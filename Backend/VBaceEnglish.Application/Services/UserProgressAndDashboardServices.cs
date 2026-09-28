using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Application.Contracts.Services;
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
    Task<Response<UserReflexProgressDto>> GetReflexProgressAsync(int userId);
    Task<Response<bool>> SaveReflexProgressAsync(int userId, UpsertReflexProgressDto dto);
    Task<Response<UserEbookProgressDto>> GetEbookProgressAsync(int userId, string? bookSlug);
    Task<Response<bool>> SaveEbookProgressAsync(int userId, UpsertEbookProgressDto dto);
    Task<Response<UserVocabProgressDto>> GetVocabProgressAsync(int userId);
    Task<Response<bool>> SaveVocabProgressAsync(int userId, UpsertVocabProgressDto dto);
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

    public async Task<Response<UserReflexProgressDto>> GetReflexProgressAsync(int userId)
    {
        var entity = await _unitOfWork.UserProgresses.GetReflexProgressAsync(userId);
        if (entity == null)
        {
            return Response<UserReflexProgressDto>.SuccessResult("Chưa có tiến độ phản xạ", new UserReflexProgressDto
            {
                MasteredCount = 0,
                StarredCount = 0,
                WeakCount = 0,
                LastStudiedUnit = 1,
                DailyGoal = 30,
                ProgressDataJson = "{}",
                UpdatedAt = DateTime.UtcNow
            });
        }

        return Response<UserReflexProgressDto>.SuccessResult("Lấy tiến độ phản xạ thành công", new UserReflexProgressDto
        {
            MasteredCount = entity.MasteredCount,
            StarredCount = entity.StarredCount,
            WeakCount = entity.WeakCount,
            LastStudiedUnit = entity.LastStudiedUnit,
            DailyGoal = entity.DailyGoal,
            ProgressDataJson = entity.ProgressDataJson,
            UpdatedAt = entity.UpdatedAt
        });
    }

    public async Task<Response<bool>> SaveReflexProgressAsync(int userId, UpsertReflexProgressDto dto)
    {
        var existing = await _unitOfWork.UserProgresses.GetReflexProgressAsync(userId);
        if (existing == null)
        {
            var newEntity = new UserReflexProgress
            {
                UserId = userId,
                MasteredCount = dto.MasteredCount,
                StarredCount = dto.StarredCount,
                WeakCount = dto.WeakCount,
                LastStudiedUnit = dto.LastStudiedUnit,
                DailyGoal = dto.DailyGoal,
                ProgressDataJson = string.IsNullOrWhiteSpace(dto.ProgressDataJson) ? "{}" : dto.ProgressDataJson,
                UpdatedAt = DateTime.UtcNow
            };
            await _unitOfWork.UserProgresses.AddReflexProgressAsync(newEntity);
        }
        else
        {
            existing.MasteredCount = dto.MasteredCount;
            existing.StarredCount = dto.StarredCount;
            existing.WeakCount = dto.WeakCount;
            existing.LastStudiedUnit = dto.LastStudiedUnit;
            existing.DailyGoal = dto.DailyGoal;
            existing.ProgressDataJson = string.IsNullOrWhiteSpace(dto.ProgressDataJson) ? "{}" : dto.ProgressDataJson;
            existing.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.UserProgresses.UpdateReflexProgress(existing);
        }

        await _unitOfWork.CompleteAsync();
        return Response<bool>.SuccessResult("Đồng bộ tiến độ phản xạ thành công", true);
    }

    public async Task<Response<UserEbookProgressDto>> GetEbookProgressAsync(int userId, string? bookSlug)
    {
        var slug = string.IsNullOrWhiteSpace(bookSlug) ? "chem-tieng-anh-khong-can-dong-nao" : bookSlug;
        var entity = await _unitOfWork.UserProgresses.GetEbookProgressAsync(userId, slug);
        if (entity == null)
        {
            return Response<UserEbookProgressDto>.SuccessResult("Chưa có tiến độ đọc sách", new UserEbookProgressDto
            {
                BookSlug = slug,
                LastCfi = null,
                BookmarksJson = "[]",
                UpdatedAt = DateTime.UtcNow
            });
        }

        return Response<UserEbookProgressDto>.SuccessResult("Lấy tiến độ đọc sách thành công", new UserEbookProgressDto
        {
            BookSlug = entity.BookSlug,
            LastCfi = entity.LastCfi,
            BookmarksJson = entity.BookmarksJson,
            UpdatedAt = entity.UpdatedAt
        });
    }

    public async Task<Response<bool>> SaveEbookProgressAsync(int userId, UpsertEbookProgressDto dto)
    {
        var slug = string.IsNullOrWhiteSpace(dto.BookSlug) ? "chem-tieng-anh-khong-can-dong-nao" : dto.BookSlug;
        var existing = await _unitOfWork.UserProgresses.GetEbookProgressAsync(userId, slug);
        if (existing == null)
        {
            var newEntity = new UserEbookProgress
            {
                UserId = userId,
                BookSlug = slug,
                LastCfi = dto.LastCfi,
                BookmarksJson = string.IsNullOrWhiteSpace(dto.BookmarksJson) ? "[]" : dto.BookmarksJson,
                UpdatedAt = DateTime.UtcNow
            };
            await _unitOfWork.UserProgresses.AddEbookProgressAsync(newEntity);
        }
        else
        {
            if (dto.LastCfi != null)
            {
                existing.LastCfi = dto.LastCfi;
            }
            if (!string.IsNullOrWhiteSpace(dto.BookmarksJson))
            {
                existing.BookmarksJson = dto.BookmarksJson;
            }
            existing.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.UserProgresses.UpdateEbookProgress(existing);
        }

        await _unitOfWork.CompleteAsync();
        return Response<bool>.SuccessResult("Đồng bộ tiến độ đọc sách thành công", true);
    }

    public async Task<Response<UserVocabProgressDto>> GetVocabProgressAsync(int userId)
    {
        var entity = await _unitOfWork.UserProgresses.GetVocabProgressAsync(userId);
        if (entity == null)
        {
            return Response<UserVocabProgressDto>.SuccessResult("Chưa có tiến độ từ vựng", new UserVocabProgressDto
            {
                MasteredCount = 0,
                StarredCount = 0,
                LastStudiedTopic = 1,
                ProgressDataJson = "{}",
                UpdatedAt = DateTime.UtcNow
            });
        }

        return Response<UserVocabProgressDto>.SuccessResult("Lấy tiến độ từ vựng thành công", new UserVocabProgressDto
        {
            MasteredCount = entity.MasteredCount,
            StarredCount = entity.StarredCount,
            LastStudiedTopic = entity.LastStudiedTopic,
            ProgressDataJson = entity.ProgressDataJson,
            UpdatedAt = entity.UpdatedAt
        });
    }

    public async Task<Response<bool>> SaveVocabProgressAsync(int userId, UpsertVocabProgressDto dto)
    {
        var existing = await _unitOfWork.UserProgresses.GetVocabProgressAsync(userId);
        if (existing == null)
        {
            var newEntity = new UserVocabProgress
            {
                UserId = userId,
                MasteredCount = dto.MasteredCount,
                StarredCount = dto.StarredCount,
                LastStudiedTopic = dto.LastStudiedTopic,
                ProgressDataJson = string.IsNullOrWhiteSpace(dto.ProgressDataJson) ? "{}" : dto.ProgressDataJson,
                UpdatedAt = DateTime.UtcNow
            };
            await _unitOfWork.UserProgresses.AddVocabProgressAsync(newEntity);
        }
        else
        {
            existing.MasteredCount = dto.MasteredCount;
            existing.StarredCount = dto.StarredCount;
            existing.LastStudiedTopic = dto.LastStudiedTopic;
            if (!string.IsNullOrWhiteSpace(dto.ProgressDataJson))
            {
                existing.ProgressDataJson = dto.ProgressDataJson;
            }
            existing.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.UserProgresses.UpdateVocabProgress(existing);
        }

        await _unitOfWork.CompleteAsync();
        return Response<bool>.SuccessResult("Đồng bộ tiến độ từ vựng thành công", true);
    }
}

