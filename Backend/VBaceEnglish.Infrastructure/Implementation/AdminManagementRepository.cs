using Microsoft.EntityFrameworkCore;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Domain.Models;
using VBaceEnglish.Infrastructure.Data;

namespace VBaceEnglish.Infrastructure.Implementation;

public class AdminManagementRepository : IAdminManagementRepository
{
    private readonly AppDBContext _context;

    public AdminManagementRepository(AppDBContext context)
    {
        _context = context;
    }

    // ==========================================
    // 1. NOTIFICATIONS
    // ==========================================

    public async Task<List<Notification>> GetUserNotificationsAsync(int userId, int limit = 40)
    {
        var now = DateTime.UtcNow;
        return await _context.Notifications
            .AsNoTracking()
            .Where(n => !n.IsDeleted &&
                        n.RecipientUserId == userId &&
                        (!n.ExpiresAt.HasValue || n.ExpiresAt.Value > now))
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        var now = DateTime.UtcNow;
        return await _context.Notifications
            .AsNoTracking()
            .CountAsync(n => !n.IsDeleted &&
                             !n.IsRead &&
                             n.RecipientUserId == userId &&
                             (!n.ExpiresAt.HasValue || n.ExpiresAt.Value > now));
    }

    public async Task<Notification?> GetNotificationByIdAsync(int id)
    {
        return await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && !n.IsDeleted);
    }

    public async Task AddNotificationsAsync(IEnumerable<Notification> notifications)
    {
        await _context.Notifications.AddRangeAsync(notifications);
    }

    public async Task<bool> MarkAsReadAsync(int userId, int notificationId)
    {
        var notif = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientUserId == userId && !n.IsDeleted);

        if (notif == null) return false;
        if (!notif.IsRead)
        {
            notif.IsRead = true;
            notif.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
        return true;
    }

    public async Task<int> MarkAllAsReadAsync(int userId)
    {
        var unread = await _context.Notifications
            .Where(n => n.RecipientUserId == userId && !n.IsRead && !n.IsDeleted)
            .ToListAsync();

        if (unread.Count == 0) return 0;

        var now = DateTime.UtcNow;
        foreach (var item in unread)
        {
            item.IsRead = true;
            item.ReadAt = now;
        }

        await _context.SaveChangesAsync();
        return unread.Count;
    }

    public async Task<int> DeleteNotificationOrBatchAsync(string idOrBatchId)
    {
        List<Notification> toDelete;
        if (int.TryParse(idOrBatchId, out int id))
        {
            var single = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id);
            if (single == null) return 0;

            if (!string.IsNullOrEmpty(single.BatchId))
            {
                toDelete = await _context.Notifications
                    .Where(n => n.BatchId == single.BatchId)
                    .ToListAsync();
            }
            else
            {
                toDelete = [single];
            }
        }
        else
        {
            toDelete = await _context.Notifications
                .Where(n => n.BatchId == idOrBatchId)
                .ToListAsync();
        }

        if (toDelete.Count == 0) return 0;

        _context.Notifications.RemoveRange(toDelete);
        await _context.SaveChangesAsync();
        return toDelete.Count;
    }

    public async Task<List<Notification>> GetAllAdminNotificationsAsync(int limit = 500)
    {
        return await _context.Notifications
            .AsNoTracking()
            .Include(n => n.RecipientUser)
            .Where(n => !n.IsDeleted)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> DeleteOldNotificationsAsync(DateTime olderThan)
    {
        var oldItems = await _context.Notifications
            .Where(n => n.CreatedAt < olderThan || (n.ExpiresAt.HasValue && n.ExpiresAt.Value < DateTime.UtcNow))
            .ToListAsync();

        if (oldItems.Count == 0) return 0;
        _context.Notifications.RemoveRange(oldItems);
        await _context.SaveChangesAsync();
        return oldItems.Count;
    }

    // ==========================================
    // 2. SYSTEM SETTINGS
    // ==========================================

    public async Task<List<SystemSetting>> GetAllSettingsAsync()
    {
        var items = await _context.SystemSettings
            .AsNoTracking()
            .OrderBy(s => s.Category)
            .ThenBy(s => s.Id)
            .ToListAsync();

        if (items.Count == 0)
        {
            var defaults = DbInitializer.GetDefaultSystemSettings();
            await _context.SystemSettings.AddRangeAsync(defaults);
            await _context.SaveChangesAsync();
            return defaults;
        }

        return items;
    }

    public async Task<SystemSetting?> GetSettingByKeyAsync(string key)
    {
        return await _context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == key);
    }

    public async Task UpsertSettingsAsync(Dictionary<string, string> updates, int? updatedByUserId)
    {
        var existing = await _context.SystemSettings.ToListAsync();
        var map = existing.ToDictionary(s => s.Key, StringComparer.OrdinalIgnoreCase);
        var defaultsMap = DbInitializer.GetDefaultSystemSettings()
            .ToDictionary(s => s.Key, StringComparer.OrdinalIgnoreCase);
        var now = DateTime.UtcNow;

        foreach (var kvp in updates)
        {
            if (map.TryGetValue(kvp.Key, out var setting))
            {
                setting.Value = kvp.Value ?? string.Empty;
                setting.UpdatedAt = now;
                setting.UpdatedByUserId = updatedByUserId;
            }
            else
            {
                defaultsMap.TryGetValue(kvp.Key, out var def);
                var newSetting = new SystemSetting
                {
                    Key = kvp.Key,
                    Value = kvp.Value ?? string.Empty,
                    Category = def?.Category ?? "General",
                    Description = def?.Description ?? kvp.Key,
                    UpdatedAt = now,
                    UpdatedByUserId = updatedByUserId
                };
                await _context.SystemSettings.AddAsync(newSetting);
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task ResetAllSettingsAsync(IEnumerable<SystemSetting> defaultSettings, int? updatedByUserId)
    {
        var existing = await _context.SystemSettings.ToListAsync();
        if (existing.Count > 0)
        {
            _context.SystemSettings.RemoveRange(existing);
            await _context.SaveChangesAsync();
        }

        var now = DateTime.UtcNow;
        var list = defaultSettings.Select(d => new SystemSetting
        {
            Key = d.Key,
            Value = d.Value,
            Category = d.Category,
            Description = d.Description,
            UpdatedAt = now,
            UpdatedByUserId = updatedByUserId
        }).ToList();

        await _context.SystemSettings.AddRangeAsync(list);
        await _context.SaveChangesAsync();
    }

    // ==========================================
    // 3. ADMIN ACTIVITY LOGS
    // ==========================================

    public async Task AddActivityLogAsync(AdminActivityLog log)
    {
        await _context.AdminActivityLogs.AddAsync(log);
        await _context.SaveChangesAsync();
    }

    public async Task<(List<AdminActivityLog> Items, int TotalCount)> GetActivityLogsAsync(
        string? action,
        string? entityType,
        string? search,
        int page = 1,
        int pageSize = 50)
    {
        var query = _context.AdminActivityLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(action) && action != "all")
        {
            query = query.Where(l => l.Action.StartsWith(action));
        }

        if (!string.IsNullOrWhiteSpace(entityType) && entityType != "all")
        {
            query = query.Where(l => l.EntityType == entityType);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(l =>
                l.Description.ToLower().Contains(term) ||
                l.AdminName.ToLower().Contains(term) ||
                l.Action.ToLower().Contains(term));
        }

        int total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((Math.Max(1, page) - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<List<AdminActivityLog>> GetRecentActivityLogsAsync(int limit = 200)
    {
        return await _context.AdminActivityLogs
            .AsNoTracking()
            .OrderByDescending(l => l.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> DeleteOldActivityLogsAsync(DateTime olderThan)
    {
        var oldLogs = await _context.AdminActivityLogs
            .Where(l => l.CreatedAt < olderThan)
            .ToListAsync();

        if (oldLogs.Count == 0) return 0;
        _context.AdminActivityLogs.RemoveRange(oldLogs);
        await _context.SaveChangesAsync();
        return oldLogs.Count;
    }

    public async Task<int> DeleteOldAiChatLogsAsync(DateTime olderThan)
    {
        var oldChats = await _context.AiChatHistories
            .Where(c => c.CreatedAt < olderThan)
            .ToListAsync();

        if (oldChats.Count == 0) return 0;
        _context.AiChatHistories.RemoveRange(oldChats);
        await _context.SaveChangesAsync();
        return oldChats.Count;
    }

    // ==========================================
    // 4. ANALYTICS & DATABASE METRICS
    // ==========================================

    public async Task<Dictionary<string, int>> GetDatabaseTableCountsAsync()
    {
        var result = new Dictionary<string, int>
        {
            ["Học viên & Quản trị (AspNetUsers)"] = await _context.Users.CountAsync(),
            ["Đề thi TOEIC (ToeicTests)"] = await _context.ToeicTests.CountAsync(),
            ["Tiến độ câu TOEIC (UserStudyProgresses)"] = await _context.UserStudyProgresses.CountAsync(),
            ["Tổng kết đề TOEIC (UserTestSummaries)"] = await _context.UserTestSummaries.CountAsync(),
            ["Chương Giao Tiếp (Chapters)"] = await _context.Chapters.CountAsync(),
            ["Bài Hội Thoại (DialogueLessons)"] = await _context.DialogueLessons.CountAsync(),
            ["Từ Vựng Hội Thoại (DialogueVocabularies)"] = await _context.DialogueVocabularies.CountAsync(),
            ["Câu Thoại Thực Chiến (DialogueLines)"] = await _context.DialogueLines.CountAsync(),
            ["Tiến Độ Hội Thoại (UserDialogueProgresses)"] = await _context.UserDialogueProgresses.CountAsync(),
            ["Thẻ SRS Ngắt Quãng (UserSRSReviews)"] = await _context.UserSRSReviews.CountAsync(),
            ["Tiến độ 3000 Từ vựng (UserVocabProgresses)"] = await _context.UserVocabProgresses.CountAsync(),
            ["Tiến độ 50 Phản xạ (UserReflexProgresses)"] = await _context.UserReflexProgresses.CountAsync(),
            ["Hồ sơ Gamification (UserGamifications)"] = await _context.UserGamifications.CountAsync(),
            ["Giao dịch XP (XPTransactions)"] = await _context.XPTransactions.CountAsync(),
            ["Lịch sử hỏi AI (AiChatHistories)"] = await _context.AiChatHistories.CountAsync(),
            ["Thông báo (Notifications)"] = await _context.Notifications.CountAsync(),
            ["Cài đặt hệ thống (SystemSettings)"] = await _context.SystemSettings.CountAsync(),
            ["Nhật ký quản trị (AdminActivityLogs)"] = await _context.AdminActivityLogs.CountAsync()
        };

        return result;
    }

    public async Task<List<UserVocabProgress>> GetAllVocabProgressesAsync()
    {
        return await _context.UserVocabProgresses.AsNoTracking().ToListAsync();
    }

    public async Task<List<UserReflexProgress>> GetAllReflexProgressesAsync()
    {
        return await _context.UserReflexProgresses.AsNoTracking().ToListAsync();
    }

    public async Task<List<UserGamification>> GetAllGamificationsAsync()
    {
        return await _context.UserGamifications.AsNoTracking().ToListAsync();
    }
}
