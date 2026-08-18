using Dapper;
using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface ITaskSubItemRepository
{
    Task<TaskSubItem?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<IReadOnlyList<TaskSubItem>> GetPageAsync(int taskId, int offset, int limit, CancellationToken cancellationToken);

    Task<int> CountAsync(int taskId, CancellationToken cancellationToken);

    Task<TaskSubItem> InsertAsync(TaskSubItem subItem, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(TaskSubItem subItem, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

public class TaskSubItemRepository : ITaskSubItemRepository
{
    private readonly IDbConnectionFactory _connections;

    public TaskSubItemRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public async Task<TaskSubItem?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_task_sub_item_by_id(@p_id)",
            new { p_id = id },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<TaskSubItem>(command);
    }

    public async Task<IReadOnlyList<TaskSubItem>> GetPageAsync(int taskId, int offset, int limit, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_task_sub_items_page(@p_taskid, @p_offset, @p_limit)",
            new { p_taskid = taskId, p_offset = offset, p_limit = limit },
            cancellationToken: cancellationToken);

        var subItems = await connection.QueryAsync<TaskSubItem>(command);
        return subItems.ToList();
    }

    public async Task<int> CountAsync(int taskId, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_count_task_sub_items(@p_taskid)",
            new { p_taskid = taskId },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<TaskSubItem> InsertAsync(TaskSubItem subItem, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_insert_task_sub_item(@p_taskid, @p_itemtext)",
            new
            {
                p_taskid = subItem.Taskid,
                p_itemtext = subItem.Itemtext,
            },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleAsync<TaskSubItem>(command);
    }

    public async Task<bool> UpdateAsync(TaskSubItem subItem, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_update_task_sub_item(@p_id, @p_itemtext, @p_iscompleted)",
            new
            {
                p_id = subItem.Id,
                p_itemtext = subItem.Itemtext,
                p_iscompleted = subItem.Iscompleted,
            },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_delete_task_sub_item(@p_id)",
            new { p_id = id },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }
}
