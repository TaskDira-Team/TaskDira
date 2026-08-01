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

    public Task<TaskSubItem?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'get task subitem by id' does not exist yet.");
    }

    public Task<IReadOnlyList<TaskSubItem>> GetPageAsync(int taskId, int offset, int limit, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'list task subitems paged' does not exist yet.");
    }

    public Task<int> CountAsync(int taskId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'count task subitems' does not exist yet.");
    }

    public Task<TaskSubItem> InsertAsync(TaskSubItem subItem, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'insert task subitem' does not exist yet.");
    }

    public Task<bool> UpdateAsync(TaskSubItem subItem, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'update task subitem' does not exist yet.");
    }

    public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'delete task subitem' does not exist yet.");
    }
}
