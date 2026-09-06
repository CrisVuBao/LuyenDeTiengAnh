using System.Text.Json;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Application.DTOs.Bino;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public interface IBinoBookService
{
    Task<Response<BinoBookDto>> GetBookOverviewAsync(int userId, string slug = "chem-tieng-anh-khong-can-dong-nao");
    Task<Response<ChapterDetailDto>> GetChapterDetailAsync(int userId, int chapterNumber);
    Task<Response<ChapterBonusDto>> GetChapterBonusAsync(int chapterNumber);
    Task<Response<DialogueLessonDetailDto>> GetDialogueLessonDetailAsync(int userId, int id);
    Task<Response<DialogueLessonDetailDto>> GetDialogueLessonByNumberAsync(int userId, int chapterNumber, int dialogueNumber);
    Task<Response<bool>> MarkProgressAsync(int userId, MarkDialogueProgressDto dto);
    Task<Response<bool>> AddWordToSRSAsync(int userId, int vocabularyId);
    Task<Response<IEnumerable<SrsCardDto>>> GetDueSRSCardsAsync(int userId);
    Task<Response<bool>> SubmitSRSReviewAsync(int userId, SubmitSrsReviewDto dto);
}

public class ChapterDetailDto
{
    public int Id { get; set; }
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public string? Description { get; set; }
    public bool HasBonus { get; set; }
    public List<DialogueLessonSummaryDto> Dialogues { get; set; } = new();
}

public class BinoBookService : IBinoBookService
{
    private readonly IUnitOfWork _unitOfWork;

    public BinoBookService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Response<BinoBookDto>> GetBookOverviewAsync(int userId, string slug = "chem-tieng-anh-khong-can-dong-nao")
    {
        var book = await _unitOfWork.BinoBooks.GetBookWithChaptersAsync(slug);
        if (book == null)
            return Response<BinoBookDto>.Failure("Không tìm thấy sách.");

        var userProgresses = (await _unitOfWork.BinoLearning.GetProgressByUserAsync(userId)).ToList();
        var completedMap = userProgresses
            .Where(p => p.IsCompleted)
            .ToDictionary(p => p.DialogueLessonId, p => true);

        var totalLessons = 0;
        var completedLessons = 0;

        var chapterDtos = new List<ChapterSummaryDto>();
        foreach (var c in book.Chapters)
        {
            var dialogues = new List<DialogueLessonSummaryDto>();
            var chapterCompletedCount = 0;

            foreach (var d in c.DialogueLessons)
            {
                totalLessons++;
                var isDone = completedMap.ContainsKey(d.Id);
                if (isDone)
                {
                    completedLessons++;
                    chapterCompletedCount++;
                }

                dialogues.Add(new DialogueLessonSummaryDto
                {
                    Id = d.Id,
                    ChapterNumber = c.ChapterNumber,
                    DialogueNumber = d.DialogueNumber,
                    Title = d.Title,
                    TitleVi = d.TitleVi,
                    SituationDescription = d.SituationDescription,
                    VideoUrl = d.VideoUrl,
                    AudioUrl = d.AudioUrl,
                    DurationSeconds = d.DurationSeconds,
                    VocabularyCount = d.Vocabularies.Count,
                    IsCompleted = isDone
                });
            }

            chapterDtos.Add(new ChapterSummaryDto
            {
                Id = c.Id,
                ChapterNumber = c.ChapterNumber,
                Title = c.Title,
                TitleVi = c.TitleVi,
                Description = c.Description,
                TotalLessons = c.DialogueLessons.Count,
                CompletedLessons = chapterCompletedCount,
                HasBonus = c.Bonus != null,
                Dialogues = dialogues
            });
        }

        var percent = totalLessons > 0 ? Math.Round((double)completedLessons / totalLessons * 100, 1) : 0;

        var dto = new BinoBookDto
        {
            Id = book.Id,
            Title = book.Title,
            Author = book.Author,
            Slug = book.Slug,
            Description = book.Description,
            CoverImageUrl = book.CoverImageUrl,
            PdfFileUrl = book.PdfFileUrl,
            EpubFileUrl = book.EpubFileUrl,
            TotalChapters = book.TotalChapters,
            CompletedLessonsCount = completedLessons,
            TotalLessonsCount = totalLessons,
            ProgressPercentage = percent,
            Chapters = chapterDtos
        };

        return Response<BinoBookDto>.SuccessResult("Lấy thông tin sách thành công", dto);
    }

