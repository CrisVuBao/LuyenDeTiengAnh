using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Infrastructure.Data;

public class AppDBContext : IdentityDbContext<ApplicationUser, Role, int>
{
    public AppDBContext(DbContextOptions<AppDBContext> options) : base(options)
    {
    }

    public DbSet<ToeicTest> ToeicTests => Set<ToeicTest>();
    public DbSet<Part1Question> Part1Questions => Set<Part1Question>();
    public DbSet<Part2Question> Part2Questions => Set<Part2Question>();
    public DbSet<Part34Passage> Part34Passages => Set<Part34Passage>();
    public DbSet<Part34Question> Part34Questions => Set<Part34Question>();
    public DbSet<ParaphraseMap> ParaphraseMaps => Set<ParaphraseMap>();
    public DbSet<Part5Question> Part5Questions => Set<Part5Question>();
    public DbSet<Part6Passage> Part6Passages => Set<Part6Passage>();
    public DbSet<Part6Question> Part6Questions => Set<Part6Question>();
    public DbSet<Part7Passage> Part7Passages => Set<Part7Passage>();
    public DbSet<Part7Question> Part7Questions => Set<Part7Question>();

    public DbSet<UserStudyProgress> UserStudyProgresses => Set<UserStudyProgress>();
    public DbSet<UserTestSummary> UserTestSummaries => Set<UserTestSummary>();
    public DbSet<AiChatHistory> AiChatHistories => Set<AiChatHistory>();

    // Bino's English Book System
    public DbSet<BinoBook> BinoBooks => Set<BinoBook>();
    public DbSet<Chapter> Chapters => Set<Chapter>();
    public DbSet<ChapterBonus> ChapterBonuses => Set<ChapterBonus>();
    public DbSet<DialogueLesson> DialogueLessons => Set<DialogueLesson>();
    public DbSet<DialogueVocabulary> DialogueVocabularies => Set<DialogueVocabulary>();
    public DbSet<DialogueLine> DialogueLines => Set<DialogueLine>();
    public DbSet<UserDialogueProgress> UserDialogueProgresses => Set<UserDialogueProgress>();
    public DbSet<UserSRSReview> UserSRSReviews => Set<UserSRSReview>();
    public DbSet<UserReflexProgress> UserReflexProgresses => Set<UserReflexProgress>();
    public DbSet<UserEbookProgress> UserEbookProgresses => Set<UserEbookProgress>();
    public DbSet<UserVocabProgress> UserVocabProgresses => Set<UserVocabProgress>();
    public DbSet<UserGamification> UserGamifications => Set<UserGamification>();
    public DbSet<XPTransaction> XPTransactions => Set<XPTransaction>();

    // Admin Command Center v2.0 Entities
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<AdminActivityLog> AdminActivityLogs => Set<AdminActivityLog>();

    // Phase 3 "Mở Rộng" - Content Module System (M.4)
    public DbSet<ContentModule> ContentModules => Set<ContentModule>();
    public DbSet<ContentLesson> ContentLessons => Set<ContentLesson>();
    public DbSet<UserModuleProgress> UserModuleProgresses => Set<UserModuleProgress>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Performance Indexes (A.6)
        builder.Entity<ToeicTest>().HasIndex(t => t.TestId).IsUnique();
        builder.Entity<ToeicTest>().HasIndex(t => t.Title);
        builder.Entity<ToeicTest>().HasIndex(t => t.CreatedAt);

        builder.Entity<Part5Question>().HasIndex(q => q.GrammarTag);
        builder.Entity<Part5Question>().HasIndex(q => new { q.ToeicTestId, q.QuestionNumber });

        builder.Entity<UserStudyProgress>().HasIndex(p => p.UserId);
        builder.Entity<UserStudyProgress>().HasIndex(p => new { p.UserId, p.ToeicTestId });
        builder.Entity<UserStudyProgress>().HasIndex(p => new { p.UserId, p.ToeicTestId, p.PartNumber, p.QuestionNumber });

