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

    public Task<ChoreTask?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'get task by id' does not exist yet.");
    }

    public Task<IReadOnlyList<ChoreTask>> GetPageAsync(int householdId, int offset, int limit, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'list tasks paged' does not exist yet.");
    }

    public Task<int> CountAsync(int householdId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'count tasks' does not exist yet.");
    }

    public Task<ChoreTask> InsertAsync(ChoreTask task, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'insert task' does not exist yet.");
    }

    public Task<bool> UpdateAsync(ChoreTask task, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'update task' does not exist yet.");
    }

    public Task<bool> UpdateStatusAsync(int id, string status, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'update task status' does not exist yet.");
    }

    public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'delete task' does not exist yet.");
    }
}
