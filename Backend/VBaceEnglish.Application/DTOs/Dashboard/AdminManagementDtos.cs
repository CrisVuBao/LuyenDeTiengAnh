namespace VBaceEnglish.Application.DTOs.Dashboard;

// ==========================================
// 1. NOTIFICATION DTOs
// ==========================================

public class NotificationItemDto
{
    public int Id { get; set; }
    public string? BatchId { get; set; }
    public string TargetScope { get; set; } = "Single";
    public string TargetLabel { get; set; } = string.Empty;
    public int? RecipientUserId { get; set; }
    public string? RecipientName { get; set; }
    public string? RecipientEmail { get; set; }
    public int? SenderUserId { get; set; }
    public string SenderName { get; set; } = "Hệ thống VBaceEnglish";
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "Announcement";
    public string? ActionUrl { get; set; }
    public string IconEmoji { get; set; } = "🔔";
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class SendNotificationRequestDto
{
    /// <summary>
    /// "All" (Tất cả học viên) | "Group" (Nhóm theo tiêu chí) | "Single" (1 học viên cụ thể)
    /// </summary>
    public string TargetScope { get; set; } = "All";

    /// <summary>
    /// ID học viên nếu TargetScope == "Single"
    /// </summary>
    public int? RecipientUserId { get; set; }

    /// <summary>
    /// Tiêu chí lọc nhóm nếu TargetScope == "Group"
    /// </summary>
    public NotificationGroupFilterDto? GroupFilter { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "Announcement";
    public string? ActionUrl { get; set; }
    public string IconEmoji { get; set; } = "📢";
    public int? ExpireDays { get; set; }
}

public class NotificationGroupFilterDto
{
    public int? MinLevel { get; set; }
    public int? MinStreak { get; set; }
    /// <summary>
    /// "all" | "approved" | "pending"
    /// </summary>
    public string ApprovalStatus { get; set; } = "all";
    /// <summary>
    /// Lọc học viên không hoạt động quá N ngày (0 hoặc null = bỏ qua)
    /// </summary>
    public int? InactiveDays { get; set; }
}

public class AdminSentNotificationBatchDto
{
    public string BatchKey { get; set; } = string.Empty;
    public int SampleId { get; set; }
    public string TargetScope { get; set; } = string.Empty;
    public string TargetLabel { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? ActionUrl { get; set; }
    public string IconEmoji { get; set; } = "🔔";
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int TotalRecipients { get; set; }
    public int ReadCount { get; set; }
    public double ReadRatePercent { get; set; }
}

public class AdminNotificationStatsDto
{
    public int TotalBatchesSent { get; set; }
    public int TotalIndividualDeliveries { get; set; }
    public int TotalReadCount { get; set; }
    public double AverageReadRatePercent { get; set; }
    public int SentLast7Days { get; set; }
    public string TopPerformingTitle { get; set; } = "Chưa có dữ liệu";
    public double TopPerformingReadRate { get; set; }
}

// ==========================================
// 2. SYSTEM SETTINGS DTOs
// ==========================================

public class SystemSettingItemDto
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}

public class UpdateSystemSettingsRequestDto
{
    public Dictionary<string, string> Settings { get; set; } = new();
}

public class SystemHealthAndInfoDto
{
    public string AppName { get; set; } = "VBaceEnglish";
    public string DotNetVersion { get; set; } = string.Empty;
    public string OsDescription { get; set; } = string.Empty;
    public string ServerTimeVietnam { get; set; } = string.Empty;
    public double UptimeHours { get; set; }
    public double MemoryUsedMb { get; set; }
    public int TotalDatabaseTables { get; set; }
    public int TotalDatabaseRows { get; set; }
    public int UploadedFilesCount { get; set; }
    public double UploadedFilesSizeMb { get; set; }
    public Dictionary<string, int> TableRowCounts { get; set; } = new();
    public List<MediaFileItemDto> MediaFiles { get; set; } = new();
}

public class MediaFileItemDto
{
    public string FileName { get; set; } = string.Empty;
    public string Folder { get; set; } = string.Empty;
    public string RelativeUrl { get; set; } = string.Empty;
    public double SizeKb { get; set; }
    public DateTime LastModifiedUtc { get; set; }
}

public class CleanupDataRequestDto
{
    public bool CleanOldNotifications { get; set; } = true;
    public int NotificationRetentionDays { get; set; } = 30;
    public bool CleanOldAiChats { get; set; } = true;
    public int AiChatRetentionDays { get; set; } = 30;
    public bool CleanOldActivityLogs { get; set; } = false;
    public int ActivityLogRetentionDays { get; set; } = 90;
}

public class CleanupDataResultDto
{
    public int DeletedNotifications { get; set; }
    public int DeletedAiChats { get; set; }
    public int DeletedActivityLogs { get; set; }
}

// ==========================================
// 3. ACTIVITY LOG (AUDIT LOG) DTOs
// ==========================================

public class AdminActivityLogDto
{
    public int Id { get; set; }
    public int? AdminUserId { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ActivityLogStatsDto
{
    public int TotalLogs { get; set; }
    public int TodayLogs { get; set; }
    public int StudentActionsCount { get; set; }
    public int NotificationActionsCount { get; set; }
    public int ContentActionsCount { get; set; }
    public int SettingsActionsCount { get; set; }
}

// ==========================================
// 4. ADVANCED ANALYTICS DTOs
// ==========================================

public class AdminAnalyticsOverviewDto
{
    // Core Engagement KPIs
    public int TotalStudents { get; set; }
    public int ApprovedStudents { get; set; }
    public int PendingStudents { get; set; }
    public int DauCount { get; set; } // Active within 24h
    public int WauCount { get; set; } // Active within 7d
    public int MauCount { get; set; } // Active within 30d
    public double RetentionRate7d { get; set; }
    public double RetentionRate30d { get; set; }
    public int TotalSystemXp { get; set; }
    public int AverageXpPerStudent { get; set; }
    public int TotalBinoStudyMinutes { get; set; }

    // Charts
    public List<AnalyticsTimeSeriesPointDto> RegistrationTrend { get; set; } = new();
    public List<AnalyticsActivityPointDto> ActivityTrend { get; set; } = new();
    public List<AnalyticsDistributionItemDto> LevelDistribution { get; set; } = new();
    public List<AnalyticsPillarStatDto> PillarComparison { get; set; } = new();

    // Top Performers
    public List<AnalyticsTopStudentDto> TopByXp { get; set; } = new();
    public List<AnalyticsTopStudentDto> TopByStreak { get; set; } = new();
    public List<AnalyticsTopStudentDto> TopByVocab { get; set; } = new();
    public List<AnalyticsTopStudentDto> TopByBino { get; set; } = new();

    // Smart Alerts
    public List<AnalyticsInactiveStudentDto> InactiveStudents { get; set; } = new();
    public List<AnalyticsInactiveStudentDto> AtRiskStreakStudents { get; set; } = new();

    // Content & Curriculum Summary
    public int TotalToeicTests { get; set; }
    public int TotalToeicQuestions { get; set; }
    public int TotalBinoChapters { get; set; }
    public int TotalBinoDialogues { get; set; }
    public int TotalVocabMasteredAcrossAll { get; set; }
    public int TotalReflexMasteredAcrossAll { get; set; }
}

public class AnalyticsTimeSeriesPointDto
{
    public string DateLabel { get; set; } = string.Empty;
    public int Count { get; set; }
    public int CumulativeCount { get; set; }
}

public class AnalyticsActivityPointDto
{
    public string DateLabel { get; set; } = string.Empty;
    public int ActiveUsers { get; set; }
    public int XpEarned { get; set; }
}

public class AnalyticsDistributionItemDto
{
    public string Label { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
    public string Color { get; set; } = "#3b82f6";
}

public class AnalyticsPillarStatDto
{
    public string PillarName { get; set; } = string.Empty;
    public int ActiveLearners { get; set; }
    public int TotalCompletions { get; set; }
    public double AvgCompletionPercent { get; set; }
}

public class AnalyticsTopStudentDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int Level { get; set; }
    public int TotalXp { get; set; }
    public int StreakDays { get; set; }
    public int MetricValue { get; set; }
    public string MetricLabel { get; set; } = string.Empty;
}

public class AnalyticsInactiveStudentDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int DaysInactive { get; set; }
    public int CurrentStreak { get; set; }
    public int TotalXp { get; set; }
    public DateTime? LastActiveAt { get; set; }
}
