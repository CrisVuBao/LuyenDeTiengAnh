using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Application.DTOs.Dashboard;
using VBaceEnglish.Application.DTOs.Progress;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public interface IUserProgressService
{
    Task<Response<IEnumerable<UserProgressDto>>> GetProgressAsync(int userId, int toeicTestId);
    Task<Response<UserProgressDto>> MarkProgressAsync(int userId, MarkProgressDto model);
    Task<Response<bool>> ResetProgressAsync(int userId, ResetPartProgressDto model);
}

public class UserProgressService : IUserProgressService
{
    private readonly IUnitOfWork _unitOfWork;

    public UserProgressService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Response<IEnumerable<UserProgressDto>>> GetProgressAsync(int userId, int toeicTestId)
    {
        var progresses = await _unitOfWork.UserProgresses.GetProgressByUserAndTestAsync(userId, toeicTestId);
        var dtos = progresses.Select(p => new UserProgressDto
        {
            PartNumber = p.PartNumber,
            QuestionNumber = p.QuestionNumber,
            IsConfident = p.IsConfident,
            IsRevealed = p.IsRevealed,
            SelectedAnswer = p.SelectedAnswer
        });

        return Response<IEnumerable<UserProgressDto>>.SuccessResult("Lấy tiến độ thành công", dtos);
    }

    public async Task<Response<UserProgressDto>> MarkProgressAsync(int userId, MarkProgressDto model)
    {
        var existing = await _unitOfWork.UserProgresses.GetByQuestionAsync(
            userId, model.ToeicTestId, model.PartNumber, model.QuestionNumber);

        if (existing == null)
        {
            existing = new UserStudyProgress
            {
                UserId = userId,
                ToeicTestId = model.ToeicTestId,
                PartNumber = model.PartNumber,
                QuestionNumber = model.QuestionNumber,
                IsConfident = model.IsConfident,
                IsRevealed = model.IsRevealed ?? false,
                SelectedAnswer = model.SelectedAnswer,
                UpdatedAt = DateTime.UtcNow
            };
            await _unitOfWork.UserProgresses.AddAsync(existing);
        }
        else
        {
            // Toggle confident logic if clicking same value
            if (model.IsConfident.HasValue)
            {
                if (existing.IsConfident == model.IsConfident.Value)
                    existing.IsConfident = null;
                else
                    existing.IsConfident = model.IsConfident.Value;
            }

            if (model.IsRevealed.HasValue)
                existing.IsRevealed = model.IsRevealed.Value;

            if (model.SelectedAnswer != null)
                existing.SelectedAnswer = model.SelectedAnswer;

            existing.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.UserProgresses.Update(existing);
        }

        // Update Summary
        var summary = await _unitOfWork.UserProgresses.GetSummaryAsync(userId, model.ToeicTestId);
        var test = await _unitOfWork.ToeicTests.GetByIdAsync(model.ToeicTestId);
        int totalQuestions = test?.TotalQuestions ?? 100;

        var allProgress = await _unitOfWork.UserProgresses.GetProgressByUserAndTestAsync(userId, model.ToeicTestId);
        int confidentCount = allProgress.Count(p => p.IsConfident == true);
        int completedCount = allProgress.Count(p => p.IsRevealed || p.SelectedAnswer != null || p.IsConfident.HasValue);

        if (summary == null)
        {
            summary = new UserTestSummary
            {
                UserId = userId,
                ToeicTestId = model.ToeicTestId,
                CompletedQuestions = completedCount,
                ConfidentQuestions = confidentCount,
                TotalQuestions = totalQuestions,
                PercentCompleted = totalQuestions > 0 ? Math.Round((double)confidentCount / totalQuestions * 100, 1) : 0,
                LastAccessedAt = DateTime.UtcNow
            };
            await _unitOfWork.UserProgresses.AddSummaryAsync(summary);
        }
        else
        {
            summary.CompletedQuestions = completedCount;
            summary.ConfidentQuestions = confidentCount;
            summary.TotalQuestions = totalQuestions;
            summary.PercentCompleted = totalQuestions > 0 ? Math.Round((double)confidentCount / totalQuestions * 100, 1) : 0;
            summary.LastAccessedAt = DateTime.UtcNow;
            _unitOfWork.UserProgresses.UpdateSummary(summary);
        }

        await _unitOfWork.CompleteAsync();

        return Response<UserProgressDto>.SuccessResult("Cập nhật tiến độ thành công", new UserProgressDto
        {
            PartNumber = existing.PartNumber,
            QuestionNumber = existing.QuestionNumber,
            IsConfident = existing.IsConfident,
            IsRevealed = existing.IsRevealed,
            SelectedAnswer = existing.SelectedAnswer
        });
    }

