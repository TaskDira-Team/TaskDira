using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TaskDira.Api.Data;
using TaskDira.Api.Middleware;
using TaskDira.Api.Models;
using TaskDira.Api.Repositories;
using TaskDira.Api.Services;

const string FrontendCorsPolicy = "FrontendCorsPolicy";

var builder = WebApplication.CreateBuilder(args);


builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
builder.Configuration.AddEnvironmentVariables();
builder.Configuration.AddCommandLine(args);

var frontendOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:4173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy => policy
        .WithOrigins(frontendOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    // Partition by signed-in session, not just IP: behind a tunnel or shared
    // venue Wi-Fi every player arrives from the same address.
    options.AddPolicy("family", context =>
    {
        var session = context.Request.Headers.Authorization.ToString();
        var key = !string.IsNullOrEmpty(session)
            ? "s:" + session
            : "ip:" + ClientAddress(context);
        return RateLimitPartition.GetFixedWindowLimiter(key,
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 1200, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 });
    });
});
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

var provider = builder.Configuration["Database:Provider"] ?? "PostgreSQL";
if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
{
    var sqlConnection = builder.Configuration.GetConnectionString("TaskDiraSqlServer");
    if (string.IsNullOrWhiteSpace(sqlConnection) && builder.Environment.IsDevelopment())
        sqlConnection = new SqlConnectionStringBuilder
        {
            DataSource = @"lpc:.\SQLEXPRESS",
            InitialCatalog = "TaskDira_MigrationDev",
            IntegratedSecurity = true,
            Encrypt = SqlConnectionEncryptOption.Optional
        }.ConnectionString;
    if (string.IsNullOrWhiteSpace(sqlConnection))
        throw new InvalidOperationException("ConnectionStrings:TaskDiraSqlServer is not set");
    builder.Services.AddScoped<IDbConnectionFactory>(_ => new SqlServerConnectionFactory(sqlConnection));
}
else if (provider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase))
{
    var connectionString = builder.Configuration.GetConnectionString("TaskDira");
    if (string.IsNullOrWhiteSpace(connectionString))
        throw new InvalidOperationException("ConnectionStrings:TaskDira is not set");
    builder.Services.AddNpgsqlDataSource(connectionString);
    builder.Services.AddScoped<IDbConnectionFactory, NpgsqlConnectionFactory>();
    builder.Services.AddDbContext<TaskDiraDbContext>(options => options.UseNpgsql(connectionString));
}
else
{
    throw new InvalidOperationException("Unsupported database provider.");
}
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IHouseholdRepository, HouseholdRepository>();
builder.Services.AddScoped<IHouseholdMemberRepository, HouseholdMemberRepository>();
builder.Services.AddScoped<IChoreTaskRepository, ChoreTaskRepository>();
builder.Services.AddScoped<ITaskSubItemRepository, TaskSubItemRepository>();
builder.Services.AddScoped<IPointsLedgerRepository, PointsLedgerRepository>();
builder.Services.AddScoped<IRewardRepository, RewardRepository>();
builder.Services.AddScoped<IMonthlyLeaderboardRepository, MonthlyLeaderboardRepository>();
builder.Services.AddScoped<IHealthRepository, HealthRepository>();
builder.Services.AddScoped<ISessionRepository, SessionRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IHouseholdService, HouseholdService>();
builder.Services.AddScoped<IHouseholdMemberService, HouseholdMemberService>();
builder.Services.AddScoped<IChoreTaskService, ChoreTaskService>();
builder.Services.AddScoped<ITaskSubItemService, TaskSubItemService>();
builder.Services.AddScoped<IPointsLedgerService, PointsLedgerService>();
builder.Services.AddScoped<IRewardService, RewardService>();
builder.Services.AddScoped<IMonthlyLeaderboardService, MonthlyLeaderboardService>();
builder.Services.AddScoped<IHealthService, HealthService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRegistrationRepository, RegistrationRepository>();

builder.Services.AddScoped<IFamilyRepository, FamilyRepository>();
builder.Services.AddScoped<IFamilyService, FamilyService>();
builder.Services.AddScoped<IWorldRepository, WorldRepository>();
builder.Services.AddScoped<IWorldService, WorldService>();
builder.Services.AddScoped<FamilyPlayService>();
builder.Services.AddSingleton<LiveUpdates>();

var app = builder.Build();

AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
{
    Console.Error.WriteLine($"Unhandled exception: {e.ExceptionObject}");
};

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "TaskDira API v1"));
}

app.UseHttpsRedirection();

app.UseCors(FrontendCorsPolicy);

// Live updates: every open screen holds a WebSocket and gets a "changed"
// ping after any successful save, so it refreshes immediately.
app.UseWebSockets(new WebSocketOptions { KeepAliveInterval = TimeSpan.FromSeconds(20) });
var live = app.Services.GetRequiredService<LiveUpdates>();
app.Use(async (context, next) =>
{
    await next();
    var method = context.Request.Method;
    var path = context.Request.Path;
    if (HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method)
        || !path.StartsWithSegments("/api") || path.StartsWithSegments("/api/auth")
        || context.Response.StatusCode >= 400)
    {
        return;
    }
    var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (int.TryParse(userId, out var id))
    {
        await live.NotifyHomesOfAsync(id, context.RequestServices.GetRequiredService<IHouseholdRepository>(), CancellationToken.None);
    }
    else
    {
        // Anonymous saves are rare (joining by invite link): ping everyone.
        live.NotifyEveryone();
    }
});
app.Map("/live", async (HttpContext context, IAuthService auth, IHouseholdRepository households) =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }
    if (!IsAllowedOrigin(context, frontendOrigins))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return;
    }
    await live.HandleAsync(context, auth, households);
});

// Optional: serve the built website from the API so the whole app lives on
// one address (one tunnel, no CORS). Set Frontend:DistPath to Frontend/dist.
var distPath = builder.Configuration["Frontend:DistPath"];
if (!string.IsNullOrWhiteSpace(distPath) && !Path.IsPathRooted(distPath))
    distPath = Path.Combine(builder.Environment.ContentRootPath, distPath);
if (!string.IsNullOrWhiteSpace(distPath) && Directory.Exists(distPath))
{
    var files = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(Path.GetFullPath(distPath));
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = files });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = files });
    app.MapFallbackToFile("index.html", new StaticFileOptions { FileProvider = files });
}

app.UseRateLimiter();
app.UseMiddleware<SessionAuthenticationMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();

static string ClientAddress(HttpContext context)
{
    var forwarded = context.Request.Headers["CF-Connecting-IP"].ToString();
    if (string.IsNullOrEmpty(forwarded))
        forwarded = context.Request.Headers["X-Forwarded-For"].ToString().Split(',')[0].Trim();
    return string.IsNullOrEmpty(forwarded)
        ? context.Connection.RemoteIpAddress?.ToString() ?? "unknown"
        : forwarded;
}

static bool IsAllowedOrigin(HttpContext context, string[] configured)
{
    var origin = context.Request.Headers.Origin.ToString();
    if (string.IsNullOrEmpty(origin) || configured.Contains(origin, StringComparer.OrdinalIgnoreCase)) return true;
    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
    // Same-origin page (the API serving the website, e.g. through a tunnel).
    var host = context.Request.Headers["X-Forwarded-Host"].ToString();
    if (string.IsNullOrEmpty(host)) host = context.Request.Host.Value ?? "";
    return string.Equals(uri.Authority, host, StringComparison.OrdinalIgnoreCase);
}
