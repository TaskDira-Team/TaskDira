using Dapper;
using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface IChoreTaskRepository
{
    Task<ChoreTask?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<IReadOnlyList<ChoreTask>> GetPageAsync(int householdId, int offset, int limit, CancellationToken cancellationToken);

    Task<int> CountAsync(int householdId, CancellationToken cancellationToken);

    Task<ChoreTask> InsertAsync(ChoreTask task, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(ChoreTask task, CancellationToken cancellationToken);

    Task<bool> UpdateStatusAsync(int id, string status, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

public class ChoreTaskRepository : IChoreTaskRepository
{
    private readonly IDbConnectionFactory _connections;

    public ChoreTaskRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public async Task<ChoreTask?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_task_by_id(@p_id)",
            new { p_id = id },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<ChoreTask>(command);
    }

    public async Task<IReadOnlyList<ChoreTask>> GetPageAsync(int householdId, int offset, int limit, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_household_tasks_page(@p_householdid, @p_offset, @p_limit)",
            new { p_householdid = householdId, p_offset = offset, p_limit = limit },
            cancellationToken: cancellationToken);

        var tasks = await connection.QueryAsync<ChoreTask>(command);
        return tasks.ToList();
    }

    public async Task<int> CountAsync(int householdId, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_count_household_tasks(@p_householdid)",
            new { p_householdid = householdId },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<ChoreTask> InsertAsync(ChoreTask task, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_insert_task(@p_householdid, @p_title, @p_description, @p_categoryid, @p_pointsvalue, @p_assigneduserid, @p_duedate)",
            new
            {
                p_householdid = task.Householdid,
                p_title = task.Title,
                p_description = task.Description,
                p_categoryid = task.Categoryid,
                p_pointsvalue = task.Pointsvalue,
                p_assigneduserid = task.Assigneduserid,
                p_duedate = task.Duedate,
            },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleAsync<ChoreTask>(command);
    }

    public async Task<bool> UpdateAsync(ChoreTask task, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_update_task(@p_id, @p_title, @p_description, @p_categoryid, @p_pointsvalue, @p_assigneduserid, @p_duedate)",
            new
            {
                p_id = task.Id,
                p_title = task.Title,
                p_description = task.Description,
                p_categoryid = task.Categoryid,
                p_pointsvalue = task.Pointsvalue,
                p_assigneduserid = task.Assigneduserid,
                p_duedate = task.Duedate,
            },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }

    public async Task<bool> UpdateStatusAsync(int id, string status, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_update_task_status(@p_id, @p_status)",
            new { p_id = id, p_status = status },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_delete_task(@p_id)",
            new { p_id = id },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }
}
