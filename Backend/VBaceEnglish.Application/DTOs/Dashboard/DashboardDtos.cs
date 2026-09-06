using VBaceEnglish.Application.DTOs.Progress;

namespace VBaceEnglish.Application.DTOs.Dashboard;

public class DashboardStatsDto
{
    public int TotalTests { get; set; }
    public int TotalQuestionsLearned { get; set; }
    public int TotalConfidentQuestions { get; set; }
    public double OverallMasteryRate { get; set; }
    public int CurrentStreakDays { get; set; }
    public List<TestSummaryDto> RecentTests { get; set; } = new();
}

