using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VBaceEnglish.Application.Contracts.Services;
using VBaceEnglish.Application.DTOs.Ai;
using VBaceEnglish.Application.Helpers;

namespace VBaceEnglish.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AiChatController : ControllerBase
{
    private readonly IAiChatService _aiChatService;

    public AiChatController(IAiChatService aiChatService)
    {
        _aiChatService = aiChatService;
    }

    [HttpPost("explain")]
    public async Task<IActionResult> ExplainQuestion([FromBody] AiExplainRequestDto model)
    {
        var explanation = await _aiChatService.ExplainQuestionAsync(
            model.Question, model.CorrectAnswer, model.Options, model.Context);

        return Ok(Response<AiExplainResponseDto>.SuccessResult("Giải thích từ AI", new AiExplainResponseDto
        {
            Explanation = explanation,
            CreatedAt = DateTime.UtcNow
        }));
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] string prompt)
    {
        var response = await _aiChatService.GenerateChatAsync(prompt);
        return Ok(Response<string>.SuccessResult("Phản hồi AI", response));
    }
}

