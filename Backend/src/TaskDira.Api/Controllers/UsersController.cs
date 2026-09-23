using Microsoft.AspNetCore.Mvc;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ApiControllerBase
{
    private readonly IUserService _users;
    private readonly IFamilyService _family;

    public UsersController(IUserService users, IFamilyService family)
    {
        _users = users;
        _family = family;
    }

    [HttpGet(Name = "GetUsers")]
    public async Task<ActionResult<PagedResult<UserResponse>>> GetPage([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        await Task.CompletedTask;
        return StatusCode(403);
    }

    [HttpGet("{id:int}", Name = "GetUserById")]
    public async Task<ActionResult<UserResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var caller)) return Unauthorized();
        var access = await _family.ContextAsync(caller, id, cancellationToken);
        if (!access.GetProperty("canRead").GetBoolean()) return NotFound();
        var user = await _users.GetByIdAsync(id, cancellationToken);
        if (user is not null)
        {
            user.IsManagedProfile = access.GetProperty("isManagedProfile").GetBoolean();
            if (user.IsManagedProfile || caller != id) user.Email = "";
        }
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost(Name = "CreateUser")]
    public async Task<ActionResult<UserResponse>> Create([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        await Task.CompletedTask;
        return StatusCode(403);
    }

    [HttpPut("{id:int}", Name = "UpdateUser")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var caller)) return Unauthorized();
        if (caller != id) return NotFound();
        var access = await _family.ContextAsync(caller, id, cancellationToken);
        if (access.GetProperty("isManagedProfile").GetBoolean()) request.FamilyRole = "kid";
        var updated = await _users.UpdateAsync(id, request, cancellationToken);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}", Name = "DeleteUser")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var caller)) return Unauthorized();
        if (caller != id) return NotFound();
        var deleted = await _users.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
