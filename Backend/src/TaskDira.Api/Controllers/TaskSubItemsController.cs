using Microsoft.AspNetCore.Mvc;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("api/tasks/{taskId:int}/subitems")]
public class TaskSubItemsController : ApiControllerBase
{
    private readonly ITaskSubItemService _subItems;

    public TaskSubItemsController(ITaskSubItemService subItems)
    {
        _subItems = subItems;
    }

    [HttpGet(Name = "GetTaskSubItems")]
    public async Task<ActionResult<PagedResult<TaskSubItemResponse>>> GetPage(int taskId, [FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var page = await _subItems.GetPageAsync(taskId, callerUserId, query, cancellationToken);
        return page is null ? NotFound() : Ok(page);
    }

    [HttpGet("{id:int}", Name = "GetTaskSubItemById")]
    public async Task<ActionResult<TaskSubItemResponse>> GetById(int taskId, int id, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var subItem = await _subItems.GetByIdAsync(taskId, id, callerUserId, cancellationToken);
        return subItem is null ? NotFound() : Ok(subItem);
    }

    [HttpPost(Name = "CreateTaskSubItem")]
    public async Task<ActionResult<TaskSubItemResponse>> Create(int taskId, [FromBody] CreateTaskSubItemRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var created = await _subItems.CreateAsync(taskId, request, callerUserId, cancellationToken);
        return created is null
            ? NotFound()
            : CreatedAtAction(nameof(GetById), new { taskId, id = created.Id }, created);
    }

    [HttpPut("{id:int}", Name = "UpdateTaskSubItem")]
    public async Task<IActionResult> Update(int taskId, int id, [FromBody] UpdateTaskSubItemRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var updated = await _subItems.UpdateAsync(taskId, id, request, callerUserId, cancellationToken);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}", Name = "DeleteTaskSubItem")]
    public async Task<IActionResult> Delete(int taskId, int id, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        var deleted = await _subItems.DeleteAsync(taskId, id, callerUserId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
