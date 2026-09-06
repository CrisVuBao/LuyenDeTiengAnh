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
    }
}

