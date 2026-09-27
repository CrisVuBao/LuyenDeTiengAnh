using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Domain.Models;
using VBaceEnglish.Infrastructure.Data;

namespace VBaceEnglish.Infrastructure.Implementation;

public class BinoBookRepository : IBinoBookRepository
{
    private readonly AppDBContext _context;

    // Bộ nhớ đệm L1 RAM cho cấu trúc giáo trình tĩnh Bino (0.01ms truy xuất, 0 SQL queries khi học viên chuyển trang)
    private static readonly ConcurrentDictionary<string, BinoBook> BookCache = new(StringComparer.OrdinalIgnoreCase);
    private static readonly ConcurrentDictionary<int, Chapter> ChapterByNumCache = new();
    private static readonly ConcurrentDictionary<int, ChapterBonus> BonusByChapterNumCache = new();
    private static readonly ConcurrentDictionary<int, DialogueLesson> LessonByIdCache = new();
    private static readonly ConcurrentDictionary<(int, int), DialogueLesson> LessonByNumCache = new();

    public static void InvalidateCurriculumCache()
    {
        BookCache.Clear();
        ChapterByNumCache.Clear();
        BonusByChapterNumCache.Clear();
        LessonByIdCache.Clear();
        LessonByNumCache.Clear();
    }

    public BinoBookRepository(AppDBContext context)
    {
        _context = context;
    }

    public async Task<BinoBook?> GetBookWithChaptersAsync(string slug = "chem-tieng-anh-khong-can-dong-nao", bool trackChanges = false)
    {
        if (!trackChanges && BookCache.TryGetValue(slug, out var cachedBook))
        {
            return cachedBook;
        }

        var query = _context.BinoBooks.AsSplitQuery();
        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        var book = await query
            .Include(b => b.Chapters.OrderBy(c => c.ChapterNumber))
                .ThenInclude(c => c.DialogueLessons.OrderBy(d => d.DialogueNumber))
                    .ThenInclude(d => d.Vocabularies)
            .Include(b => b.Chapters.OrderBy(c => c.ChapterNumber))
                .ThenInclude(c => c.DialogueLessons.OrderBy(d => d.DialogueNumber))
                    .ThenInclude(d => d.DialogueLines)
            .Include(b => b.Chapters)
                .ThenInclude(c => c.Bonus)
            .FirstOrDefaultAsync(b => b.Slug == slug);

        if (!trackChanges && book != null)
        {
            BookCache[slug] = book;
        }

        return book;
    }

    public async Task<Chapter?> GetChapterWithLessonsAsync(int chapterNumber)
    {
        if (ChapterByNumCache.TryGetValue(chapterNumber, out var cachedChapter))
        {
            return cachedChapter;
        }

        var chapter = await _context.Chapters
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.DialogueLessons.OrderBy(d => d.DialogueNumber))
                .ThenInclude(d => d.Vocabularies)
            .Include(c => c.Bonus)
            .FirstOrDefaultAsync(c => c.ChapterNumber == chapterNumber);

        if (chapter != null)
        {
            ChapterByNumCache[chapterNumber] = chapter;
        }

