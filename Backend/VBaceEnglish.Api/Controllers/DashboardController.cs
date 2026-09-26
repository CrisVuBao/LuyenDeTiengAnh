using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VBaceEnglish.Application.DTOs.Dashboard;
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
    public async Task<IActionResult> GetStats()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idStr, out int userId))
            return Unauthorized(Response<string>.Failure("Chưa xác thực"));

        var result = await _dashboardService.GetStatsAsync(userId);
        return Ok(result);
    }

    [HttpGet("admin-stats")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminStats()
    {
        var result = await _dashboardService.GetAdminStatsAsync();
        return Ok(result);
    }

    [HttpGet("admin-students")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminStudents()
    {
        var result = await _dashboardService.GetAdminStudentsAsync();
        return Ok(result);
    }

    [HttpPost("admin-students/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveStudent([FromBody] ApproveStudentRequestDto dto)
    {
        var result = await _dashboardService.ApproveStudentAsync(dto.UserId, dto.IsApproved);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("admin-students/approve-all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveAllPendingStudents()
    {
        var result = await _dashboardService.ApproveAllPendingStudentsAsync();
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("admin-students/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteStudent(int userId)
    {
        var result = await _dashboardService.DeleteStudentAsync(userId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
