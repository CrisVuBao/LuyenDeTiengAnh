using System;
using System.Collections.Generic;

namespace VBaceEnglish.Domain.Models;

/// <summary>
/// Đại diện cho một Module nội dung học tập độc lập (TOEIC, Giao tiếp, IELTS, Lớp 10, 11, 12, Tiếng Trung HSK, ...)
/// Cho phép hệ thống mở rộng đa khóa học, đa ngôn ngữ mà không cần thay đổi cấu trúc bảng.
/// </summary>
public class ContentModule
{
    public int Id { get; set; }

    /// <summary>
    /// Mã định danh duy nhất (ví dụ: "english-toeic", "english-communication", "english-ielts", "english-grade10", "chinese-hsk")
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Ngôn ngữ học tập: "en", "zh", ...
    /// </summary>
    public string Language { get; set; } = "en";

    public string Title { get; set; } = string.Empty;
    public string TitleVi { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Nhóm phân loại (ví dụ: "Chứng Chỉ Quốc Tế", "Giao Tiếp & Phản Xạ", "Chương Trình THPT", "Ngoại Ngữ Thứ Hai")
    /// </summary>
    public string Category { get; set; } = "General";

    /// <summary>
    /// Đối tượng học sinh hướng tới (ví dụ: "Học sinh Lớp 10", "Sĩ tử ôn thi Đại học", "Người đi làm")
    /// </summary>
    public string TargetAudience { get; set; } = string.Empty;

    public string Icon { get; set; } = "BookOpen";
    public string ColorGradient { get; set; } = "from-blue-600 to-indigo-600";
    public string DifficultyLevel { get; set; } = "A1-B2";

    public int EstimatedLessons { get; set; } = 30;
    public int OrderIndex { get; set; } = 0;

    public bool IsActive { get; set; } = true;
    public bool IsComingSoon { get; set; } = false;

    public string? RoutePath { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ContentLesson> Lessons { get; set; } = new List<ContentLesson>();
    public ICollection<UserModuleProgress> UserProgresses { get; set; } = new List<UserModuleProgress>();
}

/// <summary>
/// Đại diện cho một bài học thuộc ContentModule
/// </summary>
public class ContentLesson
{
    public int Id { get; set; }

    public int ContentModuleId { get; set; }
    public ContentModule? ContentModule { get; set; }

    public string Title { get; set; } = string.Empty;
    public string TitleVi { get; set; } = string.Empty;

    /// <summary>
    /// Phân loại bài học: "dialogue", "vocabulary", "grammar", "reading", "listening", "exam"
    /// </summary>
    public string Type { get; set; } = "lesson";

    public int OrderIndex { get; set; } = 1;
    public string Difficulty { get; set; } = "B1";
    public string? Description { get; set; }
    public int EstimatedMinutes { get; set; } = 15;
    public bool IsFree { get; set; } = true;

    /// <summary>
    /// Dữ liệu cấu hình hoặc nội dung chi tiết theo định dạng JSON
    /// </summary>
    public string? MetaJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Theo dõi tiến độ học tập của người dùng theo từng Module
/// </summary>
public class UserModuleProgress
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public int ContentModuleId { get; set; }
    public ContentModule? ContentModule { get; set; }

    public int CompletedLessonsCount { get; set; } = 0;
    public int TotalTimeSpentSeconds { get; set; } = 0;
    public double CompletionPercentage { get; set; } = 0.0;

    public DateTime LastStudiedAt { get; set; } = DateTime.UtcNow;
    public string? ProgressDataJson { get; set; }
}
