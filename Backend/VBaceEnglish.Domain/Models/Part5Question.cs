namespace VBaceEnglish.Domain.Models;

public class Part5Question
{
    public int Id { get; set; }
    public int ToeicTestId { get; set; }
    public ToeicTest ToeicTest { get; set; } = null!;

    public int QuestionNumber { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? Translation { get; set; }

    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty; // "A", "B", "C", "D"
    public string? GrammarTag { get; set; }
    public string? RecognitionKey { get; set; }
    public string? Explanation { get; set; }
    public string? Trap { get; set; }
}