    public async Task<Response<bool>> ResetProgressAsync(int userId, ResetPartProgressDto model)
    {
        var allProgress = (await _unitOfWork.UserProgresses.GetProgressByUserAndTestAsync(userId, model.ToeicTestId)).ToList();
        var toRemove = model.PartNumber == 0 
            ? allProgress 
            : allProgress.Where(p => p.PartNumber == model.PartNumber).ToList();

        if (toRemove.Any())
        {
            _unitOfWork.UserProgresses.RemoveRange(toRemove);
        }

        // Update summary
        var summary = await _unitOfWork.UserProgresses.GetSummaryAsync(userId, model.ToeicTestId);
        if (summary != null)
        {
            var remaining = allProgress.Except(toRemove).ToList();
            int confidentCount = remaining.Count(p => p.IsConfident == true);
            int completedCount = remaining.Count(p => p.IsRevealed || p.SelectedAnswer != null || p.IsConfident.HasValue);

            summary.CompletedQuestions = completedCount;
            summary.ConfidentQuestions = confidentCount;
            summary.PercentCompleted = summary.TotalQuestions > 0 ? Math.Round((double)confidentCount / summary.TotalQuestions * 100, 1) : 0;
            summary.LastAccessedAt = DateTime.UtcNow;
            _unitOfWork.UserProgresses.UpdateSummary(summary);
        }

        await _unitOfWork.CompleteAsync();
        return Response<bool>.SuccessResult("Reset tiến độ thành công", true);
    }
}

public interface IDashboardService
{
    Task<Response<DashboardStatsDto>> GetStatsAsync(int userId);
}

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;

    public DashboardService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Response<DashboardStatsDto>> GetStatsAsync(int userId)
    {
        var tests = (await _unitOfWork.ToeicTests.GetAllAsync()).ToList();
        var summaries = (await _unitOfWork.UserProgresses.GetSummariesByUserAsync(userId)).ToList();

        int totalQuestions = tests.Sum(t => t.TotalQuestions);
        int totalConfident = summaries.Sum(s => s.ConfidentQuestions);
        int totalCompleted = summaries.Sum(s => s.CompletedQuestions);

        var stats = new DashboardStatsDto
        {
            TotalTests = tests.Count,
            TotalQuestionsLearned = totalCompleted,
            TotalConfidentQuestions = totalConfident,
            OverallMasteryRate = totalQuestions > 0 ? Math.Round((double)totalConfident / totalQuestions * 100, 1) : 0,
            CurrentStreakDays = 3, // Streak estimate
            RecentTests = summaries.Select(s => new TestSummaryDto
            {
                ToeicTestId = s.ToeicTestId,
                TestId = s.ToeicTest?.TestId ?? "TEST",
                Title = s.ToeicTest?.Title ?? "Đề thi",
                CompletedQuestions = s.CompletedQuestions,
                ConfidentQuestions = s.ConfidentQuestions,
                TotalQuestions = s.TotalQuestions,
                PercentCompleted = s.PercentCompleted,
                LastAccessedAt = s.LastAccessedAt
            }).OrderByDescending(s => s.LastAccessedAt).ToList()
        };

        return Response<DashboardStatsDto>.SuccessResult("Lấy thống kê thành công", stats);
    }
}

