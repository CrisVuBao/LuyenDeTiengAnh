using Microsoft.EntityFrameworkCore;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Domain.Models;
using VBaceEnglish.Infrastructure.Data;

namespace VBaceEnglish.Infrastructure.Implementation;

public class BinoBookRepository : IBinoBookRepository
{
    private readonly AppDBContext _context;

    public BinoBookRepository(AppDBContext context)
    {
        _context = context;
    }

    public async Task<BinoBook?> GetBookWithChaptersAsync(string slug = "chem-tieng-anh-khong-can-dong-nao")
    {
        return await _context.BinoBooks
            .AsSplitQuery()
            .Include(b => b.Chapters.OrderBy(c => c.ChapterNumber))
                .ThenInclude(c => c.DialogueLessons.OrderBy(d => d.DialogueNumber))
                    .ThenInclude(d => d.Vocabularies)
            .Include(b => b.Chapters.OrderBy(c => c.ChapterNumber))
                .ThenInclude(c => c.DialogueLessons.OrderBy(d => d.DialogueNumber))
                    .ThenInclude(d => d.DialogueLines)
            .Include(b => b.Chapters)
                .ThenInclude(c => c.Bonus)
            .FirstOrDefaultAsync(b => b.Slug == slug);
    }

    public async Task<Chapter?> GetChapterWithLessonsAsync(int chapterNumber)
    {
        return await _context.Chapters
            .AsSplitQuery()
            .Include(c => c.DialogueLessons.OrderBy(d => d.DialogueNumber))
                .ThenInclude(d => d.Vocabularies)
            .Include(c => c.Bonus)
            .FirstOrDefaultAsync(c => c.ChapterNumber == chapterNumber);
    }

    public async Task<ChapterBonus?> GetChapterBonusAsync(int chapterNumber)
    {
        return await _context.ChapterBonuses
            .AsNoTracking()
            .Include(b => b.Chapter)
            .FirstOrDefaultAsync(b => b.Chapter.ChapterNumber == chapterNumber);
    }

    public async Task<DialogueLesson?> GetDialogueLessonAsync(int id)
    {
        return await _context.DialogueLessons
            .AsSplitQuery()
            .Include(d => d.Chapter)
            .Include(d => d.Vocabularies.OrderBy(v => v.OrderIndex))
            .Include(d => d.DialogueLines.OrderBy(l => l.OrderIndex))
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<DialogueLesson?> GetDialogueLessonByNumberAsync(int chapterNumber, int dialogueNumber)
    {
        return await _context.DialogueLessons
            .AsSplitQuery()
            .Include(d => d.Chapter)
            .Include(d => d.Vocabularies.OrderBy(v => v.OrderIndex))
            .Include(d => d.DialogueLines.OrderBy(l => l.OrderIndex))
            .FirstOrDefaultAsync(d => d.Chapter.ChapterNumber == chapterNumber && d.DialogueNumber == dialogueNumber);
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
        await _context.Chapters.AddAsync(chapter);
    }

    public void UpdateChapter(Chapter chapter)
    {
        _context.Chapters.Update(chapter);
    }

    public void RemoveChapter(Chapter chapter)
    {
        _context.Chapters.Remove(chapter);
    }

    public async Task<ChapterBonus?> GetChapterBonusByIdAsync(int chapterId)
    {
        return await _context.ChapterBonuses
            .FirstOrDefaultAsync(b => b.ChapterId == chapterId);
    }

    public async Task AddChapterBonusAsync(ChapterBonus bonus)
    {
        await _context.ChapterBonuses.AddAsync(bonus);
    }

    public void UpdateChapterBonus(ChapterBonus bonus)
    {
        _context.ChapterBonuses.Update(bonus);
    }

    public async Task<IEnumerable<DialogueLesson>> GetDialoguesByChapterIdAsync(int chapterId)
    {
        return await _context.DialogueLessons
            .Include(d => d.Vocabularies)
            .Include(d => d.DialogueLines)
            .Where(d => d.ChapterId == chapterId)
            .OrderBy(d => d.DialogueNumber)
            .ToListAsync();
    }

    public async Task AddDialogueLessonAsync(DialogueLesson lesson)
    {
        await _context.DialogueLessons.AddAsync(lesson);
    }

    public void UpdateDialogueLesson(DialogueLesson lesson)
    {
        _context.DialogueLessons.Update(lesson);
    }

    public void RemoveDialogueLesson(DialogueLesson lesson)
    {
        _context.DialogueLessons.Remove(lesson);
    }

    public async Task<IEnumerable<DialogueVocabulary>> GetVocabulariesByLessonAsync(int lessonId)
    {
        return await _context.DialogueVocabularies
            .Where(v => v.DialogueLessonId == lessonId)
            .OrderBy(v => v.OrderIndex)
            .ToListAsync();
    }

    public async Task<IEnumerable<DialogueVocabulary>> GetAllVocabulariesAsync()
    {
        return await _context.DialogueVocabularies
            .Include(v => v.DialogueLesson)
                .ThenInclude(d => d.Chapter)
            .OrderBy(v => v.DialogueLesson.Chapter.ChapterNumber)
            .ThenBy(v => v.DialogueLesson.DialogueNumber)
            .ThenBy(v => v.OrderIndex)
            .ToListAsync();
    }

    public async Task AddVocabularyAsync(DialogueVocabulary vocabulary)
    {
        await _context.DialogueVocabularies.AddAsync(vocabulary);
    }

    public void RemoveVocabulary(DialogueVocabulary vocabulary)
    {
        _context.DialogueVocabularies.Remove(vocabulary);
    }

    public void RemoveVocabularies(IEnumerable<DialogueVocabulary> vocabularies)
    {
        _context.DialogueVocabularies.RemoveRange(vocabularies);
    }

    public async Task AddDialogueLineAsync(DialogueLine line)
    {
        await _context.DialogueLines.AddAsync(line);
    }

    public void RemoveDialogueLine(DialogueLine line)
    {
        _context.DialogueLines.Remove(line);
    }

    public void RemoveDialogueLines(IEnumerable<DialogueLine> lines)
    {
        _context.DialogueLines.RemoveRange(lines);
    }
}
