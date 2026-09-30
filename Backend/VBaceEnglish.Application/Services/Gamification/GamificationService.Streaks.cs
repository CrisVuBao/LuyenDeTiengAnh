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

        // Đánh giá trạng thái streak trước (tiêu hao freeze nếu bỏ lỡ ngày hôm qua, hoặc reset về 0 nếu đứt chuỗi)
        EvaluateStreak(gamification, todayVn);

        var lastActiveVn = gamification.LastActiveDate?.Date;

        if (lastActiveVn == todayVn)
        {
            // Đã ghi nhận học tập hôm nay, không tăng thêm lần nữa
            return;
        }

        if (lastActiveVn == todayVn.AddDays(-1))
        {
            // Tiếp nối ngày học hôm qua liên tiếp
            gamification.CurrentStreak++;
            if (gamification.CurrentStreak % 7 == 0 && gamification.StreakFreezeCount < 3)
            {
                gamification.StreakFreezeCount++;
            }
        }
        else
        {
            // Bắt đầu chuỗi mới từ 1 (chuỗi trước đó đã bị đứt về 0 hoặc người dùng mới)
            gamification.CurrentStreak = 1;
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
