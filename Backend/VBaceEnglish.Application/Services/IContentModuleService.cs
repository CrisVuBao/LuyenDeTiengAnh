using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace VBaceEnglish.Application.Services;

public class ContentModuleDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = "en";
    public string Title { get; set; } = string.Empty;
    public string TitleVi { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string TargetAudience { get; set; } = string.Empty;
    public string Icon { get; set; } = "BookOpen";
    public string ColorGradient { get; set; } = "from-blue-600 to-indigo-600";
    public string DifficultyLevel { get; set; } = "A1-B2";
    public int EstimatedLessons { get; set; }
    public int OrderIndex { get; set; }
    public bool IsActive { get; set; }
    public bool IsComingSoon { get; set; }
    public string? RoutePath { get; set; }

    // User Progress context
    public int UserCompletedLessons { get; set; }
    public double UserCompletionPercentage { get; set; }
    public int UserTotalTimeSpentSeconds { get; set; }
    public DateTime? UserLastStudiedAt { get; set; }
}

public class ContentModuleDetailDto : ContentModuleDto
{
    public List<ContentLessonDto> Lessons { get; set; } = new();
}

public class ContentLessonDto
{
    public int Id { get; set; }
    public int ContentModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string TitleVi { get; set; } = string.Empty;
    public string Type { get; set; } = "lesson";
    public int OrderIndex { get; set; }
    public string Difficulty { get; set; } = "B1";
    public string? Description { get; set; }
    public int EstimatedMinutes { get; set; }
    public bool IsFree { get; set; }
}

public class TrackModuleProgressRequest
{
    public string ModuleCode { get; set; } = string.Empty;
    public int CompletedLessonsCount { get; set; }
    public int TimeSpentSeconds { get; set; }
    public string? CustomDataJson { get; set; }
}

public interface IContentModuleService
{
    Task<List<ContentModuleDto>> GetActiveModulesAsync(int? userId = null);
    Task<ContentModuleDetailDto?> GetModuleByCodeAsync(string code, int? userId = null);
    Task<bool> TrackModuleProgressAsync(int userId, TrackModuleProgressRequest request);
    Task<List<ContentModuleDto>> GetAllModulesAdminAsync();
    Task<bool> ToggleModuleStatusAdminAsync(int moduleId, bool? isActive, bool? isComingSoon);
}
