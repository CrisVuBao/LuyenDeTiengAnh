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
    Task<Response<BinoStudyProgressSummaryDto>> GetUserStudyProgressSummaryAsync(int userId);
    Task<Response<bool>> ResetUserBinoProgressAsync(int userId, int? chapterNumber);
    Task<Response<bool>> AddWordToSRSAsync(int userId, int vocabularyId);
    Task<Response<bool>> RemoveWordFromSRSAsync(int userId, int vocabularyId);
    Task<Response<IEnumerable<SrsCardDto>>> GetDueSRSCardsAsync(int userId);
    Task<Response<IEnumerable<SrsCardDto>>> GetAllSRSCardsAsync(int userId);
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

/// <summary>
/// BinoBookService (Facade / Core):
/// Được phân rã thành các partial classes chuyên trách:
/// - BinoBookService.Dialogue.cs: Chi tiết bài học, phát playlist, đánh dấu & thống kê tiến độ
/// - BinoBookService.SRS.cs: Thuật toán FSRS lặp lại ngắt quãng, chấm điểm ôn tập Flashcard
/// - BinoBookService.Admin.cs: Cổng quản trị CMS chương, bài học và từ vựng
/// - BinoBookService.Sync.cs: Trình phân tích & đồng bộ dữ liệu thật từ EPUB
/// </summary>
public partial class BinoBookService : IBinoBookService
{
    private readonly IUnitOfWork _unitOfWork;

    public BinoBookService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    private static string SanitizeBrandText(string? input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        return input
            .Replace("Chém Tiếng Anh không cần động não", "Giao Tiếp Thực Chiến: Phản Xạ Tiếng Anh Tức Thì", StringComparison.OrdinalIgnoreCase)
            .Replace("BINO'S PHILOSOPHY", "VBACE'S MINDSET")
            .Replace("Bino's Philosophy", "VBace's Mindset")
            .Replace("Much love,<br/>\n                Bino", "Trân trọng,<br/>\n                Vũ Bảo Software (VBace)")
            .Replace("Practise speaking with Bino (Thực hành nói cùng Bino)", "Practise speaking with Leo (Thực hành nói phản xạ cùng Leo)")
            .Replace("trong sách TiengAnhBi", "• Giáo trình Giao Tiếp Thực Chiến VBace")
            .Replace("TiengAnhBi.epub", "VBaceFlow.epub")
            .Replace("Bino's", "Leo's")
            .Replace("BINO", "LEO")
            .Replace("Bino", "Leo");
    }

    public async Task<Response<BinoBookDto>> GetBookOverviewAsync(int userId, string slug = "chem-tieng-anh-khong-can-dong-nao")
    {
        var book = await _unitOfWork.BinoBooks.GetBookWithChaptersAsync(slug);
        if (book == null)
            return Response<BinoBookDto>.Failure("Không tìm thấy sách.");

        var userProgresses = (await _unitOfWork.BinoLearning.GetProgressByUserAsync(userId)).ToList();
        var progressMap = userProgresses.ToDictionary(p => p.DialogueLessonId, p => p);

        var totalLessons = 0;
        var completedLessons = 0;

        var chapterDtos = new List<ChapterSummaryDto>();
        foreach (var c in book.Chapters.OrderBy(ch => ch.ChapterNumber))
        {
            var dialogues = new List<DialogueLessonSummaryDto>();
            var chapterCompletedCount = 0;

            foreach (var d in c.DialogueLessons.OrderBy(dl => dl.DialogueNumber))
            {
                totalLessons++;
                progressMap.TryGetValue(d.Id, out var prog);
                var isDone = prog?.IsCompleted ?? false;
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
                    Title = SanitizeBrandText(d.Title),
                    TitleVi = SanitizeBrandText(d.TitleVi),
                    SituationDescription = SanitizeBrandText(d.SituationDescription),
                    VideoUrl = d.VideoUrl,
                    AudioUrl = d.AudioUrl,
                    DurationSeconds = d.DurationSeconds,
                    VocabularyCount = d.Vocabularies.Count,
                    IsCompleted = isDone,
                    HasWatchedVideo = prog?.HasWatchedVideo ?? false,
                    RoleplayCompleted = prog?.RoleplayCompleted ?? false,
                    DictationScore = prog?.DictationScore,
                    TimeSpentSeconds = prog?.TimeSpentSeconds ?? 0,
                    LastAccessedAt = prog?.LastAccessedAt
                });
            }

