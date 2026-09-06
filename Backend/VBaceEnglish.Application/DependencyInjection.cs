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

        return services;
    }
}

