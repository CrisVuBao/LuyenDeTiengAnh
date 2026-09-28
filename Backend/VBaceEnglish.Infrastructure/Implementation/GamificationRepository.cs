using Microsoft.EntityFrameworkCore;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Domain.Models;
using VBaceEnglish.Infrastructure.Data;

namespace VBaceEnglish.Infrastructure.Implementation;

public class GamificationRepository : IGamificationRepository
{
    private readonly AppDBContext _context;

    public GamificationRepository(AppDBContext context)
    {
        _context = context;
    }

    public async Task<UserGamification?> GetByUserIdAsync(int userId)
    {
        return await _context.Set<UserGamification>()
            .Include(g => g.User)
            .FirstOrDefaultAsync(g => g.UserId == userId);
    }

    public async Task UpsertAsync(UserGamification entity)
    {
        var existing = await _context.Set<UserGamification>().FirstOrDefaultAsync(e => e.UserId == entity.UserId);
        if (existing == null)
        {
            await _context.Set<UserGamification>().AddAsync(entity);
        }
        else
        {
            _context.Entry(existing).CurrentValues.SetValues(entity);
        }
    }

    public async Task AddXPTransactionAsync(XPTransaction transaction)
    {
        await _context.Set<XPTransaction>().AddAsync(transaction);
    }

    public async Task<IEnumerable<UserGamification>> GetWeeklyLeaderboardAsync(int top = 20)
    {
        var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
        var adminUserIds = adminRole != null 
            ? await _context.UserRoles.Where(ur => ur.RoleId == adminRole.Id).Select(ur => ur.UserId).ToListAsync()
            : new List<int>();

        return await _context.Set<UserGamification>()
            .Include(g => g.User)
            .Where(g => !adminUserIds.Contains(g.UserId))
            .OrderByDescending(g => g.WeeklyXP)
            .ThenByDescending(g => g.TotalXP)
            .Take(top)
            .ToListAsync();
    }

    public async Task<int> GetUserRankAsync(int userId)
    {
        var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
        var adminUserIds = adminRole != null 
            ? await _context.UserRoles.Where(ur => ur.RoleId == adminRole.Id).Select(ur => ur.UserId).ToListAsync()
            : new List<int>();

        // Tài khoản Admin không tham gia xếp hạng học viên
        if (adminUserIds.Contains(userId)) return 0;

        var userGamification = await GetByUserIdAsync(userId);
        if (userGamification == null) return 0;

        var rank = await _context.Set<UserGamification>()
            .Where(g => !adminUserIds.Contains(g.UserId))
            .CountAsync(g => g.WeeklyXP > userGamification.WeeklyXP || 
                            (g.WeeklyXP == userGamification.WeeklyXP && g.TotalXP > userGamification.TotalXP)) + 1;
        return rank;
    }
}
