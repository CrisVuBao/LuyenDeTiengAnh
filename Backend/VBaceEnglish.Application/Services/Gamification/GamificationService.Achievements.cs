using System.Text.Json;
using VBaceEnglish.Application.DTOs.Gamification;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public partial class GamificationService
{
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

        // 3. Giao Tiếp Thực Chiến Achievements (Chỉ query khi source liên quan đến Bino/SRS)
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
