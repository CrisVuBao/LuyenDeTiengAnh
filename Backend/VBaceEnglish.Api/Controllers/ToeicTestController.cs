using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using VBaceEnglish.Application.DTOs.Toeic;
using VBaceEnglish.Application.Services;

namespace VBaceEnglish.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ToeicTestController : ControllerBase
{
    private readonly IToeicTestService _toeicTestService;

    public ToeicTestController(IToeicTestService toeicTestService)
    {
        _toeicTestService = toeicTestService;
    }

    [HttpGet]
    [OutputCache(Duration = 30)]
    public async Task<IActionResult> GetAll()
    {
        var result = await _toeicTestService.GetAllTestsAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [OutputCache(Duration = 30)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _toeicTestService.GetTestByIdAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("by-code/{testId}")]
    [OutputCache(Duration = 30)]
    public async Task<IActionResult> GetByCode(string testId)
    {
        var result = await _toeicTestService.GetTestByCodeAsync(testId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _toeicTestService.DeleteTestAsync(id);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("bulk-import")]
    public async Task<IActionResult> BulkImport([FromBody] string jsonContent)
    {
        if (string.IsNullOrWhiteSpace(jsonContent))
            return BadRequest("Nội dung JSON rỗng");

        var result = await _toeicTestService.BulkImportFromJsonAsync(jsonContent);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

