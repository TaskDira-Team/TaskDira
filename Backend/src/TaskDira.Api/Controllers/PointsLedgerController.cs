using Microsoft.AspNetCore.Mvc;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("api/households/{householdId:int}/points-ledger")]
public class PointsLedgerController : ApiControllerBase
{
    private readonly IPointsLedgerService _ledger;

    public PointsLedgerController(IPointsLedgerService ledger)
    {
        _ledger = ledger;
    }

    [HttpGet(Name = "GetPointsLedger")]
    public async Task<ActionResult<PagedResult<PointsLedgerEntryResponse>>> GetPage(int householdId, [FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var page = await _ledger.GetPageAsync(householdId, callerUserId, query, cancellationToken);
        return page is null ? NotFound() : Ok(page);
    }

    [HttpGet("totals/{userId:int}", Name = "GetUserPointsTotal")]
    public async Task<ActionResult<int>> GetTotalForUser(int householdId, int userId, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var total = await _ledger.GetTotalForUserAsync(householdId, userId, callerUserId, cancellationToken);
        return total is null ? NotFound() : Ok(total.Value);
    }

    [HttpGet("balance/{userId:int}", Name = "GetUserPointsBalance")]
    public async Task<ActionResult<int>> GetBalanceForUser(int householdId, int userId, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var balance = await _ledger.GetBalanceForUserAsync(householdId, userId, callerUserId, cancellationToken);
        return balance is null ? NotFound() : Ok(balance.Value);
    }

    [HttpPost(Name = "AwardPoints")]
    public async Task<ActionResult<PointsLedgerEntryResponse>> Award(int householdId, [FromBody] CreatePointsLedgerEntryRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var created = await _ledger.AwardAsync(householdId, request, callerUserId, cancellationToken);

        return created is null ? NotFound() : CreatedAtAction(nameof(GetPage), new { householdId }, created);
    }
}
