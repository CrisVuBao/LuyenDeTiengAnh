using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VBaceEnglish.Application.Contracts.Services;
using VBaceEnglish.Application.DTOs.Bino;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Application.Services;

namespace VBaceEnglish.Api.Controllers;

[ApiController]
[Route("api/bino")]
[Authorize]
public class BinoBookController : ControllerBase
{
    private readonly IBinoBookService _binoService;
    private readonly ICurrentUserService _currentUser;

    public BinoBookController(IBinoBookService binoService, ICurrentUserService currentUser)
    {
        _binoService = binoService;
        _currentUser = currentUser;
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

    [HttpPost("srs/add-word")]
    public async Task<ActionResult<Response<bool>>> AddWordToSRS([FromBody] AddSrsWordRequestDto dto)
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.AddWordToSRSAsync(userId, dto.VocabularyId);
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

    [HttpPost("srs/review")]
    public async Task<ActionResult<Response<bool>>> SubmitSRSReview([FromBody] SubmitSrsReviewDto dto)
    {
        var userId = _currentUser.UserId ?? 0;
        var result = await _binoService.SubmitSRSReviewAsync(userId, dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
