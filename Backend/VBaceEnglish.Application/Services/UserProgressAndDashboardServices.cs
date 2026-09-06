using Microsoft.AspNetCore.Identity;
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
    Task<Response<List<TestSummaryDto>>> GetAllSummariesAsync(int userId);
    Task<Response<List<UnsureQuestionDto>>> GetUnsureQuestionsAsync(int userId, int? testId);
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

    public async Task<Response<List<TestSummaryDto>>> GetAllSummariesAsync(int userId)
    {
        var summaries = (await _unitOfWork.UserProgresses.GetSummariesByUserAsync(userId)).ToList();
        var dtos = summaries.Select(s => new TestSummaryDto
        {
            ToeicTestId = s.ToeicTestId,
            TestId = s.ToeicTest?.TestId ?? "TEST",
            Title = s.ToeicTest?.Title ?? "Đề thi",
            CompletedQuestions = s.CompletedQuestions,
            ConfidentQuestions = s.ConfidentQuestions,
            TotalQuestions = s.TotalQuestions,
            PercentCompleted = s.PercentCompleted,
            LastAccessedAt = s.LastAccessedAt
        }).OrderByDescending(s => s.LastAccessedAt).ToList();

        return Response<List<TestSummaryDto>>.SuccessResult("Lấy tóm tắt tiến độ thành công", dtos);
    }

    public async Task<Response<List<UnsureQuestionDto>>> GetUnsureQuestionsAsync(int userId, int? testId)
    {
        var progressList = (await _unitOfWork.UserProgresses.GetAllProgressByUserAsync(userId))
            .Where(p => p.IsConfident == false && (!testId.HasValue || p.ToeicTestId == testId.Value))
            .ToList();

        var result = new List<UnsureQuestionDto>();
        var testGroups = progressList.GroupBy(p => p.ToeicTestId);
        foreach (var group in testGroups)
        {
            var test = await _unitOfWork.ToeicTests.GetWithDetailsAsync(group.Key);
            if (test == null) continue;

            foreach (var prog in group)
            {
                var item = new UnsureQuestionDto
                {
                    ToeicTestId = test.Id,
                    TestCode = test.TestId,
                    TestTitle = test.Title,
                    PartNumber = prog.PartNumber,
                    QuestionNumber = prog.QuestionNumber,
                    UpdatedAt = prog.UpdatedAt
                };

                if (prog.PartNumber == 5)
                {
                    var q = test.Part5Questions.FirstOrDefault(x => x.QuestionNumber == prog.QuestionNumber);
                    if (q != null)
                    {
                        item.QuestionText = q.Question;
                        item.Translation = q.Translation;
                        item.CorrectAnswer = q.CorrectAnswer;
                        item.Explanation = q.Explanation;
                    }
                }
                else if (prog.PartNumber == 6)
                {
                    var q = test.Part6Passages.SelectMany(p => p.Questions).FirstOrDefault(x => x.QuestionNumber == prog.QuestionNumber);
                    if (q != null)
                    {
                        item.QuestionText = q.Question ?? q.Text;
                        item.Translation = q.Translation;
                        item.CorrectAnswer = q.CorrectAnswer;
                        item.Explanation = q.Explanation;
                    }
                }
                else if (prog.PartNumber == 7)
                {
                    var q = test.Part7Passages.SelectMany(p => p.Questions).FirstOrDefault(x => x.QuestionNumber == prog.QuestionNumber);
                    if (q != null)
                    {
                        item.QuestionText = q.Question;
                        item.Translation = q.Translation;
                        item.CorrectAnswer = q.CorrectAnswer;
                        item.Explanation = q.Explanation;
                    }
                }
                else if (prog.PartNumber == 1)
                {
                    var q = test.Part1Questions.FirstOrDefault(x => x.QuestionNumber == prog.QuestionNumber);
                    if (q != null)
                    {
                        item.QuestionText = q.CorrectAnswerText;
                        item.CorrectAnswer = "C";
                    }
                }
                else if (prog.PartNumber == 2)
                {
                    var q = test.Part2Questions.FirstOrDefault(x => x.QuestionNumber == prog.QuestionNumber);
                    if (q != null)
                    {
                        item.CorrectAnswer = q.CorrectAnswer;
                    }
                }
                else if (prog.PartNumber == 3 || prog.PartNumber == 4)
                {
                    var q = test.Part34Passages.SelectMany(g => g.Questions).FirstOrDefault(x => x.QuestionNumber == prog.QuestionNumber);
                    if (q != null)
                    {
                        item.QuestionText = q.Question;
                        item.CorrectAnswer = q.CorrectAnswerText;
                    }
                }

                result.Add(item);
            }
        }

        return Response<List<UnsureQuestionDto>>.SuccessResult(
            "Lấy danh sách câu hỏi chưa chắc thành công", 
            result.OrderByDescending(x => x.UpdatedAt).ToList());
    }
}

