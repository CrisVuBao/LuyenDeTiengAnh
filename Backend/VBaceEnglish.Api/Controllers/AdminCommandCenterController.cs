using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using VBaceEnglish.Application.Contracts.Services;
using VBaceEnglish.Application.DTOs.Dashboard;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Application.Services;

namespace VBaceEnglish.Api.Controllers;

// ==========================================
// 1. SYSTEM SETTINGS CONTROLLER (/api/settings)
// ==========================================

[ApiController]
[Route("api/settings")]
[Authorize(Roles = "Admin")]
public class SystemSettingsController : ControllerBase
{
    private readonly ISystemSettingsService _settingsService;
    private readonly IWebHostEnvironment _env;
    private readonly IOutputCacheStore _outputCacheStore;

    public SystemSettingsController(
        ISystemSettingsService settingsService,
        IWebHostEnvironment env,
        IOutputCacheStore outputCacheStore)
    {
        _settingsService = settingsService;
        _env = env;
        _outputCacheStore = outputCacheStore;
    }

    private int GetAdminId() =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

    private string GetAdminName() =>
        User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? "Admin Quản Trị";

    private string GetClientIp() =>
        HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

    /// <summary>
    /// Lấy thông tin nhận diện thương hiệu công khai (Logo, Tên hệ thống, Slogan, Bản quyền)
    /// </summary>
    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicBranding()
    {
        var result = await _settingsService.GetPublicBrandingAsync();
        return Ok(result);
    }

    /// <summary>
    /// Tải lên Logo hoặc Favicon thương hiệu
    /// </summary>
    [HttpPost("upload-branding")]
    [RequestSizeLimit(10_000_000)] // 10MB
    public async Task<IActionResult> UploadBrandingAsset([FromServices] IFileStorageService storageService, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(Response<string>.Failure("Vui lòng chọn file ảnh hợp lệ."));

        var allowedExts = new[] { ".png", ".jpg", ".jpeg", ".svg", ".webp", ".ico" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExts.Contains(ext))
            return BadRequest(Response<string>.Failure("Chỉ hỗ trợ định dạng PNG, JPG, JPEG, SVG, WEBP hoặc ICO."));

        using var stream = file.OpenReadStream();
        var relativeUrl = await storageService.SaveFileAsync(stream, file.FileName, "branding");

        return Ok(Response<string>.SuccessResult("Tải ảnh thương hiệu lên thành công", relativeUrl));
    }

    /// <summary>
    /// Lấy toàn bộ danh sách cài đặt hệ thống (6 phân nhóm)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllSettings()
    {
        var result = await _settingsService.GetAllSettingsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Cập nhật 1 hoặc nhiều cài đặt hệ thống
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateSystemSettingsRequestDto dto)
    {
        var result = await _settingsService.UpdateSettingsAsync(
            GetAdminId(),
            GetAdminName(),
            dto.Settings,
            GetClientIp()
        );
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>
    /// Khôi phục toàn bộ cài đặt về mặc định
    /// </summary>
    [HttpPost("reset")]
    public async Task<IActionResult> ResetToDefaults()
    {
        var result = await _settingsService.ResetToDefaultsAsync(
            GetAdminId(),
            GetAdminName(),
            GetClientIp()
        );
        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin sức khỏe máy chủ, bảng Database và thư viện Media
    /// </summary>
    [HttpGet("system-info")]
    public async Task<IActionResult> GetSystemInfo()
    {
        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var result = await _settingsService.GetSystemInfoAsync(webRoot);
        return Ok(result);
    }

    /// <summary>
    /// Dọn dẹp dữ liệu cũ (Thông báo hết hạn, lịch sử AI chat, nhật ký cũ)
    /// </summary>
    [HttpPost("cleanup")]
    public async Task<IActionResult> CleanupOldData([FromBody] CleanupDataRequestDto dto)
    {
        var result = await _settingsService.CleanupOldDataAsync(GetAdminId(), GetAdminName(), dto);
        return Ok(result);
    }

    /// <summary>
    /// Làm mới (Clear) toàn bộ Output Cache trên máy chủ
    /// </summary>
    [HttpPost("clear-cache")]
    public async Task<IActionResult> ClearSystemCache(CancellationToken ct)
    {
        await _outputCacheStore.EvictByTagAsync("dashboard", ct);
        return Ok(Response<bool>.SuccessResult("Đã làm mới toàn bộ bộ nhớ đệm (Output Cache & Memory Cache) thành công!", true));
    }
}

// ==========================================
// 2. ACTIVITY LOG CONTROLLER (/api/activity-log)
// ==========================================

[ApiController]
[Route("api/activity-log")]
[Authorize(Roles = "Admin")]
public class ActivityLogController : ControllerBase
{
    private readonly IActivityLogService _activityLogService;

    public ActivityLogController(IActivityLogService activityLogService)
    {
        _activityLogService = activityLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetLogs(
        [FromQuery] string? action = null,
        [FromQuery] string? entityType = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _activityLogService.GetLogsAsync(action, entityType, search, page, pageSize);
        return Ok(result);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var result = await _activityLogService.GetStatsAsync();
        return Ok(result);
    }
}

// ==========================================
// 3. ANALYTICS CONTROLLER (/api/analytics)
// ==========================================

[ApiController]
[Route("api/analytics")]
[Authorize(Roles = "Admin")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview([FromQuery] string period = "30d")
    {
        var result = await _analyticsService.GetAnalyticsOverviewAsync(period);
        return Ok(result);
    }
}
