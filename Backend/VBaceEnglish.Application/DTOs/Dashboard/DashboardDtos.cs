using VBaceEnglish.Application.DTOs.Progress;

namespace VBaceEnglish.Application.DTOs.Dashboard;

public class DashboardStatsDto
{
    public int TotalTests { get; set; }
    public int TotalQuestionsLearned { get; set; }
    public int TotalConfidentQuestions { get; set; }
    public double OverallMasteryRate { get; set; }
    public int CurrentStreakDays { get; set; }
    public int BinoCompletedLessons { get; set; }
    public int BinoTotalLessons { get; set; } = 72;
    public double BinoProgressPercent { get; set; }
    public int BinoSavedFlashcards { get; set; }
    public int BinoTimeSpentMinutes { get; set; }
    public List<TestSummaryDto> RecentTests { get; set; } = new();
}

public class AdminDashboardStatsDto
{
    public int TotalStudents { get; set; }
    public int ApprovedStudentsCount { get; set; }
    public int PendingStudentsCount { get; set; }
    public int TotalTests { get; set; }
    public int TotalQuestions { get; set; }
    public int TotalStudyInteractions { get; set; }
    public int TotalBinoDialogues { get; set; } = 72;
    public int TotalBinoCompletedLessons { get; set; }
    public List<AdminStudentProgressDto> RecentStudents { get; set; } = new();
}

public class AdminStudentProgressDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsApproved { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int TestsEnrolled { get; set; }
    public int CompletedQuestions { get; set; }
    public int ConfidentQuestions { get; set; }
    public double MasteryRate { get; set; }
    public int BinoCompletedLessons { get; set; }
    public int BinoTotalLessons { get; set; } = 72;
    public double BinoProgressPercent { get; set; }
    public int BinoSavedFlashcards { get; set; }
    public int BinoTimeSpentMinutes { get; set; }
}

public class ApproveStudentRequestDto
{
    public int UserId { get; set; }
    public bool IsApproved { get; set; }
}
