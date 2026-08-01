using Microsoft.AspNetCore.Mvc;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("api")]
public class ChoreTasksController : ApiControllerBase
{
    private readonly IChoreTaskService _tasks;

    public ChoreTasksController(IChoreTaskService tasks)
    {
        _tasks = tasks;
    }

    [HttpGet("households/{householdId:int}/tasks", Name = "GetHouseholdTasks")]
    public async Task<ActionResult<PagedResult<ChoreTaskResponse>>> GetPage(int householdId, [FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var page = await _tasks.GetPageAsync(householdId, callerUserId, query, cancellationToken);
        return page is null ? NotFound() : Ok(page);
    }

    [HttpGet("tasks/{id:int}", Name = "GetTaskById")]
    public async Task<ActionResult<ChoreTaskResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var task = await _tasks.GetByIdAsync(id, callerUserId, cancellationToken);
        return task is null ? NotFound() : Ok(task);
    }

    [HttpPost("households/{householdId:int}/tasks", Name = "CreateTask")]
    public async Task<ActionResult<ChoreTaskResponse>> Create(int householdId, [FromBody] CreateChoreTaskRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var created = await _tasks.CreateAsync(householdId, request, callerUserId, cancellationToken);
        return created is null ? NotFound() : CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("tasks/{id:int}", Name = "UpdateTask")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateChoreTaskRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var updated = await _tasks.UpdateAsync(id, request, callerUserId, cancellationToken);
        return updated ? NoContent() : NotFound();
    }

    [HttpPut("tasks/{id:int}/status", Name = "UpdateTaskStatus")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateChoreTaskStatusRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var updated = await _tasks.UpdateStatusAsync(id, request, callerUserId, cancellationToken);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("tasks/{id:int}", Name = "DeleteTask")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var deleted = await _tasks.DeleteAsync(id, callerUserId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
