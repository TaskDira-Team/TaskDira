using Dapper;
using Microsoft.AspNetCore.Mvc;
using TaskDira.Api.Data;
using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Controllers;

/// <summary>
/// Every checklist item for every task in a household, in one request, so a
/// screen refresh doesn't need one sub-items call per task.
/// </summary>
[ApiController]
[Route("api/households/{householdId:int}/subitems")]
public class HouseholdSubItemsController : ApiControllerBase
{
    private const string Sql = """
        SELECT s.id, s.taskid, s.itemtext, s.iscompleted
        FROM tasksubitems s
        JOIN tasks t ON t.id = s.taskid
        WHERE t.householdid = @householdId
        ORDER BY s.taskid, s.id
        """;

    private readonly IDbConnectionFactory _connections;
    private readonly IHouseholdMemberRepository _members;

    public HouseholdSubItemsController(IDbConnectionFactory connections, IHouseholdMemberRepository members)
    {
        _connections = connections;
        _members = members;
    }

    [HttpGet(Name = "GetHouseholdSubItems")]
    public async Task<ActionResult<IReadOnlyList<TaskSubItemResponse>>> GetAll(int householdId, CancellationToken cancellationToken)
    {
        if (!TryGetCallerUserId(out var callerUserId))
        {
            return Unauthorized();
        }

        if (await _members.GetAsync(householdId, callerUserId, cancellationToken) is null)
        {
            return NotFound();
        }

        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<TaskSubItem>(
            new CommandDefinition(Sql, new { householdId }, cancellationToken: cancellationToken));

        return Ok(rows.Select(s => new TaskSubItemResponse
        {
            Id = s.Id,
            TaskId = s.Taskid,
            ItemText = s.Itemtext,
            IsCompleted = s.Iscompleted,
        }).ToList());
    }
}
