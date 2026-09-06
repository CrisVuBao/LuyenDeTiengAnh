namespace VBaceEnglish.Domain.Models;

public class Part7Passage
{
    public int Id { get; set; }
    public int ToeicTestId { get; set; }
    public ToeicTest ToeicTest { get; set; } = null!;

    public string PassageTitle { get; set; } = string.Empty;
    public string PassageText { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }

    public ICollection<Part7Question> Questions { get; set; } = new List<Part7Question>();
}

public class Part7Question
{
    public int Id { get; set; }
    public int PassageId { get; set; }
    public Part7Passage Passage { get; set; } = null!;

    public int QuestionNumber { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? Translation { get; set; }

    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;
    public string? CorrectAnswerText { get; set; }
    public string? EvidenceInPassage { get; set; }
    public string? RecognitionKey { get; set; }
    public string? Explanation { get; set; }
    public string? Trap { get; set; }
}

