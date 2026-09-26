using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using VBaceEnglish.Application.Contracts.Services;
using VBaceEnglish.Application.DTOs.Auth;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Application.Services;
using VBaceEnglish.Domain.Enums;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AccountController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IWebHostEnvironment _environment;

    public AccountController(
        IAuthService authService,
        UserManager<ApplicationUser> userManager,
        IJwtTokenService jwtTokenService,
        IWebHostEnvironment environment)
    {
        _authService = authService;
        _userManager = userManager;
        _jwtTokenService = jwtTokenService;
        _environment = environment;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.EmailOrPhone)
                   ?? _userManager.Users.FirstOrDefault(u => u.PhoneNumber == model.EmailOrPhone);

        if (user == null) 
            return Unauthorized(Response<string>.Failure("Tài khoản không tồn tại"));

        var isValid = await _userManager.CheckPasswordAsync(user, model.Password);
        if (!isValid) 
            return Unauthorized(Response<string>.Failure("Sai mật khẩu"));

        var roles = await _userManager.GetRolesAsync(user);
        var isAdmin = roles.Contains(UserRole.Admin.ToString());

        if (!isAdmin && !user.IsApproved)
        {
            return BadRequest(Response<string>.Failure(
                "Tài khoản của bạn đang chờ Quản trị viên (Admin) phê duyệt. Vui lòng chờ Admin kích hoạt tài khoản để đăng nhập nhé!"));
        }

        user.LastLoginAt = DateTime.UtcNow;
        if (isAdmin && !user.IsApproved)
        {
            user.IsApproved = true;
            user.ApprovedAt = DateTime.UtcNow;
        }
        await _userManager.UpdateAsync(user);

        var token = _jwtTokenService.GenerateToken(user, roles);

        // SET HTTPONLY COOKIE — Frontend KHÔNG THẤY token, tự gửi qua cookie (A.5)
        Response.Cookies.Append("Authorization", "Bearer " + token, new CookieOptions
        {
            HttpOnly = true,
            Secure = !_environment.IsDevelopment() && Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTime.UtcNow.AddDays(7)
        });

        var userDto = new UserDto 
        { 
            Id = user.Id, 
            FullName = user.FullName, 
            Email = user.Email ?? "", 
            PhoneNumber = user.PhoneNumber,
            Role = roles.FirstOrDefault() ?? UserRole.Student.ToString(),
            AvatarUrl = user.AvatarUrl,
            IsApproved = user.IsApproved,
            ApprovedAt = user.ApprovedAt,
            CreatedAt = user.CreatedAt
        };

        return Ok(Response<object>.SuccessResult("Đăng nhập thành công", new { Token = token, User = userDto }));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        var result = await _authService.RegisterAsync(model);
        if (!result.Success) return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("Authorization", new CookieOptions
        {
            Path = "/",
            HttpOnly = true,
            SameSite = SameSiteMode.Lax
        });

        return Ok(Response<string>.SuccessResult("Đăng xuất thành công", ""));
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out int userId))
            return Unauthorized(Response<string>.Failure("Chưa đăng nhập"));

        var result = await _authService.GetProfileAsync(userId);
        if (!result.Success) return Unauthorized(result);

        return Ok(result);
    }
}

