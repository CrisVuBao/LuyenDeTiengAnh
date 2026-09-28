using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VBaceEnglish.Application.DTOs.Gamification;
using VBaceEnglish.Application.Services;

namespace VBaceEnglish.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class GamificationController : ControllerBase
{
    private readonly IGamificationService _gamificationService;

    public GamificationController(IGamificationService gamificationService)
    {
        _gamificationService = gamificationService;
    }

    private int GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idStr, out int id) ? id : 0;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var response = await _gamificationService.GetProfileAsync(userId);
        return Ok(response);
    }

    [HttpPost("xp")]
    public async Task<IActionResult> AddXP([FromBody] AddXPRequestDto dto)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var response = await _gamificationService.AddXPAsync(userId, dto.Amount, dto.Source, dto.Description);
        return Ok(response);
    }

    [HttpGet("daily-quests")]
    public async Task<IActionResult> GetDailyQuests()
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var response = await _gamificationService.GetDailyQuestsAsync(userId);
        return Ok(response);
    }

    [HttpPost("daily-quests/{questId}/complete")]
    public async Task<IActionResult> CompleteDailyQuest(string questId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var response = await _gamificationService.CompleteDailyQuestAsync(userId, questId);
        return Ok(response);
    }

    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard()
    {
        var response = await _gamificationService.GetLeaderboardAsync();
        return Ok(response);
    }

    [HttpGet("achievements")]
    public async Task<IActionResult> GetAchievements()
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var response = await _gamificationService.GetAchievementsAsync(userId);
        return Ok(response);
    }
}
