using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TaskDira.Api.Data;
using TaskDira.Api.Middleware;
using TaskDira.Api.Models;
using TaskDira.Api.Repositories;
using TaskDira.Api.Services;

const string FrontendCorsPolicy = "FrontendCorsPolicy";

var builder = WebApplication.CreateBuilder(args);


builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

var frontendOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:4173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy => policy
        .WithOrigins(frontendOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

var connectionString = builder.Configuration.GetConnectionString("TaskDira");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings:TaskDira is not set");
}

builder.Services.AddNpgsqlDataSource(connectionString);
builder.Services.AddScoped<IDbConnectionFactory, NpgsqlConnectionFactory>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

builder.Services.AddDbContext<TaskDiraDbContext>(options => options.UseNpgsql(connectionString));
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

app.UseMiddleware<SessionAuthenticationMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();
