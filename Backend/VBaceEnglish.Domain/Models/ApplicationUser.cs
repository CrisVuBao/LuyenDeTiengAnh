using Microsoft.AspNetCore.Identity;

namespace VBaceEnglish.Domain.Models;

public class ApplicationUser : IdentityUser<int>
{
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public ICollection<UserStudyProgress> StudyProgresses { get; set; } = new List<UserStudyProgress>();
    public ICollection<UserTestSummary> TestSummaries { get; set; } = new List<UserTestSummary>();
    public ICollection<AiChatHistory> AiChatHistories { get; set; } = new List<AiChatHistory>();
    public ICollection<UserDialogueProgress> DialogueProgresses { get; set; } = new List<UserDialogueProgress>();
    public ICollection<UserSRSReview> SRSReviews { get; set; } = new List<UserSRSReview>();
}

public class Role : IdentityRole<int>
{
    public Role() : base() { }
    public Role(string roleName) : base(roleName) { }
}