public interface IDashboardService
{
    Task<Response<DashboardStatsDto>> GetStatsAsync(int userId);
    Task<Response<AdminDashboardStatsDto>> GetAdminStatsAsync();
    Task<Response<List<AdminStudentProgressDto>>> GetAdminStudentsAsync();
    Task<Response<AdminStudentProgressDto>> CreateStudentAsync(CreateStudentRequestDto dto);
    Task<Response<bool>> UpdateStudentAsync(int userId, UpdateStudentRequestDto dto);
    Task<Response<bool>> ResetStudentPasswordAsync(int userId, string newPassword);
    Task<Response<StudentDetailProfileDto>> GetStudentDetailProfileAsync(int userId);
    Task<Response<bool>> AdjustStudentGamificationAsync(int userId, AdminAdjustGamificationDto dto);
    Task<Response<bool>> ApproveStudentAsync(int userId, bool isApproved);
    Task<Response<int>> ApproveAllPendingStudentsAsync();
    Task<Response<bool>> DeleteStudentAsync(int userId);
}

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IGamificationService _gamificationService;
    private readonly INotificationService _notificationService;
    private readonly IActivityLogService _activityLog;
    private readonly ICurrentUserService _currentUser;

    public DashboardService(
        IUnitOfWork unitOfWork, 
        UserManager<ApplicationUser> userManager,
        IGamificationService gamificationService,
        INotificationService notificationService,
        IActivityLogService activityLog,
        ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
        _gamificationService = gamificationService;
        _notificationService = notificationService;
        _activityLog = activityLog;
        _currentUser = currentUser;
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
                LastAccessedAt = EnsureUtc(s.LastAccessedAt)
            }).OrderByDescending(s => s.LastAccessedAt).ToList()
        };

        return Response<DashboardStatsDto>.SuccessResult("Lấy thống kê thành công", stats);
    }

    private async Task<List<ApplicationUser>> GetNonAdminUsersAsync()
    {
        var admins = await _userManager.GetUsersInRoleAsync(UserRole.Admin.ToString());
        var adminIds = admins.Select(a => a.Id).ToHashSet();
        return _userManager.Users
            .Where(u => !adminIds.Contains(u.Id))
            .ToList();
    }

    private static DateTime EnsureUtc(DateTime dt)
    {
        var nowUtc = DateTime.UtcNow;
        if (dt > nowUtc.AddMinutes(5))
        {
            dt = dt.AddHours(-7);
        }
        return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
    }

    private static DateTime? EnsureUtc(DateTime? dt) =>
        dt.HasValue ? EnsureUtc(dt.Value) : null;

    public async Task<Response<AdminDashboardStatsDto>> GetAdminStatsAsync()
    {
        var tests = (await _unitOfWork.ToeicTests.GetAllAsync()).ToList();
        int totalQuestions = tests.Sum(t => t.TotalQuestions);
        var students = await GetNonAdminUsersAsync();
        int totalStudents = students.Count;
        int approvedCount = students.Count(s => s.IsApproved);
        int pendingCount = totalStudents - approvedCount;

        int totalInteractions = await _unitOfWork.UserProgresses.GetTotalInteractionCountAsync();
        var allSummaries = (await _unitOfWork.UserProgresses.GetAllSummariesAsync()).ToList();
        var allBinoProgresses = (await _unitOfWork.BinoLearning.GetAllProgressesAsync()).ToList();
        var allBinoSrs = (await _unitOfWork.BinoLearning.GetAllSRSReviewsAsync()).ToList();

        // O(1) Lookup tables thay vì quét tuyến tính O(N*M)
        var summariesByUser = allSummaries.ToLookup(x => x.UserId);
        var binoByUser = allBinoProgresses.ToLookup(x => x.UserId);
        var srsByUser = allBinoSrs.ToLookup(x => x.UserId);

        int totalBinoCompleted = allBinoProgresses.Count(p => p.IsCompleted);

        var recentStudents = students
            .OrderBy(s => s.IsApproved) // Ưu tiên hiển thị học viên đang chờ duyệt lên đầu
            .ThenByDescending(s => s.CreatedAt)
            .Take(8)
            .Select(s =>
            {
                var userSummaries = summariesByUser[s.Id].ToList();
                var userBino = binoByUser[s.Id].ToList();
                var userSrsCount = srsByUser[s.Id].Count();

                int completed = userSummaries.Sum(x => x.CompletedQuestions);
                int confident = userSummaries.Sum(x => x.ConfidentQuestions);
                int totalQ = userSummaries.Sum(x => x.TotalQuestions);
                int binoDone = userBino.Count(x => x.IsCompleted);

                DateTime? lastActive = EnsureUtc(s.LastLoginAt);
                var lastSummary = userSummaries
                    .Where(x => x.LastAccessedAt != default)
                    .OrderByDescending(x => x.LastAccessedAt)
                    .FirstOrDefault();
                if (lastSummary != null)
                {
                    var summaryTime = EnsureUtc(lastSummary.LastAccessedAt);
                    if (!lastActive.HasValue || summaryTime > lastActive.Value)
                        lastActive = summaryTime;
                }
                var lastBino = userBino
                    .Where(x => x.LastAccessedAt != default)
                    .OrderByDescending(x => x.LastAccessedAt)
                    .FirstOrDefault();
                if (lastBino != null)
                {
                    var binoTime = EnsureUtc(lastBino.LastAccessedAt);
                    if (!lastActive.HasValue || binoTime > lastActive.Value)
                        lastActive = binoTime;
                }

                return new AdminStudentProgressDto
                {
                    UserId = s.Id,
                    FullName = s.FullName,
                    Email = s.Email ?? "",
                    PhoneNumber = s.PhoneNumber,
                    IsApproved = s.IsApproved,
                    ApprovedAt = EnsureUtc(s.ApprovedAt),
                    CreatedAt = EnsureUtc(s.CreatedAt),
                    LastLoginAt = EnsureUtc(lastActive),
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
        var users = await _userManager.Users.OrderByDescending(u => u.CreatedAt).ToListAsync();
        var allSummaries = (await _unitOfWork.UserProgresses.GetAllSummariesAsync()).ToList();
        var allBinoProgresses = (await _unitOfWork.BinoLearning.GetAllProgressesAsync()).ToList();
        var allBinoSrs = (await _unitOfWork.BinoLearning.GetAllSRSReviewsAsync()).ToList();

        var summariesByUser = allSummaries.ToLookup(x => x.UserId);
        var binoByUser = allBinoProgresses.ToLookup(x => x.UserId);
        var srsByUser = allBinoSrs.ToLookup(x => x.UserId);

        var result = new List<AdminStudentProgressDto>();

        foreach (var s in users)
        {
            var roles = await _userManager.GetRolesAsync(s);
            var role = roles.FirstOrDefault() ?? "Student";
            bool isLocked = s.LockoutEnd.HasValue && s.LockoutEnd.Value > DateTimeOffset.UtcNow;

            var userSummaries = summariesByUser[s.Id].ToList();
            var userBino = binoByUser[s.Id].ToList();
            var userSrsCount = srsByUser[s.Id].Count();

            int completed = userSummaries.Sum(x => x.CompletedQuestions);
            int confident = userSummaries.Sum(x => x.ConfidentQuestions);
            int totalQ = userSummaries.Sum(x => x.TotalQuestions);
            int binoDone = userBino.Count(x => x.IsCompleted);

            var vocab = await _unitOfWork.UserProgresses.GetVocabProgressAsync(s.Id);
            var gamification = await _unitOfWork.Gamification.GetByUserIdAsync(s.Id);

            // Tính toán thời điểm truy cập / học tập gần nhất thực tế (100% chuẩn UTC, tuyệt đối không dùng gamification.LastActiveDate vì trường đó lưu giờ VN UTC+7 để tính Streak)
            DateTime? lastActive = EnsureUtc(s.LastLoginAt);

            var lastSummary = userSummaries
                .Where(x => x.LastAccessedAt != default)
                .OrderByDescending(x => x.LastAccessedAt)
                .FirstOrDefault();
            if (lastSummary != null)
            {
                var summaryTime = EnsureUtc(lastSummary.LastAccessedAt);
                if (!lastActive.HasValue || summaryTime > lastActive.Value)
                    lastActive = summaryTime;
            }

            var lastBino = userBino
                .Where(x => x.LastAccessedAt != default)
                .OrderByDescending(x => x.LastAccessedAt)
                .FirstOrDefault();
            if (lastBino != null)
            {
                var binoTime = EnsureUtc(lastBino.LastAccessedAt);
                if (!lastActive.HasValue || binoTime > lastActive.Value)
                    lastActive = binoTime;
            }

            if (vocab != null && vocab.UpdatedAt != default)
            {
                var vocabTime = EnsureUtc(vocab.UpdatedAt);
                if (!lastActive.HasValue || vocabTime > lastActive.Value)
                    lastActive = vocabTime;
            }

            if (gamification != null && gamification.UpdatedAt != default)
            {
                var gamifTime = EnsureUtc(gamification.UpdatedAt);
                if (!lastActive.HasValue || gamifTime > lastActive.Value)
                    lastActive = gamifTime;
            }

            result.Add(new AdminStudentProgressDto
            {
                UserId = s.Id,
                FullName = s.FullName,
                Email = s.Email ?? "",
                PhoneNumber = s.PhoneNumber,
                Role = role,
                IsApproved = s.IsApproved,
                IsLocked = isLocked,
                ApprovedAt = EnsureUtc(s.ApprovedAt),
                CreatedAt = DateTime.SpecifyKind(s.CreatedAt, DateTimeKind.Utc),
                LastLoginAt = EnsureUtc(lastActive),
                TestsEnrolled = userSummaries.Count,
                CompletedQuestions = completed,
                ConfidentQuestions = confident,
                MasteryRate = totalQ > 0 ? Math.Round((double)confident / totalQ * 100, 1) : 0,
                BinoCompletedLessons = binoDone,
                BinoTotalLessons = 72,
                BinoProgressPercent = Math.Round((double)binoDone / 72.0 * 100, 1),
                BinoSavedFlashcards = userSrsCount,
                BinoTimeSpentMinutes = (int)Math.Ceiling(userBino.Sum(x => x.TimeSpentSeconds) / 60.0),
                VocabMasteredWords = vocab?.MasteredCount ?? 0,
                TotalXp = gamification?.TotalXP ?? 0,
                Level = gamification?.CurrentLevel ?? 1,
                StreakDays = gamification?.CurrentStreak ?? 0
            });
        }

        result = result
            .OrderBy(s => s.IsApproved) // Tài khoản chờ duyệt lên trên cùng
            .ThenByDescending(s => s.CreatedAt)
            .ToList();

        return Response<List<AdminStudentProgressDto>>.SuccessResult("Lấy danh sách học viên thành công", result);
    }

    public async Task<Response<AdminStudentProgressDto>> CreateStudentAsync(CreateStudentRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Password))
            return Response<AdminStudentProgressDto>.Failure("Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu.");

        var cleanEmail = dto.Email.Trim();
        var existingUser = await _userManager.FindByEmailAsync(cleanEmail);
        if (existingUser != null)
            return Response<AdminStudentProgressDto>.Failure("Email này đã được sử dụng bởi một tài khoản khác.");

        if (!PhoneNumberHelper.Validate(dto.PhoneNumber, isRequired: false, out var normalizedPhone, out var phoneError))
            return Response<AdminStudentProgressDto>.Failure(phoneError!);

        if (!string.IsNullOrEmpty(normalizedPhone))
        {
            var existingPhoneUser = PhoneNumberHelper.FindUserByPhone(_userManager.Users, normalizedPhone);
            if (existingPhoneUser != null)
            {
                return Response<AdminStudentProgressDto>.Failure(
                    $"Số điện thoại {normalizedPhone} đã được đăng ký cho tài khoản \"{existingPhoneUser.FullName}\" ({existingPhoneUser.Email}). Không thể tạo trùng số điện thoại!");
            }
        }

        var user = new ApplicationUser
        {
            UserName = cleanEmail,
            Email = cleanEmail,
            FullName = dto.FullName.Trim(),
            PhoneNumber = normalizedPhone,
            IsApproved = dto.IsApproved,
            EmailConfirmed = dto.IsApproved,
            ApprovedAt = dto.IsApproved ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow
        };

        var createResult = await _userManager.CreateAsync(user, dto.Password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return Response<AdminStudentProgressDto>.Failure($"Không thể tạo tài khoản: {errors}");
        }

        var roleToAssign = string.Equals(dto.Role, "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "Student";
        await _userManager.AddToRoleAsync(user, roleToAssign);

        var studentDto = new AdminStudentProgressDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? "",
            PhoneNumber = user.PhoneNumber,
            Role = roleToAssign,
            IsApproved = user.IsApproved,
            IsLocked = false,
            ApprovedAt = user.ApprovedAt,
            CreatedAt = user.CreatedAt,
            LastLoginAt = null,
            TestsEnrolled = 0,
            CompletedQuestions = 0,
            ConfidentQuestions = 0,
            MasteryRate = 0,
            BinoCompletedLessons = 0,
            BinoTotalLessons = 72,
            BinoProgressPercent = 0,
            BinoSavedFlashcards = 0,
            BinoTimeSpentMinutes = 0,
            VocabMasteredWords = 0,
            TotalXp = 0,
            Level = 1,
            StreakDays = 0
        };

        await _activityLog.LogAsync(
            _currentUser.UserId,
            _currentUser.Email ?? "Admin",
            "student.create",
            "Student",
            user.Id,
            $"Tạo mới tài khoản {roleToAssign}: \"{user.FullName}\" ({user.Email})"
        );

        await _notificationService.TriggerUserNotificationAsync(
            user.Id,
            "🎉 Chào mừng bạn đến với VBaceEnglish!",
            $"Tài khoản của bạn ({user.FullName}) đã được Quản trị viên khởi tạo và kích hoạt thành công. Bắt đầu hành trình chinh phục tiếng Anh ngay hôm nay!",
            "Approval",
            "🎉",
            "/home"
        );

        return Response<AdminStudentProgressDto>.SuccessResult($"Đã tạo tài khoản {roleToAssign} thành công cho \"{user.FullName}\"!", studentDto);
    }

    public async Task<Response<bool>> UpdateStudentAsync(int userId, UpdateStudentRequestDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return Response<bool>.Failure("Không tìm thấy tài khoản.");

        bool wasLocked = user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow;
        bool wasApproved = user.IsApproved;

        if (!PhoneNumberHelper.Validate(dto.PhoneNumber, isRequired: false, out var normalizedPhone, out var phoneError))
            return Response<bool>.Failure(phoneError!);

        if (!string.IsNullOrEmpty(normalizedPhone))
        {
            var existingPhoneUser = PhoneNumberHelper.FindUserByPhone(_userManager.Users, normalizedPhone, excludeUserId: userId);
            if (existingPhoneUser != null)
            {
                return Response<bool>.Failure(
                    $"Số điện thoại {normalizedPhone} đã được sử dụng bởi tài khoản \"{existingPhoneUser.FullName}\" ({existingPhoneUser.Email}). Không thể cập nhật trùng số điện thoại!");
            }
        }

        user.FullName = dto.FullName.Trim();
        user.PhoneNumber = normalizedPhone;

        if (!string.Equals(user.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
        {
            var existingEmail = await _userManager.FindByEmailAsync(dto.Email.Trim());
            if (existingEmail != null && existingEmail.Id != userId)
                return Response<bool>.Failure("Email đã được sử dụng bởi tài khoản khác.");
            user.Email = dto.Email.Trim();
            user.UserName = dto.Email.Trim();
        }

        user.IsApproved = dto.IsApproved;
        if (dto.IsApproved && user.ApprovedAt == null)
        {
            user.ApprovedAt = DateTime.UtcNow;
            user.EmailConfirmed = true;
        }

        if (dto.IsLocked)
        {
            user.LockoutEnd = DateTimeOffset.UtcNow.AddYears(100);
        }
        else
        {
            user.LockoutEnd = null;
        }

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            return Response<bool>.Failure("Không thể cập nhật thông tin tài khoản.");

        var currentRoles = await _userManager.GetRolesAsync(user);
        var desiredRole = string.Equals(dto.Role, "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "Student";
        if (!currentRoles.Contains(desiredRole))
        {
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, desiredRole);
        }

        string actionCode = (!wasLocked && dto.IsLocked) ? "student.lock"
                          : (wasLocked && !dto.IsLocked) ? "student.unlock"
                          : "student.update";

        await _activityLog.LogAsync(
            _currentUser.UserId,
            _currentUser.Email ?? "Admin",
            actionCode,
            "Student",
            user.Id,
            $"Cập nhật tài khoản \"{user.FullName}\" ({user.Email}) — Vai trò: {desiredRole}, Duyệt: {dto.IsApproved}, Khóa: {dto.IsLocked}"
        );

        if (!wasLocked && dto.IsLocked)
        {
            await _notificationService.TriggerUserNotificationAsync(
                user.Id,
                "⚠️ Tài khoản bị tạm khóa",
                "Tài khoản của bạn đã bị Quản trị viên tạm khóa. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.",
                "Warning",
                "⚠️"
            );
        }
        else if (!wasApproved && dto.IsApproved)
        {
            await _notificationService.TriggerUserNotificationAsync(
                user.Id,
                "✅ Tài khoản đã được phê duyệt!",
                "Chúc mừng! Tài khoản của bạn đã được kích hoạt thành công.",
                "Approval",
                "✅",
                "/home"
            );
        }

        return Response<bool>.SuccessResult("Cập nhật thông tin tài khoản thành công!", true);
    }

    public async Task<Response<bool>> ResetStudentPasswordAsync(int userId, string newPassword)
    {
        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
            return Response<bool>.Failure("Mật khẩu mới phải có ít nhất 6 ký tự.");

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return Response<bool>.Failure("Không tìm thấy tài khoản.");

        await _userManager.RemovePasswordAsync(user);
        var addResult = await _userManager.AddPasswordAsync(user, newPassword);
        if (!addResult.Succeeded)
        {
            var errors = string.Join("; ", addResult.Errors.Select(e => e.Description));
            return Response<bool>.Failure($"Không thể đặt lại mật khẩu: {errors}");
        }

        await _activityLog.LogAsync(
            _currentUser.UserId,
            _currentUser.Email ?? "Admin",
            "student.reset_password",
            "Student",
            user.Id,
            $"Đặt lại mật khẩu mới cho học viên \"{user.FullName}\" ({user.Email})"
        );

        await _notificationService.TriggerUserNotificationAsync(
            user.Id,
            "🔑 Mật khẩu đã được đặt lại",
            "Quản trị viên đã hỗ trợ đặt lại mật khẩu cho tài khoản của bạn. Hãy đổi mật khẩu mới trong mục Hồ sơ cá nhân để bảo mật.",
            "System",
            "🔑",
            "/profile"
        );

        return Response<bool>.SuccessResult($"Đã đặt lại mật khẩu mới cho tài khoản \"{user.FullName}\" ({user.Email})!", true);
    }

    public async Task<Response<StudentDetailProfileDto>> GetStudentDetailProfileAsync(int userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return Response<StudentDetailProfileDto>.Failure("Không tìm thấy tài khoản.");

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Student";
        bool isLocked = user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow;

        // Gamification
        var gamification = await _unitOfWork.Gamification.GetByUserIdAsync(userId);
        var gamificationProfile = (await _gamificationService.GetProfileAsync(userId))?.Data;
        var achievements = (await _gamificationService.GetAchievementsAsync(userId))?.Data ?? new();
        var unlockedBadges = achievements.Where(a => a.IsUnlocked).Select(a => a.Title).ToList();

        // TOEIC
        var toeicSummaries = (await _unitOfWork.UserProgresses.GetSummariesByUserAsync(userId)).ToList();
        var summaryDtos = toeicSummaries.Select(s => new TestSummaryDto
        {
            ToeicTestId = s.ToeicTestId,
            TestId = s.ToeicTest?.TestId ?? "TEST",
            Title = s.ToeicTest?.Title ?? "Đề thi",
            CompletedQuestions = s.CompletedQuestions,
            ConfidentQuestions = s.ConfidentQuestions,
            TotalQuestions = s.TotalQuestions,
            PercentCompleted = s.PercentCompleted,
            LastAccessedAt = EnsureUtc(s.LastAccessedAt)
        }).OrderByDescending(s => s.LastAccessedAt).ToList();

        int toeicCompleted = summaryDtos.Sum(s => s.CompletedQuestions);
        int toeicConfident = summaryDtos.Sum(s => s.ConfidentQuestions);
        int toeicTotal = summaryDtos.Sum(s => s.TotalQuestions);
        double toeicMastery = toeicTotal > 0 ? Math.Round((double)toeicConfident / toeicTotal * 100, 1) : 0;

        // Bino
        var binoProgresses = (await _unitOfWork.BinoLearning.GetProgressByUserAsync(userId)).ToList();
        var binoSrs = (await _unitOfWork.BinoLearning.GetAllSRSReviewsByUserAsync(userId)).ToList();
        int binoDone = binoProgresses.Count(x => x.IsCompleted);

        // Vocab
        var vocab = await _unitOfWork.UserProgresses.GetVocabProgressAsync(userId);

        // Reflex
        var reflex = await _unitOfWork.UserProgresses.GetReflexProgressAsync(userId);
        int reflexUnits = 0;
        if (reflex != null && !string.IsNullOrWhiteSpace(reflex.ProgressDataJson))
        {
            try
            {
                using var doc = JsonDocument.Parse(reflex.ProgressDataJson);
                if (doc.RootElement.TryGetProperty("completedUnits", out var unitsElem) && unitsElem.ValueKind == JsonValueKind.Array)
                {
                    reflexUnits = unitsElem.GetArrayLength();
                }
            }
            catch { }
        }

        DateTime? lastActive = EnsureUtc(user.LastLoginAt);
        var lastToeicSummary = summaryDtos.FirstOrDefault();
        if (lastToeicSummary != null && lastToeicSummary.LastAccessedAt != default)
        {
            var summaryTime = EnsureUtc(lastToeicSummary.LastAccessedAt);
            if (!lastActive.HasValue || summaryTime > lastActive.Value)
                lastActive = summaryTime;
        }
        var lastBino = binoProgresses
            .Where(x => x.LastAccessedAt != default)
            .OrderByDescending(x => x.LastAccessedAt)
            .FirstOrDefault();
        if (lastBino != null)
        {
            var binoTime = EnsureUtc(lastBino.LastAccessedAt);
            if (!lastActive.HasValue || binoTime > lastActive.Value)
                lastActive = binoTime;
        }
        if (vocab != null && vocab.UpdatedAt != default)
        {
            var vocabTime = EnsureUtc(vocab.UpdatedAt);
            if (!lastActive.HasValue || vocabTime > lastActive.Value)
                lastActive = vocabTime;
        }
        if (reflex != null && reflex.UpdatedAt != default)
        {
            var reflexTime = EnsureUtc(reflex.UpdatedAt);
            if (!lastActive.HasValue || reflexTime > lastActive.Value)
                lastActive = reflexTime;
        }
        if (gamification != null && gamification.UpdatedAt != default)
        {
            var gamifTime = EnsureUtc(gamification.UpdatedAt);
            if (!lastActive.HasValue || gamifTime > lastActive.Value)
                lastActive = gamifTime;
        }

        var detail = new StudentDetailProfileDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? "",
            PhoneNumber = user.PhoneNumber,
            Role = role,
            IsApproved = user.IsApproved,
            IsLocked = isLocked,
            ApprovedAt = EnsureUtc(user.ApprovedAt),
            CreatedAt = EnsureUtc(user.CreatedAt),
            LastLoginAt = EnsureUtc(lastActive),

            Level = gamificationProfile?.CurrentLevel ?? (gamification?.CurrentLevel ?? 1),
            LevelTitle = gamificationProfile?.LevelTitle ?? "Tân binh",
            TotalXp = gamificationProfile?.TotalXP ?? (gamification?.TotalXP ?? 0),
            CurrentStreak = gamificationProfile?.CurrentStreak ?? (gamification?.CurrentStreak ?? 0),
            LongestStreak = gamificationProfile?.LongestStreak ?? (gamification?.LongestStreak ?? 0),
            TotalDaysStudied = gamification?.DailyQuestStreak ?? 0,
            Badges = unlockedBadges,

            ToeicTestsCount = summaryDtos.Count,
            ToeicCompletedQuestions = toeicCompleted,
            ToeicConfidentQuestions = toeicConfident,
            ToeicMasteryRate = toeicMastery,
            ToeicSummaries = summaryDtos,

            BinoCompletedLessons = binoDone,
            BinoTotalLessons = 72,
            BinoProgressPercent = Math.Round((double)binoDone / 72.0 * 100, 1),
            BinoSavedFlashcards = binoSrs.Count,
            BinoTimeSpentMinutes = (int)Math.Ceiling(binoProgresses.Sum(x => x.TimeSpentSeconds) / 60.0),

            VocabMasteredWords = vocab?.MasteredCount ?? 0,
            VocabStarredWords = vocab?.StarredCount ?? 0,
            VocabLastStudiedTopic = vocab?.LastStudiedTopic ?? 1,

            ReflexUnitsDone = reflexUnits
        };

        return Response<StudentDetailProfileDto>.SuccessResult("Lấy hồ sơ chi tiết học viên thành công", detail);
    }

    public async Task<Response<bool>> AdjustStudentGamificationAsync(int userId, AdminAdjustGamificationDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return Response<bool>.Failure("Không tìm thấy tài khoản.");

        if (dto.BonusXp > 0)
        {
            await _gamificationService.AddXPAsync(userId, dto.BonusXp, "AdminReward", dto.Reason ?? "Thưởng điểm từ Quản trị viên");
            await _activityLog.LogAsync(
                _currentUser.UserId,
                _currentUser.Email ?? "Admin",
                "student.reward_xp",
                "Student",
                user.Id,
                $"Thưởng +{dto.BonusXp} XP cho học viên \"{user.FullName}\" — Lý do: {dto.Reason}"
            );
            await _notificationService.TriggerUserNotificationAsync(
                user.Id,
                $"🎁 Bạn nhận được +{dto.BonusXp:N0} XP từ Admin!",
                $"Quản trị viên đã trao thưởng cho bạn +{dto.BonusXp:N0} XP. Lý do: {dto.Reason ?? "Tích cực học tập xuất sắc!"}",
                "Reward",
                "🎁",
                "/leaderboard"
            );
        }

        if (dto.RestoreStreakDays.HasValue && dto.RestoreStreakDays.Value > 0)
        {
            var gamification = await _unitOfWork.Gamification.GetByUserIdAsync(userId);
            if (gamification != null)
            {
                gamification.CurrentStreak = dto.RestoreStreakDays.Value;
                if (gamification.CurrentStreak > gamification.LongestStreak)
                {
                    gamification.LongestStreak = gamification.CurrentStreak;
                }
                gamification.LastActiveDate = DateTime.UtcNow;
                await _unitOfWork.Gamification.UpsertAsync(gamification);
                await _unitOfWork.CompleteAsync();
            }

            await _activityLog.LogAsync(
                _currentUser.UserId,
                _currentUser.Email ?? "Admin",
                "student.restore_streak",
                "Student",
                user.Id,
                $"Khôi phục chuỗi Streak {dto.RestoreStreakDays.Value} ngày cho học viên \"{user.FullName}\""
            );

            await _notificationService.TriggerUserNotificationAsync(
                user.Id,
                $"🔥 Chuỗi Streak {dto.RestoreStreakDays.Value} ngày đã được khôi phục!",
                $"Quản trị viên đã khôi phục chuỗi ngày học liên tiếp của bạn về mốc {dto.RestoreStreakDays.Value} ngày. Hãy tiếp tục duy trì phong độ nhé!",
                "Reward",
                "🔥",
                "/leaderboard"
            );
        }

        return Response<bool>.SuccessResult($"Đã điều chỉnh thành tích thành công cho học viên \"{user.FullName}\"!", true);
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

        await _activityLog.LogAsync(
            _currentUser.UserId,
            _currentUser.Email ?? "Admin",
            isApproved ? "student.approve" : "student.revoke",
            "Student",
            user.Id,
            isApproved
                ? $"Phê duyệt kích hoạt tài khoản học viên \"{user.FullName}\" ({user.Email})"
                : $"Thu hồi quyền duyệt đối với học viên \"{user.FullName}\" ({user.Email})"
        );

        if (isApproved)
        {
            await _notificationService.TriggerUserNotificationAsync(
                user.Id,
                "✅ Tài khoản của bạn đã được phê duyệt!",
                $"Chào mừng {user.FullName}! Tài khoản của bạn đã được Quản trị viên kích hoạt. Bạn đã có thể truy cập trọn bộ 4 chương trình học đỉnh cao!",
                "Approval",
                "✅",
                "/home"
            );
        }

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
            if (res.Succeeded)
            {
                count++;
                await _notificationService.TriggerUserNotificationAsync(
                    s.Id,
                    "✅ Tài khoản của bạn đã được phê duyệt!",
                    $"Chào mừng {s.FullName}! Tài khoản của bạn đã được kích hoạt thành công. Bắt đầu học ngay nào!",
                    "Approval",
                    "✅",
                    "/home"
                );
            }
        }

        if (count > 0)
        {
            await _activityLog.LogAsync(
                _currentUser.UserId,
                _currentUser.Email ?? "Admin",
                "student.approve_all",
                "Student",
                null,
                $"Phê duyệt hàng loạt {count} tài khoản học viên đang chờ"
            );
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

        string deletedName = user.FullName;
        string deletedEmail = user.Email ?? "";

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return Response<bool>.Failure("Lỗi khi xóa tài khoản học viên.");

        await _activityLog.LogAsync(
            _currentUser.UserId,
            _currentUser.Email ?? "Admin",
            "student.delete",
            "Student",
            userId,
            $"Xóa vĩnh viễn tài khoản học viên \"{deletedName}\" ({deletedEmail})"
        );

        return Response<bool>.SuccessResult($"Đã xóa tài khoản \"{deletedName}\" ({deletedEmail}).", true);
    }
}
