using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Application.Contracts.Services;
using VBaceEnglish.Infrastructure.Data;
using VBaceEnglish.Infrastructure.Implementation;
using VBaceEnglish.Infrastructure.Services;

namespace VBaceEnglish.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration config)
    {
        // SQL Server DbContext with Connection Pooling
        services.AddDbContext<AppDBContext>(options =>
        {
            options.UseSqlServer(config.GetConnectionString("DefaultConnection"), sqlOptions =>
            {
                sqlOptions.MigrationsAssembly(typeof(AppDBContext).Assembly.FullName);
                sqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
            });
            options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        });

        // Repositories & Unit of Work
        services.AddScoped<IToeicTestRepository, ToeicTestRepository>();
        services.AddScoped<IUserProgressRepository, UserProgressRepository>();
        services.AddScoped<IBinoBookRepository, BinoBookRepository>();
        services.AddScoped<IBinoLearningRepository, BinoLearningRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // External Services
        services.AddSingleton<IDateTimeProvider, VietnamDateTimeProvider>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddHttpClient<IAiChatService, GeminiAiChatService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        return services;
    }
}

