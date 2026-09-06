namespace VBaceEnglish.Application.DTOs.Ai;

public class AiExplainRequestDto
{
    public string Question { get; set; } = string.Empty;
    public string CorrectAnswer { get; set; } = string.Empty;
    public string? Options { get; set; }
    public string? Context { get; set; }
}

public class AiExplainResponseDto
{
    public string Explanation { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

