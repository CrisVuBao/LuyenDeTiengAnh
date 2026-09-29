using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using VBaceEnglish.Application.DTOs.Gamification;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public partial class GamificationService
{
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

        // Phân bổ cân đối: 1 từ Giao tiếp, 1 từ Reflex 50, 1 từ 3000 Từ Vựng, và 1 ngẫu nhiên từ phần còn lại
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
}
