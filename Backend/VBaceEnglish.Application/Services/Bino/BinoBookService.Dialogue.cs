using VBaceEnglish.Application.DTOs.Bino;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public partial class BinoBookService
{
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
            CharacterName = SanitizeBrandText(l.CharacterName),
            EnglishText = SanitizeBrandText(l.EnglishText),
            VietnameseText = SanitizeBrandText(l.VietnameseText),
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
            ChapterTitle = SanitizeBrandText(lesson.Chapter.Title),
            ChapterTitleVi = SanitizeBrandText(lesson.Chapter.TitleVi),
            DialogueNumber = lesson.DialogueNumber,
            Title = SanitizeBrandText(lesson.Title),
            TitleVi = SanitizeBrandText(lesson.TitleVi),
            SituationDescription = SanitizeBrandText(lesson.SituationDescription),
            VideoUrl = lesson.VideoUrl,
            AudioUrl = lesson.AudioUrl,
            DurationSeconds = lesson.DurationSeconds,
            ThumbnailUrl = lesson.ThumbnailUrl,
            IsCompleted = progress?.IsCompleted ?? false,
            HasWatchedVideo = progress?.HasWatchedVideo ?? false,
            RoleplayCompleted = progress?.RoleplayCompleted ?? false,
            DictationScore = progress?.DictationScore,
            TimeSpentSeconds = progress?.TimeSpentSeconds ?? 0,
            Vocabularies = vocabDtos,
            DialogueLines = lineDtos
        };

        return Response<DialogueLessonDetailDto>.SuccessResult("Lấy bài học thành công", dto);
    }

    public async Task<Response<List<PlaylistDialogueDto>>> GetPlaylistDialoguesAsync(int userId, string? ids = null)
    {
        var book = await _unitOfWork.BinoBooks.GetBookWithChaptersAsync();
        if (book == null)
            return Response<List<PlaylistDialogueDto>>.Failure("Không tìm thấy giáo trình hội thoại.");

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
                    ChapterTitle = SanitizeBrandText(chapter.Title),
                    ChapterTitleVi = SanitizeBrandText(chapter.TitleVi),
                    DialogueNumber = dialogue.DialogueNumber,
                    Title = SanitizeBrandText(dialogue.Title),
                    TitleVi = SanitizeBrandText(dialogue.TitleVi),
                    SituationDescription = SanitizeBrandText(dialogue.SituationDescription),
                    AudioUrl = dialogue.AudioUrl,
                    IsCompleted = completedMap.ContainsKey(dialogue.Id),
                    DialogueLines = dialogue.DialogueLines
                        .OrderBy(l => l.OrderIndex)
                        .Select(l => new DialogueLineDto
                        {
                            Id = l.Id,
                            CharacterName = SanitizeBrandText(l.CharacterName),
                            EnglishText = SanitizeBrandText(l.EnglishText),
                            VietnameseText = SanitizeBrandText(l.VietnameseText),
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
            playlist = playlist.OrderBy(p => idList.IndexOf(p.Id)).ToList();
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
                TimeSpentSeconds = Math.Max(0, dto.TimeSpentSeconds),
                LastAccessedAt = DateTime.UtcNow
            };
            await _unitOfWork.BinoLearning.AddProgressAsync(progress);
        }
        else
        {
            if (dto.IsCompleted.HasValue) progress.IsCompleted = dto.IsCompleted.Value;
            if (dto.HasWatchedVideo.HasValue) progress.HasWatchedVideo = dto.HasWatchedVideo.Value;
            if (dto.RoleplayCompleted.HasValue) progress.RoleplayCompleted = dto.RoleplayCompleted.Value;
            if (dto.DictationScore.HasValue)
            {
                // Giữ điểm cao nhất hoặc cập nhật điểm mới nhất
                progress.DictationScore = progress.DictationScore.HasValue
                    ? Math.Max(progress.DictationScore.Value, dto.DictationScore.Value)
                    : dto.DictationScore.Value;
            }
            if (dto.TimeSpentSeconds > 0)
            {
                progress.TimeSpentSeconds += dto.TimeSpentSeconds;
            }
            progress.LastAccessedAt = DateTime.UtcNow;
            _unitOfWork.BinoLearning.UpdateProgress(progress);
        }

        await _unitOfWork.CompleteAsync();
        return Response<bool>.SuccessResult("Cập nhật tiến độ thành công", true);
    }

    public async Task<Response<BinoStudyProgressSummaryDto>> GetUserStudyProgressSummaryAsync(int userId)
    {
        var book = await _unitOfWork.BinoBooks.GetBookWithChaptersAsync();
        if (book == null)
            return Response<BinoStudyProgressSummaryDto>.Failure("Không tìm thấy giáo trình hội thoại.");

        var userProgresses = (await _unitOfWork.BinoLearning.GetProgressByUserAsync(userId)).ToList();
        var progressMap = userProgresses.ToDictionary(p => p.DialogueLessonId, p => p);

        var srsReviews = (await _unitOfWork.BinoLearning.GetAllSRSReviewsByUserAsync(userId)).ToList();
        var srsVocabSet = srsReviews.Select(r => r.VocabularyId).ToHashSet();

        var toeicProgresses = (await _unitOfWork.UserProgresses.GetAllProgressByUserAsync(userId)).ToList();

        var nowUtc = DateTime.UtcNow;
        var chaptersProgress = new List<BinoChapterProgressDto>();
        var allDialogueItems = new List<BinoDialogueProgressItemDto>();

        int totalLessons = 0;
        int completedLessons = 0;
        int inProgressLessons = 0;
        int audioListenedCount = 0;
        int roleplayCompletedCount = 0;
        int dictationPracticedCount = 0;
        var dictationScores = new List<int>();
        int totalTimeSpentSeconds = 0;
        int totalBookVocabularies = 0;
        int completedChapters = 0;

        foreach (var ch in book.Chapters.OrderBy(c => c.ChapterNumber))
        {
            var chDialogues = new List<BinoDialogueProgressItemDto>();
            int chCompleted = 0;
            int chAudio = 0;
            int chRoleplay = 0;
            int chDictation = 0;
            int chTotalVocab = 0;
            int chSavedVocab = 0;
            int chTimeSeconds = 0;
            DateTime? chLastAccessed = null;

            foreach (var dl in ch.DialogueLessons.OrderBy(d => d.DialogueNumber))
            {
                totalLessons++;
                int vocabCount = dl.Vocabularies.Count;
                int savedVocab = dl.Vocabularies.Count(v => srsVocabSet.Contains(v.Id));
                totalBookVocabularies += vocabCount;
                chTotalVocab += vocabCount;
                chSavedVocab += savedVocab;

                progressMap.TryGetValue(dl.Id, out var prog);
                bool isDone = prog?.IsCompleted ?? false;
                bool hasAudio = (prog?.HasWatchedVideo ?? false) || isDone;
                bool hasRoleplay = prog?.RoleplayCompleted ?? false;
                int? dictScore = prog?.DictationScore;
                int timeSec = prog?.TimeSpentSeconds ?? 0;
                DateTime? lastAcc = prog?.LastAccessedAt;

                if (isDone)
                {
                    completedLessons++;
                    chCompleted++;
                }
                else if (prog != null && (hasAudio || hasRoleplay || dictScore.HasValue || timeSec > 0))
                {
                    inProgressLessons++;
                }

                if (hasAudio)
                {
                    audioListenedCount++;
                    chAudio++;
                }

                if (hasRoleplay)
                {
                    roleplayCompletedCount++;
                    chRoleplay++;
                }

                if (dictScore.HasValue)
                {
                    dictationPracticedCount++;
                    chDictation++;
                    dictationScores.Add(dictScore.Value);
                }

                totalTimeSpentSeconds += timeSec;
                chTimeSeconds += timeSec;

                if (lastAcc.HasValue && (!chLastAccessed.HasValue || lastAcc.Value > chLastAccessed.Value))
                {
                    chLastAccessed = lastAcc.Value;
                }

                var itemDto = new BinoDialogueProgressItemDto
                {
                    DialogueLessonId = dl.Id,
                    ChapterNumber = ch.ChapterNumber,
                    ChapterTitle = SanitizeBrandText(ch.Title),
                    ChapterTitleVi = SanitizeBrandText(ch.TitleVi),
                    DialogueNumber = dl.DialogueNumber,
                    Title = SanitizeBrandText(dl.Title),
                    TitleVi = SanitizeBrandText(dl.TitleVi),
                    VocabularyCount = vocabCount,
                    SavedVocabularyCount = savedVocab,
                    LinesCount = dl.DialogueLines.Count,
                    IsCompleted = isDone,
                    HasWatchedVideo = hasAudio,
                    RoleplayCompleted = hasRoleplay,
                    DictationScore = dictScore,
                    TimeSpentSeconds = timeSec,
                    LastAccessedAt = lastAcc
                };

                chDialogues.Add(itemDto);
                allDialogueItems.Add(itemDto);
            }

            int chTotalLessons = ch.DialogueLessons.Count;
            if (chTotalLessons > 0 && chCompleted == chTotalLessons)
            {
                completedChapters++;
            }

            chaptersProgress.Add(new BinoChapterProgressDto
            {
                ChapterId = ch.Id,
                ChapterNumber = ch.ChapterNumber,
                Title = SanitizeBrandText(ch.Title),
                TitleVi = SanitizeBrandText(ch.TitleVi),
                TotalLessons = chTotalLessons,
                CompletedLessons = chCompleted,
                AudioListenedCount = chAudio,
                RoleplayCount = chRoleplay,
                DictationCount = chDictation,
                TotalVocabCount = chTotalVocab,
                SavedVocabCount = chSavedVocab,
                TimeSpentSeconds = chTimeSeconds,
                ProgressPercent = chTotalLessons > 0 ? Math.Round((double)chCompleted / chTotalLessons * 100, 1) : 0,
                LastAccessedAt = chLastAccessed,
                Dialogues = chDialogues
            });
        }

        // Tính chuỗi ngày học liên tiếp thực tế (Vietnam Time UTC+7)
        var activityDates = new List<DateTime>();
        activityDates.AddRange(userProgresses.Select(p => p.LastAccessedAt));
        activityDates.AddRange(srsReviews.Where(r => r.LastReviewedAt.HasValue).Select(r => r.LastReviewedAt!.Value));
        activityDates.AddRange(toeicProgresses.Select(t => t.UpdatedAt));

        int streakDays = CalculateConsecutiveStreakDays(activityDates);

        var summaryDto = new BinoStudyProgressSummaryDto
        {
            TotalChapters = book.Chapters.Count,
            CompletedChapters = completedChapters,
            TotalLessons = totalLessons,
            CompletedLessons = completedLessons,
            InProgressLessons = inProgressLessons,
            ProgressPercentage = totalLessons > 0 ? Math.Round((double)completedLessons / totalLessons * 100, 1) : 0,
            AudioListenedCount = audioListenedCount,
            RoleplayCompletedCount = roleplayCompletedCount,
            DictationPracticedCount = dictationPracticedCount,
            AverageDictationScore = dictationScores.Count > 0 ? Math.Round(dictationScores.Average(), 1) : 0,
            TotalTimeSpentSeconds = totalTimeSpentSeconds,
            TotalTimeSpentMinutes = (int)Math.Ceiling(totalTimeSpentSeconds / 60.0),
            TotalBookVocabularies = totalBookVocabularies,
            SavedFlashcardsCount = srsReviews.Count,
            MasteredFlashcardsCount = srsReviews.Count(r => r.ConsecutiveCorrect >= 2 || r.IntervalDays >= 3),
            DueFlashcardsCount = srsReviews.Count(r => r.NextReviewDate <= nowUtc),
            TotalSrsReviewsCount = srsReviews.Sum(r => r.ReviewCount),
            CurrentStreakDays = streakDays,
            ChaptersProgress = chaptersProgress,
            RecentStudiedDialogues = allDialogueItems
                .Where(d => d.LastAccessedAt.HasValue)
                .OrderByDescending(d => d.LastAccessedAt)
                .Take(12)
                .ToList()
        };

        return Response<BinoStudyProgressSummaryDto>.SuccessResult("Lấy thống kê quá trình học Giao Tiếp 72 thành công", summaryDto);
    }

    public async Task<Response<bool>> ResetUserBinoProgressAsync(int userId, int? chapterNumber)
    {
        var userProgresses = (await _unitOfWork.BinoLearning.GetProgressByUserAsync(userId)).ToList();
        if (!userProgresses.Any())
            return Response<bool>.SuccessResult("Đã làm mới tiến độ học tập", true);

        if (chapterNumber.HasValue && chapterNumber.Value > 0)
        {
            var chapter = await _unitOfWork.BinoBooks.GetChapterWithLessonsAsync(chapterNumber.Value);
            if (chapter == null)
                return Response<bool>.Failure("Không tìm thấy chương cần làm lại.");

            var lessonIds = chapter.DialogueLessons.Select(d => d.Id).ToHashSet();
            var toRemove = userProgresses.Where(p => lessonIds.Contains(p.DialogueLessonId)).ToList();
            if (toRemove.Any())
            {
                _unitOfWork.BinoLearning.RemoveProgressRange(toRemove);
                await _unitOfWork.CompleteAsync();
            }
            return Response<bool>.SuccessResult($"Đã đặt lại tiến độ Chương {chapterNumber.Value:D2} về ban đầu", true);
        }
        else
        {
            _unitOfWork.BinoLearning.RemoveProgressRange(userProgresses);
            await _unitOfWork.CompleteAsync();
            return Response<bool>.SuccessResult("Đã đặt lại toàn bộ tiến độ khóa học Giao Tiếp 72 về ban đầu", true);
        }
    }

    public static int CalculateConsecutiveStreakDays(IEnumerable<DateTime> utcTimestamps)
    {
        var vnDays = utcTimestamps
            .Select(dt => dt.AddHours(7).Date)
            .Distinct()
            .OrderByDescending(d => d)
            .ToList();

        if (vnDays.Count == 0)
            return 0;

        var todayVn = DateTime.UtcNow.AddHours(7).Date;
        // Nếu ngày học gần nhất cách hôm nay quá 1 ngày (tức không học hôm nay và cũng không học hôm qua) -> chuỗi = 0
        if ((todayVn - vnDays[0]).TotalDays > 1)
            return 0;

        int streak = 1;
        for (int i = 0; i < vnDays.Count - 1; i++)
        {
            if ((vnDays[i] - vnDays[i + 1]).TotalDays == 1)
                streak++;
            else
                break;
        }
        return streak;
    }
}
