using System.Text.Json.Serialization;

namespace VBaceEnglish.Application.DTOs.Toeic;

public class ToeicTestDto
{
    public int Id { get; set; }
    public string TestId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int TotalQuestions { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Part1Dto
{
    public int Id { get; set; }
    public string? ImageUrl { get; set; }
    public string? AudioUrl { get; set; }
    public string CorrectAnswerText { get; set; } = string.Empty;
    public string? Translation { get; set; }
    public string? Explanation { get; set; }
}

public class Part2Dto
{
    public int Id { get; set; }
    public string? AudioUrl { get; set; }
    public string? QuestionText { get; set; }
    public string? QuestionTextVi { get; set; }
    public string CorrectAnswer { get; set; } = string.Empty;
    public string? CorrectAnswerText { get; set; }
    public string? Explanation { get; set; }
}

public class Part34QuestionDto
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? Translation { get; set; }
    public string? CorrectAnswer { get; set; }
    public string CorrectAnswerText { get; set; } = string.Empty;
    public string? Explanation { get; set; }
}

public class ParaphraseMapDto
{
    public string InTranscript { get; set; } = string.Empty;
    public string InQuestionOrAnswer { get; set; } = string.Empty;
    public string Color { get; set; } = "blue";
}

public class Part34PassageDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public string? Transcript { get; set; }
    public string? TranscriptVi { get; set; }
    public List<Part34QuestionDto> Questions { get; set; } = new();
    public List<ParaphraseMapDto> ParaphraseMaps { get; set; } = new();
}

public class Part5Dto
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? Translation { get; set; }
    public Dictionary<string, string> Options { get; set; } = new();
    public string CorrectAnswer { get; set; } = string.Empty;
    public string? GrammarTag { get; set; }
    public string? RecognitionKey { get; set; }
    public string? Explanation { get; set; }
    public string? Trap { get; set; }
}

public class Part6QuestionDto
{
    public int Id { get; set; }
    public string? Question { get; set; }
    public string? Text { get; set; }
    public string? Translation { get; set; }
    public Dictionary<string, string> Options { get; set; } = new();
    public string CorrectAnswer { get; set; } = string.Empty;
    public string? CorrectAnswerText { get; set; }
    public string? CorrectAnswerTextVi { get; set; }
    public string? GrammarTag { get; set; }
    public string? RecognitionKey { get; set; }
    public string? Explanation { get; set; }
    public string? Trap { get; set; }
}

public class Part6PassageDto
{
    public int Id { get; set; }
    public string PassageTitle { get; set; } = string.Empty;
    public string PassageContext { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public List<Part6QuestionDto> Questions { get; set; } = new();
}

public class Part7QuestionDto
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? Translation { get; set; }
    public Dictionary<string, string> Options { get; set; } = new();
    public string CorrectAnswer { get; set; } = string.Empty;
    public string? CorrectAnswerText { get; set; }
    public string? EvidenceInPassage { get; set; }
    public string? RecognitionKey { get; set; }
    public string? Explanation { get; set; }
    public string? Trap { get; set; }
}

public class Part7PassageDto
{
    public int Id { get; set; }
    public string PassageTitle { get; set; } = string.Empty;
    public string PassageText { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public List<Part7QuestionDto> Questions { get; set; } = new();
}

public class ToeicTestDetailDto
{
    public int Id { get; set; }
    public string TestId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int TotalQuestions { get; set; }

    public List<Part1Dto> Part1 { get; set; } = new();
    public List<Part2Dto> Part2 { get; set; } = new();
    public List<Part34PassageDto> Part34 { get; set; } = new();
    public List<Part5Dto> Part5 { get; set; } = new();
    public List<Part6PassageDto> Part6 { get; set; } = new();
    public List<Part7PassageDto> Part7 { get; set; } = new();
}

