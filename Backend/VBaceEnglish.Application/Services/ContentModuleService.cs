using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public class ContentModuleService : IContentModuleService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ContentModuleService> _logger;

    public ContentModuleService(IUnitOfWork unitOfWork, ILogger<ContentModuleService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<List<ContentModuleDto>> GetActiveModulesAsync(int? userId = null)
    {
        var modules = await _unitOfWork.ContentModules.GetActiveModulesAsync();

        var userProgressMap = new Dictionary<int, UserModuleProgress>();
        if (userId.HasValue && userId.Value > 0)
        {
            var userProgresses = await _unitOfWork.ContentModules.GetUserProgressesAsync(userId.Value);
            userProgressMap = userProgresses.ToDictionary(p => p.ContentModuleId);
        }

        return modules.Select(m =>
        {
            userProgressMap.TryGetValue(m.Id, out var prog);
            return MapToDto(m, prog);
        }).ToList();
    }

    public async Task<ContentModuleDetailDto?> GetModuleByCodeAsync(string code, int? userId = null)
    {
        var module = await _unitOfWork.ContentModules.GetByCodeWithLessonsAsync(code);
        if (module == null) return null;

        UserModuleProgress? userProgress = null;
        if (userId.HasValue && userId.Value > 0)
        {
            userProgress = await _unitOfWork.ContentModules.GetUserProgressAsync(userId.Value, module.Id);
        }

        var baseDto = MapToDto(module, userProgress);
        return new ContentModuleDetailDto
        {
            Id = baseDto.Id,
            Code = baseDto.Code,
            Language = baseDto.Language,
            Title = baseDto.Title,
            TitleVi = baseDto.TitleVi,
            Description = baseDto.Description,
            Category = baseDto.Category,
            TargetAudience = baseDto.TargetAudience,
            Icon = baseDto.Icon,
            ColorGradient = baseDto.ColorGradient,
            DifficultyLevel = baseDto.DifficultyLevel,
            EstimatedLessons = baseDto.EstimatedLessons,
            OrderIndex = baseDto.OrderIndex,
            IsActive = baseDto.IsActive,
            IsComingSoon = baseDto.IsComingSoon,
            RoutePath = baseDto.RoutePath,
            UserCompletedLessons = baseDto.UserCompletedLessons,
            UserCompletionPercentage = baseDto.UserCompletionPercentage,
            UserTotalTimeSpentSeconds = baseDto.UserTotalTimeSpentSeconds,
            UserLastStudiedAt = baseDto.UserLastStudiedAt,
            Lessons = module.Lessons.OrderBy(l => l.OrderIndex).Select(l => new ContentLessonDto
            {
                Id = l.Id,
                ContentModuleId = l.ContentModuleId,
                Title = l.Title,
                TitleVi = l.TitleVi,
                Type = l.Type,
                OrderIndex = l.OrderIndex,
                Difficulty = l.Difficulty,
                Description = l.Description,
                EstimatedMinutes = l.EstimatedMinutes,
                IsFree = l.IsFree
            }).ToList()
        };
    }

    public async Task<bool> TrackModuleProgressAsync(int userId, TrackModuleProgressRequest request)
    {
        var module = await _unitOfWork.ContentModules.GetByCodeAsync(request.ModuleCode);
        if (module == null) return false;

        var progress = await _unitOfWork.ContentModules.GetUserProgressAsync(userId, module.Id);

        var totalLessons = module.EstimatedLessons > 0 ? module.EstimatedLessons : 30;
        var completed = Math.Max(0, request.CompletedLessonsCount);
        var percentage = Math.Min(100.0, Math.Round(((double)completed / totalLessons) * 100, 1));

        if (progress == null)
        {
            progress = new UserModuleProgress
            {
                UserId = userId,
                ContentModuleId = module.Id,
                CompletedLessonsCount = completed,
                TotalTimeSpentSeconds = Math.Max(0, request.TimeSpentSeconds),
                CompletionPercentage = percentage,
                LastStudiedAt = DateTime.UtcNow,
                ProgressDataJson = request.CustomDataJson
            };
            await _unitOfWork.ContentModules.AddUserProgressAsync(progress);
        }
        else
        {
            progress.CompletedLessonsCount = Math.Max(progress.CompletedLessonsCount, completed);
            progress.TotalTimeSpentSeconds += Math.Max(0, request.TimeSpentSeconds);
            progress.CompletionPercentage = Math.Max(progress.CompletionPercentage, percentage);
            progress.LastStudiedAt = DateTime.UtcNow;
            if (!string.IsNullOrEmpty(request.CustomDataJson))
            {
                progress.ProgressDataJson = request.CustomDataJson;
            }
            _unitOfWork.ContentModules.UpdateUserProgress(progress);
        }

        await _unitOfWork.CompleteAsync();
        return true;
    }

    public async Task<List<ContentModuleDto>> GetAllModulesAdminAsync()
    {
        var modules = await _unitOfWork.ContentModules.GetAllModulesAsync();
        return modules.Select(m => MapToDto(m, null)).ToList();
    }

    public async Task<bool> ToggleModuleStatusAdminAsync(int moduleId, bool? isActive, bool? isComingSoon)
    {
        var module = await _unitOfWork.ContentModules.GetByIdAsync(moduleId);
        if (module == null) return false;

        if (isActive.HasValue) module.IsActive = isActive.Value;
        if (isComingSoon.HasValue) module.IsComingSoon = isComingSoon.Value;
        module.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.ContentModules.UpdateModule(module);
        await _unitOfWork.CompleteAsync();

        _logger.LogInformation("Admin updated ContentModule #{Id} status: IsActive={Active}, IsComingSoon={Coming}",
            moduleId, module.IsActive, module.IsComingSoon);
        return true;
    }

    private static ContentModuleDto MapToDto(ContentModule m, UserModuleProgress? prog)
    {
        return new ContentModuleDto
        {
            Id = m.Id,
            Code = m.Code,
            Language = m.Language,
            Title = m.Title,
            TitleVi = m.TitleVi,
            Description = m.Description,
            Category = m.Category,
            TargetAudience = m.TargetAudience,
            Icon = m.Icon,
            ColorGradient = m.ColorGradient,
            DifficultyLevel = m.DifficultyLevel,
            EstimatedLessons = m.EstimatedLessons,
            OrderIndex = m.OrderIndex,
            IsActive = m.IsActive,
            IsComingSoon = m.IsComingSoon,
            RoutePath = m.RoutePath,
            UserCompletedLessons = prog?.CompletedLessonsCount ?? 0,
            UserCompletionPercentage = prog?.CompletionPercentage ?? 0.0,
            UserTotalTimeSpentSeconds = prog?.TotalTimeSpentSeconds ?? 0,
            UserLastStudiedAt = prog?.LastStudiedAt
        };
    }
}
