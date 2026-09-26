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
            await context.Database.ExecuteSqlRawAsync(@"
                IF COL_LENGTH('AspNetUsers', 'IsApproved') IS NULL
                BEGIN
                    ALTER TABLE [AspNetUsers] ADD [IsApproved] bit NOT NULL CONSTRAINT [DF_AspNetUsers_IsApproved] DEFAULT 0;
                END
                IF COL_LENGTH('AspNetUsers', 'ApprovedAt') IS NULL
                BEGIN
                    ALTER TABLE [AspNetUsers] ADD [ApprovedAt] datetime2 NULL;
                END
            ");
        }
        catch (Exception ex)
        {
            logger.LogWarning("Không thể tự động thêm cột IsApproved/ApprovedAt: {msg}", ex.Message);
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

        if (existingDialogueCount == 72 && totalLinesCount == 688 && book?.Chapters.Count == 12 && hasFullBonuses)
        {
            logger.LogInformation("Dữ liệu sách Bino đã có đầy đủ và chuẩn xác 100% ({count} bài học, {lines} câu thoại, 12 chương). Bỏ qua seed.", existingDialogueCount, totalLinesCount);
            return;
        }

        logger.LogInformation("Khởi tạo và đồng bộ 100% dữ liệu thật 12 chương từ sách 'Chém Tiếng Anh không cần động não' (TiengAnhBi.epub)...");

        if (book == null)
        {
            book = new BinoBook
            {
                Title = "Chém Tiếng Anh không cần động não",
                Author = "Bino",
                Slug = "chem-tieng-anh-khong-can-dong-nao",
                Description = "Bộ sách học tiếng Anh giao tiếp đời thực đỉnh cao của Bino. Gồm 12 chương, 72 bài học thực chiến kèm video luyện nói 1:1, audio độc quyền, mẫu câu mở rộng và triết lý học tiếng Anh của Bino.",
                CoverImageUrl = "/images/bino/page15.jpg",
                PdfFileUrl = "/ebooks/chem_tieng_anh_bino.pdf",
                EpubFileUrl = "/ebooks/chem_tieng_anh_bino.epub",
                TotalChapters = 12,
                IsPublished = true,
                CreatedAt = DateTime.UtcNow
            };
            context.BinoBooks.Add(book);
        }

        book.CoverImageUrl = "/images/bino/page15.jpg";
        book.PdfFileUrl = "/ebooks/chem_tieng_anh_bino.pdf";
        book.EpubFileUrl = "/ebooks/chem_tieng_anh_bino.epub";
        book.TotalChapters = 12;
        book.Description = "Bộ sách học tiếng Anh giao tiếp đời thực đỉnh cao của Bino. Gồm 12 chương, 72 bài học thực chiến kèm video luyện nói 1:1, audio độc quyền, mẫu câu mở rộng và triết lý học tiếng Anh của Bino.";

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
                    Title = $"Mẫu Câu Mở Rộng & Bino's Philosophy - Chương {chapterNum:D2}",
                    ContentHtml = $"<p>Chào mấy bác! Khi giao tiếp chủ đề <strong>{titleVi}</strong>, người bản xứ rất ít khi dùng các cấu trúc sách vở cứng nhắc. Hãy bỏ túi ngay các cụm từ 'chém gió' đỉnh cao này nhé!</p>",
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
                                ? $"Bài {dModel.number}: {dModel.title} (Trang {dModel.startPage} trong sách TiengAnhBi - Luyện giải nghĩa đồ vật bằng tiếng Anh & đặt câu)."
                                : $"Hội thoại {dModel.number}: {dModel.title} (Trang {dModel.startPage} trong sách TiengAnhBi).";
                            dialogue.DurationSeconds = 180;
                            dialogue.AudioUrl = $"/audios/bino/ch{chModel.number:D2}_d{dModel.number:D2}.mp3";
                            dialogue.VideoUrl = $"/videos/bino/ch{chModel.number:D2}_d{dModel.number:D2}.mp4";

                            if (dialogue.Vocabularies.Any())
                            {
                                context.DialogueVocabularies.RemoveRange(dialogue.Vocabularies);
                                dialogue.Vocabularies.Clear();
                            }

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
                logger.LogWarning("Không thể đọc file bino_real_data.json: {msg}", ex.Message);
            }
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Đã khởi tạo và đồng bộ thành công 12 chương dữ liệu thật từ TiengAnhBi.epub vào cơ sở dữ liệu!");
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

