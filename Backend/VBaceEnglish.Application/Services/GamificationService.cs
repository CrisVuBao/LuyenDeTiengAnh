using System.Security.Cryptography;
using System.Text;
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

public class GamificationService : IGamificationService
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
    /// Tổng XP cần để hoàn thành Level L (bước sang Level L + 1):
    /// XP(L) = 100 * L + 25 * L * (L - 1)
    /// - Lv.1 -> Lv.2: cần 100 XP
    /// - Lv.2 -> Lv.3: cần 250 XP (+150 XP)
    /// - Lv.3 -> Lv.4: cần 450 XP (+200 XP)
    /// - Lv.4 -> Lv.5: cần 700 XP (+250 XP)
    /// - Lv.5 -> Lv.6: cần 1,000 XP (+300 XP)
    /// - Lv.10 -> Lv.11: cần 3,250 XP
    /// - Lv.20 -> Lv.21: cần 11,500 XP
    /// - Lv.30 -> Lv.31: cần 24,750 XP
    /// - Lv.50 -> Lv.51: cần 66,250 XP
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
    /// Chuẩn hóa điểm XP nhận được theo từng hành động và áp dụng cơ chế Chống Cày Điểm Ảo (Anti-Farming & Daily Cap).
    /// </summary>
    private int NormalizeAndValidateXpReward(int userId, int requestedAmount, string source, string description, DateTime todayVn)
    {
        if (string.Equals(source, "AdminReward", StringComparison.OrdinalIgnoreCase))
        {
            return Math.Max(0, requestedAmount);
        }

        string src = (source ?? "").Trim().ToLowerInvariant();
        string desc = (description ?? "").Trim();
        string dateKey = todayVn.ToString("yyyyMMdd");

        // 1. Chống nhận thưởng trùng lặp cho cùng 1 mục cụ thể trong ngày (Idempotency cho hoàn thành bài / câu cụ thể)
        if (!string.IsNullOrEmpty(desc) &&
            (src == "bino_dialogue" || src == "reflex_master" || src == "toeic_confident" || src == "bino_dictation"))
        {
            string uniqueItemKey = $"xp_once_{userId}_{dateKey}_{src}_{desc}";
            if (_memoryCache.TryGetValue(uniqueItemKey, out bool _))
            {
                return 0;
            }
            _memoryCache.Set(uniqueItemKey, true, TimeSpan.FromHours(24));
        }

        // 2. Bảng quy đổi XP chuẩn theo đúng công sức cày cuốc thực tế & Trần tối đa mỗi lần
        int baseXp;
        int dailySourceCap = 300; // Trần mặc định

        if (src == "bino_listen" || src == "reflex_listen")
        {
            // Nghe thụ động: 1 XP / câu, tối đa 15 XP / ngày (tránh bật tự động phát lặp để treo máy cày cấp)
            baseXp = 1;
            dailySourceCap = 15;
        }
        else if (src.StartsWith("vocab_master"))
        {
            baseXp = 1;
            dailySourceCap = 25;
        }
        else if (src == "flashcard_review")
        {
            baseXp = Math.Clamp(requestedAmount, 1, 3);
            dailySourceCap = 35;
        }
        else if (src.StartsWith("vocab_flashcard"))
        {
            baseXp = Math.Clamp(requestedAmount, 1, 12);
            dailySourceCap = 45;
        }
        else if (src == "vocab_quiz")
        {
            baseXp = Math.Clamp(requestedAmount, 1, 15);
            dailySourceCap = 45;
        }
        else if (src.StartsWith("vocab_spelling"))
        {
            baseXp = Math.Clamp(requestedAmount, 1, 20);
            dailySourceCap = 50;
        }
        else if (src == "bino_roleplay")
        {
            bool isFullRoleplay = desc.Contains("Hoàn thành", StringComparison.OrdinalIgnoreCase);
            baseXp = isFullRoleplay ? 10 : Math.Clamp(requestedAmount, 1, 5);
            dailySourceCap = 50;
        }
        else if (src == "bino_dictation")
        {
            baseXp = Math.Clamp(requestedAmount, 1, 5);
            dailySourceCap = 45;
        }
        else if (src == "bino_dialogue")
        {
            baseXp = 12;
            dailySourceCap = 60;
        }
        else if (src == "reflex_write")
        {
            baseXp = Math.Clamp(requestedAmount, 1, 6);
            dailySourceCap = 50;
        }
        else if (src == "reflex_speak")
        {
            baseXp = Math.Clamp(requestedAmount, 1, 8);
            dailySourceCap = 65;
        }
        else if (src == "reflex_master")
        {
            bool isFullUnit = desc.Contains("Unit", StringComparison.OrdinalIgnoreCase);
            baseXp = isFullUnit ? 10 : 1;
            dailySourceCap = 30;
        }
        else if (src == "toeic_confident")
        {
            baseXp = 2;
            dailySourceCap = 40;
        }
        else
        {
            baseXp = Math.Clamp(requestedAmount, 1, 10);
            dailySourceCap = 50;
        }

        // 3. Kiểm tra giới hạn trần XP theo nhóm nguồn trong ngày
        string capGroup = (src == "bino_listen" || src == "reflex_listen") ? "passive_listen" : src.Split(':')[0];
        string dailyAccumKey = $"xp_daily_sum_{userId}_{dateKey}_{capGroup}";
        int earnedToday = _memoryCache.TryGetValue(dailyAccumKey, out int currentSum) ? currentSum : 0;

        if (earnedToday >= dailySourceCap)
        {
            return 0;
        }

        int finalXp = Math.Min(baseXp, dailySourceCap - earnedToday);
        _memoryCache.Set(dailyAccumKey, earnedToday + finalXp, TimeSpan.FromHours(24));
        return finalXp;
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

        // 2. Kiểm tra nếu sang ngày mới mà chưa có nhiệm vụ ngày hôm nay hoặc nhiệm vụ còn sót TOEIC
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
            UnlockedBadges = unlockedBadges,
            DailyQuests = dailyQuests,
            LeaderboardRank = rank
        };

        return Response<GamificationProfileDto>.SuccessResult("Lấy thông tin thành công", dto);
    }

    public async Task<Response<GamificationProfileDto>> AddXPAsync(int userId, int amount, string source, string description)
    {
        var gamification = await _unitOfWork.Gamification.GetByUserIdAsync(userId);
        if (gamification == null)
        {
            gamification = new UserGamification { UserId = userId };
        }

        // Đồng bộ lại cấp độ thực tế trước khi cộng XP mới
        gamification.CurrentLevel = CalculateLevel(gamification.TotalXP);

        var nowVn = GetVietnamTime();
        var todayVn = nowVn.Date;

        // 1. Cập nhật chuỗi ngày học Streak (theo giờ Việt Nam UTC+7)
        if (gamification.LastActiveDate == null)
        {
            gamification.CurrentStreak = 1;
        }
        else
        {
            var lastActiveVn = gamification.LastActiveDate.Value.Date;
            if (lastActiveVn != todayVn)
            {
                if (lastActiveVn == todayVn.AddDays(-1))
                {
                    gamification.CurrentStreak++;
                    // Cứ mỗi mốc 7 ngày liên tục -> Tặng 1 lượt Streak Freeze bảo vệ (tối đa 3 lượt)
                    if (gamification.CurrentStreak % 7 == 0 && gamification.StreakFreezeCount < 3)
                    {
                        gamification.StreakFreezeCount++;
                    }
                }
                else
                {
                    // Đứt chuỗi: Kiểm tra xem có Streak Freeze bảo vệ không
                    if (gamification.StreakFreezeCount > 0)
                    {
                        gamification.StreakFreezeCount--;
                        gamification.CurrentStreak++;
                    }
                    else
                    {
                        gamification.CurrentStreak = 1;
                    }
                }
            }
        }

        if (gamification.CurrentStreak > gamification.LongestStreak)
        {
            gamification.LongestStreak = gamification.CurrentStreak;
        }
        gamification.LastActiveDate = nowVn;

        // 2. Chuẩn hóa mức thưởng XP theo cơ chế Cày Cuốc Thực Chất & Chống Spam
        int normalizedAmount = NormalizeAndValidateXpReward(userId, amount, source, description, todayVn);

        // Áp dụng hệ số nhân XP động từ Cài đặt Hệ thống (nếu không phải thưởng trực tiếp từ Admin)
        if (!string.Equals(source, "AdminReward", StringComparison.OrdinalIgnoreCase) && normalizedAmount > 0)
        {
            double multiplier = await _settingsService.GetDoubleSettingAsync("gamification.xp_multiplier", 1.0);
            if (multiplier > 0 && Math.Abs(multiplier - 1.0) > 0.01)
            {
                normalizedAmount = Math.Max(1, (int)Math.Round(normalizedAmount * multiplier));
            }
        }

        int prevLevel = gamification.CurrentLevel;
        if (normalizedAmount > 0)
        {
            gamification.TotalXP += normalizedAmount;
            gamification.WeeklyXP += normalizedAmount;

            // 3. Ghi log giao dịch XP chính
            var transaction = new XPTransaction
            {
                UserId = userId,
                Amount = normalizedAmount,
                Source = source,
                Description = description,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Gamification.AddXPTransactionAsync(transaction);
        }

        // 4. TIẾN TRÌNH NHIỆM VỤ HÀNG NGÀY (Tính cả tiến trình ngay cả khi nghe thụ động chạm trần XP)
        await AdvanceDailyQuestsProgressAsync(gamification, source);

        // 5. Tính toán thăng cấp sau khi đã gộp cả XP hành động và XP thưởng Nhiệm vụ ngày
        int newLevel = CalculateLevel(gamification.TotalXP);
        gamification.CurrentLevel = newLevel;
        if (newLevel > prevLevel)
        {
            var levelTitle = GetLevelTitle(newLevel);
            await _notificationService.TriggerUserNotificationAsync(
                userId,
                $"🏆 Chúc mừng thăng cấp Level {newLevel} ({levelTitle})!",
                $"Tuyệt vời! Bạn vừa đạt mốc {gamification.TotalXP:N0} XP sau quá trình rèn luyện bền bỉ và chính thức bước lên Cấp độ {newLevel} — {levelTitle}!",
                "Achievement",
                "🏆",
                "/leaderboard"
            );
        }

        gamification.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Gamification.UpsertAsync(gamification);
        await _unitOfWork.CompleteAsync();

        // 6. Kiểm tra và mở khóa huy hiệu thành tựu
        await CheckAndUnlockAchievementsAsync(userId, gamification, source);

        return await GetProfileAsync(userId);
    }

    private async Task AdvanceDailyQuestsProgressAsync(UserGamification gamification, string source)
    {
        var todayVn = GetVietnamToday();
        var quests = JsonSerializer.Deserialize<List<DailyQuestDto>>(gamification.DailyQuestsJson) ?? new List<DailyQuestDto>();
        bool hasToeic = quests.Any(q => q.QuestId.Contains("toeic", StringComparison.OrdinalIgnoreCase) || q.QuestType.Contains("toeic", StringComparison.OrdinalIgnoreCase));
        if (quests.Count == 0 || hasToeic)
        {
            quests = GenerateDailyQuests(gamification.UserId, todayVn);
            gamification.DailyQuestsJson = JsonSerializer.Serialize(quests);
        }

        bool hasQuestUpdates = false;

        foreach (var q in quests)
        {
            // Đồng bộ lại mức thưởng nhiệm vụ cũ nếu đang lưu giá trị quá cao từ phiên bản trước
            if (q.XPReward > 30)
            {
                q.XPReward = Math.Clamp(q.XPReward / 2, 15, 25);
                hasQuestUpdates = true;
            }

            if (q.IsCompleted) continue;

            bool matches = false;
            int increment = 1;

            if ((source == "bino_listen" || source == "bino_dialogue") && q.QuestType == "bino_listen")
            {
                matches = true;
                if (source == "bino_dialogue") increment = 4;
            }
            else if (source == "bino_roleplay" && q.QuestType == "bino_roleplay") matches = true;
            else if (source == "bino_dictation" && q.QuestType == "bino_dictation") matches = true;
            else if (source == "flashcard_review" && q.QuestType == "flashcard_review") matches = true;
            else if (source == "reflex_speak" && q.QuestType == "reflex_speak") matches = true;
            else if (source == "reflex_write" && q.QuestType == "reflex_write") matches = true;
            else if (source == "reflex_listen" && q.QuestType == "reflex_listen") matches = true;
            else if (source == "reflex_master" && q.QuestType == "reflex_master") matches = true;
            else if ((source.StartsWith("vocab_flashcard") || source == "vocab_flip") && q.QuestType == "vocab_flashcard")
            {
                matches = true;
                if (source.StartsWith("vocab_flashcard:"))
                {
                    if (int.TryParse(source.Substring("vocab_flashcard:".Length), out int countVal) && countVal > 0)
                    {
                        increment = countVal;
                    }
                }
            }
            else if (source == "vocab_quiz" && q.QuestType == "vocab_quiz") matches = true;
            else if (source.StartsWith("vocab_spelling") && q.QuestType == "vocab_spelling")
            {
                matches = true;
                if (source.StartsWith("vocab_spelling:"))
                {
                    if (int.TryParse(source.Substring("vocab_spelling:".Length), out int countVal) && countVal > 0)
                    {
                        increment = countVal;
                    }
                }
            }
            else if (source.StartsWith("vocab_master") && q.QuestType == "vocab_master")
            {
                matches = true;
                if (source.StartsWith("vocab_master:"))
                {
                    if (int.TryParse(source.Substring("vocab_master:".Length), out int countVal) && countVal > 0)
                    {
                        increment = countVal;
                    }
                }
            }

            if (matches)
            {
                q.CurrentCount += increment;
                if (q.CurrentCount > q.TargetCount) q.CurrentCount = q.TargetCount;
                hasQuestUpdates = true;

                if (q.CurrentCount >= q.TargetCount && !q.IsCompleted)
                {
                    q.CurrentCount = q.TargetCount;
                    q.IsCompleted = true;
                    gamification.TotalXP += q.XPReward;
                    gamification.WeeklyXP += q.XPReward;

                    var questTx = new XPTransaction
                    {
                        UserId = gamification.UserId,
                        Amount = q.XPReward,
                        Source = "daily_quest",
                        Description = $"Hoàn thành nhiệm vụ: {q.Title}",
                        CreatedAt = DateTime.UtcNow
                    };
                    await _unitOfWork.Gamification.AddXPTransactionAsync(questTx);
                }
            }
        }

        // Kiểm tra nếu tất cả 4 nhiệm vụ đều đã xong -> Thưởng Bonus 25 XP (chỉ 1 lần/ngày)
        string bonusKey = $"daily_quest_all_bonus_{gamification.UserId}_{todayVn:yyyyMMdd}";
        if (hasQuestUpdates && quests.Count > 0 && quests.All(q => q.IsCompleted) && !_memoryCache.TryGetValue(bonusKey, out bool _))
        {
            _memoryCache.Set(bonusKey, true, TimeSpan.FromHours(24));
            int bonusXP = 25;
            gamification.TotalXP += bonusXP;
            gamification.WeeklyXP += bonusXP;
            gamification.DailyQuestStreak++;

            var bonusTx = new XPTransaction
            {
                UserId = gamification.UserId,
                Amount = bonusXP,
                Source = "daily_quest_bonus",
                Description = "Thưởng hoàn thành 100% nhiệm vụ hôm nay!",
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Gamification.AddXPTransactionAsync(bonusTx);
        }

        if (hasQuestUpdates)
        {
            gamification.DailyQuestsJson = JsonSerializer.Serialize(quests);
        }
    }

    public async Task<Response<List<DailyQuestDto>>> GetDailyQuestsAsync(int userId)
    {
        var gamification = await _unitOfWork.Gamification.GetByUserIdAsync(userId);
        if (gamification == null)
        {
            gamification = new UserGamification { UserId = userId };
            await _unitOfWork.Gamification.UpsertAsync(gamification);
            await _unitOfWork.CompleteAsync();
        }

        var todayVn = GetVietnamToday();
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
            gamification.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Gamification.UpsertAsync(gamification);
            await _unitOfWork.CompleteAsync();
        }

        var sanitizedQuestsJson = (gamification.DailyQuestsJson ?? "[]")
            .Replace("câu thoại Bino", "câu hội thoại")
            .Replace("3 câu Bino", "3 câu hội thoại")
            .Replace("từ vựng Bino", "thẻ từ vựng SRS");
        var quests = JsonSerializer.Deserialize<List<DailyQuestDto>>(sanitizedQuestsJson) ?? new List<DailyQuestDto>();
        foreach (var q in quests)
        {
            if (q.XPReward > 30) q.XPReward = Math.Clamp(q.XPReward / 2, 15, 25);
        }
        var nonToeicQuests = quests.Where(q => !q.QuestId.Contains("toeic", StringComparison.OrdinalIgnoreCase) && !q.QuestType.Contains("toeic", StringComparison.OrdinalIgnoreCase)).ToList();
        return Response<List<DailyQuestDto>>.SuccessResult("Lấy nhiệm vụ thành công", nonToeicQuests);
    }

    /// <summary>
    /// Tạo 4 nhiệm vụ hàng ngày: Chọn lọc cân bằng từ Giao Tiếp Thực Chiến, Phản Xạ 50 Chủ Đề và 3000 Từ Vựng Thiết Yếu.
    /// Thiết kế mức thưởng cân đối (15 - 25 XP) đòi hỏi học viên thực hành thực chất mỗi ngày.
    /// </summary>
    private List<DailyQuestDto> GenerateDailyQuests(int userId, DateTime dateVn)
    {
        var binoPool = new List<DailyQuestDto>
        {
            new() { QuestId = "q_bino_listen_8", Title = "Luyện nghe 10 câu hội thoại", Description = "Nghe ngấm ngữ điệu hoặc nhại giọng 10 câu thoại giao tiếp", TargetCount = 10, XPReward = 15, QuestType = "bino_listen" },
            new() { QuestId = "q_bino_listen_15", Title = "Tắm ngôn ngữ 20 câu thoại", Description = "Luyện nghe sâu hoặc bật vòng lặp Shadowing 20 câu thoại", TargetCount = 20, XPReward = 22, QuestType = "bino_listen" },
            new() { QuestId = "q_bino_roleplay_3", Title = "Đóng vai phát âm 5 câu thoại", Description = "Bật mic thực hành đối đáp kịch bản đạt chuẩn 5 câu thoại", TargetCount = 5, XPReward = 22, QuestType = "bino_roleplay" },
            new() { QuestId = "q_bino_dictation_3", Title = "Chép chính tả chuẩn 4 câu thoại", Description = "Nghe và gõ chính tả đạt từ 70%+ cho 4 câu hội thoại", TargetCount = 4, XPReward = 20, QuestType = "bino_dictation" },
            new() { QuestId = "q_bino_flashcard_5", Title = "Ôn 8 thẻ từ vựng FSRS", Description = "Lật thẻ và đánh giá nhớ tốt 8 thẻ Flashcard FSRS", TargetCount = 8, XPReward = 15, QuestType = "flashcard_review" },
            new() { QuestId = "q_bino_flashcard_10", Title = "Chinh phục 15 thẻ từ vựng FSRS", Description = "Luyện tập trí nhớ với 15 thẻ từ vựng Flashcard FSRS", TargetCount = 15, XPReward = 25, QuestType = "flashcard_review" }
        };

        var reflexPool = new List<DailyQuestDto>
        {
            new() { QuestId = "q_reflex_speak_5", Title = "Phản xạ nói chuẩn 6 câu", Description = "Bật mic luyện nói phản xạ đạt 75%+ cho 6 câu trong Unit", TargetCount = 6, XPReward = 20, QuestType = "reflex_speak" },
            new() { QuestId = "q_reflex_speak_10", Title = "Luyện nói thực chiến 12 câu", Description = "Thực hành phát âm chuẩn Microphone 12 câu phản xạ", TargetCount = 12, XPReward = 28, QuestType = "reflex_speak" },
            new() { QuestId = "q_reflex_write_5", Title = "Luyện gõ dịch chuẩn 6 câu", Description = "Thực hành gõ dịch phản xạ đạt 80%+ cho 6 câu tiếng Anh", TargetCount = 6, XPReward = 18, QuestType = "reflex_write" },
            new() { QuestId = "q_reflex_write_10", Title = "Thực chiến viết dịch 12 câu", Description = "Hoàn thành thử thách gõ dịch chuẩn 12 câu phản xạ", TargetCount = 12, XPReward = 25, QuestType = "reflex_write" },
            new() { QuestId = "q_reflex_listen_10", Title = "Luyện nghe 15 câu phản xạ", Description = "Nghe phát âm chuẩn bản xứ 15 câu trong Unit", TargetCount = 15, XPReward = 15, QuestType = "reflex_listen" },
            new() { QuestId = "q_reflex_master_3", Title = "Làm chủ 5 câu phản xạ mới", Description = "Ghi nhớ và làm chủ 5 câu phản xạ giao tiếp mới", TargetCount = 5, XPReward = 20, QuestType = "reflex_master" }
        };

        var vocabPool = new List<DailyQuestDto>
        {
            new() { QuestId = "q_vocab_card_10", Title = "Ôn 15 thẻ từ vựng 3000", Description = "Luyện phản xạ lật thẻ 15 từ vựng theo chủ đề", TargetCount = 15, XPReward = 15, QuestType = "vocab_flashcard" },
            new() { QuestId = "q_vocab_card_20", Title = "Luyện 25 thẻ từ vựng 3D", Description = "Nạp vốn từ vựng với 25 thẻ Flashcard 3D FSRS", TargetCount = 25, XPReward = 25, QuestType = "vocab_flashcard" },
            new() { QuestId = "q_vocab_quiz_1", Title = "Vượt qua bài trắc nghiệm từ vựng", Description = "Hoàn thành 1 bài trắc nghiệm từ vựng đạt từ 60% trở lên", TargetCount = 1, XPReward = 20, QuestType = "vocab_quiz" },
            new() { QuestId = "q_vocab_spelling_5", Title = "Gõ chính tả đúng 8 từ vựng", Description = "Luyện kỹ năng nhớ mặt chữ và gõ đúng 8 từ vựng", TargetCount = 8, XPReward = 20, QuestType = "vocab_spelling" },
            new() { QuestId = "q_vocab_master_5", Title = "Thuộc làu 10 từ vựng mới", Description = "Chinh phục và thuộc 10 từ vựng mới trong các chủ đề", TargetCount = 10, XPReward = 20, QuestType = "vocab_master" }
        };

        var seed = $"{userId}_{dateVn:yyyyMMdd}";
        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(seed));
        var random = new Random(BitConverter.ToInt32(hash, 0));

        // Phân bổ cân đối: 1 từ Bino, 1 từ Reflex 50, 1 từ 3000 Từ Vựng, và 1 ngẫu nhiên từ phần còn lại
        var selectedBino = binoPool.OrderBy(_ => random.Next()).Take(1).ToList();
        var selectedReflex = reflexPool.OrderBy(_ => random.Next()).Take(1).ToList();
        var selectedVocab = vocabPool.OrderBy(_ => random.Next()).Take(1).ToList();

        var remainingPool = binoPool.Except(selectedBino)
            .Concat(reflexPool.Except(selectedReflex))
            .Concat(vocabPool.Except(selectedVocab))
            .OrderBy(_ => random.Next())
            .Take(1)
            .ToList();

        var selected = new List<DailyQuestDto>();
        selected.AddRange(selectedBino);
        selected.AddRange(selectedReflex);
        selected.AddRange(selectedVocab);
        selected.AddRange(remainingPool);
        return selected;
    }

    public async Task<Response<bool>> CompleteDailyQuestAsync(int userId, string questId)
    {
        var gamification = await _unitOfWork.Gamification.GetByUserIdAsync(userId);
        if (gamification == null) return Response<bool>.Failure("Không tìm thấy thông tin");

        var quests = JsonSerializer.Deserialize<List<DailyQuestDto>>(gamification.DailyQuestsJson) ?? new List<DailyQuestDto>();
        var quest = quests.FirstOrDefault(q => q.QuestId == questId);

        if (quest == null || quest.IsCompleted) return Response<bool>.Failure("Nhiệm vụ không tồn tại hoặc đã hoàn thành");

        if (quest.XPReward > 30) quest.XPReward = Math.Clamp(quest.XPReward / 2, 15, 25);

        quest.CurrentCount = quest.TargetCount;
        quest.IsCompleted = true;
        gamification.TotalXP += quest.XPReward;
        gamification.WeeklyXP += quest.XPReward;

        var questTx = new XPTransaction
        {
            UserId = userId,
            Amount = quest.XPReward,
            Source = "daily_quest",
            Description = $"Hoàn thành nhiệm vụ: {quest.Title}",
            CreatedAt = DateTime.UtcNow
        };
        await _unitOfWork.Gamification.AddXPTransactionAsync(questTx);

        // Kiểm tra nếu tất cả nhiệm vụ đã xong
        if (quests.Count > 0 && quests.All(q => q.IsCompleted))
        {
            int bonusXP = 25;
            gamification.TotalXP += bonusXP;
            gamification.WeeklyXP += bonusXP;
            gamification.DailyQuestStreak++;

            var bonusTx = new XPTransaction
            {
                UserId = userId,
                Amount = bonusXP,
                Source = "daily_quest_bonus",
                Description = "Thưởng hoàn thành 100% nhiệm vụ hôm nay!",
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Gamification.AddXPTransactionAsync(bonusTx);
        }

        gamification.CurrentLevel = CalculateLevel(gamification.TotalXP);
        gamification.DailyQuestsJson = JsonSerializer.Serialize(quests);
        gamification.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Gamification.UpsertAsync(gamification);
        await _unitOfWork.CompleteAsync();

        return Response<bool>.SuccessResult("Hoàn thành nhiệm vụ thành công", true);
    }

    public async Task<Response<List<LeaderboardEntryDto>>> GetLeaderboardAsync()
    {
        const string cacheKey = "weekly_leaderboard_top20";
        if (_memoryCache.TryGetValue(cacheKey, out List<LeaderboardEntryDto>? cachedList) && cachedList != null)
        {
            return Response<List<LeaderboardEntryDto>>.SuccessResult("Bảng xếp hạng tuần", cachedList);
        }

        var top = await _unitOfWork.Gamification.GetWeeklyLeaderboardAsync(20);
        var list = new List<LeaderboardEntryDto>();
        int rank = 1;

        foreach (var g in top)
        {
            int trueLevel = CalculateLevel(g.TotalXP);
            list.Add(new LeaderboardEntryDto
            {
                UserId = g.UserId,
                FullName = g.User?.FullName ?? "Học viên",
                WeeklyXP = g.WeeklyXP,
                TotalXP = g.TotalXP,
                CurrentLevel = trueLevel,
                LevelTitle = GetLevelTitle(trueLevel),
                Rank = rank++,
                CurrentStreak = g.CurrentStreak
            });
        }

        _memoryCache.Set(cacheKey, list, TimeSpan.FromSeconds(30));
        return Response<List<LeaderboardEntryDto>>.SuccessResult("Bảng xếp hạng tuần", list);
    }

    public async Task<Response<List<AchievementDto>>> GetAchievementsAsync(int userId)
    {
        var gamification = await _unitOfWork.Gamification.GetByUserIdAsync(userId);
        var unlocked = gamification != null ? 
            JsonSerializer.Deserialize<List<string>>(gamification.UnlockedBadgesJson) ?? new List<string>() : 
            new List<string>();

        var allBadges = new List<AchievementDto>
        {
            // Streak
            new() { BadgeId = "first_blood", Title = "Bước Chân Đầu Tiên", Description = "Hoàn thành bài tập đầu tiên", Icon = "👣" },
            new() { BadgeId = "streak_3", Title = "Tia Lửa 3 Ngày", Description = "Đạt chuỗi 3 ngày liên tục", Icon = "🔥" },
            new() { BadgeId = "streak_7", Title = "Chiến Binh 1 Tuần", Description = "Đạt chuỗi 7 ngày liên tục", Icon = "⚔️" },
            new() { BadgeId = "streak_14", Title = "Kiên Định 2 Tuần", Description = "Đạt chuỗi 14 ngày liên tục", Icon = "🛡️" },
            new() { BadgeId = "streak_30", Title = "Bất Bại 1 Tháng", Description = "Đạt chuỗi 30 ngày liên tục", Icon = "👑" },
            new() { BadgeId = "streak_60", Title = "Kim Cương 2 Tháng", Description = "Đạt chuỗi 60 ngày liên tục", Icon = "💎" },
            new() { BadgeId = "streak_100", Title = "Huyền Thoại 100 Ngày", Description = "Đạt chuỗi 100 ngày liên tục", Icon = "🏆" },
            new() { BadgeId = "night_owl", Title = "Cú Đêm Chăm Chỉ", Description = "Học bài sau 22:00 đêm", Icon = "🦉" },
            new() { BadgeId = "early_bird", Title = "Chim Sớm Siêng Năng", Description = "Học bài trước 07:00 sáng", Icon = "🐦" },

            // Giao Tiếp Thực Chiến
            new() { BadgeId = "bino_starter", Title = "Khởi Động Giao Tiếp", Description = "Hoàn thành bài hội thoại thực chiến đầu tiên", Icon = "📖" },
            new() { BadgeId = "bino_chapter_1", Title = "Chinh Phục Chương 1", Description = "Hoàn thành tất cả bài trong Chương 1", Icon = "🎖️" },
            new() { BadgeId = "bino_roleplay_master", Title = "Diễn Viên Giọng Nói", Description = "Hoàn thành 10 bài luyện đóng vai Roleplay 1:1", Icon = "🎭" },
            new() { BadgeId = "bino_dictation_pro", Title = "Thư Ký Nhanh Tay", Description = "Đạt 90%+ điểm bài chép chính tả Dictation", Icon = "✍️" },
            new() { BadgeId = "bino_srs_collector", Title = "Nhà Sưu Tập Từ Vựng", Description = "Lưu 30 từ vựng vào bộ thẻ Flashcard SRS", Icon = "📇" },
            new() { BadgeId = "bino_champion", Title = "Đại Sứ Giao Tiếp VBace", Description = "Hoàn thành trọn bộ 72 bài hội thoại thực chiến", Icon = "👑" },

            // Reflex 50
            new() { BadgeId = "reflex_10", Title = "Bật Tốc Phản Xạ", Description = "Master 10 câu trong 50 Chủ Đề", Icon = "⚡" },
            new() { BadgeId = "reflex_50", Title = "Phản Xạ Bền Bỉ", Description = "Master 50 câu giao tiếp thực chiến", Icon = "🎯" },
            new() { BadgeId = "reflex_100", Title = "Tia Chớp Phản Xạ", Description = "Master 100 câu phản xạ", Icon = "🌩️" },
            new() { BadgeId = "reflex_king", Title = "Vua Phản Xạ 500", Description = "Master 500 câu nói và viết thực chiến", Icon = "🌪️" },
            new() { BadgeId = "reflex_legend", Title = "Thần Phản Xạ 1500", Description = "Chinh phục toàn bộ 1.500 câu của 50 Chủ Đề", Icon = "🔮" },

            // TOEIC
            new() { BadgeId = "toeic_first", Title = "Chiến Binh Luyện Đề", Description = "Làm đề thi TOEIC đầu tiên", Icon = "🎯" },
            new() { BadgeId = "toeic_confident_50", Title = "Bộ Não Thép", Description = "Đánh dấu chắc chắn 50 câu hỏi TOEIC", Icon = "💎" },
            new() { BadgeId = "toeic_master", Title = "Chuyên Gia TOEIC", Description = "Hoàn thành học tập 5 đề thi ETS", Icon = "📚" },

            // 3000 Essential Vocabulary
            new() { BadgeId = "vocab_starter", Title = "Khởi Động 3000 Từ", Description = "Master 10 từ vựng cốt lõi đầu tiên", Icon = "🌱" },
            new() { BadgeId = "vocab_50", Title = "Nhập Môn Từ Vựng", Description = "Master 50 từ vựng thông dụng", Icon = "🌿" },
            new() { BadgeId = "vocab_100", Title = "Vốn Từ Vững Vàng", Description = "Master 100 từ vựng cốt lõi", Icon = "🌳" },
            new() { BadgeId = "vocab_300", Title = "Chiến Thần Tra Từ", Description = "Master 300 từ vựng qua các chủ đề", Icon = "📚" },
            new() { BadgeId = "vocab_500", Title = "Kho Báu 500 Từ", Description = "Master 500 từ vựng tiếng Anh", Icon = "💎" },
            new() { BadgeId = "vocab_1000", Title = "Bậc Thầy Từ Vựng", Description = "Master 1.000 từ vựng cốt lõi", Icon = "🏆" },
            new() { BadgeId = "vocab_legend", Title = "Huyền Thoại 3000 Từ", Description = "Master toàn bộ kho từ vựng tiếng Anh theo chủ đề", Icon = "👑" },
            new() { BadgeId = "vocab_quiz_ace", Title = "Trắc Nghiệm Hoàn Hảo", Description = "Đạt 100% điểm trong bài kiểm tra trắc nghiệm từ vựng", Icon = "🎯" },
            new() { BadgeId = "vocab_spelling_master", Title = "Bậc Thầy Chính Tả", Description = "Luyện tập gõ đúng chính tả từ vựng", Icon = "✍️" }
        };

        foreach (var b in allBadges)
        {
            b.IsUnlocked = unlocked.Contains(b.BadgeId);
            if (b.IsUnlocked) b.UnlockedAt = gamification?.UpdatedAt ?? DateTime.UtcNow;
        }

        return Response<List<AchievementDto>>.SuccessResult("Danh sách thành tựu", allBadges);
    }

    public async Task UpdateStreakAsync(int userId)
    {
        var gamification = await _unitOfWork.Gamification.GetByUserIdAsync(userId);
        if (gamification == null) return;

        var nowVn = GetVietnamTime();
        var todayVn = nowVn.Date;
        var lastActiveVn = gamification.LastActiveDate?.Date ?? DateTime.MinValue;

        if (lastActiveVn == todayVn) return;

        if (lastActiveVn == todayVn.AddDays(-1))
        {
            gamification.CurrentStreak++;
            if (gamification.CurrentStreak % 7 == 0 && gamification.StreakFreezeCount < 3)
            {
                gamification.StreakFreezeCount++;
            }
        }
        else
        {
            if (gamification.StreakFreezeCount > 0)
            {
                gamification.StreakFreezeCount--;
                gamification.CurrentStreak++;
            }
            else
            {
                gamification.CurrentStreak = 1;
            }
        }

        if (gamification.CurrentStreak > gamification.LongestStreak)
        {
            gamification.LongestStreak = gamification.CurrentStreak;
        }

        gamification.LastActiveDate = nowVn;
        gamification.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Gamification.UpsertAsync(gamification);
        await _unitOfWork.CompleteAsync();
    }

    private async Task<List<string>> CheckAndUnlockAchievementsAsync(int userId, UserGamification gam, string source = "")
    {
        var unlocked = JsonSerializer.Deserialize<List<string>>(gam.UnlockedBadgesJson) ?? new List<string>();
        var newUnlocked = new List<string>();

        // 1. Streak Achievements
        if (!unlocked.Contains("first_blood") && gam.TotalXP > 0)
        {
            unlocked.Add("first_blood");
            newUnlocked.Add("first_blood");
        }
        if (!unlocked.Contains("streak_3") && gam.CurrentStreak >= 3)
        {
            unlocked.Add("streak_3");
            newUnlocked.Add("streak_3");
        }
        if (!unlocked.Contains("streak_7") && gam.CurrentStreak >= 7)
        {
            unlocked.Add("streak_7");
            newUnlocked.Add("streak_7");
        }
        if (!unlocked.Contains("streak_14") && gam.CurrentStreak >= 14)
        {
            unlocked.Add("streak_14");
            newUnlocked.Add("streak_14");
        }
        if (!unlocked.Contains("streak_30") && gam.CurrentStreak >= 30)
        {
            unlocked.Add("streak_30");
            newUnlocked.Add("streak_30");
        }
        if (!unlocked.Contains("streak_60") && gam.CurrentStreak >= 60)
        {
            unlocked.Add("streak_60");
            newUnlocked.Add("streak_60");
        }
        if (!unlocked.Contains("streak_100") && gam.CurrentStreak >= 100)
        {
            unlocked.Add("streak_100");
            newUnlocked.Add("streak_100");
        }

        var hourVn = GetVietnamTime().Hour;
        if (!unlocked.Contains("night_owl") && (hourVn >= 22 || hourVn < 4))
        {
            unlocked.Add("night_owl");
            newUnlocked.Add("night_owl");
        }
        if (!unlocked.Contains("early_bird") && (hourVn >= 4 && hourVn < 7))
        {
            unlocked.Add("early_bird");
            newUnlocked.Add("early_bird");
        }

        // 2. Reflex 50 Achievements (Chỉ query khi source liên quan đến Reflex và chưa đạt max badge)
        bool checkReflex = (string.IsNullOrEmpty(source) || source.StartsWith("reflex")) && !unlocked.Contains("reflex_legend");
        if (checkReflex)
        {
            var reflexProgress = await _unitOfWork.UserProgresses.GetReflexProgressAsync(userId);
            if (reflexProgress != null)
            {
                if (!unlocked.Contains("reflex_10") && reflexProgress.MasteredCount >= 10)
                {
                    unlocked.Add("reflex_10");
                    newUnlocked.Add("reflex_10");
                }
                if (!unlocked.Contains("reflex_50") && reflexProgress.MasteredCount >= 50)
                {
                    unlocked.Add("reflex_50");
                    newUnlocked.Add("reflex_50");
                }
                if (!unlocked.Contains("reflex_100") && reflexProgress.MasteredCount >= 100)
                {
                    unlocked.Add("reflex_100");
                    newUnlocked.Add("reflex_100");
                }
                if (!unlocked.Contains("reflex_king") && reflexProgress.MasteredCount >= 500)
                {
                    unlocked.Add("reflex_king");
                    newUnlocked.Add("reflex_king");
                }
                if (!unlocked.Contains("reflex_legend") && reflexProgress.MasteredCount >= 1500)
                {
                    unlocked.Add("reflex_legend");
                    newUnlocked.Add("reflex_legend");
                }
            }
        }

        // 3. Bino Achievements (Chỉ query khi source liên quan đến Bino/SRS)
        bool checkBino = (string.IsNullOrEmpty(source) || source.StartsWith("bino") || source == "flashcard_review") && !unlocked.Contains("bino_champion");
        if (checkBino)
        {
            var binoProgresses = (await _unitOfWork.BinoLearning.GetProgressByUserAsync(userId)).ToList();
            int binoCompleted = binoProgresses.Count(p => p.IsCompleted);
            int binoRoleplay = binoProgresses.Count(p => p.RoleplayCompleted);
            int binoDictationPro = binoProgresses.Count(p => (p.DictationScore ?? 0) >= 85);

            if (!unlocked.Contains("bino_starter") && binoCompleted >= 1)
            {
                unlocked.Add("bino_starter");
                newUnlocked.Add("bino_starter");
            }
            if (!unlocked.Contains("bino_chapter_1") && binoCompleted >= 6)
            {
                unlocked.Add("bino_chapter_1");
                newUnlocked.Add("bino_chapter_1");
            }
            if (!unlocked.Contains("bino_roleplay_master") && binoRoleplay >= 10)
            {
                unlocked.Add("bino_roleplay_master");
                newUnlocked.Add("bino_roleplay_master");
            }
            if (!unlocked.Contains("bino_dictation_pro") && binoDictationPro >= 10)
            {
                unlocked.Add("bino_dictation_pro");
                newUnlocked.Add("bino_dictation_pro");
            }
            if (!unlocked.Contains("bino_champion") && binoCompleted >= 72)
            {
                unlocked.Add("bino_champion");
                newUnlocked.Add("bino_champion");
            }
        }

        if ((string.IsNullOrEmpty(source) || source.StartsWith("bino") || source == "flashcard_review") && !unlocked.Contains("bino_srs_collector"))
        {
            var srsReviews = await _unitOfWork.BinoLearning.GetAllSRSReviewsByUserAsync(userId);
            if (srsReviews.Count() >= 30)
            {
                unlocked.Add("bino_srs_collector");
                newUnlocked.Add("bino_srs_collector");
            }
        }

        // 4. TOEIC Achievements (Chỉ query khi làm bài TOEIC)
        bool checkToeic = (string.IsNullOrEmpty(source) || source.StartsWith("toeic")) && !unlocked.Contains("toeic_master");
        if (checkToeic)
        {
            var summaries = (await _unitOfWork.UserProgresses.GetSummariesByUserAsync(userId)).ToList();
            if (summaries.Any() && !unlocked.Contains("toeic_first"))
            {
                unlocked.Add("toeic_first");
                newUnlocked.Add("toeic_first");
            }
            int totalConfident = summaries.Sum(s => s.ConfidentQuestions);
            if (totalConfident >= 50 && !unlocked.Contains("toeic_confident_50"))
            {
                unlocked.Add("toeic_confident_50");
                newUnlocked.Add("toeic_confident_50");
            }
            if (summaries.Count >= 5 && !unlocked.Contains("toeic_master"))
            {
                unlocked.Add("toeic_master");
                newUnlocked.Add("toeic_master");
            }
        }

        // 5. 3000 Essential Vocabulary Achievements (Chỉ query khi học Vocab)
        bool checkVocab = (string.IsNullOrEmpty(source) || source.StartsWith("vocab")) && (!unlocked.Contains("vocab_legend") || !unlocked.Contains("vocab_quiz_ace"));
        if (checkVocab)
        {
            var vocabProgress = await _unitOfWork.UserProgresses.GetVocabProgressAsync(userId);
            if (vocabProgress != null)
            {
                if (!unlocked.Contains("vocab_starter") && vocabProgress.MasteredCount >= 10)
                {
                    unlocked.Add("vocab_starter");
                    newUnlocked.Add("vocab_starter");
                }
                if (!unlocked.Contains("vocab_50") && vocabProgress.MasteredCount >= 50)
                {
                    unlocked.Add("vocab_50");
                    newUnlocked.Add("vocab_50");
                }
                if (!unlocked.Contains("vocab_100") && vocabProgress.MasteredCount >= 100)
                {
                    unlocked.Add("vocab_100");
                    newUnlocked.Add("vocab_100");
                }
                if (!unlocked.Contains("vocab_300") && vocabProgress.MasteredCount >= 300)
                {
                    unlocked.Add("vocab_300");
                    newUnlocked.Add("vocab_300");
                }
                if (!unlocked.Contains("vocab_500") && vocabProgress.MasteredCount >= 500)
                {
                    unlocked.Add("vocab_500");
                    newUnlocked.Add("vocab_500");
                }
                if (!unlocked.Contains("vocab_1000") && vocabProgress.MasteredCount >= 1000)
                {
                    unlocked.Add("vocab_1000");
                    newUnlocked.Add("vocab_1000");
                }
                if (!unlocked.Contains("vocab_legend") && vocabProgress.MasteredCount >= 1700)
                {
                    unlocked.Add("vocab_legend");
                    newUnlocked.Add("vocab_legend");
                }

                // Kiểm tra topicScores từ ProgressDataJson cho vocab_quiz_ace
                if (!unlocked.Contains("vocab_quiz_ace") && !string.IsNullOrWhiteSpace(vocabProgress.ProgressDataJson))
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(vocabProgress.ProgressDataJson);
                        if (doc.RootElement.TryGetProperty("topicScores", out var topicScoresElement) && topicScoresElement.ValueKind == JsonValueKind.Object)
                        {
                            foreach (var topicProp in topicScoresElement.EnumerateObject())
                            {
                                if (topicProp.Value.TryGetProperty("bestScore", out var bestScoreProp) && bestScoreProp.GetInt32() >= 100)
                                {
                                    unlocked.Add("vocab_quiz_ace");
                                    newUnlocked.Add("vocab_quiz_ace");
                                    break;
                                }
                            }
                        }
                    }
                    catch {}
                }
            }
        }

        if (!unlocked.Contains("vocab_spelling_master") && source.StartsWith("vocab_spelling"))
        {
            unlocked.Add("vocab_spelling_master");
            newUnlocked.Add("vocab_spelling_master");
        }

        if (newUnlocked.Any())
        {
            gam.UnlockedBadgesJson = JsonSerializer.Serialize(unlocked);
            gam.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Gamification.UpsertAsync(gam);
            await _unitOfWork.CompleteAsync();
        }

        return newUnlocked;
    }
}
