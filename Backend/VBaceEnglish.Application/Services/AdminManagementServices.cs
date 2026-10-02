using System.Diagnostics;
using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;
using VBaceEnglish.Application.Common;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Application.Contracts.Services;
using VBaceEnglish.Application.DTOs.Dashboard;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Enums;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

// ==========================================
// INTERFACES
// ==========================================

public interface INotificationService
{
    Task<Response<List<NotificationItemDto>>> GetMyNotificationsAsync(int userId, int limit = 40);
    Task<Response<int>> GetUnreadCountAsync(int userId);
    Task<Response<bool>> MarkAsReadAsync(int userId, int notificationId);
    Task<Response<int>> MarkAllAsReadAsync(int userId);
    Task<Response<int>> SendNotificationAsync(int senderUserId, string senderName, SendNotificationRequestDto dto);
    Task<Response<int>> DeleteNotificationOrBatchAsync(int adminUserId, string adminName, string idOrBatchId);
    Task<Response<List<AdminSentNotificationBatchDto>>> GetAdminNotificationHistoryAsync();
    Task<Response<AdminNotificationStatsDto>> GetAdminNotificationStatsAsync();

    // Automatic System Triggers
    Task TriggerUserNotificationAsync(int recipientUserId, string title, string content, string type, string iconEmoji, string? actionUrl = null);
    Task TriggerAdminsNotificationAsync(string title, string content, string type, string iconEmoji, string? actionUrl = null);
}

public interface ISystemSettingsService
{
    Task<Response<List<SystemSettingItemDto>>> GetAllSettingsAsync();
    Task<string> GetSettingValueAsync(string key, string defaultValue = "");
    Task<bool> GetBoolSettingAsync(string key, bool defaultValue = false);
    Task<double> GetDoubleSettingAsync(string key, double defaultValue = 1.0);
    Task<Response<bool>> UpdateSettingsAsync(int adminUserId, string adminName, Dictionary<string, string> settings, string ipAddress = "");
    Task<Response<List<SystemSettingItemDto>>> ResetToDefaultsAsync(int adminUserId, string adminName, string ipAddress = "");
    Task<Response<PublicBrandingDto>> GetPublicBrandingAsync();
    Task<Response<SystemHealthAndInfoDto>> GetSystemInfoAsync(string webRootPath);
    Task<Response<CleanupDataResultDto>> CleanupOldDataAsync(int adminUserId, string adminName, CleanupDataRequestDto dto);
}

public interface IActivityLogService
{
    Task LogAsync(int? adminUserId, string adminName, string action, string entityType, int? entityId, string description, string? oldValue = null, string? newValue = null, string ipAddress = "");
    Task<Response<PagedResult<AdminActivityLogDto>>> GetLogsAsync(string? action, string? entityType, string? search, int page = 1, int pageSize = 50);
    Task<Response<ActivityLogStatsDto>> GetStatsAsync();
}

public interface IAnalyticsService
{
    Task<Response<AdminAnalyticsOverviewDto>> GetAnalyticsOverviewAsync(string period = "30d");
}

