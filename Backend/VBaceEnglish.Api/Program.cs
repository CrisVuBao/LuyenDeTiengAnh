using System.IO.Compression;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
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
});
builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);

// 2. Caching (A.4)
builder.Services.AddMemoryCache();
builder.Services.AddOutputCache(options => {
    options.AddBasePolicy(b => b.Expire(TimeSpan.FromSeconds(30)));
    options.AddPolicy("Dashboard", b => b.Expire(TimeSpan.FromSeconds(60)).SetVaryByQuery("period").Tag("dashboard"));
});

// 3. Controllers + JSON config (A.4)
builder.Services.AddControllers().AddJsonOptions(options => {
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
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

// 6. JWT Authentication + Cookie extraction (A.4)
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
    // ĐỌC TOKEN TỪ HEADER (Mobile/Native) HOẶC HTTPONLY COOKIE (Web)
    opt.Events = new JwtBearerEvents {
        OnMessageReceived = context => {
            // 1. Ưu tiên đọc từ Header Authorization
            string? authHeader = context.Request.Headers["Authorization"];
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                context.Token = authHeader.Substring("Bearer ".Length).Trim();
                return Task.CompletedTask;
            }

            // 2. Hỗ trợ SignalR qua query param "access_token"
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/notificationHub"))
            {
                context.Token = accessToken;
                return Task.CompletedTask;
            }

            // 3. Fallback đọc từ HttpOnly Cookie (Web Browser)
            var cookieToken = context.Request.Cookies["Authorization"]?.Replace("Bearer ", "");
            if (!string.IsNullOrEmpty(cookieToken))
            {
                context.Token = cookieToken;
            }
            return Task.CompletedTask;
        }
    };
});

// 7. CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", corsBuilder => {
        corsBuilder.SetIsOriginAllowed(_ => true)
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

// Pipeline Order
app.UseExceptionHandler();
app.UseCors("AllowFrontend");
app.UseResponseCompression();
app.UseOutputCache();

// Static Files & SPA Setup (Hỗ trợ MIME types cho Somee/Azure)
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
    ContentTypeProvider = contentTypeProvider
});

// Swagger hỗ trợ cả Development lẫn Production trên Somee / Azure
app.UseSwagger(); 
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "VBace English API v1");
    c.RoutePrefix = "swagger";
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
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

