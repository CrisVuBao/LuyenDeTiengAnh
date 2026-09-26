using Microsoft.AspNetCore.Identity;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Application.DTOs.Dashboard;
using VBaceEnglish.Application.DTOs.Progress;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Enums;
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
    Task<Response<bool>> ApproveStudentAsync(int userId, bool isApproved);
    Task<Response<int>> ApproveAllPendingStudentsAsync();
    Task<Response<bool>> DeleteStudentAsync(int userId);
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
        var toeicProgresses = (await _unitOfWork.UserProgresses.GetAllProgressByUserAsync(userId)).ToList();

        var binoProgresses = (await _unitOfWork.BinoLearning.GetProgressByUserAsync(userId)).ToList();
        var binoSrsReviews = (await _unitOfWork.BinoLearning.GetAllSRSReviewsByUserAsync(userId)).ToList();

        int totalQuestions = tests.Sum(t => t.TotalQuestions);
        int totalConfident = summaries.Sum(s => s.ConfidentQuestions);
        int totalCompleted = summaries.Sum(s => s.CompletedQuestions);

        int binoCompleted = binoProgresses.Count(p => p.IsCompleted);
        int binoTotal = 72;
        int binoTimeMinutes = (int)Math.Ceiling(binoProgresses.Sum(p => p.TimeSpentSeconds) / 60.0);

        var activityDates = new List<DateTime>();
        activityDates.AddRange(binoProgresses.Select(p => p.LastAccessedAt));
        activityDates.AddRange(binoSrsReviews.Where(r => r.LastReviewedAt.HasValue).Select(r => r.LastReviewedAt!.Value));
        activityDates.AddRange(toeicProgresses.Select(p => p.UpdatedAt));
        int streakDays = BinoBookService.CalculateConsecutiveStreakDays(activityDates);

        var stats = new DashboardStatsDto
        {
            TotalTests = tests.Count,
            TotalQuestionsLearned = totalCompleted,
            TotalConfidentQuestions = totalConfident,
            OverallMasteryRate = totalQuestions > 0 ? Math.Round((double)totalConfident / totalQuestions * 100, 1) : 0,
            CurrentStreakDays = streakDays,
            BinoCompletedLessons = binoCompleted,
            BinoTotalLessons = binoTotal,
            BinoProgressPercent = Math.Round((double)binoCompleted / binoTotal * 100, 1),
            BinoSavedFlashcards = binoSrsReviews.Count,
            BinoTimeSpentMinutes = binoTimeMinutes,
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

    private async Task<List<ApplicationUser>> GetNonAdminUsersAsync()
    {
        var allUsers = _userManager.Users.ToList();
        var students = new List<ApplicationUser>();
        foreach (var u in allUsers)
        {
            var roles = await _userManager.GetRolesAsync(u);
            if (!roles.Contains(UserRole.Admin.ToString()))
            {
                students.Add(u);
            }
        }
        return students;
    }

    public async Task<Response<AdminDashboardStatsDto>> GetAdminStatsAsync()
    {
        var tests = (await _unitOfWork.ToeicTests.GetAllAsync()).ToList();
        int totalQuestions = tests.Sum(t => t.TotalQuestions);
        var students = await GetNonAdminUsersAsync();
        int totalStudents = students.Count;
        int approvedCount = students.Count(s => s.IsApproved);
        int pendingCount = students.Count(s => !s.IsApproved);

        int totalInteractions = await _unitOfWork.UserProgresses.GetTotalInteractionCountAsync();
        var allSummaries = (await _unitOfWork.UserProgresses.GetAllSummariesAsync()).ToList();
        var allBinoProgresses = (await _unitOfWork.BinoLearning.GetAllProgressesAsync()).ToList();
        var allBinoSrs = (await _unitOfWork.BinoLearning.GetAllSRSReviewsAsync()).ToList();

        int totalBinoCompleted = allBinoProgresses.Count(p => p.IsCompleted);

        var recentStudents = students
            .OrderBy(s => s.IsApproved) // Ưu tiên hiển thị học viên đang chờ duyệt lên đầu
            .ThenByDescending(s => s.CreatedAt)
            .Take(8)
            .Select(s =>
            {
                var userSummaries = allSummaries.Where(x => x.UserId == s.Id).ToList();
                var userBino = allBinoProgresses.Where(x => x.UserId == s.Id).ToList();
                var userSrsCount = allBinoSrs.Count(x => x.UserId == s.Id);

                int completed = userSummaries.Sum(x => x.CompletedQuestions);
                int confident = userSummaries.Sum(x => x.ConfidentQuestions);
                int totalQ = userSummaries.Sum(x => x.TotalQuestions);
                int binoDone = userBino.Count(x => x.IsCompleted);

                return new AdminStudentProgressDto
                {
                    UserId = s.Id,
                    FullName = s.FullName,
                    Email = s.Email ?? "",
                    PhoneNumber = s.PhoneNumber,
                    IsApproved = s.IsApproved,
                    ApprovedAt = s.ApprovedAt,
                    CreatedAt = s.CreatedAt,
                    LastLoginAt = s.LastLoginAt,
                    TestsEnrolled = userSummaries.Count,
                    CompletedQuestions = completed,
                    ConfidentQuestions = confident,
                    MasteryRate = totalQ > 0 ? Math.Round((double)confident / totalQ * 100, 1) : 0,
                    BinoCompletedLessons = binoDone,
                    BinoTotalLessons = 72,
                    BinoProgressPercent = Math.Round((double)binoDone / 72.0 * 100, 1),
                    BinoSavedFlashcards = userSrsCount,
                    BinoTimeSpentMinutes = (int)Math.Ceiling(userBino.Sum(x => x.TimeSpentSeconds) / 60.0)
                };
            }).ToList();

        var adminStats = new AdminDashboardStatsDto
        {
            TotalStudents = totalStudents,
            ApprovedStudentsCount = approvedCount,
            PendingStudentsCount = pendingCount,
            TotalTests = tests.Count,
            TotalQuestions = totalQuestions,
            TotalStudyInteractions = totalInteractions + allBinoProgresses.Count,
            TotalBinoCompletedLessons = totalBinoCompleted,
            RecentStudents = recentStudents
        };

        return Response<AdminDashboardStatsDto>.SuccessResult("Lấy thống kê quản trị thành công", adminStats);
    }

    public async Task<Response<List<AdminStudentProgressDto>>> GetAdminStudentsAsync()
    {
        var students = await GetNonAdminUsersAsync();
        var allSummaries = (await _unitOfWork.UserProgresses.GetAllSummariesAsync()).ToList();
        var allBinoProgresses = (await _unitOfWork.BinoLearning.GetAllProgressesAsync()).ToList();
        var allBinoSrs = (await _unitOfWork.BinoLearning.GetAllSRSReviewsAsync()).ToList();

        var result = students.Select(s =>
        {
            var userSummaries = allSummaries.Where(x => x.UserId == s.Id).ToList();
            var userBino = allBinoProgresses.Where(x => x.UserId == s.Id).ToList();
            var userSrsCount = allBinoSrs.Count(x => x.UserId == s.Id);

            int completed = userSummaries.Sum(x => x.CompletedQuestions);
            int confident = userSummaries.Sum(x => x.ConfidentQuestions);
            int totalQ = userSummaries.Sum(x => x.TotalQuestions);
            int binoDone = userBino.Count(x => x.IsCompleted);

            return new AdminStudentProgressDto
            {
                UserId = s.Id,
                FullName = s.FullName,
                Email = s.Email ?? "",
                PhoneNumber = s.PhoneNumber,
                IsApproved = s.IsApproved,
                ApprovedAt = s.ApprovedAt,
                CreatedAt = s.CreatedAt,
                LastLoginAt = s.LastLoginAt,
                TestsEnrolled = userSummaries.Count,
                CompletedQuestions = completed,
                ConfidentQuestions = confident,
                MasteryRate = totalQ > 0 ? Math.Round((double)confident / totalQ * 100, 1) : 0,
                BinoCompletedLessons = binoDone,
                BinoTotalLessons = 72,
                BinoProgressPercent = Math.Round((double)binoDone / 72.0 * 100, 1),
                BinoSavedFlashcards = userSrsCount,
                BinoTimeSpentMinutes = (int)Math.Ceiling(userBino.Sum(x => x.TimeSpentSeconds) / 60.0)
            };
        })
        .OrderBy(s => s.IsApproved) // Tài khoản chờ duyệt lên trên cùng
        .ThenByDescending(s => s.CreatedAt)
        .ToList();

        return Response<List<AdminStudentProgressDto>>.SuccessResult("Lấy danh sách học viên thành công", result);
    }

    public async Task<Response<bool>> ApproveStudentAsync(int userId, bool isApproved)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return Response<bool>.Failure("Không tìm thấy tài khoản học viên.");

        user.IsApproved = isApproved;
        user.EmailConfirmed = isApproved;
        user.ApprovedAt = isApproved ? DateTime.UtcNow : null;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return Response<bool>.Failure("Không thể cập nhật trạng thái duyệt tài khoản.");

        var msg = isApproved
            ? $"Đã phê duyệt tài khoản học viên \"{user.FullName}\" ({user.Email}). Học viên đã có thể đăng nhập!"
            : $"Đã thu hồi quyền đăng nhập (chuyển về chờ duyệt) đối với \"{user.FullName}\".";

        return Response<bool>.SuccessResult(msg, true);
    }

    public async Task<Response<int>> ApproveAllPendingStudentsAsync()
    {
        var students = await GetNonAdminUsersAsync();
        var pending = students.Where(s => !s.IsApproved).ToList();
        int count = 0;

        foreach (var s in pending)
        {
            s.IsApproved = true;
            s.EmailConfirmed = true;
            s.ApprovedAt = DateTime.UtcNow;
            var res = await _userManager.UpdateAsync(s);
            if (res.Succeeded) count++;
        }

        return Response<int>.SuccessResult($"Đã phê duyệt tất cả {count} tài khoản học viên đang chờ!", count);
    }

    public async Task<Response<bool>> DeleteStudentAsync(int userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return Response<bool>.Failure("Không tìm thấy tài khoản học viên.");

        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains("Admin"))
            return Response<bool>.Failure("Không thể xóa tài khoản Quản trị viên.");

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return Response<bool>.Failure("Lỗi khi xóa tài khoản học viên.");

        return Response<bool>.SuccessResult($"Đã xóa tài khoản \"{user.FullName}\" ({user.Email}).", true);
    }
}