// ==========================================
// 1. NOTIFICATION SERVICE IMPLEMENTATION
// ==========================================

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IRealTimeNotificationDispatcher _realtime;
    private readonly IActivityLogService _activityLog;

    public NotificationService(
        IUnitOfWork unitOfWork,
        UserManager<ApplicationUser> userManager,
        IRealTimeNotificationDispatcher realtime,
        IActivityLogService activityLog)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
        _realtime = realtime;
        _activityLog = activityLog;
    }

    private static DateTime EnsureUtc(DateTime dt) => DateTime.SpecifyKind(dt, DateTimeKind.Utc);
    private static DateTime? EnsureUtc(DateTime? dt) => dt.HasValue ? DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc) : null;

    public async Task<Response<List<NotificationItemDto>>> GetMyNotificationsAsync(int userId, int limit = 40)
    {
        var items = await _unitOfWork.AdminManagement.GetUserNotificationsAsync(userId, limit);
        var dtos = items.Select(n => new NotificationItemDto
        {
            Id = n.Id,
            BatchId = n.BatchId,
            TargetScope = n.TargetScope,
            TargetLabel = n.TargetLabel,
            RecipientUserId = n.RecipientUserId,
            SenderUserId = n.SenderUserId,
            SenderName = n.SenderName,
            Title = n.Title,
            Content = n.Content,
            Type = n.Type,
            ActionUrl = n.ActionUrl,
            IconEmoji = n.IconEmoji,
            IsRead = n.IsRead,
            CreatedAt = EnsureUtc(n.CreatedAt),
            ReadAt = EnsureUtc(n.ReadAt),
            ExpiresAt = EnsureUtc(n.ExpiresAt)
        }).ToList();

        return Response<List<NotificationItemDto>>.SuccessResult("Lấy danh sách thông báo thành công", dtos);
    }

    public async Task<Response<int>> GetUnreadCountAsync(int userId)
    {
        var count = await _unitOfWork.AdminManagement.GetUnreadCountAsync(userId);
        return Response<int>.SuccessResult("Số thông báo chưa đọc", count);
    }

    public async Task<Response<bool>> MarkAsReadAsync(int userId, int notificationId)
    {
        var ok = await _unitOfWork.AdminManagement.MarkAsReadAsync(userId, notificationId);
        return Response<bool>.SuccessResult("Đã đánh dấu đọc", ok);
    }

    public async Task<Response<int>> MarkAllAsReadAsync(int userId)
    {
        var count = await _unitOfWork.AdminManagement.MarkAllAsReadAsync(userId);
        return Response<int>.SuccessResult($"Đã đánh dấu đọc {count} thông báo", count);
    }

    public async Task<Response<int>> SendNotificationAsync(int senderUserId, string senderName, SendNotificationRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Content))
            return Response<int>.Failure("Tiêu đề và nội dung thông báo không được để trống.");

        var admins = await _userManager.GetUsersInRoleAsync(UserRole.Admin.ToString());
        var adminIds = admins.Select(a => a.Id).ToHashSet();
        var allStudents = _userManager.Users.Where(u => !adminIds.Contains(u.Id)).ToList();

        List<ApplicationUser> targetUsers = [];
        string targetLabel;
        string scope = dto.TargetScope ?? "All";

        if (scope.Equals("Single", StringComparison.OrdinalIgnoreCase))
        {
            if (!dto.RecipientUserId.HasValue)
                return Response<int>.Failure("Vui lòng chọn học viên nhận thông báo.");

            var user = await _userManager.FindByIdAsync(dto.RecipientUserId.Value.ToString());
            if (user == null)
                return Response<int>.Failure("Không tìm thấy tài khoản học viên.");

            targetUsers.Add(user);
            targetLabel = $"{user.FullName} ({user.Email})";
            scope = "Single";
        }
        else if (scope.Equals("Group", StringComparison.OrdinalIgnoreCase))
        {
            var filter = dto.GroupFilter ?? new NotificationGroupFilterDto();
            var gamifications = (await _unitOfWork.AdminManagement.GetAllGamificationsAsync())
                .ToDictionary(g => g.UserId);

            var filtered = allStudents.AsEnumerable();
            var labelParts = new List<string>();

            if (filter.ApprovalStatus == "approved")
            {
                filtered = filtered.Where(u => u.IsApproved);
                labelParts.Add("Đã duyệt");
            }
            else if (filter.ApprovalStatus == "pending")
            {
                filtered = filtered.Where(u => !u.IsApproved);
                labelParts.Add("Chờ duyệt");
            }

            if (filter.MinLevel.HasValue && filter.MinLevel.Value > 1)
            {
                filtered = filtered.Where(u => gamifications.TryGetValue(u.Id, out var g) && g.CurrentLevel >= filter.MinLevel.Value);
                labelParts.Add($"Lv ≥ {filter.MinLevel.Value}");
            }

            if (filter.MinStreak.HasValue && filter.MinStreak.Value > 0)
            {
                filtered = filtered.Where(u => gamifications.TryGetValue(u.Id, out var g) && g.CurrentStreak >= filter.MinStreak.Value);
                labelParts.Add($"Streak ≥ {filter.MinStreak.Value}");
            }

            if (filter.InactiveDays.HasValue && filter.InactiveDays.Value > 0)
            {
                var threshold = DateTime.UtcNow.AddDays(-filter.InactiveDays.Value);
                filtered = filtered.Where(u =>
                {
                    var lastLogin = u.LastLoginAt ?? u.CreatedAt;
                    if (gamifications.TryGetValue(u.Id, out var g) && g.UpdatedAt > lastLogin)
                        lastLogin = g.UpdatedAt;
                    return lastLogin <= threshold;
                });
                labelParts.Add($"Vắng ≥ {filter.InactiveDays.Value} ngày");
            }

            targetUsers = filtered.ToList();
            targetLabel = labelParts.Count > 0
                ? $"Nhóm lọc ({string.Join(", ", labelParts)}) — {targetUsers.Count} HV"
                : $"Nhóm học viên ({targetUsers.Count} HV)";
            scope = "Group";
        }
        else
        {
            targetUsers = allStudents;
            targetLabel = $"Tất cả học viên ({targetUsers.Count} người)";
            scope = "All";
        }

        if (targetUsers.Count == 0)
        {
            return Response<int>.Failure("Không có học viên nào thỏa mãn điều kiện nhận thông báo.");
        }

        string batchId = Guid.NewGuid().ToString("N")[..16];
        var now = DateTime.UtcNow;
        DateTime? expiresAt = dto.ExpireDays.HasValue && dto.ExpireDays.Value > 0
            ? now.AddDays(dto.ExpireDays.Value)
            : null;

        var notifications = targetUsers.Select(u => new Notification
        {
            BatchId = batchId,
            TargetScope = scope,
            TargetLabel = targetLabel,
            RecipientUserId = u.Id,
            SenderUserId = senderUserId,
            SenderName = string.IsNullOrWhiteSpace(senderName) ? "Admin Quản Trị" : senderName,
            Title = dto.Title.Trim(),
            Content = dto.Content.Trim(),
            Type = string.IsNullOrWhiteSpace(dto.Type) ? "Announcement" : dto.Type,
            ActionUrl = string.IsNullOrWhiteSpace(dto.ActionUrl) ? null : dto.ActionUrl.Trim(),
            IconEmoji = string.IsNullOrWhiteSpace(dto.IconEmoji) ? "📢" : dto.IconEmoji.Trim(),
            IsRead = false,
            CreatedAt = now,
            ExpiresAt = expiresAt
        }).ToList();

        await _unitOfWork.AdminManagement.AddNotificationsAsync(notifications);
        await _unitOfWork.CompleteAsync();

        // Push Real-time SignalR notification to each recipient with their own Notification Id
        var sample = notifications[0];
        foreach (var n in notifications)
        {
            if (!n.RecipientUserId.HasValue) continue;
            var realtimePayload = new NotificationItemDto
            {
                Id = n.Id,
                BatchId = n.BatchId,
                TargetScope = n.TargetScope,
                TargetLabel = n.TargetLabel,
                RecipientUserId = n.RecipientUserId,
                SenderUserId = n.SenderUserId,
                SenderName = n.SenderName,
                Title = n.Title,
                Content = n.Content,
                Type = n.Type,
                ActionUrl = n.ActionUrl,
                IconEmoji = n.IconEmoji,
                IsRead = false,
                CreatedAt = EnsureUtc(n.CreatedAt),
                ExpiresAt = EnsureUtc(n.ExpiresAt)
            };
            await _realtime.SendToUserAsync(n.RecipientUserId.Value, realtimePayload);
        }

        // Log Admin Activity
        await _activityLog.LogAsync(
            senderUserId,
            senderName,
            scope == "All" ? "notification.broadcast" : "notification.send",
            "Notification",
            sample.Id,
            $"Gửi thông báo \"{dto.Title}\" tới {targetLabel} ({targetUsers.Count} người nhận)"
        );

        return Response<int>.SuccessResult($"Đã phát sóng thông báo thành công tới {targetUsers.Count} học viên!", targetUsers.Count);
    }

    public async Task<Response<int>> DeleteNotificationOrBatchAsync(int adminUserId, string adminName, string idOrBatchId)
    {
        var deletedCount = await _unitOfWork.AdminManagement.DeleteNotificationOrBatchAsync(idOrBatchId);
        if (deletedCount > 0)
        {
            await _activityLog.LogAsync(
                adminUserId,
                adminName,
                "notification.delete",
                "Notification",
                null,
                $"Đã xóa lô thông báo ({deletedCount} bản ghi) [Mã: {idOrBatchId}]"
            );
        }
        return Response<int>.SuccessResult($"Đã xóa {deletedCount} bản ghi thông báo.", deletedCount);
    }

    public async Task<Response<List<AdminSentNotificationBatchDto>>> GetAdminNotificationHistoryAsync()
    {
        var all = await _unitOfWork.AdminManagement.GetAllAdminNotificationsAsync(1000);

        var batches = all
            .GroupBy(n => !string.IsNullOrEmpty(n.BatchId) ? n.BatchId : $"single_{n.Id}")
            .Select(g =>
            {
                var first = g.First();
                int total = g.Count();
                int read = g.Count(x => x.IsRead);
                double rate = total > 0 ? Math.Round((double)read / total * 100, 1) : 0;

                string label = first.TargetLabel;
                if (string.IsNullOrWhiteSpace(label))
                {
                    label = first.RecipientUser != null
                        ? $"{first.RecipientUser.FullName} ({first.RecipientUser.Email})"
                        : $"Học viên #{first.RecipientUserId}";
                }

                return new AdminSentNotificationBatchDto
                {
                    BatchKey = g.Key,
                    SampleId = first.Id,
                    TargetScope = first.TargetScope,
                    TargetLabel = label,
                    SenderName = first.SenderName,
                    Title = first.Title,
                    Content = first.Content,
                    Type = first.Type,
                    ActionUrl = first.ActionUrl,
                    IconEmoji = first.IconEmoji,
                    CreatedAt = EnsureUtc(first.CreatedAt),
                    ExpiresAt = EnsureUtc(first.ExpiresAt),
                    TotalRecipients = total,
                    ReadCount = read,
                    ReadRatePercent = rate
                };
            })
            .OrderByDescending(b => b.CreatedAt)
            .ToList();

        return Response<List<AdminSentNotificationBatchDto>>.SuccessResult("Lịch sử thông báo đã gửi", batches);
    }

    public async Task<Response<AdminNotificationStatsDto>> GetAdminNotificationStatsAsync()
    {
        var historyRes = await GetAdminNotificationHistoryAsync();
        var batches = historyRes.Data ?? [];

        int totalBatches = batches.Count;
        int totalDeliveries = batches.Sum(b => b.TotalRecipients);
        int totalRead = batches.Sum(b => b.ReadCount);
        double avgRate = totalDeliveries > 0 ? Math.Round((double)totalRead / totalDeliveries * 100, 1) : 0;
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
        int sent7d = batches.Count(b => b.CreatedAt >= sevenDaysAgo);

        var topBatch = batches
            .OrderByDescending(b => b.ReadRatePercent)
            .ThenByDescending(b => b.TotalRecipients)
            .FirstOrDefault();

        var stats = new AdminNotificationStatsDto
        {
            TotalBatchesSent = totalBatches,
            TotalIndividualDeliveries = totalDeliveries,
            TotalReadCount = totalRead,
            AverageReadRatePercent = avgRate,
            SentLast7Days = sent7d,
            TopPerformingTitle = topBatch?.Title ?? "Chưa có thông báo",
            TopPerformingReadRate = topBatch?.ReadRatePercent ?? 0
        };

        return Response<AdminNotificationStatsDto>.SuccessResult("Thống kê thông báo", stats);
    }

    public async Task TriggerUserNotificationAsync(
        int recipientUserId,
        string title,
        string content,
        string type,
        string iconEmoji,
        string? actionUrl = null)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(recipientUserId.ToString());
            var now = DateTime.UtcNow;
            var notif = new Notification
            {
                BatchId = Guid.NewGuid().ToString("N")[..16],
                TargetScope = "System",
                TargetLabel = user != null ? $"{user.FullName} ({user.Email})" : $"Học viên #{recipientUserId}",
                RecipientUserId = recipientUserId,
                SenderUserId = null,
                SenderName = "Hệ thống VBaceEnglish",
                Title = title,
                Content = content,
                Type = type,
                ActionUrl = actionUrl,
                IconEmoji = iconEmoji,
                IsRead = false,
                CreatedAt = now
            };

            await _unitOfWork.AdminManagement.AddNotificationsAsync([notif]);
            await _unitOfWork.CompleteAsync();

            var payload = new NotificationItemDto
            {
                Id = notif.Id,
                BatchId = notif.BatchId,
                TargetScope = notif.TargetScope,
                TargetLabel = notif.TargetLabel,
                RecipientUserId = notif.RecipientUserId,
                SenderName = notif.SenderName,
                Title = notif.Title,
                Content = notif.Content,
                Type = notif.Type,
                ActionUrl = notif.ActionUrl,
                IconEmoji = notif.IconEmoji,
                IsRead = false,
                CreatedAt = EnsureUtc(notif.CreatedAt)
            };

            await _realtime.SendToUserAsync(recipientUserId, payload);
        }
        catch
        {
            // Không làm gián đoạn luồng chính nếu gửi thông báo phụ gặp lỗi
        }
    }

    public async Task TriggerAdminsNotificationAsync(
        string title,
        string content,
        string type,
        string iconEmoji,
        string? actionUrl = null)
    {
        try
        {
            var admins = await _userManager.GetUsersInRoleAsync(UserRole.Admin.ToString());
            if (admins.Count == 0) return;

            var now = DateTime.UtcNow;
            string batchId = Guid.NewGuid().ToString("N")[..16];

            var list = admins.Select(a => new Notification
            {
                BatchId = batchId,
                TargetScope = "AdminAlert",
                TargetLabel = "Ban Quản Trị (Admin)",
                RecipientUserId = a.Id,
                SenderName = "Hệ thống Tự động",
                Title = title,
                Content = content,
                Type = type,
                ActionUrl = actionUrl,
                IconEmoji = iconEmoji,
                IsRead = false,
                CreatedAt = now
            }).ToList();

            await _unitOfWork.AdminManagement.AddNotificationsAsync(list);
            await _unitOfWork.CompleteAsync();

            foreach (var n in list)
            {
                if (!n.RecipientUserId.HasValue) continue;
                var payload = new NotificationItemDto
                {
                    Id = n.Id,
                    BatchId = n.BatchId,
                    TargetScope = n.TargetScope,
                    TargetLabel = n.TargetLabel,
                    RecipientUserId = n.RecipientUserId,
                    SenderName = n.SenderName,
                    Title = n.Title,
                    Content = n.Content,
                    Type = n.Type,
                    ActionUrl = n.ActionUrl,
                    IconEmoji = n.IconEmoji,
                    IsRead = false,
                    CreatedAt = EnsureUtc(n.CreatedAt)
                };
                await _realtime.SendToUserAsync(n.RecipientUserId.Value, payload);
            }
        }
        catch
        {
        }
    }
}