        return chapter;
    }

    public async Task<ChapterBonus?> GetChapterBonusAsync(int chapterNumber)
    {
        if (BonusByChapterNumCache.TryGetValue(chapterNumber, out var cachedBonus))
        {
            return cachedBonus;
        }

        var bonus = await _context.ChapterBonuses
            .AsNoTracking()
            .Include(b => b.Chapter)
            .FirstOrDefaultAsync(b => b.Chapter.ChapterNumber == chapterNumber);

        if (bonus != null)
        {
            BonusByChapterNumCache[chapterNumber] = bonus;
        }

        return bonus;
    }

    public async Task<DialogueLesson?> GetDialogueLessonAsync(int id, bool trackChanges = false)
    {
        if (!trackChanges && LessonByIdCache.TryGetValue(id, out var cachedLesson))
        {
            return cachedLesson;
        }

        var query = _context.DialogueLessons.AsSplitQuery();
        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        var lesson = await query
            .Include(d => d.Chapter)
            .Include(d => d.Vocabularies.OrderBy(v => v.OrderIndex))
            .Include(d => d.DialogueLines.OrderBy(l => l.OrderIndex))
            .FirstOrDefaultAsync(d => d.Id == id);

        if (!trackChanges && lesson != null)
        {
            LessonByIdCache[id] = lesson;
        }

        return lesson;
    }

    public async Task<DialogueLesson?> GetDialogueLessonByNumberAsync(int chapterNumber, int dialogueNumber)
    {
        var key = (chapterNumber, dialogueNumber);
        if (LessonByNumCache.TryGetValue(key, out var cachedLesson))
        {
            return cachedLesson;
        }

        var lesson = await _context.DialogueLessons
            .AsNoTracking()
            .AsSplitQuery()
            .Include(d => d.Chapter)
            .Include(d => d.Vocabularies.OrderBy(v => v.OrderIndex))
            .Include(d => d.DialogueLines.OrderBy(l => l.OrderIndex))
            .FirstOrDefaultAsync(d => d.Chapter.ChapterNumber == chapterNumber && d.DialogueNumber == dialogueNumber);

        if (lesson != null)
        {
            LessonByNumCache[key] = lesson;
            LessonByIdCache[lesson.Id] = lesson;
        }

        return lesson;
    }

    public async Task<Chapter?> GetChapterByIdAsync(int id)
    {
        return await _context.Chapters
            .AsSplitQuery()
            .Include(c => c.DialogueLessons.OrderBy(d => d.DialogueNumber))
                .ThenInclude(d => d.Vocabularies)
            .Include(c => c.Bonus)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IEnumerable<Chapter>> GetAllChaptersAsync(string slug = "chem-tieng-anh-khong-can-dong-nao")
    {
        return await _context.Chapters
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.Book)
            .Include(c => c.DialogueLessons)
                .ThenInclude(d => d.Vocabularies)
            .Include(c => c.DialogueLessons)
                .ThenInclude(d => d.DialogueLines)
            .Include(c => c.Bonus)
            .Where(c => c.Book.Slug == slug)
            .OrderBy(c => c.ChapterNumber)
            .ToListAsync();
    }

    public async Task AddChapterAsync(Chapter chapter)
    {
        InvalidateCurriculumCache();
        await _context.Chapters.AddAsync(chapter);
    }

    public void UpdateChapter(Chapter chapter)
    {
        InvalidateCurriculumCache();
        _context.Chapters.Update(chapter);
    }

    public void RemoveChapter(Chapter chapter)
    {
        InvalidateCurriculumCache();
        _context.Chapters.Remove(chapter);
    }

    public async Task<ChapterBonus?> GetChapterBonusByIdAsync(int chapterId)
    {
        return await _context.ChapterBonuses
            .FirstOrDefaultAsync(b => b.ChapterId == chapterId);
    }

    public async Task AddChapterBonusAsync(ChapterBonus bonus)
    {
        InvalidateCurriculumCache();
        await _context.ChapterBonuses.AddAsync(bonus);
    }

    public void UpdateChapterBonus(ChapterBonus bonus)
    {
        InvalidateCurriculumCache();
        _context.ChapterBonuses.Update(bonus);
    }

    public async Task<IEnumerable<DialogueLesson>> GetDialoguesByChapterIdAsync(int chapterId)
    {
        return await _context.DialogueLessons
            .AsNoTracking()
            .Include(d => d.Vocabularies)
            .Include(d => d.DialogueLines)
            .Where(d => d.ChapterId == chapterId)
            .OrderBy(d => d.DialogueNumber)
            .ToListAsync();
    }

    public async Task AddDialogueLessonAsync(DialogueLesson lesson)
    {
        InvalidateCurriculumCache();
        await _context.DialogueLessons.AddAsync(lesson);
    }

    public void UpdateDialogueLesson(DialogueLesson lesson)
    {
        InvalidateCurriculumCache();
        _context.DialogueLessons.Update(lesson);
    }

    public void RemoveDialogueLesson(DialogueLesson lesson)
    {
        InvalidateCurriculumCache();
        _context.DialogueLessons.Remove(lesson);
    }

    public async Task<IEnumerable<DialogueVocabulary>> GetVocabulariesByLessonAsync(int lessonId)
    {
        return await _context.DialogueVocabularies
            .AsNoTracking()
            .Where(v => v.DialogueLessonId == lessonId)
            .OrderBy(v => v.OrderIndex)
            .ToListAsync();
    }

    public async Task<IEnumerable<DialogueVocabulary>> GetAllVocabulariesAsync()
    {
        return await _context.DialogueVocabularies
            .AsNoTracking()
            .Include(v => v.DialogueLesson)
                .ThenInclude(d => d.Chapter)
            .OrderBy(v => v.DialogueLesson.Chapter.ChapterNumber)
            .ThenBy(v => v.DialogueLesson.DialogueNumber)
            .ThenBy(v => v.OrderIndex)
            .ToListAsync();
    }

    public async Task AddVocabularyAsync(DialogueVocabulary vocabulary)
    {
        InvalidateCurriculumCache();
        await _context.DialogueVocabularies.AddAsync(vocabulary);
    }

    public void RemoveVocabulary(DialogueVocabulary vocabulary)
    {
        InvalidateCurriculumCache();
        _context.DialogueVocabularies.Remove(vocabulary);
    }

    public void RemoveVocabularies(IEnumerable<DialogueVocabulary> vocabularies)
    {
        InvalidateCurriculumCache();
        _context.DialogueVocabularies.RemoveRange(vocabularies);
    }

    public async Task AddDialogueLineAsync(DialogueLine line)
    {
        InvalidateCurriculumCache();
        await _context.DialogueLines.AddAsync(line);
    }

    public void RemoveDialogueLine(DialogueLine line)
    {
        InvalidateCurriculumCache();
        _context.DialogueLines.Remove(line);
    }

    public void RemoveDialogueLines(IEnumerable<DialogueLine> lines)
    {
        InvalidateCurriculumCache();
        _context.DialogueLines.RemoveRange(lines);
    }
}
