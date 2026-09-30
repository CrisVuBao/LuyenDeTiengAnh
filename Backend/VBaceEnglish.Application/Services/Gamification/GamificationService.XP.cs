using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using VBaceEnglish.Application.DTOs.Gamification;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public partial class GamificationService
{
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
        EvaluateStreak(gamification, todayVn);

        var lastActiveVn = gamification.LastActiveDate?.Date;
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
                // Bắt đầu chuỗi mới từ 1 (chuỗi trước đó đã bị đứt về 0 hoặc người dùng mới)
                gamification.CurrentStreak = 1;
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
}
