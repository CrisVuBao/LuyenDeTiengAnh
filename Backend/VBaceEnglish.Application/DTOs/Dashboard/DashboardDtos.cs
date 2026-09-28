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
    public string Role { get; set; } = "Student";
    public bool IsApproved { get; set; }
    public bool IsLocked { get; set; }
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
    public int VocabMasteredWords { get; set; }
    public int TotalXp { get; set; }
    public int Level { get; set; } = 1;
    public int StreakDays { get; set; }
}

public class ApproveStudentRequestDto
{
    public int UserId { get; set; }
    public bool IsApproved { get; set; }
}

public class CreateStudentRequestDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Password { get; set; } = string.Empty;
    public bool IsApproved { get; set; } = true;
    public string Role { get; set; } = "Student";
}

public class UpdateStudentRequestDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsApproved { get; set; }
    public bool IsLocked { get; set; }
    public string Role { get; set; } = "Student";
}

public class AdminResetPasswordDto
{
    public string NewPassword { get; set; } = string.Empty;
}

public class AdminAdjustGamificationDto
{
    public int BonusXp { get; set; }
    public string Reason { get; set; } = "Thưởng từ Quản trị viên";
    public int? RestoreStreakDays { get; set; }
}

public class StudentDetailProfileDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "Student";
    public bool IsApproved { get; set; }
    public bool IsLocked { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    // Gamification
    public int Level { get; set; } = 1;
    public string LevelTitle { get; set; } = "Tân binh";
    public int TotalXp { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public int TotalDaysStudied { get; set; }
    public List<string> Badges { get; set; } = new();

    // TOEIC
    public int ToeicTestsCount { get; set; }
    public int ToeicCompletedQuestions { get; set; }
    public int ToeicConfidentQuestions { get; set; }
    public double ToeicMasteryRate { get; set; }
    public List<TestSummaryDto> ToeicSummaries { get; set; } = new();

    // Bino
    public int BinoCompletedLessons { get; set; }
    public int BinoTotalLessons { get; set; } = 72;
    public double BinoProgressPercent { get; set; }
    public int BinoSavedFlashcards { get; set; }
    public int BinoTimeSpentMinutes { get; set; }

    // Vocab 3000
    public int VocabMasteredWords { get; set; }
    public int VocabStarredWords { get; set; }
    public int VocabLastStudiedTopic { get; set; } = 1;

    // Reflex 50
    public int ReflexUnitsDone { get; set; }
}
