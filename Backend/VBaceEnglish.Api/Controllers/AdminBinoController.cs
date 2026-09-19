using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VBaceEnglish.Application.DTOs.Bino;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Application.Services;

namespace VBaceEnglish.Api.Controllers;

[ApiController]
[Route("api/admin/bino")]
[Authorize(Roles = "Admin")]
public class AdminBinoController : ControllerBase
{
    private readonly IBinoBookService _binoService;

    public AdminBinoController(IBinoBookService binoService)
    {
        _binoService = binoService;
    }

    #region Chapter Endpoints

    [HttpGet("chapters")]
    public async Task<ActionResult<Response<List<AdminChapterDto>>>> GetChapters()
    {
        var result = await _binoService.AdminGetChaptersAsync();
        return Ok(result);
    }

    [HttpGet("chapter/{id}")]
    public async Task<ActionResult<Response<AdminChapterDto>>> GetChapter(int id)
    {
        var result = await _binoService.AdminGetChapterDetailAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("chapter")]
    public async Task<ActionResult<Response<AdminChapterDto>>> CreateChapter([FromBody] UpsertChapterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(Response<AdminChapterDto>.Failure("Tiêu đề chương không được để trống."));

        var result = await _binoService.AdminCreateChapterAsync(dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("chapter/{id}")]
    public async Task<ActionResult<Response<AdminChapterDto>>> UpdateChapter(int id, [FromBody] UpsertChapterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(Response<AdminChapterDto>.Failure("Tiêu đề chương không được để trống."));

        var result = await _binoService.AdminUpdateChapterAsync(id, dto);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpDelete("chapter/{id}")]
    public async Task<ActionResult<Response<bool>>> DeleteChapter(int id)
    {
        var result = await _binoService.AdminDeleteChapterAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    #endregion

    #region Dialogue Endpoints

    [HttpGet("dialogue/{id}")]
    public async Task<ActionResult<Response<AdminDialogueDetailDto>>> GetDialogue(int id)
    {
        var result = await _binoService.AdminGetDialogueDetailAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("dialogue")]
    public async Task<ActionResult<Response<AdminDialogueDetailDto>>> CreateDialogue([FromBody] UpsertDialogueDto dto)
    {
        if (dto.ChapterId <= 0)
            return BadRequest(Response<AdminDialogueDetailDto>.Failure("Vui lòng chọn chương cho bài hội thoại."));
        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(Response<AdminDialogueDetailDto>.Failure("Tiêu đề bài hội thoại không được để trống."));

        var result = await _binoService.AdminCreateDialogueAsync(dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("dialogue/{id}")]
    public async Task<ActionResult<Response<AdminDialogueDetailDto>>> UpdateDialogue(int id, [FromBody] UpsertDialogueDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(Response<AdminDialogueDetailDto>.Failure("Tiêu đề bài hội thoại không được để trống."));

        var result = await _binoService.AdminUpdateDialogueAsync(id, dto);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpDelete("dialogue/{id}")]
    public async Task<ActionResult<Response<bool>>> DeleteDialogue(int id)
    {
        var result = await _binoService.AdminDeleteDialogueAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    #endregion

    #region Real Data Sync from TiengAnhBi.epub

    [HttpPost("sync-real-data")]
    public async Task<ActionResult<Response<SyncEpubResultDto>>> SyncRealData()
    {
        var result = await _binoService.AdminSyncRealDataAsync();
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    #endregion
}
