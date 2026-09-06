namespace VBaceEnglish.Domain.Models;

public class UserStudyProgress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public int ToeicTestId { get; set; }
    public ToeicTest ToeicTest { get; set; } = null!;

    public int PartNumber { get; set; } // 1..7
    public int QuestionNumber { get; set; }

    public bool? IsConfident { get; set; } // null = unselected, true = nhớ rồi, false = chưa chắc
    public bool IsRevealed { get; set; } = false;
    public string? SelectedAnswer { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class UserTestSummary
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public int ToeicTestId { get; set; }
    public ToeicTest ToeicTest { get; set; } = null!;

    public int CompletedQuestions { get; set; } = 0;
    public int ConfidentQuestions { get; set; } = 0;
    public int TotalQuestions { get; set; } = 0;
    public double PercentCompleted { get; set; } = 0.0;
    public DateTime LastAccessedAt { get; set; } = DateTime.UtcNow;
}

public class AiChatHistory
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public int? QuestionNumber { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

