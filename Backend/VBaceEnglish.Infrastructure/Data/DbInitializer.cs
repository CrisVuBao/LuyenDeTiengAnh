using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using VBaceEnglish.Application.Services;
using VBaceEnglish.Domain.Enums;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDBContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var toeicService = scope.ServiceProvider.GetRequiredService<IToeicTestService>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDBContext>>();

        // 1. Auto Migrate database
        await context.Database.MigrateAsync();

        // 2. Seed Roles
        string[] roles = [UserRole.Admin.ToString(), UserRole.Teacher.ToString(), UserRole.Student.ToString()];
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new Role(roleName));
            }
        }

        // 3. Seed Default Admin User
        var adminEmail = "admin@toeichack.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Admin Quản Trị",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
            var result = await userManager.CreateAsync(adminUser, "Admin@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, UserRole.Admin.ToString());
                logger.LogInformation("Tạo tài khoản Admin thành công: admin@toeichack.com / Admin@123456");
            }
        }

        // 4. Seed Toeic Tests from data.json if database has no tests
        if (!await context.ToeicTests.AnyAsync())
        {
            // Check possible locations of data.json
            string[] possiblePaths = [
                Path.Combine(AppContext.BaseDirectory, "data.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "data.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend", "public", "data.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Frontend", "public", "data.json"),
                "D:\\Hoc_Tap\\C_Shape\\API\\1_Project\\LuyenDeTiengAnh\\Frontend\\public\\data.json",
                "D:\\Hoc_Tap\\C_Shape\\API\\1_Project\\LuyenDeTiengAnh\\public\\data.json"
            ];

            string? foundPath = possiblePaths.FirstOrDefault(File.Exists);
            if (foundPath != null)
            {
                logger.LogInformation("Tìm thấy file data.json tại: {Path}. Bắt đầu nạp đề thi...", foundPath);
                string json = await File.ReadAllTextAsync(foundPath);
                var importResult = await toeicService.BulkImportFromJsonAsync(json);
                logger.LogInformation("Kết quả nạp đề thi ban đầu: {Message}", importResult.Message);
            }
            else
            {
                logger.LogWarning("Không tìm thấy file data.json để seed ban đầu.");
            }
        }
    }
}

