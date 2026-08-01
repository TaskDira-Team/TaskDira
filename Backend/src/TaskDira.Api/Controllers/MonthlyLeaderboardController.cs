using Microsoft.AspNetCore.Mvc;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("api/households/{householdId:int}/leaderboard")]
public class MonthlyLeaderboardController : ApiControllerBase
{
    private readonly IMonthlyLeaderboardService _leaderboard;

    public MonthlyLeaderboardController(IMonthlyLeaderboardService leaderboard)
    {
        _leaderboard = leaderboard;
    }

    [HttpGet(Name = "GetLeaderboard")]
    public async Task<ActionResult<PagedResult<MonthlyLeaderboardEntryResponse>>> GetPage(int householdId, [FromQuery] LeaderboardPeriodQuery period, [FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var page = await _leaderboard.GetPageAsync(householdId, period, callerUserId, query, cancellationToken);
        return page is null ? NotFound() : Ok(page);
    }

    [HttpGet("users/{userId:int}", Name = "GetUserLeaderboardEntry")]
    public async Task<ActionResult<MonthlyLeaderboardEntryResponse>> GetForUser(int householdId, int userId, [FromQuery] LeaderboardPeriodQuery period, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var entry = await _leaderboard.GetForUserAsync(householdId, userId, period, callerUserId, cancellationToken);
        return entry is null ? NotFound() : Ok(entry);
    }
}
