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

    public async Task AddSummaryAsync(UserTestSummary summary) => await _context.UserTestSummaries.AddAsync(summary);
    public void UpdateSummary(UserTestSummary summary) => _context.UserTestSummaries.Update(summary);
}

