using System.Security.Claims;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VBaceEnglish.Application.Services;

namespace VBaceEnglish.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/content-modules")]
[Route("api/v{version:apiVersion}/content-modules")]
public class ContentModulesController : ControllerBase
{
    private readonly IContentModuleService _contentModuleService;

    public ContentModulesController(IContentModuleService contentModuleService)
    {
        _contentModuleService = contentModuleService;
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ các Modules học tập đang kích hoạt (TOEIC, Giao tiếp, IELTS, Lớp 10-12, Tiếng Trung)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetModules()
    {
        var userId = GetCurrentUserId();
        var modules = await _contentModuleService.GetActiveModulesAsync(userId);
        return Ok(new { success = true, data = modules });
    }

    /// <summary>
    /// Lấy chi tiết 1 Module cùng danh sách bài học theo mã code (ví dụ: english-toeic, english-ielts, chinese-hsk)
    /// </summary>
    [HttpGet("{code}")]
    public async Task<IActionResult> GetModuleDetail(string code)
    {
        var userId = GetCurrentUserId();
        var detail = await _contentModuleService.GetModuleByCodeAsync(code, userId);
        if (detail == null)
        {
            return NotFound(new { success = false, message = $"Không tìm thấy Module với mã '{code}'" });
        }
        return Ok(new { success = true, data = detail });
    }

    /// <summary>
    /// Cập nhật tiến độ học tập của người dùng cho một Module
    /// </summary>
    [HttpPost("progress")]
    [Authorize]
    public async Task<IActionResult> TrackProgress([FromBody] TrackModuleProgressRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var ok = await _contentModuleService.TrackModuleProgressAsync(userId.Value, request);
        if (!ok)
        {
            return BadRequest(new { success = false, message = "Không thể ghi nhận tiến độ cho Module này" });
        }
        return Ok(new { success = true, message = "Đã lưu tiến độ học tập thành công!" });
    }

    /// <summary>
    /// Admin: Xem toàn bộ Modules kể cả các module đang ẩn hoặc sắp ra mắt
    /// </summary>
    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdminGetAllModules()
    {
        var list = await _contentModuleService.GetAllModulesAdminAsync();
        return Ok(new { success = true, data = list });
    }

    public class ToggleStatusRequest
    {
        public bool? IsActive { get; set; }
        public bool? IsComingSoon { get; set; }
    }

    /// <summary>
    /// Admin: Bật/tắt trạng thái kích hoạt hoặc sắp ra mắt của Module
    /// </summary>
    [HttpPatch("admin/{id:int}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdminToggleStatus(int id, [FromBody] ToggleStatusRequest request)
    {
        var ok = await _contentModuleService.ToggleModuleStatusAdminAsync(id, request.IsActive, request.IsComingSoon);
        if (!ok) return NotFound(new { success = false, message = "Không tìm thấy Module" });
        return Ok(new { success = true, message = "Đã cập nhật trạng thái Module thành công" });
    }
}
