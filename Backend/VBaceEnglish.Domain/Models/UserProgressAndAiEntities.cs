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

/// <summary>
/// Tiến độ học và luyện phản xạ 50 Chủ đề (1500 câu) được lưu vĩnh viễn trên SQL Server theo từng tài khoản
/// </summary>
public class UserReflexProgress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public int MasteredCount { get; set; } = 0;
    public int StarredCount { get; set; } = 0;
    public int WeakCount { get; set; } = 0;
    public int LastStudiedUnit { get; set; } = 1;
    public int DailyGoal { get; set; } = 30;

    /// <summary>
    /// Toàn bộ chi tiết (masteredIds, starredIds, weakIds, writingHistory, speakingHistory, dailyLog)
    /// </summary>
    public string ProgressDataJson { get; set; } = "{}";

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Vị trí đọc sách (CFI) và danh sách dấu trang (Bookmarks) được lưu vĩnh viễn trên SQL Server theo từng tài khoản
/// </summary>
public class UserEbookProgress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public string BookSlug { get; set; } = "chem-tieng-anh-khong-can-dong-nao";
    public string? LastCfi { get; set; }
    public string BookmarksJson { get; set; } = "[]";

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

