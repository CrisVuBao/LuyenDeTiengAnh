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

    public GamificationService(IUnitOfWork unitOfWork, IMemoryCache memoryCache)
    {
        _unitOfWork = unitOfWork;
        _memoryCache = memoryCache;
    }

    private static DateTime GetVietnamTime() => DateTime.UtcNow.AddHours(7);
    private static DateTime GetVietnamToday() => GetVietnamTime().Date;

    private int CalculateLevel(int totalXp)
    {
        int level = 1;
        while (level < 50 && totalXp >= (level * level * 20))
        {
            level++;
        }
        return level;
    }

    private int GetXpForNextLevel(int currentLevel)
    {
        return currentLevel * currentLevel * 20;
    }

    private string GetLevelTitle(int level)
    {
        return level switch
        {
            <= 5 => "Tân binh",
            <= 10 => "Chiến binh",
            <= 20 => "Dũng sĩ",
            <= 30 => "Cao thủ",
            <= 40 => "Bậc thầy",
            _ => "Huyền thoại"
        };
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
        var progress = (double)(gamification.TotalXP - prevLevelXp) / (nextLevelXp - prevLevelXp) * 100;
        if (progress < 0) progress = 0;
        if (progress > 100) progress = 100;

        var rank = await _unitOfWork.Gamification.GetUserRankAsync(userId);
        var unlockedBadges = JsonSerializer.Deserialize<List<string>>(gamification.UnlockedBadgesJson) ?? new List<string>();
        var dailyQuests = JsonSerializer.Deserialize<List<DailyQuestDto>>(gamification.DailyQuestsJson) ?? new List<DailyQuestDto>();

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

        // 2. Cộng XP và kiểm tra thăng cấp Level
        gamification.TotalXP += amount;
        gamification.WeeklyXP += amount;

        int newLevel = CalculateLevel(gamification.TotalXP);
        if (newLevel > gamification.CurrentLevel)
        {
            gamification.CurrentLevel = newLevel;
        }

        // 3. Ghi log giao dịch XP chính
        var transaction = new XPTransaction
        {
            UserId = userId,
            Amount = amount,
            Source = source,
            Description = description,
            CreatedAt = DateTime.UtcNow
        };
        await _unitOfWork.Gamification.AddXPTransactionAsync(transaction);

        // 4. TIẾN TRÌNH NHIỆM VỤ HÀNG NGÀY (CHỈ DÀNH CHO BINO & PHẢN XẠ 50 CHỦ ĐỀ)
        await AdvanceDailyQuestsProgressAsync(gamification, source);

        gamification.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Gamification.UpsertAsync(gamification);
        await _unitOfWork.CompleteAsync();

        // 5. Kiểm tra và mở khóa huy hiệu thành tựu
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
            if (q.IsCompleted) continue;

            bool matches = false;
            int increment = 1;

            if ((source == "bino_listen" || source == "bino_dialogue") && q.QuestType == "bino_listen")
            {
                matches = true;
                if (source == "bino_dialogue") increment = 5;
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

        // Kiểm tra nếu tất cả 4 nhiệm vụ đều đã xong -> Thưởng Bonus 50 XP
        if (hasQuestUpdates && quests.Count > 0 && quests.All(q => q.IsCompleted))
        {
            // Kiểm tra xem đã nhận bonus hôm nay chưa qua dailyQuestStreak hoặc check count
            int bonusXP = 50;
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

        var quests = JsonSerializer.Deserialize<List<DailyQuestDto>>(gamification.DailyQuestsJson) ?? new List<DailyQuestDto>();
        var nonToeicQuests = quests.Where(q => !q.QuestId.Contains("toeic", StringComparison.OrdinalIgnoreCase) && !q.QuestType.Contains("toeic", StringComparison.OrdinalIgnoreCase)).ToList();
        return Response<List<DailyQuestDto>>.SuccessResult("Lấy nhiệm vụ thành công", nonToeicQuests);
    }

    /// <summary>
    /// Tạo 4 nhiệm vụ hàng ngày: Chọn lọc cân bằng từ Bino Giao Tiếp, Phản Xạ 50 Chủ Đề và 3000 Từ Vựng Thiết Yếu.
    /// Hoàn toàn loại bỏ TOEIC theo đúng yêu cầu học viên.
    /// Tập trung vào HÀNH ĐỘNG HỌC THỰC TẾ HÀNG NGÀY (Micro-learning & Habit building).
    /// </summary>
    private List<DailyQuestDto> GenerateDailyQuests(int userId, DateTime dateVn)
    {
        var binoPool = new List<DailyQuestDto>
        {
            new() { QuestId = "q_bino_listen_8", Title = "Luyện nghe 8 câu thoại Bino", Description = "Nghe ngấm ngữ điệu hoặc nhại giọng 8 câu thoại giao tiếp", TargetCount = 8, XPReward = 35, QuestType = "bino_listen" },
            new() { QuestId = "q_bino_listen_15", Title = "Tắm ngôn ngữ 15 câu thoại", Description = "Luyện nghe sâu hoặc bật vòng lặp Shadowing 15 câu thoại", TargetCount = 15, XPReward = 55, QuestType = "bino_listen" },
            new() { QuestId = "q_bino_roleplay_3", Title = "Đóng vai 3 lượt câu thoại", Description = "Thực hành đối đáp kịch bản 3 câu thoại trong bài học", TargetCount = 3, XPReward = 45, QuestType = "bino_roleplay" },
            new() { QuestId = "q_bino_dictation_3", Title = "Chép chính tả 3 câu Bino", Description = "Nghe và gõ thử thách chép chính tả 3 câu thoại", TargetCount = 3, XPReward = 40, QuestType = "bino_dictation" },
            new() { QuestId = "q_bino_flashcard_5", Title = "Ôn 5 thẻ từ vựng Bino", Description = "Lật thẻ và đánh giá trí nhớ Flashcard SRS lặp lại ngắt quãng", TargetCount = 5, XPReward = 30, QuestType = "flashcard_review" },
            new() { QuestId = "q_bino_flashcard_10", Title = "Ôn tập 10 từ vựng Bino", Description = "Luyện tập trí nhớ với 10 thẻ từ vựng Flashcard", TargetCount = 10, XPReward = 50, QuestType = "flashcard_review" }
        };

        var reflexPool = new List<DailyQuestDto>
        {
            new() { QuestId = "q_reflex_speak_5", Title = "Phản xạ nói 5 câu (3s)", Description = "Bật mic luyện nói phản xạ 5 câu trong Unit", TargetCount = 5, XPReward = 45, QuestType = "reflex_speak" },
            new() { QuestId = "q_reflex_speak_10", Title = "Luyện nói 10 câu phản xạ", Description = "Thực hành phát âm chuẩn Microphone 10 câu phản xạ", TargetCount = 10, XPReward = 75, QuestType = "reflex_speak" },
            new() { QuestId = "q_reflex_write_5", Title = "Luyện gõ viết 5 câu", Description = "Thực hành gõ dịch phản xạ 5 câu tiếng Anh", TargetCount = 5, XPReward = 40, QuestType = "reflex_write" },
            new() { QuestId = "q_reflex_write_10", Title = "Thực chiến viết dịch 10 câu", Description = "Hoàn thành thử thách gõ dịch 10 câu phản xạ", TargetCount = 10, XPReward = 70, QuestType = "reflex_write" },
            new() { QuestId = "q_reflex_listen_10", Title = "Luyện nghe 10 câu phản xạ", Description = "Nghe phát âm chuẩn bản xứ 10 câu trong Unit", TargetCount = 10, XPReward = 40, QuestType = "reflex_listen" },
            new() { QuestId = "q_reflex_master_3", Title = "Ghi nhớ 3 câu phản xạ", Description = "Ghi nhớ và làm chủ 3 câu phản xạ giao tiếp mới", TargetCount = 3, XPReward = 50, QuestType = "reflex_master" }
        };

        var vocabPool = new List<DailyQuestDto>
        {
            new() { QuestId = "q_vocab_card_10", Title = "Ôn 10 thẻ từ vựng 3000", Description = "Luyện phản xạ lật thẻ 10 từ vựng theo chủ đề", TargetCount = 10, XPReward = 35, QuestType = "vocab_flashcard" },
            new() { QuestId = "q_vocab_card_20", Title = "Luyện 20 thẻ từ vựng", Description = "Nạp vốn từ vựng với 20 thẻ Flashcard 3D thông minh", TargetCount = 20, XPReward = 60, QuestType = "vocab_flashcard" },
            new() { QuestId = "q_vocab_quiz_1", Title = "Thử thách trắc nghiệm từ vựng", Description = "Hoàn thành 1 bài trắc nghiệm nhanh kiểm tra vốn từ", TargetCount = 1, XPReward = 40, QuestType = "vocab_quiz" },
            new() { QuestId = "q_vocab_spelling_5", Title = "Gõ chính tả 5 từ vựng", Description = "Luyện kỹ năng nhớ mặt chữ và gõ đúng 5 từ vựng", TargetCount = 5, XPReward = 45, QuestType = "vocab_spelling" },
            new() { QuestId = "q_vocab_master_5", Title = "Ghi nhớ 5 từ vựng mới", Description = "Đánh dấu thuộc 5 từ vựng mới trong các chủ đề", TargetCount = 5, XPReward = 50, QuestType = "vocab_master" }
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
            int bonusXP = 50;
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
            list.Add(new LeaderboardEntryDto
            {
                UserId = g.UserId,
                FullName = g.User?.FullName ?? "Học viên",
                WeeklyXP = g.WeeklyXP,
                TotalXP = g.TotalXP,
                CurrentLevel = g.CurrentLevel,
                LevelTitle = GetLevelTitle(g.CurrentLevel),
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

            // Bino
            new() { BadgeId = "bino_starter", Title = "Bắt Đầu Chém Gió", Description = "Hoàn thành bài hội thoại Bino đầu tiên", Icon = "📖" },
            new() { BadgeId = "bino_chapter_1", Title = "Chinh Phục Chương 1", Description = "Hoàn thành tất cả bài trong Chương 1", Icon = "🎖️" },
            new() { BadgeId = "bino_roleplay_master", Title = "Diễn Viên Giọng Nói", Description = "Hoàn thành 10 bài luyện đóng vai Roleplay 1:1", Icon = "🎭" },
            new() { BadgeId = "bino_dictation_pro", Title = "Thư Ký Nhanh Tay", Description = "Đạt 90%+ điểm bài chép chính tả Dictation", Icon = "✍️" },
            new() { BadgeId = "bino_srs_collector", Title = "Nhà Sưu Tập Từ Vựng", Description = "Lưu 30 từ vựng vào bộ thẻ Flashcard SRS", Icon = "📇" },
            new() { BadgeId = "bino_champion", Title = "Đại Sứ Chém Tiếng Anh", Description = "Hoàn thành trọn bộ 72 bài hội thoại Bino", Icon = "👑" },

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
