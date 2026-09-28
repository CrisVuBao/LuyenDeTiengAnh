using Microsoft.AspNetCore.Identity;
using VBaceEnglish.Application.Contracts.Services;
using VBaceEnglish.Application.DTOs.Auth;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Enums;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public interface IAuthService
{
    Task<Response<LoginResultDto>> LoginAsync(LoginDto model);
    Task<Response<UserDto>> RegisterAsync(RegisterDto model);
    Task<Response<UserDto>> GetProfileAsync(int userId);
    Task<Response<UserDto>> UpdateProfileAsync(int userId, UpdateProfileDto model);
    Task<Response<AccountAvailabilityDto>> CheckAvailabilityAsync(string? email, string? phoneNumber, int? excludeUserId = null);
}

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ISystemSettingsService _settingsService;
    private readonly INotificationService _notificationService;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        IJwtTokenService jwtTokenService,
        ISystemSettingsService settingsService,
        INotificationService notificationService)
    {
        _userManager = userManager;
        _jwtTokenService = jwtTokenService;
        _settingsService = settingsService;
        _notificationService = notificationService;
    }

    public async Task<Response<LoginResultDto>> LoginAsync(LoginDto model)
    {
        var rawIdentifier = model.EmailOrPhone?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(rawIdentifier) || string.IsNullOrWhiteSpace(model.Password))
        {
            return Response<LoginResultDto>.Failure("Vui lòng nhập đầy đủ Email/Số điện thoại và Mật khẩu.");
        }

        ApplicationUser? user = null;

        if (rawIdentifier.Contains('@'))
        {
            user = await _userManager.FindByEmailAsync(rawIdentifier);
            if (user == null)
            {
                return Response<LoginResultDto>.Failure("Email này chưa được đăng ký trong hệ thống.");
            }

            var emailPassValid = await _userManager.CheckPasswordAsync(user, model.Password);
            if (!emailPassValid)
            {
                return Response<LoginResultDto>.Failure("Mật khẩu không chính xác.");
            }
        }
        else
        {
            var isValidPhone = PhoneNumberHelper.Validate(rawIdentifier, isRequired: true, out var normalizedPhone, out var phoneError);
            var matchedUsers = PhoneNumberHelper.FindAllUsersByPhone(_userManager.Users, normalizedPhone ?? rawIdentifier);

            if (matchedUsers.Count == 0)
            {
                // Fallback nếu người dùng nhập username
                var byName = await _userManager.FindByNameAsync(rawIdentifier);
                if (byName != null)
                {
                    matchedUsers.Add(byName);
                }
            }

            if (matchedUsers.Count == 0)
            {
                if (!isValidPhone && !string.IsNullOrEmpty(phoneError))
                {
                    return Response<LoginResultDto>.Failure(phoneError);
                }
                return Response<LoginResultDto>.Failure($"Số điện thoại {normalizedPhone ?? rawIdentifier} chưa được đăng ký trong hệ thống.");
            }

            foreach (var candidate in matchedUsers)
            {
                if (await _userManager.CheckPasswordAsync(candidate, model.Password))
                {
                    user = candidate;
                    break;
                }
            }

            if (user == null)
            {
                return Response<LoginResultDto>.Failure("Mật khẩu không chính xác.");
            }

            // Tự động chuẩn hóa định dạng số điện thoại lưu trong DB nếu bản ghi cũ chưa chuẩn
            if (!string.IsNullOrEmpty(normalizedPhone) && user.PhoneNumber != normalizedPhone)
            {
                user.PhoneNumber = normalizedPhone;
            }
        }

        var roles = await _userManager.GetRolesAsync(user);
        var isAdmin = roles.Contains(UserRole.Admin.ToString());

        // Kiểm tra chế độ bảo trì đối với học viên
        if (!isAdmin && await _settingsService.GetBoolSettingAsync("app.maintenance_mode", false))
        {
            var maintMsg = await _settingsService.GetSettingValueAsync(
                "app.maintenance_message",
                "Hệ thống đang được bảo trì nâng cấp. Vui lòng quay lại sau ít phút!");
            return Response<LoginResultDto>.Failure(maintMsg);
        }

        // Kiểm tra khóa tài khoản
        if (!isAdmin && user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow)
        {
            return Response<LoginResultDto>.Failure("Tài khoản của bạn đã bị Quản trị viên tạm khóa. Vui lòng liên hệ hỗ trợ!");
        }

        // Tài khoản học viên bắt buộc phải được Admin phê duyệt mới được đăng nhập
        if (!isAdmin && !user.IsApproved)
        {
            return Response<LoginResultDto>.Failure(
                "Tài khoản của bạn đang chờ Quản trị viên (Admin) phê duyệt. Vui lòng chờ Admin kích hoạt tài khoản để đăng nhập nhé!");
        }

        user.LastLoginAt = DateTime.UtcNow;
        if (isAdmin && !user.IsApproved)
        {
            user.IsApproved = true;
            user.ApprovedAt = DateTime.UtcNow;
        }
        await _userManager.UpdateAsync(user);

        var token = _jwtTokenService.GenerateToken(user, roles);

        var userDto = new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            Role = roles.FirstOrDefault() ?? UserRole.Student.ToString(),
            AvatarUrl = user.AvatarUrl,
            IsApproved = user.IsApproved,
            ApprovedAt = user.ApprovedAt,
            CreatedAt = user.CreatedAt
        };

        return Response<LoginResultDto>.SuccessResult(
            "Đăng nhập thành công",
            new LoginResultDto { Token = token, User = userDto });
    }

    public async Task<Response<UserDto>> RegisterAsync(RegisterDto model)
    {
        if (!await _settingsService.GetBoolSettingAsync("app.registration_open", true))
        {
            return Response<UserDto>.Failure("Hệ thống hiện đang tạm đóng đăng ký tài khoản mới. Vui lòng liên hệ Quản trị viên!");
        }

        var fullName = model.FullName?.Trim() ?? string.Empty;
        var email = model.Email?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(fullName))
            return Response<UserDto>.Failure("Vui lòng nhập Họ và tên.");

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return Response<UserDto>.Failure("Vui lòng nhập địa chỉ Email hợp lệ.");

        var existingEmail = await _userManager.FindByEmailAsync(email);
        if (existingEmail != null)
        {
            return Response<UserDto>.Failure("Email này đã được đăng ký trong hệ thống. Vui lòng dùng Email khác hoặc chuyển sang Đăng nhập!");
        }

        // Kiểm tra định dạng và trùng lặp Số điện thoại (bắt buộc vì hệ thống hỗ trợ đăng nhập bằng Email hoặc SĐT)
        if (!PhoneNumberHelper.Validate(model.PhoneNumber, isRequired: true, out var normalizedPhone, out var phoneError))
        {
            return Response<UserDto>.Failure(phoneError!);
        }

        var existingPhoneUser = PhoneNumberHelper.FindUserByPhone(_userManager.Users, normalizedPhone);
        if (existingPhoneUser != null)
        {
            return Response<UserDto>.Failure(
                $"Số điện thoại {normalizedPhone} đã được đăng ký bởi một tài khoản khác. Vui lòng kiểm tra lại hoặc dùng số điện thoại này để Đăng nhập!");
        }

        bool autoApprove = await _settingsService.GetBoolSettingAsync("app.auto_approve", false);

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            PhoneNumber = normalizedPhone,
            IsApproved = autoApprove,
            ApprovedAt = autoApprove ? DateTime.UtcNow : null,
            EmailConfirmed = autoApprove,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return Response<UserDto>.Failure($"Đăng ký thất bại: {errors}");
        }

        await _userManager.AddToRoleAsync(user, UserRole.Student.ToString());

        if (await _settingsService.GetBoolSettingAsync("notif.auto_notify_new_student", true))
        {
            await _notificationService.TriggerAdminsNotificationAsync(
                "📋 Học viên mới đăng ký!",
                $"Học viên \"{user.FullName}\" ({user.Email} - SĐT: {user.PhoneNumber}) vừa đăng ký tài khoản {(autoApprove ? "(Đã tự động duyệt)" : "và đang chờ phê duyệt")}.",
                "System",
                "📋",
                "/admin/students"
            );
        }

        var userDto = new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = UserRole.Student.ToString(),
            IsApproved = user.IsApproved,
            ApprovedAt = user.ApprovedAt,
            CreatedAt = user.CreatedAt
        };

        var successMsg = autoApprove
            ? "Đăng ký tài khoản thành công! Tài khoản đã được kích hoạt tự động, bạn có thể đăng nhập ngay bằng Email hoặc Số điện thoại."
            : "Đăng ký tài khoản thành công! Tài khoản của bạn đang chờ Admin phê duyệt trước khi có thể đăng nhập.";

        return Response<UserDto>.SuccessResult(successMsg, userDto);
    }

    public async Task<Response<UserDto>> GetProfileAsync(int userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return Response<UserDto>.Failure("Không tìm thấy người dùng");

        var roles = await _userManager.GetRolesAsync(user);
        var isAdmin = roles.Contains(UserRole.Admin.ToString());
        if (!isAdmin && !user.IsApproved)
            return Response<UserDto>.Failure("Tài khoản chưa được phê duyệt hoặc đã bị tạm khóa");

        // Cập nhật mốc thời gian hoạt động gần nhất nếu cách nhau hơn 2 phút
        if (!user.LastLoginAt.HasValue || (DateTime.UtcNow - user.LastLoginAt.Value).TotalMinutes > 2)
        {
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
        }

        var userDto = new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            Role = roles.FirstOrDefault() ?? UserRole.Student.ToString(),
            AvatarUrl = user.AvatarUrl,
            IsApproved = user.IsApproved,
            ApprovedAt = user.ApprovedAt,
            CreatedAt = user.CreatedAt
        };

        return Response<UserDto>.SuccessResult("Lấy thông tin thành công", userDto);
    }

    public async Task<Response<UserDto>> UpdateProfileAsync(int userId, UpdateProfileDto model)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return Response<UserDto>.Failure("Không tìm thấy tài khoản người dùng.");

        var fullName = model.FullName?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(fullName))
            return Response<UserDto>.Failure("Họ và tên không được để trống.");

        if (!PhoneNumberHelper.Validate(model.PhoneNumber, isRequired: true, out var normalizedPhone, out var phoneError))
        {
            return Response<UserDto>.Failure(phoneError!);
        }

        var existingPhoneUser = PhoneNumberHelper.FindUserByPhone(_userManager.Users, normalizedPhone, excludeUserId: userId);
        if (existingPhoneUser != null)
        {
            return Response<UserDto>.Failure(
                $"Số điện thoại {normalizedPhone} đã được sử dụng bởi một tài khoản khác trong hệ thống!");
        }

        user.FullName = fullName;
        user.PhoneNumber = normalizedPhone;

        var updateRes = await _userManager.UpdateAsync(user);
        if (!updateRes.Succeeded)
        {
            var errors = string.Join("; ", updateRes.Errors.Select(e => e.Description));
            return Response<UserDto>.Failure($"Không thể cập nhật thông tin: {errors}");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var userDto = new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            Role = roles.FirstOrDefault() ?? UserRole.Student.ToString(),
            AvatarUrl = user.AvatarUrl,
            IsApproved = user.IsApproved,
            ApprovedAt = user.ApprovedAt,
            CreatedAt = user.CreatedAt
        };

        return Response<UserDto>.SuccessResult("Đã cập nhật thông tin cá nhân và số điện thoại thành công!", userDto);
    }

    public async Task<Response<AccountAvailabilityDto>> CheckAvailabilityAsync(
        string? email,
        string? phoneNumber,
        int? excludeUserId = null)
    {
        var dto = new AccountAvailabilityDto();

        if (!string.IsNullOrWhiteSpace(email))
        {
            var trimmedEmail = email.Trim();
            var existingEmail = await _userManager.FindByEmailAsync(trimmedEmail);
            if (existingEmail != null && (!excludeUserId.HasValue || existingEmail.Id != excludeUserId.Value))
            {
                dto.EmailAvailable = false;
                dto.EmailMessage = "Email này đã được sử dụng bởi tài khoản khác.";
            }
        }

        if (!string.IsNullOrWhiteSpace(phoneNumber))
        {
            if (!PhoneNumberHelper.Validate(phoneNumber, isRequired: true, out var normalizedPhone, out var phoneError))
            {
                dto.PhoneAvailable = false;
                dto.PhoneMessage = phoneError;
            }
            else
            {
                dto.NormalizedPhone = normalizedPhone;
                var existingPhone = PhoneNumberHelper.FindUserByPhone(_userManager.Users, normalizedPhone, excludeUserId);
                if (existingPhone != null)
                {
                    dto.PhoneAvailable = false;
                    dto.PhoneMessage = $"Số điện thoại {normalizedPhone} đã được đăng ký trong hệ thống.";
                }
            }
        }

        return Response<AccountAvailabilityDto>.SuccessResult("Kiểm tra hợp lệ", dto);
    }
}

