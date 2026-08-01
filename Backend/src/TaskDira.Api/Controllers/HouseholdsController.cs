using Microsoft.AspNetCore.Mvc;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("api/households")]
public class HouseholdsController : ApiControllerBase
{
    private readonly IHouseholdService _households;

    public HouseholdsController(IHouseholdService households)
    {
        _households = households;
    }

    [HttpGet(Name = "GetHouseholds")]
    public async Task<ActionResult<PagedResult<HouseholdResponse>>> GetPage([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        return Ok(await _households.GetPageForCallerAsync(callerUserId, query, cancellationToken));
    }

    [HttpGet("{id:int}", Name = "GetHouseholdById")]
    public async Task<ActionResult<HouseholdResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var household = await _households.GetByIdAsync(id, callerUserId, cancellationToken);
        return household is null ? NotFound() : Ok(household);
    }

    [HttpPost(Name = "CreateHousehold")]
    public async Task<ActionResult<HouseholdResponse>> Create([FromBody] CreateHouseholdRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var created = await _households.CreateAsync(request, callerUserId, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}", Name = "UpdateHousehold")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateHouseholdRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var updated = await _households.UpdateAsync(id, request, callerUserId, cancellationToken);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}", Name = "DeleteHousehold")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var deleted = await _households.DeleteAsync(id, callerUserId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
