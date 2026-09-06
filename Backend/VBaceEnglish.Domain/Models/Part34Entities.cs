using VBaceEnglish.Domain.Enums;

namespace VBaceEnglish.Domain.Models;

public class Part34Passage
{
    public int Id { get; set; }
    public int ToeicTestId { get; set; }
    public ToeicTest ToeicTest { get; set; } = null!;

    public PartType PartType { get; set; } = PartType.Part3;
    public string Title { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public string? Transcript { get; set; }
    public string? TranscriptVi { get; set; }

    public ICollection<Part34Question> Questions { get; set; } = new List<Part34Question>();
    public ICollection<ParaphraseMap> ParaphraseMaps { get; set; } = new List<ParaphraseMap>();
}

public class Part34Question
{
    public int Id { get; set; }
    public int PassageId { get; set; }
    public Part34Passage Passage { get; set; } = null!;

    public int QuestionNumber { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? Translation { get; set; }
    public string? CorrectAnswer { get; set; }
    public string CorrectAnswerText { get; set; } = string.Empty;
    public string? Explanation { get; set; }
}

public class ParaphraseMap
{
    public int Id { get; set; }
    public int PassageId { get; set; }
    public Part34Passage Passage { get; set; } = null!;

    public string InTranscript { get; set; } = string.Empty;
    public string InQuestionOrAnswer { get; set; } = string.Empty;
    public string Color { get; set; } = "blue"; // "blue" or "yellow"
}

