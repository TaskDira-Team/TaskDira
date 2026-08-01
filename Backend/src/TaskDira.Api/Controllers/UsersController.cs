using Microsoft.AspNetCore.Mvc;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ApiControllerBase
{
    private readonly IUserService _users;

    public UsersController(IUserService users)
    {
        _users = users;
    }

    [HttpGet(Name = "GetUsers")]
    public async Task<ActionResult<PagedResult<UserResponse>>> GetPage([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        return Ok(await _users.GetPageAsync(query, cancellationToken));
    }

    [HttpGet("{id:int}", Name = "GetUserById")]
    public async Task<ActionResult<UserResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var user = await _users.GetByIdAsync(id, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost(Name = "CreateUser")]
    public async Task<ActionResult<UserResponse>> Create([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        var created = await _users.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}", Name = "UpdateUser")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var updated = await _users.UpdateAsync(id, request, cancellationToken);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}", Name = "DeleteUser")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var deleted = await _users.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
