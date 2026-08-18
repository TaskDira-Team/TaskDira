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

    public async Task InvokeAsync(HttpContext context, IAuthService auth)
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

        await _next(context);
    }
}
