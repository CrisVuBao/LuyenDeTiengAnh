using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Domain.Models;
using VBaceEnglish.Infrastructure.Data;

namespace VBaceEnglish.Infrastructure.Implementation;

public class ContentModuleRepository : IContentModuleRepository
{
    private readonly AppDBContext _context;

    public ContentModuleRepository(AppDBContext context)
    {
        _context = context;
    }

    public async Task<List<ContentModule>> GetActiveModulesAsync()
    {
        return await _context.ContentModules
            .AsNoTracking()
            .Where(m => m.IsActive)
            .OrderBy(m => m.OrderIndex)
            .ToListAsync();
    }

    public async Task<List<ContentModule>> GetAllModulesAsync()
    {
        return await _context.ContentModules
            .AsNoTracking()
            .OrderBy(m => m.OrderIndex)
            .ToListAsync();
    }

    public async Task<ContentModule?> GetByIdAsync(int id)
    {
        return await _context.ContentModules.FindAsync(id);
    }

    public async Task<ContentModule?> GetByCodeWithLessonsAsync(string code)
    {
        return await _context.ContentModules
            .Include(m => m.Lessons.OrderBy(l => l.OrderIndex))
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Code.ToLower() == code.ToLower());
    }

    public async Task<ContentModule?> GetByCodeAsync(string code)
    {
        return await _context.ContentModules
            .FirstOrDefaultAsync(m => m.Code.ToLower() == code.ToLower());
    }

    public async Task<List<UserModuleProgress>> GetUserProgressesAsync(int userId)
    {
        return await _context.UserModuleProgresses
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .ToListAsync();
    }

    public async Task<UserModuleProgress?> GetUserProgressAsync(int userId, int moduleId)
    {
        return await _context.UserModuleProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ContentModuleId == moduleId);
    }

    public async Task AddUserProgressAsync(UserModuleProgress progress)
    {
        await _context.UserModuleProgresses.AddAsync(progress);
    }

    public void UpdateUserProgress(UserModuleProgress progress)
    {
        _context.UserModuleProgresses.Update(progress);
    }

    public void UpdateModule(ContentModule module)
    {
        _context.ContentModules.Update(module);
    }
}
