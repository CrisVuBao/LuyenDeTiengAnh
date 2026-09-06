using System.IO.Compression;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.IdentityModel.Tokens;
using VBaceEnglish.Api.Hubs;
using VBaceEnglish.Application;
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
    // ĐỌC TOKEN TỪ HTTPONLY COOKIE (bảo mật XSS) (A.4)
    opt.Events = new JwtBearerEvents {
        OnMessageReceived = context => {
            var token = context.Request.Cookies["Authorization"]?.Replace("Bearer ", "");
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
app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment()) 
{ 
    app.UseSwagger(); 
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "TOEIC API v1")); 
}

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

