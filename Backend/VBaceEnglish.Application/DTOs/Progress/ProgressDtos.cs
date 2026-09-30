namespace VBaceEnglish.Application.DTOs.Progress;

public class UserProgressDto
{
    public int PartNumber { get; set; }
    public int QuestionNumber { get; set; }
    public bool? IsConfident { get; set; }
    public bool IsRevealed { get; set; }
    public string? SelectedAnswer { get; set; }
}

public class MarkProgressDto
{
    public int ToeicTestId { get; set; }
    public int PartNumber { get; set; }
    public int QuestionNumber { get; set; }
    public bool? IsConfident { get; set; }
    public bool? IsRevealed { get; set; }
    public string? SelectedAnswer { get; set; }
}

public class ResetPartProgressDto
{
    public int ToeicTestId { get; set; }
    public int PartNumber { get; set; } // 0 = all parts
}

public class TestSummaryDto
{
    public int ToeicTestId { get; set; }
    public string TestId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int CompletedQuestions { get; set; }
    public int ConfidentQuestions { get; set; }
    public int TotalQuestions { get; set; }
    public double PercentCompleted { get; set; }
    public DateTime LastAccessedAt { get; set; }
}

public class UnsureQuestionDto
{
    public int ToeicTestId { get; set; }
    public string TestCode { get; set; } = string.Empty;
    public string TestTitle { get; set; } = string.Empty;
    public int PartNumber { get; set; }
    public int QuestionNumber { get; set; }
    public string? QuestionText { get; set; }
    public string? Translation { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UserReflexProgressDto
{
    public int MasteredCount { get; set; }
    public int StarredCount { get; set; }
    public int WeakCount { get; set; }
    public int LastStudiedUnit { get; set; } = 1;
    public int DailyGoal { get; set; } = 30;
    public string ProgressDataJson { get; set; } = "{}";
    public DateTime UpdatedAt { get; set; }
}

public class UpsertReflexProgressDto
{
    public int MasteredCount { get; set; }
    public int StarredCount { get; set; }
    public int WeakCount { get; set; }
    public int LastStudiedUnit { get; set; } = 1;
    public int DailyGoal { get; set; } = 30;
    public string ProgressDataJson { get; set; } = "{}";
}

public class UserEbookProgressDto
{
    public string BookSlug { get; set; } = string.Empty;
    public string? LastCfi { get; set; }
    public string BookmarksJson { get; set; } = "[]";
    public DateTime UpdatedAt { get; set; }
}

public class UpsertEbookProgressDto
{
    public string BookSlug { get; set; } = "chem-tieng-anh-khong-can-dong-nao";
    public string? LastCfi { get; set; }
    public string BookmarksJson { get; set; } = "[]";
}

public class UserVocabProgressDto
{
    public int MasteredCount { get; set; }
    public int StarredCount { get; set; }
    public int LastStudiedTopic { get; set; } = 1;
    public string ProgressDataJson { get; set; } = "{}";
    public DateTime UpdatedAt { get; set; }
}

public class UpsertVocabProgressDto
{
    public int MasteredCount { get; set; }
    public int StarredCount { get; set; }
    public int LastStudiedTopic { get; set; } = 1;
    public string ProgressDataJson { get; set; } = "{}";
}

public class CompetenceDomainDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public double Percentage { get; set; }
    public string LevelLabel { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string NextMilestoneTip { get; set; } = string.Empty;
    public int TargetWordCount { get; set; }
}

public class CompetenceRadarDto
{
    public double OverallPercentage { get; set; }
    public double DailyGainPercentage { get; set; }
    public int MasteredWords { get; set; }
    public int MasteredReflexSentences { get; set; }
    public int CompletedBinoLessons { get; set; }
    public int CompletedToeicQuestions { get; set; }
    public string BinoMascotMessage { get; set; } = string.Empty;
    public string RecommendedFocusDomain { get; set; } = string.Empty;
    public List<CompetenceDomainDto> Domains { get; set; } = new();
}

public class MemoryShieldDto
{
    public int TotalLearnedWords { get; set; }
    public double HealthPercentage { get; set; }
    public double ProjectedTomorrowPercentage { get; set; }
    public double DecayDeltaPercentage { get; set; }
    public int SolidWordsCount { get; set; }
    public int FadingWordsCount { get; set; }
    public int CriticalWordsCount { get; set; }
    public int EstimatedReviewMinutes { get; set; }
    public string TierCode { get; set; } = "Pristine"; // Pristine | Stable | Decaying
    public string TierLabel { get; set; } = "Trí nhớ đang KHỎE";
    public string StatusMessage { get; set; } = string.Empty;
    public string WarningBanner { get; set; } = string.Empty;
}