public interface IDashboardService
{
    Task<Response<DashboardStatsDto>> GetStatsAsync(int userId);
    Task<Response<AdminDashboardStatsDto>> GetAdminStatsAsync();
    Task<Response<List<AdminStudentProgressDto>>> GetAdminStudentsAsync();
}

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;

    public DashboardService(IUnitOfWork unitOfWork, UserManager<ApplicationUser> userManager)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
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
            CurrentStreakDays = 3,
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

    public async Task<Response<AdminDashboardStatsDto>> GetAdminStatsAsync()
    {
        var tests = (await _unitOfWork.ToeicTests.GetAllAsync()).ToList();
        int totalQuestions = tests.Sum(t => t.TotalQuestions);
        var students = await _userManager.GetUsersInRoleAsync("Student");
        int totalStudents = students.Count;
        int totalInteractions = await _unitOfWork.UserProgresses.GetTotalInteractionCountAsync();
        var allSummaries = (await _unitOfWork.UserProgresses.GetAllSummariesAsync()).ToList();

        var recentStudents = students
            .OrderByDescending(s => s.CreatedAt)
            .Take(5)
            .Select(s =>
            {
                var userSummaries = allSummaries.Where(x => x.UserId == s.Id).ToList();
                int completed = userSummaries.Sum(x => x.CompletedQuestions);
                int confident = userSummaries.Sum(x => x.ConfidentQuestions);
                int totalQ = userSummaries.Sum(x => x.TotalQuestions);
                return new AdminStudentProgressDto
                {
                    UserId = s.Id,
                    FullName = s.FullName,
                    Email = s.Email ?? "",
                    PhoneNumber = s.PhoneNumber,
                    CreatedAt = s.CreatedAt,
                    LastLoginAt = s.LastLoginAt,
                    TestsEnrolled = userSummaries.Count,
                    CompletedQuestions = completed,
                    ConfidentQuestions = confident,
                    MasteryRate = totalQ > 0 ? Math.Round((double)confident / totalQ * 100, 1) : 0
                };
            }).ToList();

        var adminStats = new AdminDashboardStatsDto
        {
            TotalStudents = totalStudents,
            TotalTests = tests.Count,
            TotalQuestions = totalQuestions,
            TotalStudyInteractions = totalInteractions,
            RecentStudents = recentStudents
        };

        return Response<AdminDashboardStatsDto>.SuccessResult("Lấy thống kê quản trị thành công", adminStats);
    }

    public async Task<Response<List<AdminStudentProgressDto>>> GetAdminStudentsAsync()
    {
        var students = await _userManager.GetUsersInRoleAsync("Student");
        var allSummaries = (await _unitOfWork.UserProgresses.GetAllSummariesAsync()).ToList();

        var result = students.Select(s =>
        {
            var userSummaries = allSummaries.Where(x => x.UserId == s.Id).ToList();
            int completed = userSummaries.Sum(x => x.CompletedQuestions);
            int confident = userSummaries.Sum(x => x.ConfidentQuestions);
            int totalQ = userSummaries.Sum(x => x.TotalQuestions);
            return new AdminStudentProgressDto
            {
                UserId = s.Id,
                FullName = s.FullName,
                Email = s.Email ?? "",
                PhoneNumber = s.PhoneNumber,
                CreatedAt = s.CreatedAt,
                LastLoginAt = s.LastLoginAt,
                TestsEnrolled = userSummaries.Count,
                CompletedQuestions = completed,
                ConfidentQuestions = confident,
                MasteryRate = totalQ > 0 ? Math.Round((double)confident / totalQ * 100, 1) : 0
            };
        }).OrderByDescending(s => s.CreatedAt).ToList();

        return Response<List<AdminStudentProgressDto>>.SuccessResult("Lấy danh sách học viên thành công", result);
    }
}
