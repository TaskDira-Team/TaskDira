using Microsoft.AspNetCore.Mvc;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("api")]
public class RewardsController : ApiControllerBase
{
    private readonly IRewardService _rewards;

    public RewardsController(IRewardService rewards)
    {
        _rewards = rewards;
    }

    [HttpGet("households/{householdId:int}/rewards", Name = "GetHouseholdRewards")]
    public async Task<ActionResult<PagedResult<RewardResponse>>> GetPage(int householdId, [FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var page = await _rewards.GetPageAsync(householdId, callerUserId, query, cancellationToken);
        return page is null ? NotFound() : Ok(page);
    }

    [HttpGet("rewards/{id:int}", Name = "GetRewardById")]
    public async Task<ActionResult<RewardResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var reward = await _rewards.GetByIdAsync(id, callerUserId, cancellationToken);
        return reward is null ? NotFound() : Ok(reward);
    }

    [HttpPost("households/{householdId:int}/rewards", Name = "CreateReward")]
    public async Task<ActionResult<RewardResponse>> Create(int householdId, [FromBody] CreateRewardRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var created = await _rewards.CreateAsync(householdId, request, callerUserId, cancellationToken);
        return created is null
            ? NotFound()
            : CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("rewards/{id:int}", Name = "UpdateReward")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRewardRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var updated = await _rewards.UpdateAsync(id, request, callerUserId, cancellationToken);
        return updated ? NoContent() : NotFound();
    }

    [HttpPost("rewards/{id:int}/claim", Name = "ClaimReward")]
    public async Task<IActionResult> Claim(int id, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var claimed = await _rewards.ClaimAsync(id, callerUserId, cancellationToken);
        return claimed ? NoContent() : NotFound();
    }

    [HttpDelete("rewards/{id:int}", Name = "DeleteReward")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var deleted = await _rewards.DeleteAsync(id, callerUserId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
