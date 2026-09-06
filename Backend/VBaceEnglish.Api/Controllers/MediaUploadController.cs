using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VBaceEnglish.Application.Contracts.Services;
using VBaceEnglish.Application.Helpers;

namespace VBaceEnglish.Api.Controllers;

[ApiController]
[Route("api/admin/bino/media")]
[Authorize(Roles = "Admin")]
public class MediaUploadController : ControllerBase
{
    private readonly IFileStorageService _storageService;

    public MediaUploadController(IFileStorageService storageService)
    {
        _storageService = storageService;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(100_000_000)] // 100 MB max for videos/ebooks
    public async Task<ActionResult<Response<string>>> UploadMedia(
        IFormFile file,
        [FromQuery] string? folder = null,
        [FromForm(Name = "folder")] string? formFolder = null)
    {
        if (file == null || file.Length == 0)
            return BadRequest(Response<string>.Failure("Vui lòng chọn file cần tải lên."));

        var chosenFolder = !string.IsNullOrWhiteSpace(folder) ? folder : (!string.IsNullOrWhiteSpace(formFolder) ? formFolder : "audios");
        var validFolders = new[] { "videos", "audios", "ebooks", "images" };
        var targetFolder = validFolders.Contains(chosenFolder.ToLower()) ? chosenFolder.ToLower() : "misc";

        using var stream = file.OpenReadStream();
        var relativeUrl = await _storageService.SaveFileAsync(stream, file.FileName, targetFolder);

        return Ok(Response<string>.SuccessResult("Tải file lên thành công", relativeUrl));
    }

    [HttpDelete]
    public async Task<ActionResult<Response<bool>>> DeleteMedia([FromQuery] string fileUrl)
    {
        if (string.IsNullOrWhiteSpace(fileUrl))
            return BadRequest(Response<bool>.Failure("Đường dẫn file không hợp lệ."));

        var result = await _storageService.DeleteFileAsync(fileUrl);
        return Ok(Response<bool>.SuccessResult("Xóa file thành công", result));
    }
}
