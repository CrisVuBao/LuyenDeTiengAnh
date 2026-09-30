using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Application.DTOs.Gamification;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public interface IGamificationService
{
    Task<Response<GamificationProfileDto>> GetProfileAsync(int userId);
    Task<Response<GamificationProfileDto>> AddXPAsync(int userId, int amount, string source, string description);
    Task<Response<List<DailyQuestDto>>> GetDailyQuestsAsync(int userId);
    Task<Response<bool>> CompleteDailyQuestAsync(int userId, string questId);
    Task<Response<List<LeaderboardEntryDto>>> GetLeaderboardAsync();
    Task<Response<List<AchievementDto>>> GetAchievementsAsync(int userId);
    Task UpdateStreakAsync(int userId);
}

/// <summary>
/// GamificationService (Facade / Core):
/// Được phân rã thành các partial classes chuyên trách:
/// - GamificationService.XP.cs: Cơ chế cộng XP, chuẩn hóa điểm, chống cày điểm ảo
/// - GamificationService.Streaks.cs: Cập nhật chuỗi ngày học liên tục, đóng băng Streak
/// - GamificationService.Quests.cs: Tạo và hoàn thành nhiệm vụ hàng ngày
/// - GamificationService.Leaderboard.cs: Bảng xếp hạng tuần và lưu cache
/// - GamificationService.Achievements.cs: Hệ thống 28 danh hiệu thành tựu và huy hiệu
/// </summary>
public partial class GamificationService : IGamificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMemoryCache _memoryCache;
    private readonly ISystemSettingsService _settingsService;
    private readonly INotificationService _notificationService;

    public GamificationService(
        IUnitOfWork unitOfWork,
        IMemoryCache memoryCache,
        ISystemSettingsService settingsService,
        INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _memoryCache = memoryCache;
        _settingsService = settingsService;
        _notificationService = notificationService;
    }

    private static DateTime GetVietnamTime() => DateTime.UtcNow.AddHours(7);
    private static DateTime GetVietnamToday() => GetVietnamTime().Date;

    /// <summary>
    /// Đường cong Cấp độ chuẩn RPG Cày Cuốc Thực Chất (Mở rộng tới Level 100):
    /// XP(L) = 100 * L + 25 * L * (L - 1)
    /// </summary>
    private int GetXpForNextLevel(int currentLevel)
    {
        int lv = Math.Max(1, currentLevel);
        return 100 * lv + 25 * lv * (lv - 1);
    }

    private int CalculateLevel(int totalXp)
    {
        int level = 1;
        while (level < 100 && totalXp >= GetXpForNextLevel(level))
        {
            level++;
        }
        return level;
    }

    private string GetLevelTitle(int level)
    {
        return level switch
        {
            <= 3 => "Tân binh",
            <= 7 => "Học việc",
            <= 12 => "Chiến binh",
            <= 20 => "Tinh anh",
            <= 30 => "Dũng sĩ",
            <= 45 => "Cao thủ",
            <= 65 => "Bậc thầy",
            _ => "Huyền thoại"
        };
    }

    /// <summary>
    /// Đánh giá và cập nhật trạng thái chuỗi học tập (Streak).
    /// Quy tắc nghiêm ngặt: Ngày hôm đó không học là mất chuỗi!
    /// - Nếu hôm nay đã học: Chuỗi an toàn (active, hasStudiedToday = true).
    /// - Nếu hôm qua đã học: Chuỗi đang giữ (at_risk, hasStudiedToday = false). Cần học hôm nay để không mất chuỗi.
    /// - Nếu hôm qua không học:
    ///     + Nếu chỉ lỡ đúng hôm qua và có Streak Freeze: Tiêu hao 1 Freeze để bảo vệ, giữ nguyên chuỗi.
    ///     + Nếu không có Freeze hoặc lỡ từ 2 ngày trở lên: MẤT CHUỖI (CurrentStreak = 0, broken).
    /// </summary>
    public static (bool changed, bool hasStudiedToday, string streakStatus) EvaluateStreak(UserGamification gamification, DateTime todayVn)
    {
        if (gamification == null) return (false, false, "broken");
        bool changed = false;

        var lastActiveDateVn = gamification.LastActiveDate?.Date;
        bool hasStudiedToday = lastActiveDateVn.HasValue && lastActiveDateVn.Value == todayVn;

        if (gamification.CurrentStreak > 0)
        {
            if (lastActiveDateVn == null)
            {
                gamification.CurrentStreak = 0;
                changed = true;
                return (changed, false, "broken");
            }

            if (lastActiveDateVn.Value == todayVn)
            {
                // Đã học trong hôm nay -> Chuỗi an toàn
                return (changed, true, "active");
            }

            if (lastActiveDateVn.Value == todayVn.AddDays(-1))
            {
                // Đã học hôm qua, hôm nay chưa học -> Có nguy cơ mất chuỗi nếu hết hôm nay không học
                return (changed, false, "at_risk");
            }

            // Bỏ lỡ ngày hôm qua (lastActiveDateVn < yesterday)
            if (lastActiveDateVn.Value == todayVn.AddDays(-2) && gamification.StreakFreezeCount > 0)
            {
                // Tự động tiêu hao 1 lượt bảo vệ chuỗi cho ngày hôm qua
                gamification.StreakFreezeCount--;
                gamification.LastActiveDate = todayVn.AddDays(-1).AddHours(23).AddMinutes(59);
                changed = true;
                return (changed, false, "at_risk");
            }

            // Mất chuỗi do không học hôm qua và không có lượt đóng băng bảo vệ (hoặc bỏ lỡ >= 2 ngày)
            gamification.CurrentStreak = 0;
            changed = true;
            return (changed, false, "broken");
        }

        string status = hasStudiedToday ? "active" : "broken";
        return (changed, hasStudiedToday, status);
    }

    public async Task<Response<GamificationProfileDto>> GetProfileAsync(int userId)
    {
        var gamification = await _unitOfWork.Gamification.GetByUserIdAsync(userId);
        if (gamification == null)
        {
            gamification = new UserGamification { UserId = userId };
            await _unitOfWork.Gamification.UpsertAsync(gamification);
            await _unitOfWork.CompleteAsync();
        }

        var todayVn = GetVietnamToday();
        bool hasChanges = false;

        // 0. Đồng bộ lại chính xác CurrentLevel theo đường cong RPG mới dựa trên TotalXP thực tế
        int calculatedLevel = CalculateLevel(gamification.TotalXP);
        if (gamification.CurrentLevel != calculatedLevel)
        {
            gamification.CurrentLevel = calculatedLevel;
            hasChanges = true;
        }

        // 1. Kiểm tra Reset WeeklyXP vào đầu tuần (Thứ Hai 00:00 VN)
        int diff = (7 + (todayVn.DayOfWeek - DayOfWeek.Monday)) % 7;
        var mondayThisWeek = todayVn.AddDays(-diff);
        if (gamification.LastActiveDate != null && gamification.LastActiveDate.Value.Date < mondayThisWeek)
        {
            gamification.WeeklyXP = 0;
            hasChanges = true;
        }

        // 2. Đánh giá Chuỗi học tập (Streak) theo quy tắc nghiêm ngặt: Ngày hôm đó không học là mất chuỗi
        var (streakChanged, hasStudiedToday, streakStatus) = EvaluateStreak(gamification, todayVn);
        if (streakChanged)
        {
            hasChanges = true;
        }

        // 3. Kiểm tra nếu sang ngày mới mà chưa có nhiệm vụ ngày hôm nay hoặc nhiệm vụ còn sót TOEIC
        bool hasToeicInQuests = !string.IsNullOrEmpty(gamification.DailyQuestsJson) && 
                                gamification.DailyQuestsJson.Contains("toeic", StringComparison.OrdinalIgnoreCase);

        bool needNewQuests = gamification.LastActiveDate == null || 
                             gamification.LastActiveDate.Value.Date < todayVn ||
                             string.IsNullOrEmpty(gamification.DailyQuestsJson) || 
                             gamification.DailyQuestsJson == "[]" ||
                             hasToeicInQuests;

        if (needNewQuests)
        {
            var newQuests = GenerateDailyQuests(userId, todayVn);
            gamification.DailyQuestsJson = JsonSerializer.Serialize(newQuests);
            hasChanges = true;
        }

        if (hasChanges)
        {
            gamification.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Gamification.UpsertAsync(gamification);
            await _unitOfWork.CompleteAsync();
        }

        var nextLevelXp = GetXpForNextLevel(gamification.CurrentLevel);
        var prevLevelXp = gamification.CurrentLevel > 1 ? GetXpForNextLevel(gamification.CurrentLevel - 1) : 0;
        var progress = (double)(gamification.TotalXP - prevLevelXp) / Math.Max(1, nextLevelXp - prevLevelXp) * 100;
        if (progress < 0) progress = 0;
        if (progress > 100) progress = 100;

        var rank = await _unitOfWork.Gamification.GetUserRankAsync(userId);
        var unlockedBadges = JsonSerializer.Deserialize<List<string>>(gamification.UnlockedBadgesJson) ?? new List<string>();
        var sanitizedQuestsJson = (gamification.DailyQuestsJson ?? "[]")
            .Replace("câu thoại Bino", "câu hội thoại")
            .Replace("3 câu Bino", "3 câu hội thoại")
            .Replace("từ vựng Bino", "thẻ từ vựng SRS");
        var dailyQuests = JsonSerializer.Deserialize<List<DailyQuestDto>>(sanitizedQuestsJson) ?? new List<DailyQuestDto>();

        // Lấy lịch sử ngày hoạt động học tập thực tế từ XPTransaction
        var recentDates = await _unitOfWork.Gamification.GetRecentActiveDatesAsync(userId, 70);
        var activeDateStrings = recentDates
            .Select(d => d.AddHours(7).ToString("yyyy-MM-dd"))
            .ToList();

        if (gamification.LastActiveDate != null)
        {
            activeDateStrings.Add(gamification.LastActiveDate.Value.ToString("yyyy-MM-dd"));
        }
        var distinctActiveDates = activeDateStrings.Distinct().OrderBy(d => d).ToList();

        var dto = new GamificationProfileDto
        {
            TotalXP = gamification.TotalXP,
            CurrentLevel = gamification.CurrentLevel,
            LevelTitle = GetLevelTitle(gamification.CurrentLevel),
            XPForNextLevel = nextLevelXp,
            XPProgressPercentage = Math.Round(progress, 1),
            WeeklyXP = gamification.WeeklyXP,
            CurrentStreak = gamification.CurrentStreak,
            LongestStreak = gamification.LongestStreak,
            StreakFreezeCount = gamification.StreakFreezeCount,
            HasStudiedToday = hasStudiedToday,
            StreakStatus = streakStatus,
            ActiveDates = distinctActiveDates,
            UnlockedBadges = unlockedBadges,
            DailyQuests = dailyQuests,
            LeaderboardRank = rank
        };

        return Response<GamificationProfileDto>.SuccessResult("Lấy thông tin thành công", dto);
    }
}