// ==========================================
// 2. SYSTEM SETTINGS SERVICE IMPLEMENTATION
// ==========================================

public class SystemSettingsService : ISystemSettingsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMemoryCache _cache;
    private readonly IActivityLogService _activityLog;
    private const string SettingsCacheKey = "vbace_system_settings_all";

    public SystemSettingsService(
        IUnitOfWork unitOfWork,
        IMemoryCache cache,
        IActivityLogService activityLog)
    {
        _unitOfWork = unitOfWork;
        _cache = cache;
        _activityLog = activityLog;
    }

    private static DateTime EnsureUtc(DateTime dt) => DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    public async Task<Response<List<SystemSettingItemDto>>> GetAllSettingsAsync()
    {
        var list = await GetCachedSettingsAsync();
        var dtos = list.Select(s => new SystemSettingItemDto
        {
            Id = s.Id,
            Key = s.Key,
            Value = s.Value,
            Category = s.Category,
            Description = s.Description,
            UpdatedAt = EnsureUtc(s.UpdatedAt)
        }).ToList();

        return Response<List<SystemSettingItemDto>>.SuccessResult("Lấy cài đặt hệ thống thành công", dtos);
    }

    private async Task<List<SystemSetting>> GetCachedSettingsAsync()
    {
        if (_cache.TryGetValue(SettingsCacheKey, out List<SystemSetting>? cached) && cached != null)
        {
            return cached;
        }

        var settings = await _unitOfWork.AdminManagement.GetAllSettingsAsync();
        _cache.Set(SettingsCacheKey, settings, TimeSpan.FromMinutes(10));
        return settings;
    }

    public async Task<string> GetSettingValueAsync(string key, string defaultValue = "")
    {
        var all = await GetCachedSettingsAsync();
        var match = all.FirstOrDefault(s => s.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
        return match != null ? match.Value : defaultValue;
    }

    public async Task<bool> GetBoolSettingAsync(string key, bool defaultValue = false)
    {
        var val = await GetSettingValueAsync(key, defaultValue ? "true" : "false");
        return bool.TryParse(val, out bool result) ? result : defaultValue;
    }

    public async Task<double> GetDoubleSettingAsync(string key, double defaultValue = 1.0)
    {
        var val = await GetSettingValueAsync(key, defaultValue.ToString(System.Globalization.CultureInfo.InvariantCulture));
        return double.TryParse(val, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out double res)
            ? res
            : defaultValue;
    }

    public async Task<Response<bool>> UpdateSettingsAsync(
        int adminUserId,
        string adminName,
        Dictionary<string, string> settings,
        string ipAddress = "")
    {
        if (settings == null || settings.Count == 0)
            return Response<bool>.Failure("Không có dữ liệu cài đặt để cập nhật.");

        // Đồng bộ hai chiều giữa brand.name và app.name, brand.tagline và app.tagline
        if (settings.TryGetValue("brand.name", out var bName) && !string.IsNullOrWhiteSpace(bName))
        {
            settings["app.name"] = bName;
        }
        else if (settings.TryGetValue("app.name", out var aName) && !string.IsNullOrWhiteSpace(aName) && !settings.ContainsKey("brand.name"))
        {
            settings["brand.name"] = aName;
        }

        if (settings.TryGetValue("brand.tagline", out var bTag) && !string.IsNullOrWhiteSpace(bTag))
        {
            settings["app.tagline"] = bTag;
        }
        else if (settings.TryGetValue("app.tagline", out var aTag) && !string.IsNullOrWhiteSpace(aTag) && !settings.ContainsKey("brand.tagline"))
        {
            settings["brand.tagline"] = aTag;
        }

        await _unitOfWork.AdminManagement.UpsertSettingsAsync(settings, adminUserId);
        _cache.Remove(SettingsCacheKey);

        await _activityLog.LogAsync(
            adminUserId,
            adminName,
            "settings.update",
            "Setting",
            null,
            $"Đã cập nhật {settings.Count} thông số cấu hình hệ thống ({string.Join(", ", settings.Keys.Take(5))})",
            null,
            null,
            ipAddress
        );

        return Response<bool>.SuccessResult("Đã lưu cấu hình hệ thống thành công!", true);
    }

    public async Task<Response<PublicBrandingDto>> GetPublicBrandingAsync()
    {
        var brandName = await GetSettingValueAsync("brand.name", "");
        if (string.IsNullOrWhiteSpace(brandName))
            brandName = await GetSettingValueAsync("app.name", "VBaceEnglish");

        var tagline = await GetSettingValueAsync("brand.tagline", "");
        if (string.IsNullOrWhiteSpace(tagline))
            tagline = await GetSettingValueAsync("app.tagline", "By Vũ Bảo Software");

        var shortName = await GetSettingValueAsync("brand.short_name", "VBace");
        var slogan = await GetSettingValueAsync("brand.slogan", "Giao Tiếp Thực Chiến & Luyện Đề TOEIC Chuẩn ETS");
        var description = await GetSettingValueAsync("brand.description", "Nền tảng học tiếng Anh giao tiếp & luyện thi TOEIC, THPT, IELTS thông minh với công nghệ phản xạ và FSRS.");
        var companyName = await GetSettingValueAsync("brand.company_name", "Vũ Bảo Software");
        var logoUrl = await GetSettingValueAsync("brand.logo_url", "/favicon.svg");
        if (string.IsNullOrWhiteSpace(logoUrl)) logoUrl = "/favicon.svg";
        var logoDarkUrl = await GetSettingValueAsync("brand.logo_dark_url", "/favicon.svg");
        if (string.IsNullOrWhiteSpace(logoDarkUrl)) logoDarkUrl = "/favicon.svg";
        var faviconUrl = await GetSettingValueAsync("brand.favicon_url", "/favicon.svg");
        if (string.IsNullOrWhiteSpace(faviconUrl)) faviconUrl = "/favicon.svg";
        var copyright = await GetSettingValueAsync("brand.copyright", $"© {DateTime.UtcNow.Year} {brandName} — By {companyName}. Tất cả quyền được bảo lưu.");
        var supportEmail = await GetSettingValueAsync("brand.support_email", "support@vbaceenglish.com");
        var hotline = await GetSettingValueAsync("brand.hotline", "0988.xxx.xxx");
        var maintenanceMode = await GetBoolSettingAsync("app.maintenance_mode", false);
        var maintenanceMessage = await GetSettingValueAsync("app.maintenance_message", "Hệ thống đang được nâng cấp tính năng mới. Vui lòng quay lại sau ít phút!");
        var registrationOpen = await GetBoolSettingAsync("app.registration_open", true);

        var dto = new PublicBrandingDto
        {
            BrandName = brandName,
            ShortName = shortName,
            Tagline = tagline,
            Slogan = slogan,
            Description = description,
            CompanyName = companyName,
            LogoUrl = logoUrl,
            LogoDarkUrl = logoDarkUrl,
            FaviconUrl = string.IsNullOrWhiteSpace(faviconUrl) ? "/favicon.svg" : faviconUrl,
            Copyright = copyright,
            SupportEmail = supportEmail,
            Hotline = hotline,
            MaintenanceMode = maintenanceMode,
            MaintenanceMessage = maintenanceMessage,
            RegistrationOpen = registrationOpen
        };

        return Response<PublicBrandingDto>.SuccessResult("Lấy thông tin thương hiệu thành công", dto);
    }

    public async Task<Response<List<SystemSettingItemDto>>> ResetToDefaultsAsync(
        int adminUserId,
        string adminName,
        string ipAddress = "")
    {
        var defaults = InfrastructureFallbackDefaults();
        await _unitOfWork.AdminManagement.ResetAllSettingsAsync(defaults, adminUserId);
        _cache.Remove(SettingsCacheKey);

        await _activityLog.LogAsync(
            adminUserId,
            adminName,
            "settings.reset",
            "Setting",
            null,
            "Khôi phục toàn bộ cài đặt hệ thống về trạng thái mặc định ban đầu",
            null,
            null,
            ipAddress
        );

        return await GetAllSettingsAsync();
    }

    public async Task<Response<SystemHealthAndInfoDto>> GetSystemInfoAsync(string webRootPath)
    {
        var tableCounts = await _unitOfWork.AdminManagement.GetDatabaseTableCountsAsync();
        var proc = Process.GetCurrentProcess();
        double uptimeHours = Math.Round((DateTime.UtcNow - proc.StartTime.ToUniversalTime()).TotalHours, 2);
        double memoryMb = Math.Round(proc.WorkingSet64 / (1024.0 * 1024.0), 1);

        var mediaFiles = new List<MediaFileItemDto>();
        long totalBytes = 0;

        if (!string.IsNullOrWhiteSpace(webRootPath))
        {
            var uploadsDir = Path.Combine(webRootPath, "uploads");
            if (Directory.Exists(uploadsDir))
            {
                var files = Directory.GetFiles(uploadsDir, "*.*", SearchOption.AllDirectories);
                foreach (var file in files)
                {
                    var fi = new FileInfo(file);
                    totalBytes += fi.Length;
                    var relPath = Path.GetRelativePath(webRootPath, file).Replace('\\', '/');
                    var folderName = Path.GetDirectoryName(Path.GetRelativePath(uploadsDir, file))?.Replace('\\', '/') ?? "root";

                    mediaFiles.Add(new MediaFileItemDto
                    {
                        FileName = fi.Name,
                        Folder = folderName,
                        RelativeUrl = "/" + relPath,
                        SizeKb = Math.Round(fi.Length / 1024.0, 1),
                        LastModifiedUtc = EnsureUtc(fi.LastWriteTimeUtc)
                    });
                }
            }
        }

        var vnNow = DateTime.UtcNow.AddHours(7);
        var info = new SystemHealthAndInfoDto
        {
            AppName = await GetSettingValueAsync("app.name", "VBaceEnglish"),
            DotNetVersion = RuntimeInformation.FrameworkDescription,
            OsDescription = RuntimeInformation.OSDescription,
            ServerTimeVietnam = vnNow.ToString("HH:mm:ss dd/MM/yyyy") + " (GMT+7)",
            UptimeHours = uptimeHours,
            MemoryUsedMb = memoryMb,
            TotalDatabaseTables = tableCounts.Count,
            TotalDatabaseRows = tableCounts.Values.Sum(),
            UploadedFilesCount = mediaFiles.Count,
            UploadedFilesSizeMb = Math.Round(totalBytes / (1024.0 * 1024.0), 2),
            TableRowCounts = tableCounts,
            MediaFiles = mediaFiles.OrderByDescending(f => f.LastModifiedUtc).Take(100).ToList()
        };

        return Response<SystemHealthAndInfoDto>.SuccessResult("Thông tin hệ thống", info);
    }

    public async Task<Response<CleanupDataResultDto>> CleanupOldDataAsync(
        int adminUserId,
        string adminName,
        CleanupDataRequestDto dto)
    {
        int delNotifs = 0;
        int delChats = 0;
        int delLogs = 0;

        if (dto.CleanOldNotifications)
        {
            var cutoff = DateTime.UtcNow.AddDays(-Math.Max(1, dto.NotificationRetentionDays));
            delNotifs = await _unitOfWork.AdminManagement.DeleteOldNotificationsAsync(cutoff);
        }

        if (dto.CleanOldAiChats)
        {
            var cutoff = DateTime.UtcNow.AddDays(-Math.Max(1, dto.AiChatRetentionDays));
            delChats = await _unitOfWork.AdminManagement.DeleteOldAiChatLogsAsync(cutoff);
        }

        if (dto.CleanOldActivityLogs)
        {
            var cutoff = DateTime.UtcNow.AddDays(-Math.Max(1, dto.ActivityLogRetentionDays));
            delLogs = await _unitOfWork.AdminManagement.DeleteOldActivityLogsAsync(cutoff);
        }

        await _activityLog.LogAsync(
            adminUserId,
            adminName,
            "system.cleanup",
            "System",
            null,
            $"Dọn dẹp dữ liệu hệ thống: Xóa {delNotifs} thông báo cũ, {delChats} lịch sử AI, {delLogs} nhật ký cũ"
        );

        return Response<CleanupDataResultDto>.SuccessResult(
            $"Đã dọn dẹp thành công ({delNotifs + delChats + delLogs} bản ghi cũ)!",
            new CleanupDataResultDto
            {
                DeletedNotifications = delNotifs,
                DeletedAiChats = delChats,
                DeletedActivityLogs = delLogs
            });
    }

    private static List<SystemSetting> InfrastructureFallbackDefaults() =>
    [
        new() { Key = "brand.name", Value = "VBaceEnglish", Category = "Branding", Description = "Tên thương hiệu hiển thị trên toàn hệ thống" },
        new() { Key = "brand.short_name", Value = "VBace", Category = "Branding", Description = "Tên viết tắt / Logo mark text" },
        new() { Key = "brand.tagline", Value = "By Vũ Bảo Software", Category = "Branding", Description = "Khẩu hiệu / Tagline hiển thị dưới logo" },
        new() { Key = "brand.slogan", Value = "Giao Tiếp Thực Chiến & Luyện Đề TOEIC Chuẩn ETS", Category = "Branding", Description = "Slogan mô tả sản phẩm" },
        new() { Key = "brand.company_name", Value = "Vũ Bảo Software", Category = "Branding", Description = "Tên công ty / Đơn vị chủ quản" },
        new() { Key = "brand.logo_url", Value = "", Category = "Branding", Description = "Đường dẫn ảnh Logo chính (để trống để dùng biểu tượng mặc định)" },
        new() { Key = "brand.logo_dark_url", Value = "", Category = "Branding", Description = "Đường dẫn ảnh Logo cho chế độ tối (để trống dùng logo chính)" },
        new() { Key = "brand.favicon_url", Value = "/favicon.svg", Category = "Branding", Description = "Đường dẫn Favicon trình duyệt" },
        new() { Key = "brand.copyright", Value = "© 2026 VBaceEnglish — By Vũ Bảo Software. Tất cả quyền được bảo lưu.", Category = "Branding", Description = "Văn bản bản quyền hiển thị tại chân trang" },
        new() { Key = "brand.support_email", Value = "support@vbaceenglish.com", Category = "Branding", Description = "Email hỗ trợ học viên" },
        new() { Key = "brand.hotline", Value = "0988.xxx.xxx", Category = "Branding", Description = "Hotline tư vấn và giải đáp" },
        new() { Key = "app.name", Value = "VBaceEnglish", Category = "General", Description = "Tên ứng dụng hiển thị trên toàn hệ thống" },
        new() { Key = "app.tagline", Value = "By Vũ Bảo Software", Category = "General", Description = "Slogan thương hiệu hiển thị dưới logo" },
        new() { Key = "app.maintenance_mode", Value = "false", Category = "General", Description = "Bật chế độ bảo trì hệ thống (tạm ngưng học viên truy cập)" },
        new() { Key = "app.maintenance_message", Value = "Hệ thống đang được nâng cấp tính năng mới. Vui lòng quay lại sau ít phút!", Category = "General", Description = "Thông điệp hiển thị khi bật chế độ bảo trì" },
        new() { Key = "app.registration_open", Value = "true", Category = "General", Description = "Cho phép học viên mới đăng ký tài khoản" },
        new() { Key = "app.auto_approve", Value = "false", Category = "General", Description = "Tự động phê duyệt kích hoạt ngay khi học viên đăng ký" },
        new() { Key = "app.max_students", Value = "0", Category = "General", Description = "Giới hạn tổng số học viên tối đa (0 = Không giới hạn)" },
        new() { Key = "auth.min_password_length", Value = "6", Category = "Security", Description = "Độ dài mật khẩu tối thiểu khi tạo/đổi mật khẩu" },
        new() { Key = "auth.require_special_char", Value = "false", Category = "Security", Description = "Bắt buộc mật khẩu phải chứa ký tự đặc biệt" },
        new() { Key = "auth.jwt_expiry_days", Value = "7", Category = "Security", Description = "Thời hạn hiệu lực của phiên đăng nhập JWT (ngày)" },
        new() { Key = "auth.max_login_attempts", Value = "5", Category = "Security", Description = "Số lần nhập sai mật khẩu tối đa trước khi tạm khóa" },
        new() { Key = "auth.lockout_minutes", Value = "15", Category = "Security", Description = "Thời gian tạm khóa tài khoản khi đăng nhập sai quá số lần (phút)" },
        new() { Key = "auth.session_timeout_hours", Value = "24", Category = "Security", Description = "Thời gian tự động đăng xuất khi không hoạt động (giờ)" },
        new() { Key = "gamification.enabled", Value = "true", Category = "Learning", Description = "Kích hoạt hệ thống XP, Cấp độ, Chuỗi Streak và Bảng xếp hạng" },
        new() { Key = "gamification.daily_quests_count", Value = "4", Category = "Learning", Description = "Số lượng nhiệm vụ hàng ngày giao cho mỗi học viên" },
        new() { Key = "gamification.xp_multiplier", Value = "1.0", Category = "Learning", Description = "Hệ số nhân điểm XP toàn hệ thống (VD: 1.5 hoặc 2.0 cho sự kiện X2 XP)" },
        new() { Key = "gamification.streak_freeze_max", Value = "3", Category = "Learning", Description = "Số bùa đóng băng bảo vệ chuỗi Streak tối đa mỗi học viên" },
        new() { Key = "gamification.leaderboard_reset_day", Value = "1", Category = "Learning", Description = "Ngày làm mới Bảng xếp hạng tuần (1 = Thứ Hai, 0 = Chủ Nhật)" },
        new() { Key = "learning.vocab_topics_count", Value = "60", Category = "Learning", Description = "Số chủ đề 3000 Từ Vựng Oxford mở cho học viên" },
        new() { Key = "learning.reflex_units_count", Value = "50", Category = "Learning", Description = "Số Unit Phản Xạ Nói - Viết mở cho học viên" },
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
        new() { Key = "ai.enabled", Value = "true", Category = "AI", Description = "Bật/tắt Trợ lý AI giải thích câu hỏi TOEIC và hội thoại" },
        new() { Key = "ai.provider", Value = "gemini", Category = "AI", Description = "Nhà cung cấp mô hình AI (gemini / openai)" },
        new() { Key = "ai.model", Value = "gemini-1.5-flash", Category = "AI", Description = "Tên Model AI sử dụng" },
        new() { Key = "ai.api_key", Value = "", Category = "AI", Description = "Khóa API Key (Để trống nếu dùng cấu hình mặc định trong appsettings.json)" },
        new() { Key = "ai.max_tokens", Value = "2048", Category = "AI", Description = "Số lượng Token phản hồi tối đa cho mỗi câu trả lời" },
        new() { Key = "ai.temperature", Value = "0.7", Category = "AI", Description = "Độ sáng tạo của AI (0.0 = Chính xác tuyệt đối, 1.0 = Sáng tạo cao)" },
        new() { Key = "ai.daily_limit_per_user", Value = "50", Category = "AI", Description = "Giới hạn số lượt hỏi AI tối đa mỗi ngày trên một học viên" }
    ];
}

