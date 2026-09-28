using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VBaceEnglish.Application.DTOs.Dashboard;
using VBaceEnglish.Application.Services;

namespace VBaceEnglish.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    private int GetCurrentUserId()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdStr, out var id) ? id : 0;
    }

    private string GetCurrentUserName()
    {
        return User.FindFirstValue(ClaimTypes.Name)
            ?? User.FindFirstValue(ClaimTypes.Email)
            ?? "Admin Quản Trị";
    }

    /// <summary>
    /// Lấy danh sách thông báo của người dùng đang đăng nhập (Học viên hoặc Admin)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMyNotifications([FromQuery] int limit = 40)
    {
        var userId = GetCurrentUserId();
        var result = await _notificationService.GetMyNotificationsAsync(userId, limit);
        return Ok(result);
    }

    /// <summary>
    /// Lấy số lượng thông báo chưa đọc
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetCurrentUserId();
        var result = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(result);
    }

    /// <summary>
    /// Đánh dấu đã đọc 1 thông báo
    /// </summary>
    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _notificationService.MarkAsReadAsync(userId, id);
        return Ok(result);
    }

    /// <summary>
    /// Đánh dấu đã đọc tất cả thông báo
    /// </summary>
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetCurrentUserId();
        var result = await _notificationService.MarkAllAsReadAsync(userId);
        return Ok(result);
    }

    // ==========================================
    // ADMIN ENDPOINTS
    // ==========================================

    /// <summary>
    /// Admin tạo và gửi thông báo (Hỗ trợ Broadcast tất cả, Nhóm theo tiêu chí, hoặc Cá nhân)
    /// </summary>
    [HttpPost("send")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SendNotification([FromBody] SendNotificationRequestDto dto)
    {
        var adminId = GetCurrentUserId();
        var adminName = GetCurrentUserName();
        var result = await _notificationService.SendNotificationAsync(adminId, adminName, dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>
    /// Admin lấy lịch sử toàn bộ các đợt thông báo đã phát đi kèm tỷ lệ đọc (%)
    /// </summary>
    [HttpGet("admin/history")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminHistory()
    {
        var result = await _notificationService.GetAdminNotificationHistoryAsync();
        return Ok(result);
    }

    /// <summary>
    /// Admin lấy thống kê tổng quan hệ thống thông báo
    /// </summary>
    [HttpGet("admin/stats")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminStats()
    {
        var result = await _notificationService.GetAdminNotificationStatsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Admin xóa một thông báo hoặc một lô thông báo (Batch)
    /// </summary>
    [HttpDelete("admin/{idOrBatchKey}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteNotification(string idOrBatchKey)
    {
        var adminId = GetCurrentUserId();
        var adminName = GetCurrentUserName();
        var result = await _notificationService.DeleteNotificationOrBatchAsync(adminId, adminName, idOrBatchKey);
        return Ok(result);
    }
}
