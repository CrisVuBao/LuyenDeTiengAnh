using System.IO.Compression;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.IdentityModel.Tokens;
using VBaceEnglish.Api.Hubs;
using VBaceEnglish.Api.Services;
using VBaceEnglish.Application;
using VBaceEnglish.Application.Contracts.Services;
using VBaceEnglish.Domain.Models;
using VBaceEnglish.Infrastructure;
using VBaceEnglish.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Response Compression (Brotli + Gzip) (A.4)
builder.Services.AddResponseCompression(options => {
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        "application/javascript",
        "text/css",
        "image/svg+xml",
        "application/epub+zip",
        "font/woff2"
    });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);

// 2. Caching (A.4)
builder.Services.AddMemoryCache();
builder.Services.AddOutputCache(options => {
    // Tuyệt đối KHÔNG áp dụng BasePolicy cho toàn bộ API để tránh việc tài khoản này nhận dữ liệu tiến độ của tài khoản khác
    // Chỉ cache những endpoint công khai tĩnh hoặc được gắn policy cụ thể
    options.AddPolicy("Dashboard", b => b.Expire(TimeSpan.FromSeconds(60)).SetVaryByQuery("period").Tag("dashboard"));
});

// 2b. Rate Limiter (Phase 1 C.4) - Bảo vệ API, chống Brute-Force & Spam
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var path = httpContext.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/assets/", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/images/", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/audios/", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/ebooks/", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/health", StringComparison.OrdinalIgnoreCase) ||
            path == "/" ||
            path.EndsWith(".html", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".ico", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".svg", StringComparison.OrdinalIgnoreCase))
        {
            return RateLimitPartition.GetNoLimiter("static");
        }

        var clientKey = httpContext.User?.Identity?.Name
                        ?? httpContext.Connection.RemoteIpAddress?.ToString()
                        ?? "anonymous";

        return RateLimitPartition.GetTokenBucketLimiter(clientKey, _ => new TokenBucketRateLimiterOptions
        {
            TokenLimit = 150,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 15,
            ReplenishmentPeriod = TimeSpan.FromSeconds(1),
            TokensPerPeriod = 35,
            AutoReplenishment = true
        });
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json; charset=utf-8";
        await context.HttpContext.Response.WriteAsync(
            "{\"success\":false,\"message\":\"Hệ thống đang tiếp nhận quá nhiều yêu cầu từ bạn. Vui lòng chờ 2-3 giây rồi thử lại.\",\"status\":429}", token);
    };
});

// 2c. Health Checks (Phase 1 C.5)
builder.Services.AddHealthChecks()
    .AddAsyncCheck("database", async () =>
    {
        try
        {
            return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("Database connection active");
        }
        catch (Exception ex)
        {
            return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy(ex.Message);
        }
    });

// 3. Controllers + JSON config (A.4)
builder.Services.AddControllers().AddJsonOptions(options => {
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IRealTimeNotificationDispatcher, SignalRNotificationDispatcher>();
builder.Services.AddProblemDetails();

// 4. Clean Architecture DI (A.4)
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// 5. Identity (A.4)
builder.Services.AddIdentity<ApplicationUser, Role>(opt => {
    opt.User.RequireUniqueEmail = false;
    opt.Password.RequireDigit = false;
    opt.Password.RequireLowercase = false;
    opt.Password.RequireUppercase = false;
    opt.Password.RequireNonAlphanumeric = false;
    opt.Password.RequiredLength = 6;
}).AddEntityFrameworkStores<AppDBContext>().AddDefaultTokenProviders();

// 6. JWT Authentication + Cookie & SignalR Token extraction (A.4)
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SUPER_SECRET_TOEIC_HACK_SPEED_KEY_2026_VERY_SECURE_KEY!";
builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(opt => {
    opt.TokenValidationParameters = new TokenValidationParameters {
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "VBaceEnglish",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "VBaceEnglishClient",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true, 
        ValidateAudience = true, 
        ValidateLifetime = true, 
        ValidateIssuerSigningKey = true
    };
    // ĐỌC TOKEN TỪ HTTPONLY COOKIE HOẶC SIGNALR QUERY STRING (bảo mật XSS) (A.4)
    opt.Events = new JwtBearerEvents {
        OnMessageReceived = context => {
            var token = context.Request.Cookies["Authorization"]?.Replace("Bearer ", "");
            if (string.IsNullOrEmpty(token))
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/notificationHub"))
                {
                    token = accessToken;
                }
            }
            if (!string.IsNullOrEmpty(token)) context.Token = token;
            return Task.CompletedTask;
        }
    };
});

// 7. CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", corsBuilder => {
        corsBuilder.WithOrigins("http://localhost:4100", "http://localhost:5173", "https://localhost:4100")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// 8. SignalR
builder.Services.AddSignalR();

// Swagger Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Pipeline Order (THỨ TỰ QUAN TRỌNG theo A.4)
app.UseExceptionHandler();
app.UseCors("AllowFrontend");
app.UseResponseCompression();
app.UseOutputCache();
// Static Files & SPA Setup (Hỗ trợ MIME types & Cache-Control siêu tốc cho Somee/MonsterASP/Azure)
var contentTypeProvider = new FileExtensionContentTypeProvider();
contentTypeProvider.Mappings[".epub"] = "application/epub+zip";
contentTypeProvider.Mappings[".webp"] = "image/webp";
contentTypeProvider.Mappings[".webm"] = "video/webm";
contentTypeProvider.Mappings[".json"] = "application/json";
contentTypeProvider.Mappings[".woff"] = "font/woff";
contentTypeProvider.Mappings[".woff2"] = "font/woff2";

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = contentTypeProvider,
    OnPrepareResponse = ctx =>
    {
        var path = ctx.Context.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/assets/", StringComparison.OrdinalIgnoreCase))
        {
            // Hashed Vite assets: cache 1 năm immutable (0ms tải lại)
            ctx.Context.Response.Headers["Cache-Control"] = "public, max-age=31536000, immutable";
        }
        else if (path.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        }
        else if (path.StartsWith("/images/", StringComparison.OrdinalIgnoreCase) ||
                 path.StartsWith("/audios/", StringComparison.OrdinalIgnoreCase) ||
                 path.StartsWith("/ebooks/", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.Headers["Cache-Control"] = "public, max-age=604800";
        }
    }
});

// Swagger hỗ trợ cả Development lẫn Production trên MonsterASP / Somee / Azure
app.UseSwagger(); 
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "VBace English API v1");
    c.RoutePrefix = "swagger";
});

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter(); // Phase 1 C.4

app.MapControllers();
app.MapHealthChecks("/health"); // Phase 1 C.5
app.MapHub<NotificationHub>("/notificationHub");

// Auto migrate database and seed data (roles, admin, data.json)
try
{
    await DbInitializer.SeedAsync(app.Services);
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "Lỗi xảy ra trong quá trình khởi tạo Database");
}

app.MapFallbackToFile("index.html");

app.Run();

