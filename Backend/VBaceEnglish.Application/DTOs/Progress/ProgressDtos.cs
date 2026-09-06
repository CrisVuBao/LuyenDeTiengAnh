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

