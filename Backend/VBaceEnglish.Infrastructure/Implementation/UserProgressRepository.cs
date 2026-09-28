using Microsoft.EntityFrameworkCore;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Domain.Models;
using VBaceEnglish.Infrastructure.Data;

namespace VBaceEnglish.Infrastructure.Implementation;

public class UserProgressRepository : IUserProgressRepository
{
    private readonly AppDBContext _context;

    public UserProgressRepository(AppDBContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<UserStudyProgress>> GetProgressByUserAndTestAsync(int userId, int toeicTestId)
    {
        return await _context.UserStudyProgresses
            .AsNoTracking()
            .Where(p => p.UserId == userId && p.ToeicTestId == toeicTestId)
            .ToListAsync();
    }

    public async Task<UserStudyProgress?> GetByQuestionAsync(int userId, int toeicTestId, int partNumber, int questionNumber)
    {
        return await _context.UserStudyProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && 
                                      p.ToeicTestId == toeicTestId && 
                                      p.PartNumber == partNumber && 
                                      p.QuestionNumber == questionNumber);
    }

    public async Task AddAsync(UserStudyProgress entity) => await _context.UserStudyProgresses.AddAsync(entity);
    public void Update(UserStudyProgress entity) => _context.UserStudyProgresses.Update(entity);
    public void RemoveRange(IEnumerable<UserStudyProgress> entities) => _context.UserStudyProgresses.RemoveRange(entities);

    public async Task<UserTestSummary?> GetSummaryAsync(int userId, int toeicTestId)
    {
        return await _context.UserTestSummaries
            .FirstOrDefaultAsync(s => s.UserId == userId && s.ToeicTestId == toeicTestId);
    }

    public async Task<IEnumerable<UserTestSummary>> GetSummariesByUserAsync(int userId)
    {
        return await _context.UserTestSummaries
            .AsNoTracking()
            .Include(s => s.ToeicTest)
            .Where(s => s.UserId == userId)
            .ToListAsync();
    }

    public async Task<IEnumerable<UserTestSummary>> GetAllSummariesAsync()
    {
        return await _context.UserTestSummaries
            .AsNoTracking()
            .Include(s => s.ToeicTest)
            .ToListAsync();
    }

    public async Task<IEnumerable<UserStudyProgress>> GetAllProgressByUserAsync(int userId)
    {
        return await _context.UserStudyProgresses
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .ToListAsync();
    }

    public async Task<int> GetTotalInteractionCountAsync()
    {
        return await _context.UserStudyProgresses.CountAsync();
    }

    public async Task AddSummaryAsync(UserTestSummary summary) => await _context.UserTestSummaries.AddAsync(summary);
    public void UpdateSummary(UserTestSummary summary) => _context.UserTestSummaries.Update(summary);

    public async Task<UserReflexProgress?> GetReflexProgressAsync(int userId)
    {
        return await _context.UserReflexProgresses
            .FirstOrDefaultAsync(r => r.UserId == userId);
    }

    public async Task AddReflexProgressAsync(UserReflexProgress progress)
    {
        await _context.UserReflexProgresses.AddAsync(progress);
    }

    public void UpdateReflexProgress(UserReflexProgress progress)
    {
        _context.UserReflexProgresses.Update(progress);
    }

    public async Task<UserEbookProgress?> GetEbookProgressAsync(int userId, string bookSlug)
    {
        return await _context.UserEbookProgresses
            .FirstOrDefaultAsync(e => e.UserId == userId && e.BookSlug == bookSlug);
    }

    public async Task AddEbookProgressAsync(UserEbookProgress progress)
    {
        await _context.UserEbookProgresses.AddAsync(progress);
    }

    public void UpdateEbookProgress(UserEbookProgress progress)
    {
        _context.UserEbookProgresses.Update(progress);
    }

    public async Task<UserVocabProgress?> GetVocabProgressAsync(int userId)
    {
        return await _context.UserVocabProgresses
            .FirstOrDefaultAsync(v => v.UserId == userId);
    }

    public async Task AddVocabProgressAsync(UserVocabProgress progress)
    {
        await _context.UserVocabProgresses.AddAsync(progress);
    }

    public void UpdateVocabProgress(UserVocabProgress progress)
    {
        _context.UserVocabProgresses.Update(progress);
    }
}


