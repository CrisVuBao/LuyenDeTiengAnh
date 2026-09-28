using System.IO;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using VBaceEnglish.Application.Services;
using VBaceEnglish.Domain.Enums;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDBContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var toeicService = scope.ServiceProvider.GetRequiredService<IToeicTestService>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDBContext>>();

        // 1. Ensure Approval columns exist on AspNetUsers first (before Migrate or queries)
        try
        {
            var conn = context.Database.GetDbConnection();
            if (conn.State != System.Data.ConnectionState.Open)
            {
                await conn.OpenAsync();
            }
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                IF COL_LENGTH('AspNetUsers', 'IsApproved') IS NULL
                BEGIN
                    ALTER TABLE [AspNetUsers] ADD [IsApproved] bit NOT NULL CONSTRAINT [DF_AspNetUsers_IsApproved] DEFAULT 0;
                END
                IF COL_LENGTH('AspNetUsers', 'ApprovedAt') IS NULL
                BEGIN
                    ALTER TABLE [AspNetUsers] ADD [ApprovedAt] datetime2 NULL;
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserReflexProgresses')
                BEGIN
                    CREATE TABLE [UserReflexProgresses] (
                        [Id] int IDENTITY(1,1) NOT NULL,
                        [UserId] int NOT NULL,
                        [MasteredCount] int NOT NULL CONSTRAINT [DF_UserReflexProgresses_MasteredCount] DEFAULT 0,
                        [StarredCount] int NOT NULL CONSTRAINT [DF_UserReflexProgresses_StarredCount] DEFAULT 0,
                        [WeakCount] int NOT NULL CONSTRAINT [DF_UserReflexProgresses_WeakCount] DEFAULT 0,
                        [LastStudiedUnit] int NOT NULL CONSTRAINT [DF_UserReflexProgresses_LastStudiedUnit] DEFAULT 1,
                        [DailyGoal] int NOT NULL CONSTRAINT [DF_UserReflexProgresses_DailyGoal] DEFAULT 30,
                        [ProgressDataJson] nvarchar(max) NOT NULL CONSTRAINT [DF_UserReflexProgresses_ProgressDataJson] DEFAULT '{}',
                        [UpdatedAt] datetime2 NOT NULL CONSTRAINT [DF_UserReflexProgresses_UpdatedAt] DEFAULT GETUTCDATE(),
                        CONSTRAINT [PK_UserReflexProgresses] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_UserReflexProgresses_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                    );
                    CREATE UNIQUE INDEX [IX_UserReflexProgresses_UserId] ON [UserReflexProgresses] ([UserId]);
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserEbookProgresses')
                BEGIN
                    CREATE TABLE [UserEbookProgresses] (
                        [Id] int IDENTITY(1,1) NOT NULL,
                        [UserId] int NOT NULL,
                        [BookSlug] nvarchar(100) NOT NULL CONSTRAINT [DF_UserEbookProgresses_BookSlug] DEFAULT 'chem-tieng-anh-khong-can-dong-nao',
                        [LastCfi] nvarchar(500) NULL,
                        [BookmarksJson] nvarchar(max) NOT NULL CONSTRAINT [DF_UserEbookProgresses_BookmarksJson] DEFAULT '[]',
                        [UpdatedAt] datetime2 NOT NULL CONSTRAINT [DF_UserEbookProgresses_UpdatedAt] DEFAULT GETUTCDATE(),
                        CONSTRAINT [PK_UserEbookProgresses] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_UserEbookProgresses_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                    );
                    CREATE UNIQUE INDEX [IX_UserEbookProgresses_UserId_BookSlug] ON [UserEbookProgresses] ([UserId], [BookSlug]);
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserVocabProgresses')
                BEGIN
                    CREATE TABLE [UserVocabProgresses] (
                        [Id] int IDENTITY(1,1) NOT NULL,
                        [UserId] int NOT NULL,
                        [MasteredCount] int NOT NULL CONSTRAINT [DF_UserVocabProgresses_MasteredCount] DEFAULT 0,
                        [StarredCount] int NOT NULL CONSTRAINT [DF_UserVocabProgresses_StarredCount] DEFAULT 0,
                        [LastStudiedTopic] int NOT NULL CONSTRAINT [DF_UserVocabProgresses_LastStudiedTopic] DEFAULT 1,
                        [ProgressDataJson] nvarchar(max) NOT NULL CONSTRAINT [DF_UserVocabProgresses_ProgressDataJson] DEFAULT '{}',
                        [UpdatedAt] datetime2 NOT NULL CONSTRAINT [DF_UserVocabProgresses_UpdatedAt] DEFAULT GETUTCDATE(),
                        CONSTRAINT [PK_UserVocabProgresses] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_UserVocabProgresses_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                    );
                    CREATE UNIQUE INDEX [IX_UserVocabProgresses_UserId] ON [UserVocabProgresses] ([UserId]);
                END
                
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserGamifications')
                BEGIN
                    CREATE TABLE [UserGamifications] (
                        [Id] int IDENTITY(1,1) NOT NULL,
                        [UserId] int NOT NULL,
                        [TotalXP] int NOT NULL CONSTRAINT [DF_UserGamifications_TotalXP] DEFAULT 0,
                        [CurrentLevel] int NOT NULL CONSTRAINT [DF_UserGamifications_CurrentLevel] DEFAULT 1,
                        [WeeklyXP] int NOT NULL CONSTRAINT [DF_UserGamifications_WeeklyXP] DEFAULT 0,
                        [CurrentStreak] int NOT NULL CONSTRAINT [DF_UserGamifications_CurrentStreak] DEFAULT 0,
                        [LongestStreak] int NOT NULL CONSTRAINT [DF_UserGamifications_LongestStreak] DEFAULT 0,
                        [StreakFreezeCount] int NOT NULL CONSTRAINT [DF_UserGamifications_StreakFreezeCount] DEFAULT 0,
                        [LastActiveDate] datetime2 NULL,
                        [DailyQuestsJson] nvarchar(max) NOT NULL CONSTRAINT [DF_UserGamifications_DailyQuestsJson] DEFAULT '[]',
                        [DailyQuestStreak] int NOT NULL CONSTRAINT [DF_UserGamifications_DailyQuestStreak] DEFAULT 0,
                        [UnlockedBadgesJson] nvarchar(max) NOT NULL CONSTRAINT [DF_UserGamifications_UnlockedBadgesJson] DEFAULT '[]',
                        [UpdatedAt] datetime2 NOT NULL CONSTRAINT [DF_UserGamifications_UpdatedAt] DEFAULT GETUTCDATE(),
                        CONSTRAINT [PK_UserGamifications] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_UserGamifications_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                    );
                    CREATE UNIQUE INDEX [IX_UserGamifications_UserId] ON [UserGamifications] ([UserId]);
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'XPTransactions')
                BEGIN
                    CREATE TABLE [XPTransactions] (
                        [Id] int IDENTITY(1,1) NOT NULL,
                        [UserId] int NOT NULL,
                        [Amount] int NOT NULL,
                        [Source] nvarchar(50) NOT NULL CONSTRAINT [DF_XPTransactions_Source] DEFAULT '',
                        [Description] nvarchar(200) NOT NULL CONSTRAINT [DF_XPTransactions_Description] DEFAULT '',
                        [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_XPTransactions_CreatedAt] DEFAULT GETUTCDATE(),
                        CONSTRAINT [PK_XPTransactions] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_XPTransactions_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                    );
                    CREATE INDEX [IX_XPTransactions_UserId] ON [XPTransactions] ([UserId]);
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
                BEGIN
                    CREATE TABLE [Notifications] (
                        [Id] int IDENTITY(1,1) NOT NULL,
                        [BatchId] nvarchar(64) NULL,
                        [TargetScope] nvarchar(50) NOT NULL CONSTRAINT [DF_Notifications_TargetScope] DEFAULT 'Single',
                        [TargetLabel] nvarchar(250) NOT NULL CONSTRAINT [DF_Notifications_TargetLabel] DEFAULT '',
                        [RecipientUserId] int NULL,
                        [SenderUserId] int NULL,
                        [SenderName] nvarchar(150) NOT NULL CONSTRAINT [DF_Notifications_SenderName] DEFAULT N'Hệ thống VBaceEnglish',
                        [Title] nvarchar(300) NOT NULL CONSTRAINT [DF_Notifications_Title] DEFAULT '',
                        [Content] nvarchar(max) NOT NULL CONSTRAINT [DF_Notifications_Content] DEFAULT '',
                        [Type] nvarchar(50) NOT NULL CONSTRAINT [DF_Notifications_Type] DEFAULT 'Announcement',
                        [ActionUrl] nvarchar(300) NULL,
                        [IconEmoji] nvarchar(20) NOT NULL CONSTRAINT [DF_Notifications_IconEmoji] DEFAULT N'🔔',
                        [IsRead] bit NOT NULL CONSTRAINT [DF_Notifications_IsRead] DEFAULT 0,
                        [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_Notifications_CreatedAt] DEFAULT GETUTCDATE(),
                        [ReadAt] datetime2 NULL,
                        [ExpiresAt] datetime2 NULL,
                        [IsDeleted] bit NOT NULL CONSTRAINT [DF_Notifications_IsDeleted] DEFAULT 0,
                        CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_Notifications_AspNetUsers_RecipientUserId] FOREIGN KEY ([RecipientUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                    );
                    CREATE INDEX [IX_Notifications_Recipient_Read_Created] ON [Notifications] ([RecipientUserId], [IsRead], [CreatedAt]);
                    CREATE INDEX [IX_Notifications_BatchId] ON [Notifications] ([BatchId]);
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemSettings')
                BEGIN
                    CREATE TABLE [SystemSettings] (
                        [Id] int IDENTITY(1,1) NOT NULL,
                        [Key] nvarchar(100) NOT NULL,
                        [Value] nvarchar(max) NOT NULL CONSTRAINT [DF_SystemSettings_Value] DEFAULT '',
                        [Category] nvarchar(50) NOT NULL CONSTRAINT [DF_SystemSettings_Category] DEFAULT 'General',
                        [Description] nvarchar(300) NOT NULL CONSTRAINT [DF_SystemSettings_Description] DEFAULT '',
                        [UpdatedAt] datetime2 NOT NULL CONSTRAINT [DF_SystemSettings_UpdatedAt] DEFAULT GETUTCDATE(),
                        [UpdatedByUserId] int NULL,
                        CONSTRAINT [PK_SystemSettings] PRIMARY KEY ([Id])
                    );
                    CREATE UNIQUE INDEX [IX_SystemSettings_Key] ON [SystemSettings] ([Key]);
                    CREATE INDEX [IX_SystemSettings_Category] ON [SystemSettings] ([Category]);
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdminActivityLogs')
                BEGIN
                    CREATE TABLE [AdminActivityLogs] (
                        [Id] int IDENTITY(1,1) NOT NULL,
                        [AdminUserId] int NULL,
                        [AdminName] nvarchar(150) NOT NULL CONSTRAINT [DF_AdminActivityLogs_AdminName] DEFAULT 'Admin',
                        [Action] nvarchar(100) NOT NULL CONSTRAINT [DF_AdminActivityLogs_Action] DEFAULT '',
                        [EntityType] nvarchar(100) NOT NULL CONSTRAINT [DF_AdminActivityLogs_EntityType] DEFAULT '',
                        [EntityId] int NULL,
                        [Description] nvarchar(max) NOT NULL CONSTRAINT [DF_AdminActivityLogs_Description] DEFAULT '',
                        [OldValue] nvarchar(max) NULL,
                        [NewValue] nvarchar(max) NULL,
                        [IpAddress] nvarchar(64) NOT NULL CONSTRAINT [DF_AdminActivityLogs_IpAddress] DEFAULT '',
                        [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_AdminActivityLogs_CreatedAt] DEFAULT GETUTCDATE(),
                        CONSTRAINT [PK_AdminActivityLogs] PRIMARY KEY ([Id])
                    );
                    CREATE INDEX [IX_AdminActivityLogs_CreatedAt] ON [AdminActivityLogs] ([CreatedAt]);
                    CREATE INDEX [IX_AdminActivityLogs_Action] ON [AdminActivityLogs] ([Action]);
                    CREATE INDEX [IX_AdminActivityLogs_EntityType] ON [AdminActivityLogs] ([EntityType]);
                END
            ";
            await cmd.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            logger.LogWarning("Không thể tự động khởi tạo các bảng hệ thống: {msg}", ex.Message);
        }


        try
        {
            await context.Database.MigrateAsync();
        }
        catch (Exception ex)
        {
            logger.LogWarning("MigrateAsync warning: {msg}", ex.Message);
        }

        // 2. Seed Roles
        string[] roles = [UserRole.Admin.ToString(), UserRole.Teacher.ToString(), UserRole.Student.ToString()];
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new Role(roleName));
            }
        }

        // 3. Seed Default Admin User
        var adminEmail = "admin@toeichack.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Admin Quản Trị",
                EmailConfirmed = true,
                IsApproved = true,
                ApprovedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            var result = await userManager.CreateAsync(adminUser, "Admin@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, UserRole.Admin.ToString());
                logger.LogInformation("Tạo tài khoản Admin thành công: admin@toeichack.com / Admin@123456");
            }
        }
        else if (!adminUser.IsApproved)
        {
            adminUser.IsApproved = true;
            adminUser.ApprovedAt = DateTime.UtcNow;
            await userManager.UpdateAsync(adminUser);
        }

        var allAdmins = await userManager.GetUsersInRoleAsync(UserRole.Admin.ToString());
        foreach (var adm in allAdmins)
        {
            if (!adm.IsApproved)
            {
                adm.IsApproved = true;
                adm.ApprovedAt = DateTime.UtcNow;
                await userManager.UpdateAsync(adm);
            }
        }

        // 4. Seed Toeic Tests from data.json if database has no tests
        if (!await context.ToeicTests.AnyAsync())
        {
            // Check possible locations of data.json
            string[] possiblePaths = [
                Path.Combine(AppContext.BaseDirectory, "data.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "data.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend", "public", "data.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Frontend", "public", "data.json"),
                "D:\\Hoc_Tap\\C_Shape\\API\\1_Project\\LuyenDeTiengAnh\\Frontend\\public\\data.json",
                "D:\\Hoc_Tap\\C_Shape\\API\\1_Project\\LuyenDeTiengAnh\\public\\data.json"
            ];

            string? foundPath = possiblePaths.FirstOrDefault(File.Exists);
            if (foundPath != null)
            {
                logger.LogInformation("Tìm thấy file data.json tại: {Path}. Bắt đầu nạp đề thi...", foundPath);
                string json = await File.ReadAllTextAsync(foundPath);
                var importResult = await toeicService.BulkImportFromJsonAsync(json);
                logger.LogInformation("Kết quả nạp đề thi ban đầu: {Message}", importResult.Message);
            }
            else
            {
                logger.LogWarning("Không tìm thấy file data.json để seed ban đầu.");
            }
        }

        // 5. Seed Bino's English Book System if empty
        await SeedBinoBookAsync(context, logger);

        // 6. Seed Default System Settings if empty
        await SeedSystemSettingsAsync(context, logger);
    }

    public static List<SystemSetting> GetDefaultSystemSettings() =>
    [
        // Tab 1: General (Cài đặt chung)
        new() { Key = "app.name", Value = "VBaceEnglish", Category = "General", Description = "Tên ứng dụng hiển thị trên toàn hệ thống" },
        new() { Key = "app.tagline", Value = "By Vũ Bảo Software", Category = "General", Description = "Slogan thương hiệu hiển thị dưới logo" },
        new() { Key = "app.maintenance_mode", Value = "false", Category = "General", Description = "Bật chế độ bảo trì hệ thống (tạm ngưng học viên truy cập)" },
        new() { Key = "app.maintenance_message", Value = "Hệ thống đang được nâng cấp tính năng mới. Vui lòng quay lại sau ít phút!", Category = "General", Description = "Thông điệp hiển thị khi bật chế độ bảo trì" },
        new() { Key = "app.registration_open", Value = "true", Category = "General", Description = "Cho phép học viên mới đăng ký tài khoản" },
        new() { Key = "app.auto_approve", Value = "false", Category = "General", Description = "Tự động phê duyệt kích hoạt ngay khi học viên đăng ký" },
        new() { Key = "app.max_students", Value = "0", Category = "General", Description = "Giới hạn tổng số học viên tối đa (0 = Không giới hạn)" },

        // Tab 2: Security (Bảo mật & Xác thực)
        new() { Key = "auth.min_password_length", Value = "6", Category = "Security", Description = "Độ dài mật khẩu tối thiểu khi tạo/đổi mật khẩu" },
        new() { Key = "auth.require_special_char", Value = "false", Category = "Security", Description = "Bắt buộc mật khẩu phải chứa ký tự đặc biệt" },
        new() { Key = "auth.jwt_expiry_days", Value = "7", Category = "Security", Description = "Thời hạn hiệu lực của phiên đăng nhập JWT (ngày)" },
        new() { Key = "auth.max_login_attempts", Value = "5", Category = "Security", Description = "Số lần nhập sai mật khẩu tối đa trước khi tạm khóa" },
        new() { Key = "auth.lockout_minutes", Value = "15", Category = "Security", Description = "Thời gian tạm khóa tài khoản khi đăng nhập sai quá số lần (phút)" },
        new() { Key = "auth.session_timeout_hours", Value = "24", Category = "Security", Description = "Thời gian tự động đăng xuất khi không hoạt động (giờ)" },

        // Tab 3: Learning & Gamification (Học tập & Game hóa)
        new() { Key = "gamification.enabled", Value = "true", Category = "Learning", Description = "Kích hoạt hệ thống XP, Cấp độ, Chuỗi Streak và Bảng xếp hạng" },
        new() { Key = "gamification.daily_quests_count", Value = "4", Category = "Learning", Description = "Số lượng nhiệm vụ hàng ngày giao cho mỗi học viên" },
        new() { Key = "gamification.xp_multiplier", Value = "1.0", Category = "Learning", Description = "Hệ số nhân điểm XP toàn hệ thống (VD: 1.5 hoặc 2.0 cho sự kiện X2 XP)" },
        new() { Key = "gamification.streak_freeze_max", Value = "3", Category = "Learning", Description = "Số bùa đóng băng bảo vệ chuỗi Streak tối đa mỗi học viên" },
        new() { Key = "gamification.leaderboard_reset_day", Value = "1", Category = "Learning", Description = "Ngày làm mới Bảng xếp hạng tuần (1 = Thứ Hai, 0 = Chủ Nhật)" },
        new() { Key = "learning.vocab_topics_count", Value = "60", Category = "Learning", Description = "Số chủ đề 3000 Từ Vựng Oxford mở cho học viên" },
        new() { Key = "learning.reflex_units_count", Value = "50", Category = "Learning", Description = "Số Unit Phản Xạ Nói - Viết mở cho học viên" },

        // Tab 4: Notifications & Email (Thông báo & Email)
        new() { Key = "notif.auto_notify_approval", Value = "true", Category = "Notifications", Description = "Tự động gửi thông báo chào mừng khi Admin duyệt tài khoản" },
        new() { Key = "notif.auto_notify_reward", Value = "true", Category = "Notifications", Description = "Tự động gửi thông báo khi Admin thưởng XP hoặc khôi phục Streak" },
        new() { Key = "notif.auto_notify_new_student", Value = "true", Category = "Notifications", Description = "Gửi cảnh báo thời gian thực cho Admin khi có học viên mới đăng ký" },
        new() { Key = "notif.max_notifications_per_user", Value = "100", Category = "Notifications", Description = "Số thông báo lưu trữ tối đa cho mỗi tài khoản" },
        new() { Key = "notif.notification_expiry_days", Value = "30", Category = "Notifications", Description = "Tự động dọn dẹp thông báo cũ sau số ngày quy định" },
        new() { Key = "notif.email_enabled", Value = "false", Category = "Notifications", Description = "Kích hoạt gửi thông báo qua Email SMTP" },
        new() { Key = "notif.email_smtp_host", Value = "smtp.gmail.com", Category = "Notifications", Description = "Địa chỉ máy chủ SMTP" },
        new() { Key = "notif.email_smtp_port", Value = "587", Category = "Notifications", Description = "Cổng kết nối SMTP (587 TLS / 465 SSL)" },
        new() { Key = "notif.email_smtp_user", Value = "", Category = "Notifications", Description = "Tài khoản đăng nhập SMTP" },
        new() { Key = "notif.email_smtp_password", Value = "", Category = "Notifications", Description = "Mật khẩu ứng dụng SMTP (App Password)" },
        new() { Key = "notif.email_from_name", Value = "VBaceEnglish - By Vũ Bảo Software", Category = "Notifications", Description = "Tên người gửi hiển thị trong Email" },
        new() { Key = "notif.email_from_address", Value = "noreply@vbaceenglish.com", Category = "Notifications", Description = "Địa chỉ Email người gửi" },

        // Tab 5: AI & Integrations (Trợ lý AI & Tích hợp)
        new() { Key = "ai.enabled", Value = "true", Category = "AI", Description = "Bật/tắt Trợ lý AI giải thích câu hỏi TOEIC và hội thoại" },
        new() { Key = "ai.provider", Value = "gemini", Category = "AI", Description = "Nhà cung cấp mô hình AI (gemini / openai)" },
        new() { Key = "ai.model", Value = "gemini-1.5-flash", Category = "AI", Description = "Tên Model AI sử dụng" },
        new() { Key = "ai.api_key", Value = "", Category = "AI", Description = "Khóa API Key (Để trống nếu dùng cấu hình mặc định trong appsettings.json)" },
        new() { Key = "ai.max_tokens", Value = "2048", Category = "AI", Description = "Số lượng Token phản hồi tối đa cho mỗi câu trả lời" },
        new() { Key = "ai.temperature", Value = "0.7", Category = "AI", Description = "Độ sáng tạo của AI (0.0 = Chính xác tuyệt đối, 1.0 = Sáng tạo cao)" },
        new() { Key = "ai.daily_limit_per_user", Value = "50", Category = "AI", Description = "Giới hạn số lượt hỏi AI tối đa mỗi ngày trên một học viên" }
    ];

    private static async Task SeedSystemSettingsAsync(AppDBContext context, ILogger logger)
    {
        try
        {
            var existingKeys = await context.SystemSettings.Select(s => s.Key).ToListAsync();
            var existingSet = existingKeys.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var defaults = GetDefaultSystemSettings();
            var missing = defaults.Where(d => !existingSet.Contains(d.Key)).ToList();

            if (missing.Count > 0)
            {
                await context.SystemSettings.AddRangeAsync(missing);
                await context.SaveChangesAsync();
                logger.LogInformation("Đã khởi tạo {Count} cài đặt hệ thống mặc định.", missing.Count);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning("Không thể seed SystemSettings: {msg}", ex.Message);
        }
    }

    private static async Task SeedBinoBookAsync(AppDBContext context, ILogger logger)
    {
        var book = await context.BinoBooks
            .Include(b => b.Chapters)
                .ThenInclude(c => c.DialogueLessons)
                    .ThenInclude(d => d.Vocabularies)
            .Include(b => b.Chapters)
                .ThenInclude(c => c.DialogueLessons)
                    .ThenInclude(d => d.DialogueLines)
            .Include(b => b.Chapters)
                .ThenInclude(c => c.Bonus)
            .FirstOrDefaultAsync(b => b.Slug == "chem-tieng-anh-khong-can-dong-nao");

        int existingDialogueCount = book?.Chapters.SelectMany(c => c.DialogueLessons).Count() ?? 0;
        int totalLinesCount = book?.Chapters.SelectMany(c => c.DialogueLessons).SelectMany(d => d.DialogueLines).Count() ?? 0;
        bool hasFullBonuses = book?.Chapters.Count == 12 && book.Chapters.All(c => c.Bonus != null && !string.IsNullOrEmpty(c.Bonus.ContentHtml) && c.Bonus.ContentHtml.Length > 1000);

        bool needsRebrand = book != null && (
            book.Author == "Bino" ||
            book.Title.Contains("Chém", StringComparison.OrdinalIgnoreCase) ||
            book.Chapters.Any(c => c.Bonus != null && c.Bonus.Title.Contains("Bino", StringComparison.OrdinalIgnoreCase)));

        if (existingDialogueCount == 72 && totalLinesCount == 688 && book?.Chapters.Count == 12 && hasFullBonuses && !needsRebrand)
        {
            logger.LogInformation("Dữ liệu Giáo trình Giao Tiếp Thực Chiến VBace đã có đầy đủ và chuẩn xác 100% ({count} bài học, {lines} câu thoại, 12 chương). Bỏ qua seed.", existingDialogueCount, totalLinesCount);
            return;
        }

        logger.LogInformation("Khởi tạo và đồng bộ 100% dữ liệu 12 chương Giáo trình 'Giao Tiếp Thực Chiến: Phản Xạ Tiếng Anh Tức Thì' (By Vũ Bảo Software)...");

        if (book == null)
        {
            book = new BinoBook
            {
                Title = "Giao Tiếp Thực Chiến: Phản Xạ Tiếng Anh Tức Thì",
                Author = "Vũ Bảo Software",
                Slug = "chem-tieng-anh-khong-can-dong-nao",
                Description = "Hệ thống 12 chương, 72 bài hội thoại giao tiếp đời thực kèm luyện nói đóng vai 1:1, audio thụ động, biến hóa mẫu câu và Góc Tư Duy VBace — Độc quyền bởi Vũ Bảo Software.",
                CoverImageUrl = "/images/bino/page15.jpg",
                PdfFileUrl = "/ebooks/chem_tieng_anh_bino.pdf",
                EpubFileUrl = "/ebooks/chem_tieng_anh_bino.epub",
                TotalChapters = 12,
                IsPublished = true,
                CreatedAt = DateTime.UtcNow
            };
            context.BinoBooks.Add(book);
        }

        book.Title = "Giao Tiếp Thực Chiến: Phản Xạ Tiếng Anh Tức Thì";
        book.Author = "Vũ Bảo Software";
        book.CoverImageUrl = "/images/bino/page15.jpg";
        book.PdfFileUrl = "/ebooks/chem_tieng_anh_bino.pdf";
        book.EpubFileUrl = "/ebooks/chem_tieng_anh_bino.epub";
        book.TotalChapters = 12;
        book.Description = "Hệ thống 12 chương, 72 bài hội thoại giao tiếp đời thực kèm luyện nói đóng vai 1:1, audio thụ động, biến hóa mẫu câu và Góc Tư Duy VBace — Độc quyền bởi Vũ Bảo Software.";

        var chapterTitles = new[]
        {
            ("Greetings and Introductions", "Chào hỏi và giới thiệu bản thân"),
            ("FAMILY", "Gia đình"),
            ("Days of the Week and Months", "Ngày trong tuần và Các tháng"),
            ("WEATHER", "Các cuộc hội thoại liên quan đến thời tiết"),
            ("RESTAURANT, FOOD AND DRINKS", "Hội thoại và từ vựng cơ bản về nhà hàng, món ăn và đồ uống"),
            ("EMOTIONS, FEELINGS, AND CHARACTERISTICS", "Cảm xúc, cảm giác và tính cách"),
            ("DAILY ROUTINE", "Miêu tả các hoạt động thường ngày"),
            ("SOCIAL MEDIA, FAVORITE APPS", "Từ vựng và hội thoại cơ bản về mạng xã hội và các ứng dụng yêu thích"),
            ("HOBBIES", "Làm quen với từ vựng và hội thoại diễn tả sở thích"),
            ("AT THE STORE", "Làm quen với từ vựng và hội thoại khi đi mua sắm tại cửa hàng"),
            ("TRANSPORTATION", "Từ vựng và hội thoại cơ bản khi di chuyển bằng phương tiện công cộng, cá nhân"),
            ("AROUND THE HOUSE", "Làm quen với từ vựng trong phòng và quanh nhà")
        };

        // Remove any excess chapters > 12
        var excessChapters = book.Chapters.Where(c => c.ChapterNumber > 12).ToList();
        foreach (var exCh in excessChapters)
        {
            context.Chapters.Remove(exCh);
            book.Chapters.Remove(exCh);
        }

        // Ensure all 12 chapters exist
        for (int i = 0; i < chapterTitles.Length; i++)
        {
            var (titleEn, titleVi) = chapterTitles[i];
            int chapterNum = i + 1;
            var chapter = book.Chapters.FirstOrDefault(c => c.ChapterNumber == chapterNum);
            if (chapter == null)
            {
                chapter = new Chapter
                {
                    Book = book,
                    ChapterNumber = chapterNum,
                    Title = titleEn,
                    TitleVi = titleVi,
                    Description = $"Chương {chapterNum:D2}: Luyện phản xạ tự nhiên chủ đề {titleVi.ToLower()}.",
                    OrderIndex = chapterNum
                };
                book.Chapters.Add(chapter);
            }
            else
            {
                chapter.Title = titleEn;
                chapter.TitleVi = titleVi;
                chapter.Description = $"Chương {chapterNum:D2}: Luyện phản xạ tự nhiên chủ đề {titleVi.ToLower()}.";
                chapter.OrderIndex = chapterNum;
            }

            if (chapter.Bonus == null)
            {
                chapter.Bonus = new ChapterBonus
                {
                    Chapter = chapter,
                    Title = $"Mẫu Câu Mở Rộng & VBace's Mindset - Chương {chapterNum:D2}",
                    ContentHtml = $"<p>Chào bạn! Khi giao tiếp chủ đề <strong>{titleVi}</strong>, người bản xứ rất ít khi dùng các cấu trúc sách vở cứng nhắc. Hãy bỏ túi ngay các cụm từ phản xạ tự nhiên đỉnh cao này nhé!</p>",
                    SlangListJson = "[\"No worries\",\"Make it\",\"Vibe\",\"Grab a bite\",\"Hang out\",\"Catch you later\"]"
                };
            }
        }

        // Try load real data from bino_real_data.json
        var possiblePaths = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "bino_real_data.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "bino_real_data.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "../VBaceEnglish.Infrastructure/Data/bino_real_data.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "Data/bino_real_data.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "../Frontend/scripts/extracted_bino_data.json")
        };

        string? filePath = possiblePaths.FirstOrDefault(File.Exists);
        if (filePath != null)
        {
            try
            {
                var json = await File.ReadAllTextAsync(filePath);
                var extractedChapters = JsonSerializer.Deserialize<List<ExtractedChapterSeedDto>>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (extractedChapters != null)
                {
                    foreach (var chModel in extractedChapters)
                    {
                        var chapter = book.Chapters.FirstOrDefault(c => c.ChapterNumber == chModel.number);
                        if (chapter == null) continue;

                        chapter.Title = chModel.title;
                        chapter.TitleVi = chModel.titleVi;

                        if (chapter.Bonus != null)
                        {
                            if (!string.IsNullOrWhiteSpace(chModel.bonusTitle))
                                chapter.Bonus.Title = chModel.bonusTitle;
                            if (!string.IsNullOrWhiteSpace(chModel.bonusContentHtml))
                                chapter.Bonus.ContentHtml = chModel.bonusContentHtml;
                            if (chModel.bonusSlangs != null && chModel.bonusSlangs.Any())
                                chapter.Bonus.SlangListJson = JsonSerializer.Serialize(chModel.bonusSlangs);
                        }

                        foreach (var dModel in chModel.dialogues)
                        {
                            var dialogue = chapter.DialogueLessons.FirstOrDefault(d => d.DialogueNumber == dModel.number);
                            if (dialogue == null)
                            {
                                dialogue = new DialogueLesson
                                {
                                    Chapter = chapter,
                                    DialogueNumber = dModel.number,
                                    OrderIndex = dModel.number
                                };
                                chapter.DialogueLessons.Add(dialogue);
                            }

                            dialogue.Title = dModel.title;
                            dialogue.TitleVi = dModel.title;
                            dialogue.SituationDescription = chModel.number == 12
                                ? $"Bài {dModel.number}: {dModel.title} (Trang {dModel.startPage} • Giáo trình VBace - Luyện giải nghĩa đồ vật bằng tiếng Anh & đặt câu)."
                                : $"Hội thoại {dModel.number}: {dModel.title} (Trang {dModel.startPage} • Giáo trình Giao Tiếp Thực Chiến VBace).";
                            dialogue.DurationSeconds = 180;
                            dialogue.AudioUrl = $"/audios/bino/ch{chModel.number:D2}_d{dModel.number:D2}.mp3";
                            dialogue.VideoUrl = $"/videos/bino/ch{chModel.number:D2}_d{dModel.number:D2}.mp4";

                            if (!dialogue.Vocabularies.Any())
                            {
                                int vOrder = 1;
                                foreach (var vModel in dModel.vocabularies)
                                {
                                    dialogue.Vocabularies.Add(new DialogueVocabulary
                                    {
                                        Word = vModel.word,
                                        Phonetic = vModel.phonetic,
                                        WordType = vModel.wordType,
                                        Meaning = vModel.meaning,
                                        OrderIndex = vOrder++
                                    });
                                }
                            }

                            if (dialogue.DialogueLines.Any())
                            {
                                context.DialogueLines.RemoveRange(dialogue.DialogueLines);
                                dialogue.DialogueLines.Clear();
                            }

                            int lOrder = 1;
                            foreach (var lModel in dModel.lines)
                            {
                                dialogue.DialogueLines.Add(new DialogueLine
                                {
                                    CharacterName = lModel.speaker,
                                    EnglishText = lModel.englishText,
                                    VietnameseText = lModel.vietnameseText,
                                    IsUserRole = lModel.isUserRole,
                                    OrderIndex = lOrder++
                                });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning("Không thể đọc file dữ liệu hội thoại: {msg}", ex.Message);
            }
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Đã khởi tạo và đồng bộ thành công 12 chương Giáo trình Giao Tiếp Thực Chiến VBace vào cơ sở dữ liệu!");
    }

    private class ExtractedChapterSeedDto
    {
        public int number { get; set; }
        public string title { get; set; } = string.Empty;
        public string titleVi { get; set; } = string.Empty;
        public int startPage { get; set; }
        public string? bonusTitle { get; set; }
        public string? bonusContentHtml { get; set; }
        public List<string>? bonusSlangs { get; set; }
        public List<ExtractedDialogueSeedDto> dialogues { get; set; } = new();
    }

    private class ExtractedDialogueSeedDto
    {
        public int number { get; set; }
        public string title { get; set; } = string.Empty;
        public int startPage { get; set; }
        public List<ExtractedVocabSeedDto> vocabularies { get; set; } = new();
        public List<ExtractedLineSeedDto> lines { get; set; } = new();
    }

    private class ExtractedVocabSeedDto
    {
        public string word { get; set; } = string.Empty;
        public string? phonetic { get; set; }
        public string? wordType { get; set; }
        public string meaning { get; set; } = string.Empty;
    }

    private class ExtractedLineSeedDto
    {
        public string speaker { get; set; } = string.Empty;
        public string englishText { get; set; } = string.Empty;
        public string vietnameseText { get; set; } = string.Empty;
        public bool isUserRole { get; set; }
    }
}

