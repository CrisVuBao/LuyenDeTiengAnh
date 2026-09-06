using VBaceEnglish.Application.Contracts.Services;

namespace VBaceEnglish.Infrastructure.Services;

public class VietnamDateTimeProvider : IDateTimeProvider
{
    private static readonly TimeZoneInfo VietnamTimeZone = 
        TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

    public DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamTimeZone);
    public DateTime UtcNow => DateTime.UtcNow;
}

