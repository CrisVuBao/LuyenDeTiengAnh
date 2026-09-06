namespace VBaceEnglish.Domain.Models;

public class ToeicTest
{
    public int Id { get; set; }
    public string TestId { get; set; } = string.Empty; // e.g. "READING_TEST_1", "READING_TEST_5"
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int TotalQuestions { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation collections for all parts
    public ICollection<Part1Question> Part1Questions { get; set; } = new List<Part1Question>();
    public ICollection<Part2Question> Part2Questions { get; set; } = new List<Part2Question>();
    public ICollection<Part34Passage> Part34Passages { get; set; } = new List<Part34Passage>();
    public ICollection<Part5Question> Part5Questions { get; set; } = new List<Part5Question>();
    public ICollection<Part6Passage> Part6Passages { get; set; } = new List<Part6Passage>();
    public ICollection<Part7Passage> Part7Passages { get; set; } = new List<Part7Passage>();
    public ICollection<UserStudyProgress> StudyProgresses { get; set; } = new List<UserStudyProgress>();
    public ICollection<UserTestSummary> UserSummaries { get; set; } = new List<UserTestSummary>();
}

