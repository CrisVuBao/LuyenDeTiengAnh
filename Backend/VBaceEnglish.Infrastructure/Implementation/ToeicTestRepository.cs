using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Domain.Models;
using VBaceEnglish.Infrastructure.Data;

namespace VBaceEnglish.Infrastructure.Implementation;

public class ToeicTestRepository : IToeicTestRepository
{
    private readonly AppDBContext _context;

    private static List<ToeicTest>? _allTestsCache;
    private static readonly ConcurrentDictionary<int, ToeicTest> TestByIdCache = new();
    private static readonly ConcurrentDictionary<string, ToeicTest> TestByCodeCache = new(StringComparer.OrdinalIgnoreCase);

    public static void InvalidateToeicCache()
    {
        _allTestsCache = null;
        TestByIdCache.Clear();
        TestByCodeCache.Clear();
    }

    public ToeicTestRepository(AppDBContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ToeicTest>> GetAllAsync()
    {
        if (_allTestsCache != null)
        {
            return _allTestsCache;
        }

        var list = await _context.ToeicTests
            .AsNoTracking()
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        _allTestsCache = list;
        return list;
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
        if (TestByIdCache.TryGetValue(id, out var cached))
        {
            return cached;
        }

        var test = await _context.ToeicTests
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

        if (test != null)
        {
            TestByIdCache[id] = test;
            TestByCodeCache[test.TestId] = test;
        }

        return test;
    }

    public async Task<ToeicTest?> GetWithDetailsByTestIdAsync(string testId, bool trackChanges = false)
    {
        if (!trackChanges && TestByCodeCache.TryGetValue(testId, out var cached))
        {
            return cached;
        }

        var query = _context.ToeicTests.AsSplitQuery();
        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        var test = await query
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

        if (!trackChanges && test != null)
        {
            TestByCodeCache[testId] = test;
            TestByIdCache[test.Id] = test;
        }

        return test;
    }

    public async Task AddAsync(ToeicTest entity)
    {
        InvalidateToeicCache();
        await _context.ToeicTests.AddAsync(entity);
    }

    public void Update(ToeicTest entity)
    {
        InvalidateToeicCache();
        _context.ToeicTests.Update(entity);
    }

    public void Remove(ToeicTest entity)
    {
        InvalidateToeicCache();
        _context.ToeicTests.Remove(entity);
    }
}

