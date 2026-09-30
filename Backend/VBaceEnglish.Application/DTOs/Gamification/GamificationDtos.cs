namespace VBaceEnglish.Application.DTOs.Gamification;

public class GamificationProfileDto
{
    public int TotalXP { get; set; }
    public int CurrentLevel { get; set; }
    public string LevelTitle { get; set; } = string.Empty;
    public int XPForNextLevel { get; set; }
    public double XPProgressPercentage { get; set; }
    public int WeeklyXP { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public int StreakFreezeCount { get; set; }
    public bool HasStudiedToday { get; set; }
    public string StreakStatus { get; set; } = "at_risk";
    public List<string> ActiveDates { get; set; } = new();
    public List<string> UnlockedBadges { get; set; } = new();
    public List<DailyQuestDto> DailyQuests { get; set; } = new();
    public int LeaderboardRank { get; set; }
}

public class DailyQuestDto
{
    public string QuestId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int TargetCount { get; set; }
    public int CurrentCount { get; set; }
    public int XPReward { get; set; }
    public bool IsCompleted { get; set; }
    public string QuestType { get; set; } = string.Empty;
}

public class AddXPRequestDto
{
    public int Amount { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class LeaderboardEntryDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int WeeklyXP { get; set; }
    public int TotalXP { get; set; }
    public int CurrentLevel { get; set; }
    public string LevelTitle { get; set; } = string.Empty;
    public int Rank { get; set; }
    public int CurrentStreak { get; set; }
}

public class AchievementDto
{
    public string BadgeId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public DateTime? UnlockedAt { get; set; }
    public bool IsUnlocked { get; set; }
}
