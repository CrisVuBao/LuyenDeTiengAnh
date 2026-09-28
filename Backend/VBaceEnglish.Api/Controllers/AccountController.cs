using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VBaceEnglish.Application.DTOs.Auth;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Application.Services;

namespace VBaceEnglish.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AccountController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _environment;

    public AccountController(
        IAuthService authService,
        IWebHostEnvironment environment)
    {
        _authService = authService;
        _environment = environment;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        var result = await _authService.LoginAsync(model);
        if (!result.Success || result.Data == null)
        {
            return BadRequest(result);
        }

        var token = result.Data.Token;

        // SET HTTPONLY COOKIE — Frontend KHÔNG THẤY token, tự gửi qua cookie (A.5)
        Response.Cookies.Append("Authorization", "Bearer " + token, new CookieOptions
        {
            HttpOnly = true,
            Secure = !_environment.IsDevelopment() && Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTime.UtcNow.AddDays(7)
        });

        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        var result = await _authService.RegisterAsync(model);
        if (!result.Success) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("check-availability")]
    public async Task<IActionResult> CheckAvailability(
        [FromQuery] string? email = null,
        [FromQuery] string? phone = null,
        [FromQuery] int? excludeUserId = null)
    {
        var result = await _authService.CheckAvailabilityAsync(email, phone, excludeUserId);
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

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto model)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out int userId))
            return Unauthorized(Response<string>.Failure("Chưa đăng nhập"));

        var result = await _authService.UpdateProfileAsync(userId, model);
        if (!result.Success) return BadRequest(result);

        return Ok(result);
    }
}


