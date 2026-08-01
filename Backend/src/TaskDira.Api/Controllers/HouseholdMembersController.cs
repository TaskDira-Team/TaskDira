using Microsoft.AspNetCore.Mvc;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("api/households/{householdId:int}/members")]
public class HouseholdMembersController : ApiControllerBase
{
    private readonly IHouseholdMemberService _members;

    public HouseholdMembersController(IHouseholdMemberService members)
    {
        _members = members;
    }

    [HttpGet(Name = "GetHouseholdMembers")]
    public async Task<ActionResult<PagedResult<HouseholdMemberResponse>>> GetPage(int householdId, [FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var page = await _members.GetPageAsync(householdId, callerUserId, query, cancellationToken);
        return page is null ? NotFound() : Ok(page);
    }

    [HttpGet("{userId:int}", Name = "GetHouseholdMemberById")]
    public async Task<ActionResult<HouseholdMemberResponse>> GetById(int householdId, int userId, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var member = await _members.GetAsync(householdId, userId, callerUserId, cancellationToken);
        return member is null ? NotFound() : Ok(member);
    }

    [HttpPost(Name = "AddHouseholdMember")]
    public async Task<ActionResult<HouseholdMemberResponse>> Add(int householdId, [FromBody] AddHouseholdMemberRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var created = await _members.AddAsync(householdId, request, callerUserId, cancellationToken);
        return created is null ? NotFound() : CreatedAtAction(nameof(GetById), new { householdId, userId = created.UserId }, created);
    }

    [HttpPut("{userId:int}/role", Name = "UpdateHouseholdMemberRole")]
    public async Task<IActionResult> UpdateRole(int householdId, int userId, [FromBody] UpdateHouseholdMemberRoleRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var updated = await _members.UpdateRoleAsync(householdId, userId, request, callerUserId, cancellationToken);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{userId:int}", Name = "RemoveHouseholdMember")]
    public async Task<IActionResult> Remove(int householdId, int userId, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var removed = await _members.RemoveAsync(householdId, userId, callerUserId, cancellationToken);
        return removed ? NoContent() : NotFound();
    }
}
