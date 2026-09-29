using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public partial class GamificationService
{
    public async Task UpdateStreakAsync(int userId)
    {
        var gamification = await _unitOfWork.Gamification.GetByUserIdAsync(userId);
        if (gamification == null) return;

        var nowVn = GetVietnamTime();
        var todayVn = nowVn.Date;
        var lastActiveVn = gamification.LastActiveDate?.Date ?? DateTime.MinValue;

        if (lastActiveVn == todayVn) return;

        if (lastActiveVn == todayVn.AddDays(-1))
        {
            gamification.CurrentStreak++;
            if (gamification.CurrentStreak % 7 == 0 && gamification.StreakFreezeCount < 3)
            {
                gamification.StreakFreezeCount++;
            }
        }
        else
        {
            if (gamification.StreakFreezeCount > 0)
            {
                gamification.StreakFreezeCount--;
                gamification.CurrentStreak++;
            }
            else
            {
                gamification.CurrentStreak = 1;
            }
        }

        if (gamification.CurrentStreak > gamification.LongestStreak)
        {
            gamification.LongestStreak = gamification.CurrentStreak;
        }

        gamification.LastActiveDate = nowVn;
        gamification.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Gamification.UpsertAsync(gamification);
        await _unitOfWork.CompleteAsync();
    }
}
