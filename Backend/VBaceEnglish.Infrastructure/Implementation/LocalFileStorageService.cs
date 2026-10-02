using Microsoft.Extensions.Logging;
using VBaceEnglish.Application.Contracts.Services;

namespace VBaceEnglish.Infrastructure.Implementation;

public class LocalFileStorageService : IFileStorageService
{
    private readonly ILogger<LocalFileStorageService> _logger;
    private readonly string _webRootPath;

    public LocalFileStorageService(ILogger<LocalFileStorageService> logger)
    {
        _logger = logger;
        // Determine wwwroot folder path across local dev, IIS and remote hosting (MonsterASP)
        var currentDir = Directory.GetCurrentDirectory();
        var baseDir = AppContext.BaseDirectory;
        string candidate;

        if (Directory.Exists(Path.Combine(currentDir, "wwwroot")))
            candidate = Path.Combine(currentDir, "wwwroot");
        else if (Directory.Exists(Path.Combine(currentDir, "VBaceEnglish.Api", "wwwroot")))
            candidate = Path.Combine(currentDir, "VBaceEnglish.Api", "wwwroot");
        else if (Directory.Exists(Path.Combine(baseDir, "wwwroot")))
            candidate = Path.Combine(baseDir, "wwwroot");
        else
            candidate = Path.Combine(currentDir, "wwwroot");

        _webRootPath = candidate;
        if (!Directory.Exists(_webRootPath))
        {
            Directory.CreateDirectory(_webRootPath);
        }
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string originalFileName, string subFolder)
    {
        var uploadsFolder = Path.Combine(_webRootPath, "uploads", subFolder);

        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var extension = Path.GetExtension(originalFileName);
        var baseName = Path.GetFileNameWithoutExtension(originalFileName);
        // Clean baseName of special characters
        var cleanBaseName = string.Concat(baseName.Where(c => char.IsLetterOrDigit(c) || c == '_' || c == '-'));
        if (string.IsNullOrEmpty(cleanBaseName)) cleanBaseName = "file";

        var uniqueFileName = $"{cleanBaseName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid().ToString("N")[..6]}{extension}";
        var fullPath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var output = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await fileStream.CopyToAsync(output);
        }

        _logger.LogInformation("Đã lưu file thành công: {Path}", fullPath);
        return $"/uploads/{subFolder}/{uniqueFileName}".Replace("\\", "/");
    }

    public Task<bool> DeleteFileAsync(string fileUrl)
    {
        if (string.IsNullOrWhiteSpace(fileUrl)) return Task.FromResult(false);

        try
        {
            var relativePath = fileUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.Combine(_webRootPath, relativePath);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                _logger.LogInformation("Đã xóa file: {Path}", fullPath);
                return Task.FromResult(true);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xóa file: {Url}", fileUrl);
        }

        return Task.FromResult(false);
    }
}
