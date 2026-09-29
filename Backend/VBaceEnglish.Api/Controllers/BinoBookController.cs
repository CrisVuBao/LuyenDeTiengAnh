using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VBaceEnglish.Api.Services;
using VBaceEnglish.Application.Contracts.Services;
using VBaceEnglish.Application.DTOs.Bino;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Application.Services;

namespace VBaceEnglish.Api.Controllers;

[ApiController]
[Route("api/bino")]
[Route("api/communication")]
[Authorize]
public class BinoBookController : ControllerBase
{
    private readonly IBinoBookService _binoService;
    private readonly ICurrentUserService _currentUser;
    private readonly IWebHostEnvironment _env;

    public BinoBookController(IBinoBookService binoService, ICurrentUserService currentUser, IWebHostEnvironment env)
    {
        _binoService = binoService;
        _currentUser = currentUser;
        _env = env;
    }

    [HttpGet("book")]
    [AllowAnonymous]
    public async Task<ActionResult<Response<BinoBookDto>>> GetBookOverview([FromQuery] string slug = "chem-tieng-anh-khong-can-dong-nao")
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.GetBookOverviewAsync(userId, slug);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("chapter/{chapterNumber}")]
    [AllowAnonymous]
    public async Task<ActionResult<Response<ChapterDetailDto>>> GetChapterDetail(int chapterNumber)
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.GetChapterDetailAsync(userId, chapterNumber);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("chapter/{chapterNumber}/bonus")]
    [AllowAnonymous]
    public async Task<ActionResult<Response<ChapterBonusDto>>> GetChapterBonus(int chapterNumber)
    {
        var result = await _binoService.GetChapterBonusAsync(chapterNumber);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("playlist")]
    [AllowAnonymous]
    public async Task<ActionResult<Response<List<PlaylistDialogueDto>>>> GetPlaylistDialogues([FromQuery] string? ids = null)
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.GetPlaylistDialoguesAsync(userId, ids);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("dialogue/{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<Response<DialogueLessonDetailDto>>> GetDialogueLessonDetail(int id)
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.GetDialogueLessonDetailAsync(userId, id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("chapter/{chapterNumber}/dialogue/{dialogueNumber}")]
    [AllowAnonymous]
    public async Task<ActionResult<Response<DialogueLessonDetailDto>>> GetDialogueLessonByNumber(int chapterNumber, int dialogueNumber)
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.GetDialogueLessonByNumberAsync(userId, chapterNumber, dialogueNumber);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("progress/mark")]
    public async Task<ActionResult<Response<bool>>> MarkProgress([FromBody] MarkDialogueProgressDto dto)
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.MarkProgressAsync(userId, dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("progress/summary")]
    public async Task<ActionResult<Response<BinoStudyProgressSummaryDto>>> GetProgressSummary()
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.GetUserStudyProgressSummaryAsync(userId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("progress/reset")]
    public async Task<ActionResult<Response<bool>>> ResetProgress([FromBody] ResetBinoProgressDto dto)
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.ResetUserBinoProgressAsync(userId, dto?.ChapterNumber);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("srs/add-word")]
    public async Task<ActionResult<Response<bool>>> AddWordToSRS([FromBody] AddSrsWordRequestDto dto)
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.AddWordToSRSAsync(userId, dto.VocabularyId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("srs/remove-word")]
    public async Task<ActionResult<Response<bool>>> RemoveWordFromSRS([FromBody] AddSrsWordRequestDto dto)
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.RemoveWordFromSRSAsync(userId, dto.VocabularyId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("srs/due-words")]
    public async Task<ActionResult<Response<IEnumerable<SrsCardDto>>>> GetDueSRSCards()
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.GetDueSRSCardsAsync(userId);
        return Ok(result);
    }

    [HttpGet("srs/all-words")]
    public async Task<ActionResult<Response<IEnumerable<SrsCardDto>>>> GetAllSRSCards()
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.GetAllSRSCardsAsync(userId);
        return Ok(result);
    }

    [HttpPost("srs/review")]
    public async Task<ActionResult<Response<bool>>> SubmitSRSReview([FromBody] SubmitSrsReviewDto dto)
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.SubmitSRSReviewAsync(userId, dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("tts")]
    [AllowAnonymous]
    public async Task<IActionResult> StreamTtsAudio(
        [FromQuery] string text,
        [FromQuery] string? voice = null,
        [FromQuery] string? rate = null,
        [FromQuery] string? pitch = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(text))
            return BadRequest();

        try
        {
            var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var bytes = await EdgeNeuralTtsEngine.GetOrSynthesizeAudioAsync(
                text,
                voice,
                rate,
                pitch,
                webRootPath,
                cancellationToken);

            if (bytes == null || bytes.Length == 0)
                return StatusCode(503);

            Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            return File(bytes, "audio/mpeg");
        }
        catch
        {
            return StatusCode(503);
        }
    }
}