            chapterDtos.Add(new ChapterSummaryDto
            {
                Id = c.Id,
                ChapterNumber = c.ChapterNumber,
                Title = SanitizeBrandText(c.Title),
                TitleVi = SanitizeBrandText(c.TitleVi),
                Description = SanitizeBrandText(c.Description),
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
            Title = book.Title.Contains("Chém", StringComparison.OrdinalIgnoreCase)
                ? "Giao Tiếp Thực Chiến: Phản Xạ Tiếng Anh Tức Thì"
                : SanitizeBrandText(book.Title),
            Author = book.Author.Equals("Bino", StringComparison.OrdinalIgnoreCase)
                ? "Vũ Bảo Software"
                : SanitizeBrandText(book.Author),
            Slug = book.Slug,
            Description = (book.Description != null && book.Description.Contains("Bino", StringComparison.OrdinalIgnoreCase))
                ? "Hệ thống 12 chương, 72 bài hội thoại giao tiếp đời thực kèm luyện nói đóng vai 1:1, audio thụ động, biến hóa mẫu câu và Góc Tư Duy VBace — Độc quyền bởi Vũ Bảo Software."
                : SanitizeBrandText(book.Description),
            CoverImageUrl = book.CoverImageUrl,
            PdfFileUrl = book.PdfFileUrl,
            EpubFileUrl = book.EpubFileUrl,
            TotalChapters = book.TotalChapters,
            CompletedLessonsCount = completedLessons,
            TotalLessonsCount = totalLessons,
            ProgressPercentage = percent,
            Chapters = chapterDtos
        };

        return Response<BinoBookDto>.SuccessResult("Lấy thông tin giáo trình thành công", dto);
    }

    public async Task<Response<ChapterDetailDto>> GetChapterDetailAsync(int userId, int chapterNumber)
    {
        var chapter = await _unitOfWork.BinoBooks.GetChapterWithLessonsAsync(chapterNumber);
        if (chapter == null)
            return Response<ChapterDetailDto>.Failure("Không tìm thấy chương.");

        var userProgresses = (await _unitOfWork.BinoLearning.GetProgressByUserAsync(userId)).ToList();
        var progressMap = userProgresses.ToDictionary(p => p.DialogueLessonId, p => p);

        var dialogues = chapter.DialogueLessons.OrderBy(d => d.DialogueNumber).Select(d =>
        {
            progressMap.TryGetValue(d.Id, out var prog);
            return new DialogueLessonSummaryDto
            {
                Id = d.Id,
                ChapterNumber = chapter.ChapterNumber,
                DialogueNumber = d.DialogueNumber,
                Title = SanitizeBrandText(d.Title),
                TitleVi = SanitizeBrandText(d.TitleVi),
                SituationDescription = SanitizeBrandText(d.SituationDescription),
                VideoUrl = d.VideoUrl,
                AudioUrl = d.AudioUrl,
                DurationSeconds = d.DurationSeconds,
                VocabularyCount = d.Vocabularies.Count,
                IsCompleted = prog?.IsCompleted ?? false,
                HasWatchedVideo = prog?.HasWatchedVideo ?? false,
                RoleplayCompleted = prog?.RoleplayCompleted ?? false,
                DictationScore = prog?.DictationScore,
                TimeSpentSeconds = prog?.TimeSpentSeconds ?? 0,
                LastAccessedAt = prog?.LastAccessedAt
            };
        }).ToList();

        var dto = new ChapterDetailDto
        {
            Id = chapter.Id,
            ChapterNumber = chapter.ChapterNumber,
            Title = SanitizeBrandText(chapter.Title),
            TitleVi = SanitizeBrandText(chapter.TitleVi),
            Description = SanitizeBrandText(chapter.Description),
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
            Title = SanitizeBrandText(bonus.Title),
            ContentHtml = SanitizeBrandText(bonus.ContentHtml),
            AudioUrl = bonus.AudioUrl,
            SlangList = slangList
        };

        return Response<ChapterBonusDto>.SuccessResult("Lấy nội dung bổ sung thành công", dto);
    }
}
