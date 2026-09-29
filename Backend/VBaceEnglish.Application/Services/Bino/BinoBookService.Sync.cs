using System.Text.Json;
using VBaceEnglish.Application.DTOs.Bino;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public partial class BinoBookService
{
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

        var book = await _unitOfWork.BinoBooks.GetBookWithChaptersAsync(trackChanges: true);
        if (book == null)
        {
            book = new BinoBook
            {
                Title = "Giao Tiếp Thực Chiến: Phản Xạ Tiếng Anh Tức Thì",
                Author = "Vũ Bảo Software",
                Slug = "chem-tieng-anh-khong-can-dong-nao",
                Description = $"Hệ thống {extractedChapters.Count} chương, {extractedChapters.Sum(c => c.dialogues.Count)} bài hội thoại giao tiếp đời thực kèm luyện nói đóng vai 1:1, audio thụ động, biến hóa mẫu câu và Góc Tư Duy VBace — Độc quyền bởi Vũ Bảo Software.",
                CoverImageUrl = "/images/bino/page15.jpg",
                PdfFileUrl = "/ebooks/chem_tieng_anh_bino.pdf",
                EpubFileUrl = "/ebooks/chem_tieng_anh_bino.epub",
                TotalChapters = extractedChapters.Count,
                IsPublished = true,
                CreatedAt = DateTime.UtcNow
            };
        }

        book.Title = "Giao Tiếp Thực Chiến: Phản Xạ Tiếng Anh Tức Thì";
        book.Author = "Vũ Bảo Software";
        book.CoverImageUrl = "/images/bino/page15.jpg";
        book.PdfFileUrl = "/ebooks/chem_tieng_anh_bino.pdf";
        book.EpubFileUrl = "/ebooks/chem_tieng_anh_bino.epub";
        book.TotalChapters = extractedChapters.Count;
        book.Description = $"Hệ thống {extractedChapters.Count} chương, {extractedChapters.Sum(c => c.dialogues.Count)} bài hội thoại giao tiếp đời thực kèm luyện nói đóng vai 1:1, audio thụ động, biến hóa mẫu câu và Góc Tư Duy VBace — Độc quyền bởi Vũ Bảo Software.";

        // Remove any excess chapters > extractedChapters.Count
        var excessChapters = book.Chapters.Where(c => c.ChapterNumber > extractedChapters.Count).ToList();
        foreach (var exCh in excessChapters)
        {
            _unitOfWork.BinoBooks.RemoveChapter(exCh);
            book.Chapters.Remove(exCh);
        }

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
                    Title = !string.IsNullOrWhiteSpace(chModel.bonusTitle)
                        ? chModel.bonusTitle
                        : $"Mẫu Câu Mở Rộng & VBace's Mindset - Chương {chModel.number:D2}",
                    ContentHtml = !string.IsNullOrWhiteSpace(chModel.bonusContentHtml)
                        ? chModel.bonusContentHtml
                        : $"<p>Chào bạn! Khi giao tiếp chủ đề <strong>{chModel.titleVi}</strong>, hãy bỏ túi ngay các từ khóa và mẫu câu phản xạ tự nhiên dưới đây!</p>",
                    SlangListJson = chModel.bonusSlangs != null && chModel.bonusSlangs.Any()
                        ? JsonSerializer.Serialize(chModel.bonusSlangs)
                        : JsonSerializer.Serialize(chModel.dialogues.SelectMany(d => d.vocabularies.Take(2)).Select(v => v.word).Distinct().ToList())
                };
            }
            else
            {
                if (!string.IsNullOrWhiteSpace(chModel.bonusTitle))
                    chapter.Bonus.Title = chModel.bonusTitle;
                if (!string.IsNullOrWhiteSpace(chModel.bonusContentHtml))
                    chapter.Bonus.ContentHtml = chModel.bonusContentHtml;
                if (chModel.bonusSlangs != null && chModel.bonusSlangs.Any())
                    chapter.Bonus.SlangListJson = JsonSerializer.Serialize(chModel.bonusSlangs);
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
                dialogue.SituationDescription = chModel.number == 12
                    ? $"Bài {dModel.number}: {dModel.title} (Trang {dModel.startPage} • Giáo trình VBace - Luyện giải nghĩa đồ vật bằng tiếng Anh & đặt câu)."
                    : $"Hội thoại {dModel.number}: {dModel.title} (Trang {dModel.startPage} • Giáo trình Giao Tiếp Thực Chiến VBace).";
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
            Message = $"Đồng bộ thành công {chCount} chương, {dCount} bài học, {vCount} từ vựng và {lCount} câu thoại Giáo trình Giao Tiếp Thực Chiến VBace!"
        };

        return Response<SyncEpubResultDto>.SuccessResult(resultDto.Message, resultDto);
    }

    #region Models for JSON parsing
    private class ExtractedChapterModel
    {
        public int number { get; set; }
        public string title { get; set; } = string.Empty;
        public string titleVi { get; set; } = string.Empty;
        public int startPage { get; set; }
        public string? bonusTitle { get; set; }
        public string? bonusContentHtml { get; set; }
        public List<string>? bonusSlangs { get; set; }
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