        builder.Entity<UserTestSummary>().HasIndex(s => new { s.UserId, s.ToeicTestId }).IsUnique();
        builder.Entity<UserReflexProgress>().HasIndex(r => r.UserId).IsUnique();
        builder.Entity<UserEbookProgress>().HasIndex(e => new { e.UserId, e.BookSlug }).IsUnique();
        builder.Entity<UserVocabProgress>().HasIndex(v => v.UserId).IsUnique();

        // Cascade Deletes for Test
        builder.Entity<ToeicTest>()
            .HasMany(t => t.Part1Questions)
            .WithOne(q => q.ToeicTest)
            .HasForeignKey(q => q.ToeicTestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ToeicTest>()
            .HasMany(t => t.Part2Questions)
            .WithOne(q => q.ToeicTest)
            .HasForeignKey(q => q.ToeicTestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ToeicTest>()
            .HasMany(t => t.Part34Passages)
            .WithOne(p => p.ToeicTest)
            .HasForeignKey(p => p.ToeicTestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ToeicTest>()
            .HasMany(t => t.Part5Questions)
            .WithOne(q => q.ToeicTest)
            .HasForeignKey(q => q.ToeicTestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ToeicTest>()
            .HasMany(t => t.Part6Passages)
            .WithOne(p => p.ToeicTest)
            .HasForeignKey(p => p.ToeicTestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ToeicTest>()
            .HasMany(t => t.Part7Passages)
            .WithOne(p => p.ToeicTest)
            .HasForeignKey(p => p.ToeicTestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Part34Passage>()
            .HasMany(p => p.Questions)
            .WithOne(q => q.Passage)
            .HasForeignKey(q => q.PassageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Part34Passage>()
            .HasMany(p => p.ParaphraseMaps)
            .WithOne(pm => pm.Passage)
            .HasForeignKey(pm => pm.PassageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Part6Passage>()
            .HasMany(p => p.Questions)
            .WithOne(q => q.Passage)
            .HasForeignKey(q => q.PassageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Part7Passage>()
            .HasMany(p => p.Questions)
            .WithOne(q => q.Passage)
            .HasForeignKey(q => q.PassageId)
            .OnDelete(DeleteBehavior.Cascade);

        // ==========================================
        // Bino's English Book System Configurations
        // ==========================================
        builder.Entity<BinoBook>().HasIndex(b => b.Slug).IsUnique();

        builder.Entity<Chapter>().HasIndex(c => new { c.BookId, c.ChapterNumber }).IsUnique();
        builder.Entity<Chapter>()
            .HasOne(c => c.Book)
            .WithMany(b => b.Chapters)
            .HasForeignKey(c => c.BookId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ChapterBonus>()
            .HasOne(b => b.Chapter)
            .WithOne(c => c.Bonus)
            .HasForeignKey<ChapterBonus>(b => b.ChapterId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<DialogueLesson>().HasIndex(d => new { d.ChapterId, d.DialogueNumber }).IsUnique();
        builder.Entity<DialogueLesson>()
            .HasOne(d => d.Chapter)
            .WithMany(c => c.DialogueLessons)
            .HasForeignKey(d => d.ChapterId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<DialogueVocabulary>().HasIndex(v => v.Word);
        builder.Entity<DialogueVocabulary>().HasIndex(v => new { v.DialogueLessonId, v.OrderIndex });
        builder.Entity<DialogueVocabulary>()
            .HasOne(v => v.DialogueLesson)
            .WithMany(d => d.Vocabularies)
            .HasForeignKey(v => v.DialogueLessonId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<DialogueLine>().HasIndex(l => new { l.DialogueLessonId, l.OrderIndex });
        builder.Entity<DialogueLine>()
            .HasOne(l => l.DialogueLesson)
            .WithMany(d => d.DialogueLines)
            .HasForeignKey(l => l.DialogueLessonId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserDialogueProgress>().HasIndex(p => new { p.UserId, p.DialogueLessonId }).IsUnique();
        builder.Entity<UserDialogueProgress>()
            .HasOne(p => p.User)
            .WithMany(u => u.DialogueProgresses)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<UserDialogueProgress>()
            .HasOne(p => p.DialogueLesson)
            .WithMany(d => d.UserProgresses)
            .HasForeignKey(p => p.DialogueLessonId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserSRSReview>().HasIndex(r => new { r.UserId, r.NextReviewDate });
        builder.Entity<UserSRSReview>().HasIndex(r => new { r.UserId, r.VocabularyId }).IsUnique();
        builder.Entity<UserSRSReview>()
            .HasOne(r => r.User)
            .WithMany(u => u.SRSReviews)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<UserSRSReview>()
            .HasOne(r => r.Vocabulary)
            .WithMany(v => v.SRSReviews)
            .HasForeignKey(r => r.VocabularyId)
            .OnDelete(DeleteBehavior.Cascade);

        // ==========================================
        // Admin Command Center v2.0 Configurations
        // ==========================================
        builder.Entity<Notification>().HasIndex(n => new { n.RecipientUserId, n.IsRead, n.CreatedAt });
        builder.Entity<Notification>().HasIndex(n => n.BatchId);
        builder.Entity<Notification>()
            .HasOne(n => n.RecipientUser)
            .WithMany()
            .HasForeignKey(n => n.RecipientUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<SystemSetting>().HasIndex(s => s.Key).IsUnique();
        builder.Entity<SystemSetting>().HasIndex(s => s.Category);

        builder.Entity<AdminActivityLog>().HasIndex(l => l.CreatedAt);
        builder.Entity<AdminActivityLog>().HasIndex(l => l.Action);
        builder.Entity<AdminActivityLog>().HasIndex(l => l.EntityType);

        // ==========================================
        // Phase 1 "Vững Nền" - Gamification, AI & User Performance Indexes (H.4)
        // ==========================================
        builder.Entity<UserGamification>().HasIndex(g => g.UserId).IsUnique();
        builder.Entity<UserGamification>().HasIndex(g => g.CurrentLevel);
        builder.Entity<UserGamification>().HasIndex(g => g.WeeklyXP);
        builder.Entity<UserGamification>().HasIndex(g => g.CurrentStreak);

        builder.Entity<XPTransaction>().HasIndex(x => new { x.UserId, x.CreatedAt });
        builder.Entity<XPTransaction>().HasIndex(x => x.Source);

        builder.Entity<AiChatHistory>().HasIndex(a => new { a.UserId, a.CreatedAt });

        builder.Entity<ApplicationUser>().HasIndex(u => u.PhoneNumber);
        builder.Entity<ApplicationUser>().HasIndex(u => u.IsApproved);
        builder.Entity<ApplicationUser>().HasIndex(u => u.CreatedAt);

        // ==========================================
        // Phase 3 "Mở Rộng" - Content Module System Configurations (M.4)
        // ==========================================
        builder.Entity<ContentModule>().HasIndex(m => m.Code).IsUnique();
        builder.Entity<ContentModule>().HasIndex(m => m.Language);
        builder.Entity<ContentModule>().HasIndex(m => m.Category);
        builder.Entity<ContentModule>().HasIndex(m => m.IsActive);
        builder.Entity<ContentModule>().HasIndex(m => m.OrderIndex);

        builder.Entity<ContentLesson>().HasIndex(l => new { l.ContentModuleId, l.OrderIndex });
        builder.Entity<ContentLesson>().HasIndex(l => l.Type);
        builder.Entity<ContentLesson>()
            .HasOne(l => l.ContentModule)
            .WithMany(m => m.Lessons)
            .HasForeignKey(l => l.ContentModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserModuleProgress>().HasIndex(p => new { p.UserId, p.ContentModuleId }).IsUnique();
        builder.Entity<UserModuleProgress>().HasIndex(p => p.LastStudiedAt);
        builder.Entity<UserModuleProgress>()
            .HasOne(p => p.ContentModule)
            .WithMany(m => m.UserProgresses)
            .HasForeignKey(p => p.ContentModuleId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<UserModuleProgress>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

