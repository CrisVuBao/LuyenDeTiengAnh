namespace VBaceEnglish.Application.DTOs.Bino;

public class AdminChapterDto
{
    public int Id { get; set; }
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public string? Description { get; set; }
    public int OrderIndex { get; set; }
    public int DialoguesCount { get; set; }
    public int VocabulariesCount { get; set; }
    public int LinesCount { get; set; }

    // Bonus info
    public string? BonusTitle { get; set; }
    public string? BonusContentHtml { get; set; }
    public string? BonusAudioUrl { get; set; }
    public List<string> BonusSlangs { get; set; } = new();

    public List<AdminDialogueSummaryDto> Dialogues { get; set; } = new();
}

public class AdminDialogueSummaryDto
{
    public int Id { get; set; }
    public int DialogueNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public string? SituationDescription { get; set; }
    public string? VideoUrl { get; set; }
    public string? AudioUrl { get; set; }
    public int DurationSeconds { get; set; }
    public int OrderIndex { get; set; }
    public int VocabulariesCount { get; set; }
    public int LinesCount { get; set; }
}

public class AdminDialogueDetailDto
{
    public int Id { get; set; }
    public int ChapterId { get; set; }
    public int ChapterNumber { get; set; }
    public string ChapterTitle { get; set; } = string.Empty;
    public int DialogueNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public string? SituationDescription { get; set; }
    public string? VideoUrl { get; set; }
    public string? AudioUrl { get; set; }
    public int DurationSeconds { get; set; }
    public int OrderIndex { get; set; }

    public List<AdminVocabularyItemDto> Vocabularies { get; set; } = new();
    public List<AdminDialogueLineItemDto> DialogueLines { get; set; } = new();
}

public class AdminVocabularyItemDto
{
    public int Id { get; set; }
    public string Word { get; set; } = string.Empty;
    public string? Phonetic { get; set; }
    public string? WordType { get; set; }
    public string Meaning { get; set; } = string.Empty;
    public string? ExampleSentence { get; set; }
    public string? AudioPronunciationUrl { get; set; }
    public int OrderIndex { get; set; }
}

public class AdminDialogueLineItemDto
{
    public int Id { get; set; }
    public string CharacterName { get; set; } = string.Empty;
    public string EnglishText { get; set; } = string.Empty;
    public string VietnameseText { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public int OrderIndex { get; set; }
    public bool IsUserRole { get; set; }
}

public class UpsertChapterDto
{
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public string? Description { get; set; }
    public int OrderIndex { get; set; }

    // Bonus details
    public string? BonusTitle { get; set; }
    public string? BonusContentHtml { get; set; }
    public string? BonusAudioUrl { get; set; }
    public List<string>? BonusSlangs { get; set; }
}

public class UpsertDialogueDto
{
    public int ChapterId { get; set; }
    public int DialogueNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public string? SituationDescription { get; set; }
    public string? VideoUrl { get; set; }
    public string? AudioUrl { get; set; }
    public int DurationSeconds { get; set; }
    public int OrderIndex { get; set; }

    public List<UpsertVocabularyItemDto> Vocabularies { get; set; } = new();
    public List<UpsertDialogueLineItemDto> DialogueLines { get; set; } = new();
}

public class UpsertVocabularyItemDto
{
    public int Id { get; set; } // 0 for new
    public string Word { get; set; } = string.Empty;
    public string? Phonetic { get; set; }
    public string? WordType { get; set; }
    public string Meaning { get; set; } = string.Empty;
    public string? ExampleSentence { get; set; }
    public string? AudioPronunciationUrl { get; set; }
    public int OrderIndex { get; set; }
}

public class UpsertDialogueLineItemDto
{
    public int Id { get; set; } // 0 for new
    public string CharacterName { get; set; } = string.Empty;
    public string EnglishText { get; set; } = string.Empty;
    public string VietnameseText { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public int OrderIndex { get; set; }
    public bool IsUserRole { get; set; }
}

public class SyncEpubResultDto
{
    public int ChaptersUpdated { get; set; }
    public int DialoguesUpdated { get; set; }
    public int VocabulariesUpdated { get; set; }
    public int LinesUpdated { get; set; }
    public string Message { get; set; } = string.Empty;
}