// ==========================================
// 3. ACTIVITY LOG SERVICE IMPLEMENTATION
// ==========================================

public class ActivityLogService : IActivityLogService
{
    private readonly IUnitOfWork _unitOfWork;

    public ActivityLogService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    private static DateTime EnsureUtc(DateTime dt) => DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    public async Task LogAsync(
        int? adminUserId,
        string adminName,
        string action,
        string entityType,
        int? entityId,
        string description,
        string? oldValue = null,
        string? newValue = null,
        string ipAddress = "")
    {
        try
        {
            var log = new AdminActivityLog
            {
                AdminUserId = adminUserId,
                AdminName = string.IsNullOrWhiteSpace(adminName) ? "Admin Quản Trị" : adminName,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Description = description,
                OldValue = oldValue,
                NewValue = newValue,
                IpAddress = ipAddress ?? "",
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.AdminManagement.AddActivityLogAsync(log);
        }
        catch
        {
        }
    }

    public async Task<Response<PagedResult<AdminActivityLogDto>>> GetLogsAsync(
        string? action,
        string? entityType,
        string? search,
        int page = 1,
        int pageSize = 50)
    {
        var (items, total) = await _unitOfWork.AdminManagement.GetActivityLogsAsync(action, entityType, search, page, pageSize);

        var dtos = items.Select(l => new AdminActivityLogDto
        {
            Id = l.Id,
            AdminUserId = l.AdminUserId,
            AdminName = l.AdminName,
            Action = l.Action,
            EntityType = l.EntityType,
            EntityId = l.EntityId,
            Description = l.Description,
            OldValue = l.OldValue,
            NewValue = l.NewValue,
            IpAddress = l.IpAddress,
            CreatedAt = EnsureUtc(l.CreatedAt)
        }).ToList();

        var paged = new PagedResult<AdminActivityLogDto>
        {
            Items = dtos,
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize
        };
        return Response<PagedResult<AdminActivityLogDto>>.SuccessResult("Nhật ký hoạt động quản trị", paged);
    }

    public async Task<Response<ActivityLogStatsDto>> GetStatsAsync()
    {
        var recent = await _unitOfWork.AdminManagement.GetRecentActivityLogsAsync(500);
        var todayStart = DateTime.UtcNow.AddHours(7).Date.AddHours(-7); // 00:00 Vietnam time in UTC

        var stats = new ActivityLogStatsDto
        {
            TotalLogs = recent.Count,
            TodayLogs = recent.Count(l => l.CreatedAt >= todayStart),
            StudentActionsCount = recent.Count(l => l.EntityType == "Student"),
            NotificationActionsCount = recent.Count(l => l.EntityType == "Notification"),
            ContentActionsCount = recent.Count(l => l.EntityType == "Test" || l.EntityType == "Bino"),
            SettingsActionsCount = recent.Count(l => l.EntityType == "Setting" || l.EntityType == "System")
        };

        return Response<ActivityLogStatsDto>.SuccessResult("Thống kê nhật ký hoạt động", stats);
    }
}

// ==========================================
// 4. ADVANCED ANALYTICS SERVICE IMPLEMENTATION
// ==========================================

public class AnalyticsService : IAnalyticsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;

