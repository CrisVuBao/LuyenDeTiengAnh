using Microsoft.Extensions.DependencyInjection;
using VBaceEnglish.Application.Services;

namespace VBaceEnglish.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IToeicTestService, ToeicTestService>();
        services.AddScoped<IUserProgressService, UserProgressService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IBinoBookService, BinoBookService>();
        services.AddScoped<IGamificationService, GamificationService>();

        // Admin Command Center v2.0 Services
        services.AddScoped<IActivityLogService, ActivityLogService>();
        services.AddScoped<ISystemSettingsService, SystemSettingsService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();

        return services;
    }
}

