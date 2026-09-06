namespace VBaceEnglish.Domain.Models;

public class BinoBook
{
    public int Id { get; set; }
    public string Title { get; set; } = "Chém Tiếng Anh không cần động não";
    public string Author { get; set; } = "Bino";
    public string Slug { get; set; } = "chem-tieng-anh-khong-can-dong-nao";
    public string? Description { get; set; } = "Học giao tiếp tiếng Anh tự nhiên, phản xạ 'không cần động não' với 12 chương và hơn 70 bài hội thoại thực tế của Bino.";
    public string? CoverImageUrl { get; set; }
    public string? PdfFileUrl { get; set; }
    public string? EpubFileUrl { get; set; }
    public int TotalChapters { get; set; } = 12;
    public bool IsPublished { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
}

public class Chapter
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public BinoBook Book { get; set; } = null!;

    public int ChapterNumber { get; set; } // 1..12
    public string Title { get; set; } = string.Empty; // e.g. "Greetings and Introductions"
    public string? TitleVi { get; set; } // e.g. "Chào hỏi và Làm quen"
    public string? Description { get; set; }
    public int OrderIndex { get; set; } = 0;

    public ChapterBonus? Bonus { get; set; }
    public ICollection<DialogueLesson> DialogueLessons { get; set; } = new List<DialogueLesson>();
}

public class ChapterBonus
{
    public int Id { get; set; }
    public int ChapterId { get; set; }
    public Chapter Chapter { get; set; } = null!;

    public string Title { get; set; } = "Góc Tiếng Lóng & Mẹo Văn Hóa";
    public string? ContentHtml { get; set; }
    public string? AudioUrl { get; set; }
    public string? SlangListJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class DialogueLesson
{
    public int Id { get; set; }
    public int ChapterId { get; set; }
    public Chapter Chapter { get; set; } = null!;

    public int DialogueNumber { get; set; } // 1..6
    public string Title { get; set; } = string.Empty; // e.g. "At Bino's New Friend's Party"
    public string? TitleVi { get; set; }
    public string? SituationDescription { get; set; }
    public string? VideoUrl { get; set; } // MP4 video file
    public string? AudioUrl { get; set; } // MP3 audio file
    public int DurationSeconds { get; set; } = 0;
    public string? ThumbnailUrl { get; set; }
    public int OrderIndex { get; set; } = 0;

    public ICollection<DialogueVocabulary> Vocabularies { get; set; } = new List<DialogueVocabulary>();
    public ICollection<DialogueLine> DialogueLines { get; set; } = new List<DialogueLine>();
    public ICollection<UserDialogueProgress> UserProgresses { get; set; } = new List<UserDialogueProgress>();
}

public class DialogueVocabulary
{
    public int Id { get; set; }
    public int DialogueLessonId { get; set; }
    public DialogueLesson DialogueLesson { get; set; } = null!;

    public string Word { get; set; } = string.Empty; // e.g. "Make it", "Vibe"
    public string? Phonetic { get; set; } // e.g. "/vaɪb/"
    public string? WordType { get; set; } // e.g. "idiom", "n", "v", "adj"
    public string Meaning { get; set; } = string.Empty; // e.g. "Làm được", "Không khí"
    public string? ExampleSentence { get; set; }
    public string? AudioPronunciationUrl { get; set; }
    public int OrderIndex { get; set; } = 0;

    public ICollection<UserSRSReview> SRSReviews { get; set; } = new List<UserSRSReview>();
}

public class DialogueLine
{
    public int Id { get; set; }
    public int DialogueLessonId { get; set; }
    public DialogueLesson DialogueLesson { get; set; } = null!;

    public string CharacterName { get; set; } = string.Empty; // "BINO", "NEW FRIEND", "RACHEL", "JEREMY"
    public string EnglishText { get; set; } = string.Empty;
    public string? VietnameseText { get; set; }
    public int OrderIndex { get; set; } = 0;
    public int? AudioStartTimeMs { get; set; } // for karaoke sync
    public int? AudioEndTimeMs { get; set; }
    public bool IsUserRole { get; set; } = false; // can be picked for user roleplay
}

public class UserDialogueProgress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public int DialogueLessonId { get; set; }
    public DialogueLesson DialogueLesson { get; set; } = null!;

    public bool IsCompleted { get; set; } = false;
    public bool HasWatchedVideo { get; set; } = false;
    public bool RoleplayCompleted { get; set; } = false;
    public int? DictationScore { get; set; } // 0..100
    public int TimeSpentSeconds { get; set; } = 0;
    public DateTime LastAccessedAt { get; set; } = DateTime.UtcNow;
}

public class UserSRSReview
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public int VocabularyId { get; set; }
    public DialogueVocabulary Vocabulary { get; set; } = null!;

    public double EaseFactor { get; set; } = 2.5; // SM-2 default
    public int IntervalDays { get; set; } = 1;
    public int ConsecutiveCorrect { get; set; } = 0;
    public DateTime NextReviewDate { get; set; } = DateTime.UtcNow;
    public int ReviewCount { get; set; } = 0;
    public DateTime? LastReviewedAt { get; set; }
}
