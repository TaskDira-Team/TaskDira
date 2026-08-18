using Microsoft.AspNetCore.Mvc;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("health")]
public class HealthController : ApiControllerBase
{
    private readonly IHealthService _health;

    public HealthController(IHealthService health)
    {
        _health = health;
    }

    [HttpGet(Name = "GetHealth")]
    public async Task<ActionResult<HealthResponse>> Get(CancellationToken cancellationToken)
    {
        var healthy = await _health.IsDatabaseHealthyAsync(cancellationToken);

        var response = new HealthResponse
        {
            Status = healthy ? "healthy" : "unhealthy",
            CheckedAt = DateTime.UtcNow,
        };

        return healthy ? Ok(response) : StatusCode(StatusCodes.Status503ServiceUnavailable, response);
    }
}
