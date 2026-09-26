using Microsoft.AspNetCore.Identity;
using VBaceEnglish.Application.Contracts.Services;
using VBaceEnglish.Application.DTOs.Auth;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Enums;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public interface IAuthService
{
    Task<Response<object>> LoginAsync(LoginDto model);
    Task<Response<UserDto>> RegisterAsync(RegisterDto model);
    Task<Response<UserDto>> GetProfileAsync(int userId);
}

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthService(UserManager<ApplicationUser> userManager, IJwtTokenService jwtTokenService)
    {
        _userManager = userManager;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<Response<object>> LoginAsync(LoginDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.EmailOrPhone);
        if (user == null)
        {
            user = _userManager.Users.FirstOrDefault(u => u.PhoneNumber == model.EmailOrPhone);
        }

        if (user == null)
            return Response<object>.Failure("Tài khoản không tồn tại");

        var isValid = await _userManager.CheckPasswordAsync(user, model.Password);
        if (!isValid)
            return Response<object>.Failure("Mật khẩu không chính xác");

        var roles = await _userManager.GetRolesAsync(user);
        var isAdmin = roles.Contains(UserRole.Admin.ToString());

        // Tài khoản học viên bắt buộc phải được Admin phê duyệt mới được đăng nhập
        if (!isAdmin && !user.IsApproved)
        {
            return Response<object>.Failure(
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

        return Response<object>.SuccessResult("Đăng nhập thành công", new { Token = token, User = userDto });
    }

    public async Task<Response<UserDto>> RegisterAsync(RegisterDto model)
    {
        var existingEmail = await _userManager.FindByEmailAsync(model.Email);
        if (existingEmail != null)
            return Response<UserDto>.Failure("Email đã được đăng ký trong hệ thống");

        var user = new ApplicationUser
        {
            UserName = model.Email,
            Email = model.Email,
            FullName = model.FullName,
            PhoneNumber = model.PhoneNumber,
            IsApproved = false,
            ApprovedAt = null,
            EmailConfirmed = false,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return Response<UserDto>.Failure($"Đăng ký thất bại: {errors}");
        }

        await _userManager.AddToRoleAsync(user, UserRole.Student.ToString());

        var userDto = new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = UserRole.Student.ToString(),
            IsApproved = false,
            ApprovedAt = null,
            CreatedAt = user.CreatedAt
        };

        return Response<UserDto>.SuccessResult(
            "Đăng ký tài khoản thành công! Tài khoản của bạn đang chờ Admin phê duyệt trước khi có thể đăng nhập.",
            userDto);
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
}
