using System.Text.Json;
using VBaceEnglish.Application.DTOs.Bino;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public partial class BinoBookService
{
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
        var lesson = await _unitOfWork.BinoBooks.GetDialogueLessonAsync(id, trackChanges: true);
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
        var lesson = await _unitOfWork.BinoBooks.GetDialogueLessonAsync(id, trackChanges: true);
        if (lesson == null)
            return Response<bool>.Failure("Không tìm thấy bài hội thoại cần xóa.");

        _unitOfWork.BinoBooks.RemoveDialogueLesson(lesson);
        await _unitOfWork.CompleteAsync();
        return Response<bool>.SuccessResult("Xóa bài hội thoại thành công", true);
    }
}
