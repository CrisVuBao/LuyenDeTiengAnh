namespace VBaceEnglish.Domain.Models;

public class Part1Question
{
    public int Id { get; set; }
    public int ToeicTestId { get; set; }
    public ToeicTest ToeicTest { get; set; } = null!;

    public int QuestionNumber { get; set; }
    public string? ImageUrl { get; set; }
    public string? AudioUrl { get; set; }
    public string CorrectAnswerText { get; set; } = string.Empty;
    public string? Translation { get; set; }
    public string? Explanation { get; set; }
}

public class Part2Question
{
    public int Id { get; set; }
    public int ToeicTestId { get; set; }
    public ToeicTest ToeicTest { get; set; } = null!;

    public int QuestionNumber { get; set; }
    public string? AudioUrl { get; set; }
    public string? QuestionText { get; set; }
    public string? QuestionTextVi { get; set; }
    public string CorrectAnswer { get; set; } = string.Empty; // "A", "B", "C"
    public string? CorrectAnswerText { get; set; }
    public string? Explanation { get; set; }
}

