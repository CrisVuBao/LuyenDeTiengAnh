using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VBaceEnglish.Application.DTOs.Progress;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Application.Services;

namespace VBaceEnglish.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UserProgressController : ControllerBase
{
    private readonly IUserProgressService _progressService;

    public UserProgressController(IUserProgressService progressService)
    {
        _progressService = progressService;
    }

    private int GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idStr, out int id) ? id : 0;
    }

    [HttpGet("by-test/{testId:int}")]
    public async Task<IActionResult> GetProgress(int testId)
    {
        int userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(Response<string>.Failure("Chưa xác thực"));

        var result = await _progressService.GetProgressAsync(userId, testId);
        return Ok(result);
    }

    [HttpGet("all-summaries")]
    public async Task<IActionResult> GetAllSummaries()
    {
        int userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(Response<string>.Failure("Chưa xác thực"));

        var result = await _progressService.GetAllSummariesAsync(userId);
        return Ok(result);
    }

    [HttpGet("unsure-questions")]
    public async Task<IActionResult> GetUnsureQuestions([FromQuery] int? testId)
    {
        int userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(Response<string>.Failure("Chưa xác thực"));

        var result = await _progressService.GetUnsureQuestionsAsync(userId, testId);
        return Ok(result);
    }

    [HttpPost("mark")]
    public async Task<IActionResult> MarkProgress([FromBody] MarkProgressDto model)
    {
        int userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(Response<string>.Failure("Chưa xác thực"));

        var result = await _progressService.MarkProgressAsync(userId, model);
        return Ok(result);
    }

    [HttpPost("reset")]
    public async Task<IActionResult> ResetProgress([FromBody] ResetPartProgressDto model)
    {
        int userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(Response<string>.Failure("Chưa xác thực"));

        var result = await _progressService.ResetProgressAsync(userId, model);
        return Ok(result);
    }
}
