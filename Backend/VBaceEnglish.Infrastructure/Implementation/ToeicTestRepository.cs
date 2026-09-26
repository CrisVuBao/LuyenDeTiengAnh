using Microsoft.EntityFrameworkCore;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Domain.Models;
using VBaceEnglish.Infrastructure.Data;

namespace VBaceEnglish.Infrastructure.Implementation;

public class ToeicTestRepository : IToeicTestRepository
{
    private readonly AppDBContext _context;

    public ToeicTestRepository(AppDBContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ToeicTest>> GetAllAsync()
    {
        return await _context.ToeicTests
            .AsNoTracking() // Bắt buộc AsNoTracking cho read queries (A.3)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<ToeicTest?> GetByIdAsync(int id)
    {
        return await _context.ToeicTests
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<ToeicTest?> GetByTestIdAsync(string testId)
    {
        return await _context.ToeicTests
            .FirstOrDefaultAsync(t => t.TestId == testId);
    }

    public async Task<ToeicTest?> GetWithDetailsAsync(int id)
    {
        return await _context.ToeicTests
            .AsNoTracking()
            .AsSplitQuery()
            .Include(t => t.Part1Questions.OrderBy(q => q.QuestionNumber))
            .Include(t => t.Part2Questions.OrderBy(q => q.QuestionNumber))
            .Include(t => t.Part34Passages)
                .ThenInclude(p => p.Questions.OrderBy(q => q.QuestionNumber))
            .Include(t => t.Part34Passages)
                .ThenInclude(p => p.ParaphraseMaps)
            .Include(t => t.Part5Questions.OrderBy(q => q.QuestionNumber))
            .Include(t => t.Part6Passages)
                .ThenInclude(p => p.Questions.OrderBy(q => q.QuestionNumber))
            .Include(t => t.Part7Passages)
                .ThenInclude(p => p.Questions.OrderBy(q => q.QuestionNumber))
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<ToeicTest?> GetWithDetailsByTestIdAsync(string testId)
    {
        return await _context.ToeicTests
            .AsSplitQuery()
            .Include(t => t.Part1Questions)
            .Include(t => t.Part2Questions)
            .Include(t => t.Part34Passages)
                .ThenInclude(p => p.Questions)
            .Include(t => t.Part34Passages)
                .ThenInclude(p => p.ParaphraseMaps)
            .Include(t => t.Part5Questions)
            .Include(t => t.Part6Passages)
                .ThenInclude(p => p.Questions)
            .Include(t => t.Part7Passages)
                .ThenInclude(p => p.Questions)
            .FirstOrDefaultAsync(t => t.TestId == testId);
    }

    public async Task AddAsync(ToeicTest entity) => await _context.ToeicTests.AddAsync(entity);
    public void Update(ToeicTest entity) => _context.ToeicTests.Update(entity);
    public void Remove(ToeicTest entity) => _context.ToeicTests.Remove(entity);
}

