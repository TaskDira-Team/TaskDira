using Microsoft.EntityFrameworkCore;
using TaskDira.Api.Data;
using TaskDira.Api.Repositories;
using TaskDira.Api.Services;

var builder = WebApplication.CreateBuilder(args);


builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("TaskDira");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings:TaskDira is not set");
}

builder.Services.AddNpgsqlDataSource(connectionString);
builder.Services.AddScoped<IDbConnectionFactory, NpgsqlConnectionFactory>();

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
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IHouseholdService, HouseholdService>();
builder.Services.AddScoped<IHouseholdMemberService, HouseholdMemberService>();
builder.Services.AddScoped<IChoreTaskService, ChoreTaskService>();
builder.Services.AddScoped<ITaskSubItemService, TaskSubItemService>();
builder.Services.AddScoped<IPointsLedgerService, PointsLedgerService>();
builder.Services.AddScoped<IRewardService, RewardService>();
builder.Services.AddScoped<IMonthlyLeaderboardService, MonthlyLeaderboardService>();

var app = builder.Build();

AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
{
    Console.Error.WriteLine($"Unhandled exception: {e.ExceptionObject}");
};

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "TaskDira API v1"));
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