    public async Task<Response<ChapterDetailDto>> GetChapterDetailAsync(int userId, int chapterNumber)
    {
        var chapter = await _unitOfWork.BinoBooks.GetChapterWithLessonsAsync(chapterNumber);
        if (chapter == null)
            return Response<ChapterDetailDto>.Failure("Không tìm thấy chương này.");

        var userProgresses = (await _unitOfWork.BinoLearning.GetProgressByUserAsync(userId)).ToList();
        var completedMap = userProgresses
            .Where(p => p.IsCompleted)
            .ToDictionary(p => p.DialogueLessonId, p => true);

        var dialogues = chapter.DialogueLessons.Select(d => new DialogueLessonSummaryDto
        {
            Id = d.Id,
            ChapterNumber = chapter.ChapterNumber,
            DialogueNumber = d.DialogueNumber,
            Title = d.Title,
            TitleVi = d.TitleVi,
            SituationDescription = d.SituationDescription,
            VideoUrl = d.VideoUrl,
            AudioUrl = d.AudioUrl,
            DurationSeconds = d.DurationSeconds,
            VocabularyCount = d.Vocabularies.Count,
            IsCompleted = completedMap.ContainsKey(d.Id)
        }).ToList();

        var dto = new ChapterDetailDto
        {
            Id = chapter.Id,
            ChapterNumber = chapter.ChapterNumber,
            Title = chapter.Title,
            TitleVi = chapter.TitleVi,
            Description = chapter.Description,
            HasBonus = chapter.Bonus != null,
            Dialogues = dialogues
        };

        return Response<ChapterDetailDto>.SuccessResult("Lấy chi tiết chương thành công", dto);
    }

    public async Task<Response<ChapterBonusDto>> GetChapterBonusAsync(int chapterNumber)
    {
        var bonus = await _unitOfWork.BinoBooks.GetChapterBonusAsync(chapterNumber);
        if (bonus == null)
            return Response<ChapterBonusDto>.Failure("Chưa có nội dung bổ sung cho chương này.");

        var slangList = new List<string>();
        if (!string.IsNullOrWhiteSpace(bonus.SlangListJson))
        {
            try
            {
                slangList = JsonSerializer.Deserialize<List<string>>(bonus.SlangListJson) ?? new();
            }
            catch
            {
                // fallback
            }
        }

        var dto = new ChapterBonusDto
        {
            Id = bonus.Id,
            ChapterId = bonus.ChapterId,
            ChapterNumber = chapterNumber,
            Title = bonus.Title,
            ContentHtml = bonus.ContentHtml,
            AudioUrl = bonus.AudioUrl,
            SlangList = slangList
        };

        return Response<ChapterBonusDto>.SuccessResult("Lấy nội dung bổ sung thành công", dto);
    }

    public async Task<Response<DialogueLessonDetailDto>> GetDialogueLessonDetailAsync(int userId, int id)
    {
        var lesson = await _unitOfWork.BinoBooks.GetDialogueLessonAsync(id);
        if (lesson == null)
            return Response<DialogueLessonDetailDto>.Failure("Không tìm thấy bài hội thoại.");

        return await BuildLessonDetailResponse(userId, lesson);
    }

    public async Task<Response<DialogueLessonDetailDto>> GetDialogueLessonByNumberAsync(int userId, int chapterNumber, int dialogueNumber)
    {
        var lesson = await _unitOfWork.BinoBooks.GetDialogueLessonByNumberAsync(chapterNumber, dialogueNumber);
        if (lesson == null)
            return Response<DialogueLessonDetailDto>.Failure("Không tìm thấy bài hội thoại.");

        return await BuildLessonDetailResponse(userId, lesson);
    }

    private async Task<Response<DialogueLessonDetailDto>> BuildLessonDetailResponse(int userId, DialogueLesson lesson)
    {
        var progress = await _unitOfWork.BinoLearning.GetProgressAsync(userId, lesson.Id);
        var srsReviews = (await _unitOfWork.BinoLearning.GetAllSRSReviewsByUserAsync(userId))
            .ToDictionary(r => r.VocabularyId, r => true);

        var vocabDtos = lesson.Vocabularies.Select(v => new DialogueVocabularyDto
        {
            Id = v.Id,
            Word = v.Word,
            Phonetic = v.Phonetic,
            WordType = v.WordType,
            Meaning = v.Meaning,
            ExampleSentence = v.ExampleSentence,
            AudioPronunciationUrl = v.AudioPronunciationUrl,
            OrderIndex = v.OrderIndex,
            IsInFlashcards = srsReviews.ContainsKey(v.Id)
        }).ToList();

        var lineDtos = lesson.DialogueLines.Select(l => new DialogueLineDto
        {
            Id = l.Id,
            CharacterName = l.CharacterName,
            EnglishText = l.EnglishText,
            VietnameseText = l.VietnameseText,
            OrderIndex = l.OrderIndex,
            AudioStartTimeMs = l.AudioStartTimeMs,
            AudioEndTimeMs = l.AudioEndTimeMs,
            IsUserRole = l.IsUserRole
        }).ToList();

        var dto = new DialogueLessonDetailDto
        {
            Id = lesson.Id,
            ChapterId = lesson.ChapterId,
            ChapterNumber = lesson.Chapter.ChapterNumber,
            ChapterTitle = lesson.Chapter.Title,
            ChapterTitleVi = lesson.Chapter.TitleVi,
            DialogueNumber = lesson.DialogueNumber,
            Title = lesson.Title,
            TitleVi = lesson.TitleVi,
            SituationDescription = lesson.SituationDescription,
            VideoUrl = lesson.VideoUrl,
            AudioUrl = lesson.AudioUrl,
            DurationSeconds = lesson.DurationSeconds,
            ThumbnailUrl = lesson.ThumbnailUrl,
            IsCompleted = progress?.IsCompleted ?? false,
            HasWatchedVideo = progress?.HasWatchedVideo ?? false,
            RoleplayCompleted = progress?.RoleplayCompleted ?? false,
            DictationScore = progress?.DictationScore,
            Vocabularies = vocabDtos,
            DialogueLines = lineDtos
        };

        return Response<DialogueLessonDetailDto>.SuccessResult("Lấy bài học thành công", dto);
    }