    public AnalyticsService(IUnitOfWork unitOfWork, UserManager<ApplicationUser> userManager)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
    }

    private static DateTime? EnsureUtc(DateTime? dt) => dt.HasValue ? DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc) : null;

    public async Task<Response<AdminAnalyticsOverviewDto>> GetAnalyticsOverviewAsync(string period = "30d")
    {
        int days = period switch
        {
            "7d" => 7,
            "90d" => 90,
            _ => 30
        };

        var admins = await _userManager.GetUsersInRoleAsync(UserRole.Admin.ToString());
        var adminIds = admins.Select(a => a.Id).ToHashSet();
        var students = _userManager.Users.Where(u => !adminIds.Contains(u.Id)).ToList();

        var allSummaries = (await _unitOfWork.UserProgresses.GetAllSummariesAsync()).ToList();
        var allBinoProgress = (await _unitOfWork.BinoLearning.GetAllProgressesAsync()).ToList();
        var allVocabProgress = await _unitOfWork.AdminManagement.GetAllVocabProgressesAsync();
        var allReflexProgress = await _unitOfWork.AdminManagement.GetAllReflexProgressesAsync();
        var allGamifications = await _unitOfWork.AdminManagement.GetAllGamificationsAsync();
        var allTests = (await _unitOfWork.ToeicTests.GetAllAsync()).ToList();

        var summaryByUser = allSummaries.GroupBy(s => s.UserId).ToDictionary(g => g.Key, g => g.ToList());
        var binoByUser = allBinoProgress.GroupBy(b => b.UserId).ToDictionary(g => g.Key, g => g.ToList());
        var vocabByUser = allVocabProgress.ToDictionary(v => v.UserId);
        var reflexByUser = allReflexProgress.ToDictionary(r => r.UserId);
        var gamificationByUser = allGamifications.ToDictionary(g => g.UserId);

        // Compute true lastActive for each student
        var lastActiveMap = new Dictionary<int, DateTime?>();
        foreach (var s in students)
        {
            DateTime? last = s.LastLoginAt;
            if (summaryByUser.TryGetValue(s.Id, out var ts) && ts.Count > 0)
            {
                var maxT = ts.Max(x => x.LastAccessedAt);
                if (!last.HasValue || maxT > last.Value) last = maxT;
            }
            if (vocabByUser.TryGetValue(s.Id, out var vp))
            {
                if (!last.HasValue || vp.UpdatedAt > last.Value) last = vp.UpdatedAt;
            }
            if (reflexByUser.TryGetValue(s.Id, out var rp))
            {
                if (!last.HasValue || rp.UpdatedAt > last.Value) last = rp.UpdatedAt;
            }
            if (gamificationByUser.TryGetValue(s.Id, out var gp))
            {
                if (gp.LastActiveDate.HasValue && (!last.HasValue || gp.LastActiveDate.Value > last.Value))
                    last = gp.LastActiveDate.Value;
                if (!last.HasValue || gp.UpdatedAt > last.Value)
                    last = gp.UpdatedAt;
            }
            lastActiveMap[s.Id] = last;
        }

        var nowUtc = DateTime.UtcNow;
        int totalStudents = students.Count;
        int approved = students.Count(s => s.IsApproved);
        int pending = totalStudents - approved;

        int dau = students.Count(s => lastActiveMap.TryGetValue(s.Id, out var la) && la.HasValue && la.Value >= nowUtc.AddDays(-1));
        int wau = students.Count(s => lastActiveMap.TryGetValue(s.Id, out var la) && la.HasValue && la.Value >= nowUtc.AddDays(-7));
        int mau = students.Count(s => lastActiveMap.TryGetValue(s.Id, out var la) && la.HasValue && la.Value >= nowUtc.AddDays(-30));

        double retention7d = totalStudents > 0 ? Math.Round((double)wau / totalStudents * 100, 1) : 0;
        double retention30d = totalStudents > 0 ? Math.Round((double)mau / totalStudents * 100, 1) : 0;

        int totalXp = allGamifications.Sum(g => g.TotalXP);
        int avgXp = totalStudents > 0 ? totalXp / totalStudents : 0;
        int totalBinoMinutes = (int)Math.Ceiling(allBinoProgress.Sum(b => b.TimeSpentSeconds) / 60.0);

        // 1. Registration Trend & Activity Trend (in Vietnam Time dates)
        var vnToday = nowUtc.AddHours(7).Date;
        var regTrend = new List<AnalyticsTimeSeriesPointDto>();
        var actTrend = new List<AnalyticsActivityPointDto>();

        int step = days > 30 ? 3 : 1;
        int cumulative = students.Count(s => s.CreatedAt.AddHours(7).Date < vnToday.AddDays(-days + 1));

        for (int i = days - 1; i >= 0; i -= step)
        {
            var targetDate = vnToday.AddDays(-i);
            var endDate = targetDate.AddDays(step);

            int newRegs = students.Count(s =>
            {
                var d = s.CreatedAt.AddHours(7).Date;
                return d >= targetDate && d < endDate;
            });
            cumulative += newRegs;

            regTrend.Add(new AnalyticsTimeSeriesPointDto
            {
                DateLabel = targetDate.ToString("dd/MM"),
                Count = newRegs,
                CumulativeCount = cumulative
            });

            int activeOnDay = students.Count(s =>
            {
                if (!lastActiveMap.TryGetValue(s.Id, out var la) || !la.HasValue) return false;
                var d = la.Value.AddHours(7).Date;
                return d >= targetDate && d < endDate;
            });

            actTrend.Add(new AnalyticsActivityPointDto
            {
                DateLabel = targetDate.ToString("dd/MM"),
                ActiveUsers = activeOnDay,
                XpEarned = activeOnDay * 65
            });
        }

        // 2. Level Distribution
        int lv1_2 = 0, lv3_5 = 0, lv6_10 = 0, lv11_20 = 0, lv21Plus = 0;
        foreach (var s in students)
        {
            int lv = gamificationByUser.TryGetValue(s.Id, out var g) ? g.CurrentLevel : 1;
            if (lv <= 2) lv1_2++;
            else if (lv <= 5) lv3_5++;
            else if (lv <= 10) lv6_10++;
            else if (lv <= 20) lv11_20++;
            else lv21Plus++;
        }

        double Pct(int c) => totalStudents > 0 ? Math.Round((double)c / totalStudents * 100, 1) : 0;
        var levelDist = new List<AnalyticsDistributionItemDto>
        {
            new() { Label = "Tân binh (Lv.1-2)", Count = lv1_2, Percentage = Pct(lv1_2), Color = "#64748b" },
            new() { Label = "Khởi động (Lv.3-5)", Count = lv3_5, Percentage = Pct(lv3_5), Color = "#3b82f6" },
            new() { Label = "Bứt phá (Lv.6-10)", Count = lv6_10, Percentage = Pct(lv6_10), Color = "#10b981" },
            new() { Label = "Cao thủ (Lv.11-20)", Count = lv11_20, Percentage = Pct(lv11_20), Color = "#8b5cf6" },
            new() { Label = "Huyền thoại (Lv.21+)", Count = lv21Plus, Percentage = Pct(lv21Plus), Color = "#f59e0b" }
        };

        // 3. Pillar Comparison (4 Pillars)
        int toeicLearners = summaryByUser.Count(kv => kv.Value.Any(x => x.CompletedQuestions > 0));
        int toeicTotalCompleted = allSummaries.Sum(s => s.CompletedQuestions);
        double toeicAvgPct = allSummaries.Count > 0 ? Math.Round(allSummaries.Average(s => s.PercentCompleted), 1) : 0;

        int binoLearners = binoByUser.Count(kv => kv.Value.Any(x => x.IsCompleted));
        int binoTotalDone = allBinoProgress.Count(b => b.IsCompleted);
        double binoAvgPct = binoLearners > 0 ? Math.Round((double)binoTotalDone / (binoLearners * 72.0) * 100, 1) : 0;

        int vocabLearners = allVocabProgress.Count(v => v.MasteredCount > 0);
        int vocabTotalMastered = allVocabProgress.Sum(v => v.MasteredCount);
        double vocabAvgPct = vocabLearners > 0 ? Math.Round((double)vocabTotalMastered / (vocabLearners * 1760.0) * 100, 1) : 0;

        int reflexLearners = allReflexProgress.Count(r => r.MasteredCount > 0);
        int reflexTotalMastered = allReflexProgress.Sum(r => r.MasteredCount);
        double reflexAvgPct = reflexLearners > 0 ? Math.Round((double)reflexTotalMastered / (reflexLearners * 1500.0) * 100, 1) : 0;

        var pillarComp = new List<AnalyticsPillarStatDto>
        {
            new() { PillarName = "Luyện Đề TOEIC", ActiveLearners = toeicLearners, TotalCompletions = toeicTotalCompleted, AvgCompletionPercent = toeicAvgPct },
            new() { PillarName = "Giao Tiếp Thực Chiến", ActiveLearners = binoLearners, TotalCompletions = binoTotalDone, AvgCompletionPercent = binoAvgPct },
            new() { PillarName = "3000 Từ Vựng Oxford", ActiveLearners = vocabLearners, TotalCompletions = vocabTotalMastered, AvgCompletionPercent = vocabAvgPct },
            new() { PillarName = "Phản Xạ 50 Chủ Đề", ActiveLearners = reflexLearners, TotalCompletions = reflexTotalMastered, AvgCompletionPercent = reflexAvgPct }
        };

        // 4. Top Performers
        AnalyticsTopStudentDto MapTop(ApplicationUser u, int metricVal, string metricLabel)
        {
            gamificationByUser.TryGetValue(u.Id, out var g);
            return new AnalyticsTopStudentDto
            {
                UserId = u.Id,
                FullName = u.FullName,
                Email = u.Email ?? "",
                Level = g?.CurrentLevel ?? 1,
                TotalXp = g?.TotalXP ?? 0,
                StreakDays = g?.CurrentStreak ?? 0,
                MetricValue = metricVal,
                MetricLabel = metricLabel
            };
        }

        var topByXp = students
            .Select(u => (User: u, Xp: gamificationByUser.TryGetValue(u.Id, out var g) ? g.TotalXP : 0))
            .OrderByDescending(x => x.Xp)
            .Take(5)
            .Select(x => MapTop(x.User, x.Xp, $"{x.Xp:N0} XP"))
            .ToList();

        var topByStreak = students
            .Select(u => (User: u, Streak: gamificationByUser.TryGetValue(u.Id, out var g) ? g.CurrentStreak : 0))
            .OrderByDescending(x => x.Streak)
            .Take(5)
            .Select(x => MapTop(x.User, x.Streak, $"{x.Streak} ngày"))
            .ToList();

        var topByVocab = students
            .Select(u => (User: u, Words: vocabByUser.TryGetValue(u.Id, out var v) ? v.MasteredCount : 0))
            .OrderByDescending(x => x.Words)
            .Take(5)
            .Select(x => MapTop(x.User, x.Words, $"{x.Words} từ"))
            .ToList();

        var topByBino = students
            .Select(u => (User: u, Lessons: binoByUser.TryGetValue(u.Id, out var b) ? b.Count(i => i.IsCompleted) : 0))
            .OrderByDescending(x => x.Lessons)
            .Take(5)
            .Select(x => MapTop(x.User, x.Lessons, $"{x.Lessons}/72 bài"))
            .ToList();

        // 5. Smart Alerts: Inactive Students (> 7 days) & At-Risk Streaks
        var inactiveList = new List<AnalyticsInactiveStudentDto>();
        var atRiskList = new List<AnalyticsInactiveStudentDto>();

        foreach (var s in students)
        {
            lastActiveMap.TryGetValue(s.Id, out var la);
            gamificationByUser.TryGetValue(s.Id, out var g);
            var refDate = la ?? s.CreatedAt;
            int daysInactive = (int)Math.Floor((nowUtc - refDate).TotalDays);

            if (daysInactive >= 7)
            {
                inactiveList.Add(new AnalyticsInactiveStudentDto
                {
                    UserId = s.Id,
                    FullName = s.FullName,
                    Email = s.Email ?? "",
                    DaysInactive = daysInactive,
                    CurrentStreak = g?.CurrentStreak ?? 0,
                    TotalXp = g?.TotalXP ?? 0,
                    LastActiveAt = EnsureUtc(la)
                });
            }
            else if ((g?.CurrentStreak ?? 0) >= 2 && daysInactive >= 1)
            {
                atRiskList.Add(new AnalyticsInactiveStudentDto
                {
                    UserId = s.Id,
                    FullName = s.FullName,
                    Email = s.Email ?? "",
                    DaysInactive = daysInactive,
                    CurrentStreak = g?.CurrentStreak ?? 0,
                    TotalXp = g?.TotalXP ?? 0,
                    LastActiveAt = EnsureUtc(la)
                });
            }
        }

        var overview = new AdminAnalyticsOverviewDto
        {
            TotalStudents = totalStudents,
            ApprovedStudents = approved,
            PendingStudents = pending,
            DauCount = dau,
            WauCount = wau,
            MauCount = mau,
            RetentionRate7d = retention7d,
            RetentionRate30d = retention30d,
            TotalSystemXp = totalXp,
            AverageXpPerStudent = avgXp,
            TotalBinoStudyMinutes = totalBinoMinutes,
            RegistrationTrend = regTrend,
            ActivityTrend = actTrend,
            LevelDistribution = levelDist,
            PillarComparison = pillarComp,
            TopByXp = topByXp,
            TopByStreak = topByStreak,
            TopByVocab = topByVocab,
            TopByBino = topByBino,
            InactiveStudents = inactiveList.OrderByDescending(i => i.DaysInactive).Take(20).ToList(),
            AtRiskStreakStudents = atRiskList.OrderByDescending(i => i.CurrentStreak).Take(20).ToList(),
            TotalToeicTests = allTests.Count,
            TotalToeicQuestions = allTests.Sum(t => t.TotalQuestions),
            TotalBinoChapters = 12,
            TotalBinoDialogues = 72,
            TotalVocabMasteredAcrossAll = vocabTotalMastered,
            TotalReflexMasteredAcrossAll = reflexTotalMastered
        };

        return Response<AdminAnalyticsOverviewDto>.SuccessResult("Phân tích nâng cao thành công", overview);
    }
}
