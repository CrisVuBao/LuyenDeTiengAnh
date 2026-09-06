using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Application.Services;

namespace VBaceEnglish.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    [OutputCache(PolicyName = "Dashboard")]
    public async Task<IActionResult> GetStats()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idStr, out int userId))
            return Unauthorized(Response<string>.Failure("Chưa xác thực"));

        var result = await _dashboardService.GetStatsAsync(userId);
        return Ok(result);
    }
}

