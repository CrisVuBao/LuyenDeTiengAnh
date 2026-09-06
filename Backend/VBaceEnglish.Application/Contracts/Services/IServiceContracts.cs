using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Contracts.Services;

public interface IDateTimeProvider
{
    DateTime Now { get; }
    DateTime UtcNow { get; }
}

public interface IAiChatService
{
    Task<string> GenerateChatAsync(string prompt);
    Task<string> ExplainQuestionAsync(string question, string correctAnswer, string? options, string? context);
}

public interface IJwtTokenService
{
    string GenerateToken(ApplicationUser user, IEnumerable<string> roles);
}

public interface ICurrentUserService
{
    int? UserId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
}

public interface IFileStorageService
{
    Task<string> SaveFileAsync(Stream fileStream, string originalFileName, string subFolder);
    Task<bool> DeleteFileAsync(string fileUrl);
}


