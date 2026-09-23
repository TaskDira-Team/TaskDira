using System.Security.Claims;
using TaskDira.Api.Services;

namespace TaskDira.Api.Middleware;

public class SessionAuthenticationMiddleware
{
    private const string BearerPrefix = "Bearer ";

    private readonly RequestDelegate _next;

    public SessionAuthenticationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IAuthService auth, IFamilyService family, IChoreTaskService tasks)
    {
        var header = context.Request.Headers.Authorization.ToString();

        if (string.IsNullOrWhiteSpace(header) || !header.StartsWith(BearerPrefix, StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var token = header[BearerPrefix.Length..].Trim();
        var userId = await auth.ValidateTokenAsync(token, context.RequestAborted);

        if (userId is null)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }

        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString())],
            "TaskDiraSession");

        context.User = new ClaimsPrincipal(identity);

        var access = await family.ContextAsync(userId.Value, userId.Value, context.RequestAborted);
        if (access.GetProperty("isManagedProfile").GetBoolean())
        {
            if (!access.GetProperty("active").GetBoolean())
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }
            var path = context.Request.Path.Value?.TrimEnd('/').ToLowerInvariant() ?? "";
            var method = context.Request.Method;
            var allowed = (method == "POST" && System.Text.RegularExpressions.Regex.IsMatch(path, @"^/api/households/\d+/points-ledger$"))
                || method == "GET" || (method == "POST" && path == "/api/auth/logout")
                || (method == "PUT" && path == $"/api/users/{userId}")
                || (method == "POST" && System.Text.RegularExpressions.Regex.IsMatch(path, @"^/api/rewards/\d+/claim$"));
            var taskMatch = System.Text.RegularExpressions.Regex.Match(path, @"^/api/tasks/(\d+)/(status|subitems/\d+)$");
            if (method == "PUT" && taskMatch.Success)
            {
                var task = await tasks.GetByIdAsync(int.Parse(taskMatch.Groups[1].Value), userId.Value, context.RequestAborted);
                allowed = task?.AssignedUserId == userId.Value;
            }
            if (!allowed)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { detail = "Ask a parent to manage this part of your home." }, context.RequestAborted);
                return;
            }
        }

        await _next(context);
    }
}
