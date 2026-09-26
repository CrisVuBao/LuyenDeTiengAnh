using Microsoft.EntityFrameworkCore;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Domain.Models;
using VBaceEnglish.Infrastructure.Data;

namespace VBaceEnglish.Infrastructure.Implementation;

public class BinoLearningRepository : IBinoLearningRepository
{
    private readonly AppDBContext _context;

    public BinoLearningRepository(AppDBContext context)
    {
        _context = context;
    }

    public async Task<UserDialogueProgress?> GetProgressAsync(int userId, int dialogueLessonId)
    {
        return await _context.UserDialogueProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.DialogueLessonId == dialogueLessonId);
    }

    public async Task<IEnumerable<UserDialogueProgress>> GetProgressByUserAsync(int userId)
    {
        return await _context.UserDialogueProgresses
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .ToListAsync();
    }

    public async Task AddProgressAsync(UserDialogueProgress progress)
    {
        await _context.UserDialogueProgresses.AddAsync(progress);
    }

    public void UpdateProgress(UserDialogueProgress progress)
    {
        _context.UserDialogueProgresses.Update(progress);
    }

    public async Task<UserSRSReview?> GetSRSReviewAsync(int userId, int vocabularyId)
    {
        return await _context.UserSRSReviews
            .Include(r => r.Vocabulary)
            .FirstOrDefaultAsync(r => r.UserId == userId && r.VocabularyId == vocabularyId);
    }

    public async Task<IEnumerable<UserSRSReview>> GetDueSRSReviewsAsync(int userId)
    {
        var now = DateTime.UtcNow;
        return await _context.UserSRSReviews
            .AsNoTracking()
            .Include(r => r.Vocabulary)
                .ThenInclude(v => v.DialogueLesson)
                    .ThenInclude(d => d.Chapter)
            .Where(r => r.UserId == userId && r.NextReviewDate <= now)
            .OrderBy(r => r.NextReviewDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<UserSRSReview>> GetAllSRSReviewsByUserAsync(int userId)
    {
        return await _context.UserSRSReviews
            .AsNoTracking()
            .Include(r => r.Vocabulary)
                .ThenInclude(v => v.DialogueLesson)
                    .ThenInclude(d => d.Chapter)
            .Where(r => r.UserId == userId)
            .OrderBy(r => r.NextReviewDate)
            .ToListAsync();
    }

    public async Task AddSRSReviewAsync(UserSRSReview review)
    {
        await _context.UserSRSReviews.AddAsync(review);
    }

    public void UpdateSRSReview(UserSRSReview review)
    {
        _context.UserSRSReviews.Update(review);
    }
}
