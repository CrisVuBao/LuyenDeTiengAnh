namespace VBaceEnglish.Application.DTOs.Bino;

public class BinoBookDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? PdfFileUrl { get; set; }
    public string? EpubFileUrl { get; set; }
    public int TotalChapters { get; set; }
    public int CompletedLessonsCount { get; set; }
    public int TotalLessonsCount { get; set; }
    public int CompletedLessons => CompletedLessonsCount;
    public int TotalLessons => TotalLessonsCount;
    public double ProgressPercentage { get; set; }
    public List<ChapterSummaryDto> Chapters { get; set; } = new();
}

public class ChapterSummaryDto
{
    public int Id { get; set; }
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public string? Description { get; set; }
    public int TotalLessons { get; set; } = 6;
    public int CompletedLessons { get; set; } = 0;
    public bool HasBonus { get; set; } = true;
    public List<DialogueLessonSummaryDto> Dialogues { get; set; } = new();
}

public class ChapterBonusDto
{
    public int Id { get; set; }
    public int ChapterId { get; set; }
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ContentHtml { get; set; }
    public string? AudioUrl { get; set; }
    public List<string> SlangList { get; set; } = new();
}

public class DialogueLessonSummaryDto
{
    public int Id { get; set; }
    public int ChapterNumber { get; set; }
    public int DialogueNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public string? SituationDescription { get; set; }
    public string? VideoUrl { get; set; }
    public string? AudioUrl { get; set; }
    public int DurationSeconds { get; set; }
    public int VocabularyCount { get; set; }
    public bool IsCompleted { get; set; }
    public bool HasWatchedVideo { get; set; }
    public bool RoleplayCompleted { get; set; }
    public int? DictationScore { get; set; }
    public int TimeSpentSeconds { get; set; }
    public DateTime? LastAccessedAt { get; set; }
}

public class DialogueLessonDetailDto
{
    public int Id { get; set; }
    public int ChapterId { get; set; }
    public int ChapterNumber { get; set; }
    public string ChapterTitle { get; set; } = string.Empty;
    public string? ChapterTitleVi { get; set; }
    public int DialogueNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public string? SituationDescription { get; set; }
    public string? VideoUrl { get; set; }
    public string? AudioUrl { get; set; }
    public int DurationSeconds { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool IsCompleted { get; set; }
    public bool HasWatchedVideo { get; set; }
    public bool RoleplayCompleted { get; set; }
    public int? DictationScore { get; set; }
    public int TimeSpentSeconds { get; set; }

    public List<DialogueVocabularyDto> Vocabularies { get; set; } = new();
    public List<DialogueLineDto> DialogueLines { get; set; } = new();
}

public class DialogueVocabularyDto
{
    public int Id { get; set; }
    public string Word { get; set; } = string.Empty;
    public string? Phonetic { get; set; }
    public string? WordType { get; set; }
    public string Meaning { get; set; } = string.Empty;
    public string? ExampleSentence { get; set; }
    public string? AudioPronunciationUrl { get; set; }
    public int OrderIndex { get; set; }
    public bool IsInFlashcards { get; set; }
}

public class DialogueLineDto
{
    public int Id { get; set; }
    public string CharacterName { get; set; } = string.Empty;
    public string EnglishText { get; set; } = string.Empty;
    public string? VietnameseText { get; set; }
    public int OrderIndex { get; set; }
    public int? AudioStartTimeMs { get; set; }
    public int? AudioEndTimeMs { get; set; }
    public bool IsUserRole { get; set; }
}

public class MarkDialogueProgressDto
{
    public int DialogueLessonId { get; set; }
    public bool? IsCompleted { get; set; }
    public bool? HasWatchedVideo { get; set; }
    public bool? RoleplayCompleted { get; set; }
    public int? DictationScore { get; set; }
    public int TimeSpentSeconds { get; set; }
}

public class ResetBinoProgressDto
{
    public int? ChapterNumber { get; set; }
}

public class AddSrsWordRequestDto
{
    public int VocabularyId { get; set; }
}

public class SubmitSrsReviewDto
{
    public int VocabularyId { get; set; }
    public int Grade { get; set; } // 0 = Forgot, 1 = Hard, 2 = Good, 3 = Easy
}

public class SrsCardDto
{
    public int Id { get; set; }
    public int VocabularyId { get; set; }
    public string Word { get; set; } = string.Empty;
    public string? Phonetic { get; set; }
    public string? WordType { get; set; }
    public string Meaning { get; set; } = string.Empty;
    public string? ExampleSentence { get; set; }
    public string ChapterTitle { get; set; } = string.Empty;
    public string DialogueTitle { get; set; } = string.Empty;
    public int IntervalDays { get; set; }
    public int ConsecutiveCorrect { get; set; }
    public DateTime NextReviewDate { get; set; }
}

public class PlaylistDialogueDto
{
    public int Id { get; set; }
    public int ChapterId { get; set; }
    public int ChapterNumber { get; set; }
    public string ChapterTitle { get; set; } = string.Empty;
    public string? ChapterTitleVi { get; set; }
    public int DialogueNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public string? SituationDescription { get; set; }
    public string? AudioUrl { get; set; }
    public bool IsCompleted { get; set; }
    public List<DialogueLineDto> DialogueLines { get; set; } = new();
}

public class BinoStudyProgressSummaryDto
{
    public int TotalChapters { get; set; }
    public int CompletedChapters { get; set; }
    public int TotalLessons { get; set; }
    public int CompletedLessons { get; set; }
    public int InProgressLessons { get; set; }
    public double ProgressPercentage { get; set; }
    public int AudioListenedCount { get; set; }
    public int RoleplayCompletedCount { get; set; }
    public int DictationPracticedCount { get; set; }
    public double AverageDictationScore { get; set; }
    public int TotalTimeSpentSeconds { get; set; }
    public int TotalTimeSpentMinutes { get; set; }
    public int TotalBookVocabularies { get; set; }
    public int SavedFlashcardsCount { get; set; }
    public int MasteredFlashcardsCount { get; set; }
    public int DueFlashcardsCount { get; set; }
    public int TotalSrsReviewsCount { get; set; }
    public int CurrentStreakDays { get; set; }
    public List<BinoChapterProgressDto> ChaptersProgress { get; set; } = new();
    public List<BinoDialogueProgressItemDto> RecentStudiedDialogues { get; set; } = new();
}

public class BinoChapterProgressDto
{
    public int ChapterId { get; set; }
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public int TotalLessons { get; set; }
    public int CompletedLessons { get; set; }
    public int AudioListenedCount { get; set; }
    public int RoleplayCount { get; set; }
    public int DictationCount { get; set; }
    public int TotalVocabCount { get; set; }
    public int SavedVocabCount { get; set; }
    public int TimeSpentSeconds { get; set; }
    public double ProgressPercent { get; set; }
    public DateTime? LastAccessedAt { get; set; }
    public List<BinoDialogueProgressItemDto> Dialogues { get; set; } = new();
}

public class BinoDialogueProgressItemDto
{
    public int DialogueLessonId { get; set; }
    public int ChapterNumber { get; set; }
    public string ChapterTitle { get; set; } = string.Empty;
    public string? ChapterTitleVi { get; set; }
    public int DialogueNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public int VocabularyCount { get; set; }
    public int SavedVocabularyCount { get; set; }
    public int LinesCount { get; set; }
    public bool IsCompleted { get; set; }
    public bool HasWatchedVideo { get; set; }
    public bool RoleplayCompleted { get; set; }
    public int? DictationScore { get; set; }
    public int TimeSpentSeconds { get; set; }
    public DateTime? LastAccessedAt { get; set; }
}
