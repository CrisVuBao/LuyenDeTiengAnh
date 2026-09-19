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
    Task<Response<List<PlaylistDialogueDto>>> GetPlaylistDialoguesAsync(int userId, string? ids = null);

    // Admin CMS Methods
    Task<Response<List<AdminChapterDto>>> AdminGetChaptersAsync();
    Task<Response<AdminChapterDto>> AdminGetChapterDetailAsync(int id);
    Task<Response<AdminChapterDto>> AdminCreateChapterAsync(UpsertChapterDto dto);
    Task<Response<AdminChapterDto>> AdminUpdateChapterAsync(int id, UpsertChapterDto dto);
    Task<Response<bool>> AdminDeleteChapterAsync(int id);

    Task<Response<AdminDialogueDetailDto>> AdminGetDialogueDetailAsync(int id);
    Task<Response<AdminDialogueDetailDto>> AdminCreateDialogueAsync(UpsertDialogueDto dto);
    Task<Response<AdminDialogueDetailDto>> AdminUpdateDialogueAsync(int id, UpsertDialogueDto dto);
    Task<Response<bool>> AdminDeleteDialogueAsync(int id);

    Task<Response<SyncEpubResultDto>> AdminSyncRealDataAsync();
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

    public async Task<Response<List<PlaylistDialogueDto>>> GetPlaylistDialoguesAsync(int userId, string? ids = null)
    {
        var book = await _unitOfWork.BinoBooks.GetBookWithChaptersAsync();
        if (book == null)
            return Response<List<PlaylistDialogueDto>>.Failure("Không tìm thấy sách Bino.");

        var userProgresses = (await _unitOfWork.BinoLearning.GetProgressByUserAsync(userId)).ToList();
        var completedMap = userProgresses
            .Where(p => p.IsCompleted)
            .ToDictionary(p => p.DialogueLessonId, p => true);

        HashSet<int>? targetIdSet = null;
        if (!string.IsNullOrWhiteSpace(ids))
        {
            var parsedIds = ids.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                               .Select(s => int.TryParse(s, out var v) ? v : (int?)null)
                               .Where(v => v.HasValue)
                               .Select(v => v!.Value)
                               .ToHashSet();
            if (parsedIds.Any())
            {
                targetIdSet = parsedIds;
            }
        }

        var playlist = new List<PlaylistDialogueDto>();

        foreach (var chapter in book.Chapters.OrderBy(c => c.ChapterNumber))
        {
            foreach (var dialogue in chapter.DialogueLessons.OrderBy(d => d.DialogueNumber))
            {
                if (targetIdSet != null && !targetIdSet.Contains(dialogue.Id))
                    continue;

                playlist.Add(new PlaylistDialogueDto
                {
                    Id = dialogue.Id,
                    ChapterId = chapter.Id,
                    ChapterNumber = chapter.ChapterNumber,
                    ChapterTitle = chapter.Title,
                    ChapterTitleVi = chapter.TitleVi,
                    DialogueNumber = dialogue.DialogueNumber,
                    Title = dialogue.Title,
                    TitleVi = dialogue.TitleVi,
                    SituationDescription = dialogue.SituationDescription,
                    AudioUrl = dialogue.AudioUrl,
                    IsCompleted = completedMap.ContainsKey(dialogue.Id),
                    DialogueLines = dialogue.DialogueLines
                        .OrderBy(l => l.OrderIndex)
                        .Select(l => new DialogueLineDto
                        {
                            Id = l.Id,
                            CharacterName = l.CharacterName,
                            EnglishText = l.EnglishText,
                            VietnameseText = l.VietnameseText,
                            OrderIndex = l.OrderIndex,
                            AudioStartTimeMs = l.AudioStartTimeMs,
                            AudioEndTimeMs = l.AudioEndTimeMs,
                            IsUserRole = l.IsUserRole
                        }).ToList()
                });
            }
        }

        if (targetIdSet != null)
        {
            var idList = ids!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                             .Select(s => int.TryParse(s, out var v) ? v : (int?)null)
                             .Where(v => v.HasValue)
                             .Select(v => v!.Value)
                             .ToList();

            var playlistMap = playlist.ToDictionary(p => p.Id);
            var sortedPlaylist = new List<PlaylistDialogueDto>();
            foreach (var id in idList)
            {
                if (playlistMap.TryGetValue(id, out var item))
                {
                    sortedPlaylist.Add(item);
                }
            }
            if (sortedPlaylist.Any())
            {
                playlist = sortedPlaylist;
            }
        }

        return Response<List<PlaylistDialogueDto>>.SuccessResult($"Lấy danh sách phát thành công ({playlist.Count} bài)", playlist);
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

    #region Admin CMS Methods

    public async Task<Response<List<AdminChapterDto>>> AdminGetChaptersAsync()
    {
        var chapters = (await _unitOfWork.BinoBooks.GetAllChaptersAsync()).ToList();
        var dtos = chapters.Select(c => new AdminChapterDto
        {
            Id = c.Id,
            ChapterNumber = c.ChapterNumber,
            Title = c.Title,
            TitleVi = c.TitleVi,
            Description = c.Description,
            OrderIndex = c.OrderIndex,
            DialoguesCount = c.DialogueLessons.Count,
            VocabulariesCount = c.DialogueLessons.Sum(d => d.Vocabularies.Count),
            LinesCount = c.DialogueLessons.Sum(d => d.DialogueLines.Count),
            BonusTitle = c.Bonus?.Title,
            BonusContentHtml = c.Bonus?.ContentHtml,
            BonusAudioUrl = c.Bonus?.AudioUrl,
            BonusSlangs = !string.IsNullOrEmpty(c.Bonus?.SlangListJson)
                ? (JsonSerializer.Deserialize<List<string>>(c.Bonus.SlangListJson) ?? new())
                : new(),
            Dialogues = c.DialogueLessons.OrderBy(d => d.DialogueNumber).Select(d => new AdminDialogueSummaryDto
            {
                Id = d.Id,
                DialogueNumber = d.DialogueNumber,
                Title = d.Title,
                TitleVi = d.TitleVi,
                SituationDescription = d.SituationDescription,
                VideoUrl = d.VideoUrl,
                AudioUrl = d.AudioUrl,
                DurationSeconds = d.DurationSeconds,
                OrderIndex = d.OrderIndex,
                VocabulariesCount = d.Vocabularies.Count,
                LinesCount = d.DialogueLines.Count
            }).ToList()
        }).ToList();

        return Response<List<AdminChapterDto>>.SuccessResult("Lấy danh sách chương thành công", dtos);
    }

    public async Task<Response<AdminChapterDto>> AdminGetChapterDetailAsync(int id)
    {
        var chapter = await _unitOfWork.BinoBooks.GetChapterByIdAsync(id);
        if (chapter == null)
            return Response<AdminChapterDto>.Failure("Không tìm thấy chương.");

        var dto = new AdminChapterDto
        {
            Id = chapter.Id,
            ChapterNumber = chapter.ChapterNumber,
            Title = chapter.Title,
            TitleVi = chapter.TitleVi,
            Description = chapter.Description,
            OrderIndex = chapter.OrderIndex,
            DialoguesCount = chapter.DialogueLessons.Count,
            VocabulariesCount = chapter.DialogueLessons.Sum(d => d.Vocabularies.Count),
            LinesCount = chapter.DialogueLessons.Sum(d => d.DialogueLines.Count),
            BonusTitle = chapter.Bonus?.Title,
            BonusContentHtml = chapter.Bonus?.ContentHtml,
            BonusAudioUrl = chapter.Bonus?.AudioUrl,
            BonusSlangs = !string.IsNullOrEmpty(chapter.Bonus?.SlangListJson)
                ? (JsonSerializer.Deserialize<List<string>>(chapter.Bonus.SlangListJson) ?? new())
                : new(),
            Dialogues = chapter.DialogueLessons.OrderBy(d => d.DialogueNumber).Select(d => new AdminDialogueSummaryDto
            {
                Id = d.Id,
                DialogueNumber = d.DialogueNumber,
                Title = d.Title,
                TitleVi = d.TitleVi,
                SituationDescription = d.SituationDescription,
                VideoUrl = d.VideoUrl,
                AudioUrl = d.AudioUrl,
                DurationSeconds = d.DurationSeconds,
                OrderIndex = d.OrderIndex,
                VocabulariesCount = d.Vocabularies.Count,
                LinesCount = d.DialogueLines.Count
            }).ToList()
        };

        return Response<AdminChapterDto>.SuccessResult("Lấy chi tiết chương thành công", dto);
    }

    public async Task<Response<AdminChapterDto>> AdminCreateChapterAsync(UpsertChapterDto dto)
    {
        var book = await _unitOfWork.BinoBooks.GetBookWithChaptersAsync();
        if (book == null)
            return Response<AdminChapterDto>.Failure("Không tìm thấy sách gốc.");

        var chapter = new Chapter
        {
            BookId = book.Id,
            ChapterNumber = dto.ChapterNumber,
            Title = dto.Title,
            TitleVi = dto.TitleVi,
            Description = dto.Description,
            OrderIndex = dto.OrderIndex > 0 ? dto.OrderIndex : dto.ChapterNumber
        };

        if (!string.IsNullOrWhiteSpace(dto.BonusTitle) || !string.IsNullOrWhiteSpace(dto.BonusContentHtml) || (dto.BonusSlangs != null && dto.BonusSlangs.Any()))
        {
            chapter.Bonus = new ChapterBonus
            {
                Title = dto.BonusTitle ?? $"Góc Tiếng Lóng & Mẹo Văn Hóa - Chương {dto.ChapterNumber:D2}",
                ContentHtml = dto.BonusContentHtml,
                AudioUrl = dto.BonusAudioUrl,
                SlangListJson = JsonSerializer.Serialize(dto.BonusSlangs ?? new List<string>())
            };
        }

        await _unitOfWork.BinoBooks.AddChapterAsync(chapter);
        await _unitOfWork.CompleteAsync();

        return await AdminGetChapterDetailAsync(chapter.Id);
    }

    public async Task<Response<AdminChapterDto>> AdminUpdateChapterAsync(int id, UpsertChapterDto dto)
    {
        var chapter = await _unitOfWork.BinoBooks.GetChapterByIdAsync(id);
        if (chapter == null)
            return Response<AdminChapterDto>.Failure("Không tìm thấy chương cần cập nhật.");

        chapter.ChapterNumber = dto.ChapterNumber;
        chapter.Title = dto.Title;
        chapter.TitleVi = dto.TitleVi;
        chapter.Description = dto.Description;
        chapter.OrderIndex = dto.OrderIndex > 0 ? dto.OrderIndex : dto.ChapterNumber;

        // Update or create Bonus
        if (chapter.Bonus != null)
        {
            chapter.Bonus.Title = dto.BonusTitle ?? chapter.Bonus.Title;
            chapter.Bonus.ContentHtml = dto.BonusContentHtml;
            chapter.Bonus.AudioUrl = dto.BonusAudioUrl;
            if (dto.BonusSlangs != null)
            {
                chapter.Bonus.SlangListJson = JsonSerializer.Serialize(dto.BonusSlangs);
            }
            _unitOfWork.BinoBooks.UpdateChapterBonus(chapter.Bonus);
        }
        else if (!string.IsNullOrWhiteSpace(dto.BonusTitle) || !string.IsNullOrWhiteSpace(dto.BonusContentHtml) || (dto.BonusSlangs != null && dto.BonusSlangs.Any()))
        {
            var newBonus = new ChapterBonus
            {
                ChapterId = chapter.Id,
                Title = dto.BonusTitle ?? $"Góc Tiếng Lóng & Mẹo Văn Hóa - Chương {chapter.ChapterNumber:D2}",
                ContentHtml = dto.BonusContentHtml,
                AudioUrl = dto.BonusAudioUrl,
                SlangListJson = JsonSerializer.Serialize(dto.BonusSlangs ?? new List<string>())
            };
            await _unitOfWork.BinoBooks.AddChapterBonusAsync(newBonus);
        }

        _unitOfWork.BinoBooks.UpdateChapter(chapter);
        await _unitOfWork.CompleteAsync();

        return await AdminGetChapterDetailAsync(chapter.Id);
    }

    public async Task<Response<bool>> AdminDeleteChapterAsync(int id)
    {
        var chapter = await _unitOfWork.BinoBooks.GetChapterByIdAsync(id);
        if (chapter == null)
            return Response<bool>.Failure("Không tìm thấy chương cần xóa.");

        _unitOfWork.BinoBooks.RemoveChapter(chapter);
        await _unitOfWork.CompleteAsync();
        return Response<bool>.SuccessResult("Xóa chương thành công", true);
    }

    public async Task<Response<AdminDialogueDetailDto>> AdminGetDialogueDetailAsync(int id)
    {
        var dialogue = await _unitOfWork.BinoBooks.GetDialogueLessonAsync(id);
        if (dialogue == null)
            return Response<AdminDialogueDetailDto>.Failure("Không tìm thấy bài hội thoại.");

        var dto = new AdminDialogueDetailDto
        {
            Id = dialogue.Id,
            ChapterId = dialogue.ChapterId,
            ChapterNumber = dialogue.Chapter.ChapterNumber,
            ChapterTitle = dialogue.Chapter.Title,
            DialogueNumber = dialogue.DialogueNumber,
            Title = dialogue.Title,
            TitleVi = dialogue.TitleVi,
            SituationDescription = dialogue.SituationDescription,
            VideoUrl = dialogue.VideoUrl,
            AudioUrl = dialogue.AudioUrl,
            DurationSeconds = dialogue.DurationSeconds,
            OrderIndex = dialogue.OrderIndex,
            Vocabularies = dialogue.Vocabularies.OrderBy(v => v.OrderIndex).Select(v => new AdminVocabularyItemDto
            {
                Id = v.Id,
                Word = v.Word,
                Phonetic = v.Phonetic,
                WordType = v.WordType,
                Meaning = v.Meaning,
                ExampleSentence = v.ExampleSentence,
                AudioPronunciationUrl = v.AudioPronunciationUrl,
                OrderIndex = v.OrderIndex
            }).ToList(),
            DialogueLines = dialogue.DialogueLines.OrderBy(l => l.OrderIndex).Select(l => new AdminDialogueLineItemDto
            {
                Id = l.Id,
                CharacterName = l.CharacterName,
                EnglishText = l.EnglishText,
                VietnameseText = l.VietnameseText ?? string.Empty,
                OrderIndex = l.OrderIndex,
                IsUserRole = l.IsUserRole
            }).ToList()
        };

        return Response<AdminDialogueDetailDto>.SuccessResult("Lấy chi tiết bài hội thoại thành công", dto);
    }

    public async Task<Response<AdminDialogueDetailDto>> AdminCreateDialogueAsync(UpsertDialogueDto dto)
    {
        var chapter = await _unitOfWork.BinoBooks.GetChapterByIdAsync(dto.ChapterId);
        if (chapter == null)
            return Response<AdminDialogueDetailDto>.Failure("Không tìm thấy chương tương ứng.");

        var lesson = new DialogueLesson
        {
            ChapterId = dto.ChapterId,
            DialogueNumber = dto.DialogueNumber,
            Title = dto.Title,
            TitleVi = dto.TitleVi,
            SituationDescription = dto.SituationDescription,
            VideoUrl = dto.VideoUrl,
            AudioUrl = dto.AudioUrl,
            DurationSeconds = dto.DurationSeconds > 0 ? dto.DurationSeconds : 180,
            OrderIndex = dto.OrderIndex > 0 ? dto.OrderIndex : dto.DialogueNumber
        };

        if (dto.Vocabularies != null)
        {
            int order = 1;
            foreach (var v in dto.Vocabularies)
            {
                lesson.Vocabularies.Add(new DialogueVocabulary
                {
                    Word = v.Word,
                    Phonetic = v.Phonetic,
                    WordType = v.WordType,
                    Meaning = v.Meaning,
                    ExampleSentence = v.ExampleSentence,
                    AudioPronunciationUrl = v.AudioPronunciationUrl,
                    OrderIndex = v.OrderIndex > 0 ? v.OrderIndex : order++
                });
            }
        }

        if (dto.DialogueLines != null)
        {
            int order = 1;
            foreach (var l in dto.DialogueLines)
            {
                lesson.DialogueLines.Add(new DialogueLine
                {
                    CharacterName = l.CharacterName,
                    EnglishText = l.EnglishText,
                    VietnameseText = l.VietnameseText,
                    OrderIndex = l.OrderIndex > 0 ? l.OrderIndex : order++,
                    IsUserRole = l.IsUserRole
                });
            }
        }

        await _unitOfWork.BinoBooks.AddDialogueLessonAsync(lesson);
        await _unitOfWork.CompleteAsync();

        return await AdminGetDialogueDetailAsync(lesson.Id);
    }

    public async Task<Response<AdminDialogueDetailDto>> AdminUpdateDialogueAsync(int id, UpsertDialogueDto dto)
    {
        var lesson = await _unitOfWork.BinoBooks.GetDialogueLessonAsync(id);
        if (lesson == null)
            return Response<AdminDialogueDetailDto>.Failure("Không tìm thấy bài hội thoại cần cập nhật.");

        lesson.DialogueNumber = dto.DialogueNumber;
        lesson.Title = dto.Title;
        lesson.TitleVi = dto.TitleVi;
        lesson.SituationDescription = dto.SituationDescription;
        lesson.VideoUrl = dto.VideoUrl;
        lesson.AudioUrl = dto.AudioUrl;
        lesson.DurationSeconds = dto.DurationSeconds > 0 ? dto.DurationSeconds : 180;
        lesson.OrderIndex = dto.OrderIndex > 0 ? dto.OrderIndex : dto.DialogueNumber;

        // Sync Vocabularies
        _unitOfWork.BinoBooks.RemoveVocabularies(lesson.Vocabularies.ToList());
        if (dto.Vocabularies != null)
        {
            int order = 1;
            foreach (var v in dto.Vocabularies)
            {
                await _unitOfWork.BinoBooks.AddVocabularyAsync(new DialogueVocabulary
                {
                    DialogueLessonId = lesson.Id,
                    Word = v.Word,
                    Phonetic = v.Phonetic,
                    WordType = v.WordType,
                    Meaning = v.Meaning,
                    ExampleSentence = v.ExampleSentence,
                    AudioPronunciationUrl = v.AudioPronunciationUrl,
                    OrderIndex = v.OrderIndex > 0 ? v.OrderIndex : order++
                });
            }
        }

        // Sync Dialogue Lines
        _unitOfWork.BinoBooks.RemoveDialogueLines(lesson.DialogueLines.ToList());
        if (dto.DialogueLines != null)
        {
            int order = 1;
            foreach (var l in dto.DialogueLines)
            {
                await _unitOfWork.BinoBooks.AddDialogueLineAsync(new DialogueLine
                {
                    DialogueLessonId = lesson.Id,
                    CharacterName = l.CharacterName,
                    EnglishText = l.EnglishText,
                    VietnameseText = l.VietnameseText,
                    OrderIndex = l.OrderIndex > 0 ? l.OrderIndex : order++,
                    IsUserRole = l.IsUserRole
                });
            }
        }

        _unitOfWork.BinoBooks.UpdateDialogueLesson(lesson);
        await _unitOfWork.CompleteAsync();

        return await AdminGetDialogueDetailAsync(lesson.Id);
    }

    public async Task<Response<bool>> AdminDeleteDialogueAsync(int id)
    {
        var lesson = await _unitOfWork.BinoBooks.GetDialogueLessonAsync(id);
        if (lesson == null)
            return Response<bool>.Failure("Không tìm thấy bài hội thoại cần xóa.");

        _unitOfWork.BinoBooks.RemoveDialogueLesson(lesson);
        await _unitOfWork.CompleteAsync();
        return Response<bool>.SuccessResult("Xóa bài hội thoại thành công", true);
    }

    public async Task<Response<SyncEpubResultDto>> AdminSyncRealDataAsync()
    {
        // Locate bino_real_data.json
        var possiblePaths = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "bino_real_data.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "bino_real_data.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "../VBaceEnglish.Infrastructure/Data/bino_real_data.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "Data/bino_real_data.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "../Frontend/scripts/extracted_bino_data.json")
        };

        string? filePath = possiblePaths.FirstOrDefault(File.Exists);
        if (filePath == null)
        {
            return Response<SyncEpubResultDto>.Failure("Không tìm thấy file bino_real_data.json.");
        }

        var jsonContent = await File.ReadAllTextAsync(filePath);
        var extractedChapters = JsonSerializer.Deserialize<List<ExtractedChapterModel>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (extractedChapters == null || !extractedChapters.Any())
        {
            return Response<SyncEpubResultDto>.Failure("Dữ liệu trong file json rỗng hoặc không đúng cấu trúc.");
        }

        var book = await _unitOfWork.BinoBooks.GetBookWithChaptersAsync();
        if (book == null)
        {
            book = new BinoBook
            {
                Title = "Chém Tiếng Anh không cần động não",
                Author = "Bino",
                Slug = "chem-tieng-anh-khong-can-dong-nao",
                Description = "Bộ sách học tiếng Anh giao tiếp đời thực đỉnh cao của Bino. Gồm 12 chương, 72 bài hội thoại thực chiến kèm video luyện nói 1:1, audio độc quyền, các từ lóng slang và mẹo văn hóa thú vị.",
                CoverImageUrl = "/images/bino/page15.jpg",
                PdfFileUrl = "/ebooks/chem_tieng_anh_bino.pdf",
                EpubFileUrl = "/ebooks/chem_tieng_anh_bino.epub",
                TotalChapters = 12,
                IsPublished = true,
                CreatedAt = DateTime.UtcNow
            };
        }

        book.CoverImageUrl = "/images/bino/page15.jpg";
        book.PdfFileUrl = "/ebooks/chem_tieng_anh_bino.pdf";
        book.EpubFileUrl = "/ebooks/chem_tieng_anh_bino.epub";

        int chCount = 0;
        int dCount = 0;
        int vCount = 0;
        int lCount = 0;

        foreach (var chModel in extractedChapters)
        {
            var chapter = book.Chapters.FirstOrDefault(c => c.ChapterNumber == chModel.number);
            if (chapter == null)
            {
                chapter = new Chapter
                {
                    Book = book,
                    ChapterNumber = chModel.number,
                    OrderIndex = chModel.number
                };
                book.Chapters.Add(chapter);
            }

            chapter.Title = chModel.title;
            chapter.TitleVi = chModel.titleVi;
            chapter.Description = $"Chương {chModel.number:D2}: Luyện phản xạ tự nhiên chủ đề {chModel.titleVi.ToLower()}.";
            chCount++;

            // Chapter bonus
            if (chapter.Bonus == null)
            {
                chapter.Bonus = new ChapterBonus
                {
                    Chapter = chapter,
                    Title = $"Góc Tiếng Lóng & Mẹo Văn Hóa - Chương {chModel.number:D2}",
                    ContentHtml = $"<p>Chào mấy bác! Khi giao tiếp chủ đề <strong>{chModel.titleVi}</strong>, hãy bỏ túi ngay các từ khóa và mẫu câu tự nhiên dưới đây!</p>",
                    SlangListJson = JsonSerializer.Serialize(chModel.dialogues.SelectMany(d => d.vocabularies.Take(2)).Select(v => v.word).Distinct().ToList())
                };
            }

            // Sync Dialogues
            foreach (var dModel in chModel.dialogues)
            {
                var dialogue = chapter.DialogueLessons.FirstOrDefault(d => d.DialogueNumber == dModel.number);
                if (dialogue == null)
                {
                    dialogue = new DialogueLesson
                    {
                        Chapter = chapter,
                        DialogueNumber = dModel.number,
                        OrderIndex = dModel.number
                    };
                    chapter.DialogueLessons.Add(dialogue);
                }

                dialogue.Title = dModel.title;
                dialogue.TitleVi = dModel.title;
                dialogue.SituationDescription = $"Hội thoại {dModel.number}: {dModel.title} (Trang {dModel.startPage} trong sách TiengAnhBi).";
                dialogue.DurationSeconds = 180;
                dialogue.AudioUrl = $"/audios/bino/ch{chModel.number:D2}_d{dModel.number:D2}.mp3";
                dialogue.VideoUrl = $"/videos/bino/ch{chModel.number:D2}_d{dModel.number:D2}.mp4";
                dCount++;

                // Vocabularies
                if (dialogue.Vocabularies.Any())
                {
                    _unitOfWork.BinoBooks.RemoveVocabularies(dialogue.Vocabularies.ToList());
                    dialogue.Vocabularies.Clear();
                }

                int vOrder = 1;
                foreach (var vModel in dModel.vocabularies)
                {
                    dialogue.Vocabularies.Add(new DialogueVocabulary
                    {
                        Word = vModel.word,
                        Phonetic = vModel.phonetic,
                        WordType = vModel.wordType,
                        Meaning = vModel.meaning,
                        OrderIndex = vOrder++
                    });
                    vCount++;
                }

                // Lines
                if (dialogue.DialogueLines.Any())
                {
                    _unitOfWork.BinoBooks.RemoveDialogueLines(dialogue.DialogueLines.ToList());
                    dialogue.DialogueLines.Clear();
                }

                int lOrder = 1;
                foreach (var lModel in dModel.lines)
                {
                    dialogue.DialogueLines.Add(new DialogueLine
                    {
                        CharacterName = lModel.speaker,
                        EnglishText = lModel.englishText,
                        VietnameseText = lModel.vietnameseText,
                        IsUserRole = lModel.isUserRole,
                        OrderIndex = lOrder++
                    });
                    lCount++;
                }
            }
        }

        await _unitOfWork.CompleteAsync();

        var resultDto = new SyncEpubResultDto
        {
            ChaptersUpdated = chCount,
            DialoguesUpdated = dCount,
            VocabulariesUpdated = vCount,
            LinesUpdated = lCount,
            Message = $"Đồng bộ thành công {chCount} chương, {dCount} bài hội thoại, {vCount} từ vựng và {lCount} câu thoại thật từ TiengAnhBi.epub!"
        };

        return Response<SyncEpubResultDto>.SuccessResult(resultDto.Message, resultDto);
    }

    #endregion

    #region Models for JSON parsing
    private class ExtractedChapterModel
    {
        public int number { get; set; }
        public string title { get; set; } = string.Empty;
        public string titleVi { get; set; } = string.Empty;
        public int startPage { get; set; }
        public List<ExtractedDialogueModel> dialogues { get; set; } = new();
    }

    private class ExtractedDialogueModel
    {
        public int number { get; set; }
        public string title { get; set; } = string.Empty;
        public int startPage { get; set; }
        public List<ExtractedVocabularyModel> vocabularies { get; set; } = new();
        public List<ExtractedLineModel> lines { get; set; } = new();
    }

    private class ExtractedVocabularyModel
    {
        public string word { get; set; } = string.Empty;
        public string? phonetic { get; set; }
        public string? wordType { get; set; }
        public string meaning { get; set; } = string.Empty;
    }

    private class ExtractedLineModel
    {
        public string speaker { get; set; } = string.Empty;
        public string englishText { get; set; } = string.Empty;
        public string vietnameseText { get; set; } = string.Empty;
        public bool isUserRole { get; set; }
    }
    #endregion
}
