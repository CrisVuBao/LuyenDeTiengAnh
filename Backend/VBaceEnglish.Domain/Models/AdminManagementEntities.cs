namespace VBaceEnglish.Domain.Models;

/// <summary>
/// Hệ thống Thông báo Thời gian Thực (Notification Center)
/// Lưu trữ thông báo gửi tới từng học viên hoặc quản trị viên, hỗ trợ gom nhóm theo BatchId khi gửi hàng loạt.
/// </summary>
public class Notification
{
    public int Id { get; set; }

    /// <summary>
    /// Mã lô gửi (dùng để gom nhóm thống kê khi Admin gửi Broadcast hoặc gửi theo Nhóm)
    /// </summary>
    public string? BatchId { get; set; }

    /// <summary>
    /// Phạm vi gửi: "All" | "Group" | "Single" | "System" | "AdminAlert"
    /// </summary>
    public string TargetScope { get; set; } = "Single";

    /// <summary>
    /// Mô tả đối tượng nhận (VD: "Tất cả học viên", "Nhóm Level >= 5", "Nguyễn Văn A")
    /// </summary>
    public string TargetLabel { get; set; } = string.Empty;

    public int? RecipientUserId { get; set; }
    public ApplicationUser? RecipientUser { get; set; }

    public int? SenderUserId { get; set; }
    public string SenderName { get; set; } = "Hệ thống VBaceEnglish";

    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Loại thông báo: System, Announcement, Reward, Reminder, Approval, Achievement, Warning, Custom
    /// </summary>
    public string Type { get; set; } = "Announcement";

    public string? ActionUrl { get; set; }
    public string IconEmoji { get; set; } = "🔔";

    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsDeleted { get; set; } = false;
}

/// <summary>
/// Cài đặt Hệ thống Động (Admin System Settings)
/// </summary>
public class SystemSetting
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string Description { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int? UpdatedByUserId { get; set; }
}

/// <summary>
/// Nhật ký Hoạt động Quản trị viên (Admin Audit Log)
/// </summary>
public class AdminActivityLog
{
    public int Id { get; set; }
    public int? AdminUserId { get; set; }
    public string AdminName { get; set; } = "Admin";

    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