    public async Task<Response<bool>> MarkProgressAsync(int userId, MarkDialogueProgressDto dto)
    {
        var progress = await _unitOfWork.BinoLearning.GetProgressAsync(userId, dto.DialogueLessonId);
        if (progress == null)
        {
            progress = new UserDialogueProgress
            {
                UserId = userId,
                DialogueLessonId = dto.DialogueLessonId,
                IsCompleted = dto.IsCompleted ?? false,
                HasWatchedVideo = dto.HasWatchedVideo ?? false,
                RoleplayCompleted = dto.RoleplayCompleted ?? false,
                DictationScore = dto.DictationScore,
                TimeSpentSeconds = dto.TimeSpentSeconds,
                LastAccessedAt = DateTime.UtcNow
            };
            await _unitOfWork.BinoLearning.AddProgressAsync(progress);
        }
        else
        {
            if (dto.IsCompleted.HasValue) progress.IsCompleted = dto.IsCompleted.Value;
            if (dto.HasWatchedVideo.HasValue) progress.HasWatchedVideo = dto.HasWatchedVideo.Value;
            if (dto.RoleplayCompleted.HasValue) progress.RoleplayCompleted = dto.RoleplayCompleted.Value;
            if (dto.DictationScore.HasValue) progress.DictationScore = dto.DictationScore.Value;
            progress.TimeSpentSeconds += dto.TimeSpentSeconds;
            progress.LastAccessedAt = DateTime.UtcNow;
            _unitOfWork.BinoLearning.UpdateProgress(progress);
        }

        await _unitOfWork.CompleteAsync();
        return Response<bool>.SuccessResult("Cập nhật tiến độ thành công", true);
    }

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

    public async Task<Response<IEnumerable<SrsCardDto>>> GetDueSRSCardsAsync(int userId)
    {
        var reviews = await _unitOfWork.BinoLearning.GetDueSRSReviewsAsync(userId);
        var dtos = reviews.Select(r => new SrsCardDto
        {
            Id = r.Id,
            VocabularyId = r.VocabularyId,
            Word = r.Vocabulary.Word,
            Phonetic = r.Vocabulary.Phonetic,
            WordType = r.Vocabulary.WordType,
            Meaning = r.Vocabulary.Meaning,
            ExampleSentence = r.Vocabulary.ExampleSentence,
            ChapterTitle = r.Vocabulary.DialogueLesson?.Chapter?.Title ?? "",
            DialogueTitle = r.Vocabulary.DialogueLesson?.Title ?? "",
            IntervalDays = r.IntervalDays,
            ConsecutiveCorrect = r.ConsecutiveCorrect,
            NextReviewDate = r.NextReviewDate
        });

        return Response<IEnumerable<SrsCardDto>>.SuccessResult("Lấy danh sách thẻ cần ôn", dtos);
    }

    public async Task<Response<bool>> SubmitSRSReviewAsync(int userId, SubmitSrsReviewDto dto)
    {
        var review = await _unitOfWork.BinoLearning.GetSRSReviewAsync(userId, dto.VocabularyId);
        if (review == null)
            return Response<bool>.Failure("Không tìm thấy thẻ ôn tập.");

        // SM-2 Algorithm Implementation
        // Grade: 0 = Forgot, 1 = Hard, 2 = Good, 3 = Easy
        if (dto.Grade < 2)
        {
            review.ConsecutiveCorrect = 0;
            review.IntervalDays = 1;
        }
        else
        {
            review.ConsecutiveCorrect++;
            if (review.ConsecutiveCorrect == 1)
                review.IntervalDays = 1;
            else if (review.ConsecutiveCorrect == 2)
                review.IntervalDays = 3;
            else
                review.IntervalDays = (int)Math.Max(1, Math.Round(review.IntervalDays * review.EaseFactor));
        }

        // Update Ease Factor (EF)
        // EF' = EF + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02))
        review.EaseFactor = Math.Max(1.3, review.EaseFactor + (0.1 - (3 - dto.Grade) * (0.08 + (3 - dto.Grade) * 0.02)));

        review.ReviewCount++;
        review.LastReviewedAt = DateTime.UtcNow;
        review.NextReviewDate = DateTime.UtcNow.AddDays(review.IntervalDays);

        _unitOfWork.BinoLearning.UpdateSRSReview(review);
        await _unitOfWork.CompleteAsync();

        return Response<bool>.SuccessResult("Đã ghi nhận kết quả ôn tập", true);
    }
}
