using VBaceEnglish.Application.DTOs.Bino;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public partial class BinoBookService
{
    public async Task<Response<bool>> AddWordToSRSAsync(int userId, int vocabularyId)
    {
        var existing = await _unitOfWork.BinoLearning.GetSRSReviewAsync(userId, vocabularyId);
        if (existing != null)
            return Response<bool>.SuccessResult("Từ này đã có trong bộ Flashcard", true);

        var review = new UserSRSReview
        {
            UserId = userId,
            VocabularyId = vocabularyId,
            EaseFactor = 2.5,
            IntervalDays = 1,
            ConsecutiveCorrect = 0,
            NextReviewDate = DateTime.UtcNow,
            ReviewCount = 0
        };

        await _unitOfWork.BinoLearning.AddSRSReviewAsync(review);
        await _unitOfWork.CompleteAsync();
        return Response<bool>.SuccessResult("Đã thêm vào Flashcard thành công", true);
    }

    public async Task<Response<bool>> RemoveWordFromSRSAsync(int userId, int vocabularyId)
    {
        var existing = await _unitOfWork.BinoLearning.GetSRSReviewAsync(userId, vocabularyId);
        if (existing == null)
            return Response<bool>.SuccessResult("Từ này đã được gỡ khỏi bộ Flashcard", true);

        _unitOfWork.BinoLearning.RemoveSRSReview(existing);
        await _unitOfWork.CompleteAsync();
        return Response<bool>.SuccessResult("Đã gỡ khỏi Flashcard thành công", true);
    }

    private static double ExtractFsrsDifficulty(double easeFactor, int reviewCount)
    {
        if (reviewCount <= 0) return 5.0;
        // Nếu thẻ cũ dùng SM-2 (EaseFactor trong khoảng [1.3, 3.2]), chuyển đổi mượt sang FSRS Difficulty D ∈ [1, 10]
        if (easeFactor >= 1.0 && easeFactor <= 3.2)
        {
            return Math.Clamp(Math.Round(10.5 - easeFactor * 2.2, 2), 1.0, 10.0);
        }
        return Math.Clamp(Math.Round(easeFactor, 2), 1.0, 10.0);
    }

    private static double CalculateFsrsRetrievability(double stabilityDays, DateTime? lastReviewedAt)
    {
        if (!lastReviewedAt.HasValue || stabilityDays <= 0) return 100.0;
        double elapsedDays = Math.Max(0.0, (DateTime.UtcNow - lastReviewedAt.Value).TotalDays);
        // FSRS v4.5 power forgetting curve: R(t, S) = (1 + (19/81) * (t / S))^(-0.5)
        double r = Math.Pow(1.0 + (19.0 / 81.0) * (elapsedDays / Math.Max(0.4, stabilityDays)), -0.5);
        return Math.Clamp(Math.Round(r * 100.0, 1), 1.0, 100.0);
    }

    public async Task<Response<IEnumerable<SrsCardDto>>> GetDueSRSCardsAsync(int userId)
    {
        var reviews = await _unitOfWork.BinoLearning.GetDueSRSReviewsAsync(userId);
        var dtos = reviews.Select(MapToSrsCardDto).ToList();
        return Response<IEnumerable<SrsCardDto>>.SuccessResult("Lấy danh sách thẻ cần ôn (FSRS)", dtos);
    }

    public async Task<Response<IEnumerable<SrsCardDto>>> GetAllSRSCardsAsync(int userId)
    {
        var reviews = await _unitOfWork.BinoLearning.GetAllSRSReviewsByUserAsync(userId);
        var dtos = reviews.Select(MapToSrsCardDto).ToList();
        return Response<IEnumerable<SrsCardDto>>.SuccessResult("Lấy toàn bộ thẻ Flashcard đã lưu", dtos);
    }

    private static SrsCardDto MapToSrsCardDto(UserSRSReview r)
    {
        double stability = r.ReviewCount == 0 ? 0.0 : Math.Max(0.5, r.IntervalDays);
        double difficulty = ExtractFsrsDifficulty(r.EaseFactor, r.ReviewCount);
        double retrievability = r.ReviewCount == 0 ? 100.0 : CalculateFsrsRetrievability(stability, r.LastReviewedAt);

        return new SrsCardDto
        {
            Id = r.Id,
            VocabularyId = r.VocabularyId,
            Word = r.Vocabulary?.Word ?? string.Empty,
            Phonetic = r.Vocabulary?.Phonetic,
            WordType = r.Vocabulary?.WordType,
            Meaning = r.Vocabulary?.Meaning ?? string.Empty,
            ExampleSentence = r.Vocabulary?.ExampleSentence,
            ChapterTitle = r.Vocabulary?.DialogueLesson?.Chapter?.Title ?? string.Empty,
            DialogueTitle = r.Vocabulary?.DialogueLesson?.Title ?? string.Empty,
            IntervalDays = r.IntervalDays,
            ConsecutiveCorrect = r.ConsecutiveCorrect,
            ReviewCount = r.ReviewCount,
            Stability = stability,
            Difficulty = difficulty,
            Retrievability = retrievability,
            LastReviewedAt = r.LastReviewedAt,
            NextReviewDate = r.NextReviewDate
        };
    }

    public async Task<Response<bool>> SubmitSRSReviewAsync(int userId, SubmitSrsReviewDto dto)
    {
        var review = await _unitOfWork.BinoLearning.GetSRSReviewAsync(userId, dto.VocabularyId);
        if (review == null)
            return Response<bool>.Failure("Không tìm thấy thẻ ôn tập.");

        // FSRS (Free Spaced Repetition Scheduler v4.5/v5) Implementation
        // Grade: 0 = Again (Quên hẳn), 1 = Hard (Khó), 2 = Good (Nhớ tốt), 3 = Easy (Quá dễ)
        int rating = Math.Clamp(dto.Grade, 0, 3) + 1; // FSRS G ∈ {1, 2, 3, 4}
        double prevStability = review.ReviewCount == 0 ? 0.0 : Math.Max(0.5, review.IntervalDays);
        double prevDifficulty = ExtractFsrsDifficulty(review.EaseFactor, review.ReviewCount);

        double newDifficulty;
        double newStability;

        if (review.ReviewCount == 0)
        {
            // Initial FSRS state S_0(G) & D_0(G) chuẩn FSRS v4.5 / v5
            newDifficulty = Math.Clamp(5.0 - 1.0 * (rating - 3), 1.0, 10.0);
            newStability = rating switch
            {
                1 => 0.4,
                2 => 1.2,
                3 => 3.2,
                4 => 8.0,
                _ => 3.2
            };
        }
        else
        {
            // FSRS Difficulty update with mean reversion toward D_0(3) = 5.0
            double deltaD = -0.8 * (rating - 3);
            newDifficulty = Math.Clamp(0.9 * (prevDifficulty + deltaD) + 0.1 * 5.0, 1.0, 10.0);

            double elapsedDays = review.LastReviewedAt.HasValue
                ? Math.Max(0.0, (DateTime.UtcNow - review.LastReviewedAt.Value).TotalDays)
                : prevStability;
            double rawR = Math.Pow(1.0 + (19.0 / 81.0) * (elapsedDays / Math.Max(0.4, prevStability)), -0.5);
            double r = Math.Clamp(rawR, 0.05, 0.99);

            if (rating == 1)
            {
                // Lapse: giảm sâu về ngắn hạn nhưng bảo lưu phần nào nền tảng
                newStability = Math.Max(
                    0.4,
                    Math.Min(
                        prevStability * 0.25,
                        0.4 * Math.Pow(Math.Max(1.0, prevStability), 0.3) * Math.Pow(newDifficulty, -0.2)
                    )
                );
            }
            else
            {
                // Recall: Retrieval practice effect
                double hardPenalty = rating == 2 ? 0.5 : 1.0;
                double easyBonus = rating == 4 ? 1.4 : 1.0;
                double hR = Math.Min(2.5, Math.Exp(1.0 * (1.0 - r)) - 1.0);
                double difficultyFactor = (11.0 - newDifficulty) / 6.0;
                double stabilityDamping = Math.Pow(Math.Max(0.4, prevStability), -0.2);

                double growthFactor = 18.0 * difficultyFactor * stabilityDamping * hR * hardPenalty * easyBonus;
                newStability = prevStability * (1.0 + Math.Max(0.1, growthFactor));
            }
        }

        if (rating == 1) // Again (Quên)
        {
            review.ConsecutiveCorrect = 0;
            review.IntervalDays = 1;
            // Trong FSRS, thẻ quên được đưa vào diện cần ôn lại sau 10 phút
            review.NextReviewDate = DateTime.UtcNow.AddMinutes(10);
        }
        else
        {
            review.ConsecutiveCorrect++;
            int prevInterval = Math.Max(1, review.IntervalDays);
            int targetInterval = (int)Math.Round(newStability);

            if (rating == 2) // Hard (Khó)
            {
                int days = review.ReviewCount == 0 ? 1 : Math.Max(1, Math.Min(targetInterval, (int)Math.Round(prevInterval * 1.2)));
                review.IntervalDays = Math.Clamp(days, 1, 365);
            }
            else if (rating == 3) // Good (Nhớ tốt)
            {
                int days = review.ReviewCount == 0 ? 3 : Math.Max(prevInterval + 1, targetInterval);
                review.IntervalDays = Math.Clamp(days, 1, 365);
            }
            else // Easy (Quá dễ)
            {
                int days = review.ReviewCount == 0 ? 8 : Math.Max(prevInterval + 2, (int)Math.Round(targetInterval * 1.15));
                review.IntervalDays = Math.Clamp(days, 1, 365);
            }

            review.NextReviewDate = DateTime.UtcNow.AddDays(review.IntervalDays);
        }

        // Lưu FSRS Difficulty D ∈ [1.0, 10.0] vào trường EaseFactor
        review.EaseFactor = Math.Round(newDifficulty, 2);
        review.ReviewCount++;
        review.LastReviewedAt = DateTime.UtcNow;

        _unitOfWork.BinoLearning.UpdateSRSReview(review);
        await _unitOfWork.CompleteAsync();

        return Response<bool>.SuccessResult("Đã ghi nhận kết quả ôn tập (FSRS)", true);
    }
}
