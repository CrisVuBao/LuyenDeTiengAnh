using Microsoft.Extensions.Caching.Memory;
using VBaceEnglish.Application.DTOs.Gamification;
using VBaceEnglish.Application.Helpers;

namespace VBaceEnglish.Application.Services;

public partial class GamificationService
{
    public async Task<Response<List<LeaderboardEntryDto>>> GetLeaderboardAsync()
    {
        const string cacheKey = "weekly_leaderboard_top20";
        if (_memoryCache.TryGetValue(cacheKey, out List<LeaderboardEntryDto>? cachedList) && cachedList != null)
        {
            return Response<List<LeaderboardEntryDto>>.SuccessResult("Bảng xếp hạng tuần", cachedList);
        }

        var top = await _unitOfWork.Gamification.GetWeeklyLeaderboardAsync(20);
        var list = new List<LeaderboardEntryDto>();
        int rank = 1;

        foreach (var g in top)
        {
            int trueLevel = CalculateLevel(g.TotalXP);
            list.Add(new LeaderboardEntryDto
            {
                UserId = g.UserId,
                FullName = g.User?.FullName ?? "Học viên",
                WeeklyXP = g.WeeklyXP,
                TotalXP = g.TotalXP,
                CurrentLevel = trueLevel,
                LevelTitle = GetLevelTitle(trueLevel),
                Rank = rank++,
                CurrentStreak = g.CurrentStreak
            });
        }

        _memoryCache.Set(cacheKey, list, TimeSpan.FromSeconds(30));
        return Response<List<LeaderboardEntryDto>>.SuccessResult("Bảng xếp hạng tuần", list);
    }
}
