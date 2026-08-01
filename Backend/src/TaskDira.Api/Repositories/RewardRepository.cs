using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface IRewardRepository
{
    Task<Reward?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<IReadOnlyList<Reward>> GetPageAsync(int householdId, int offset, int limit, CancellationToken cancellationToken);

    Task<int> CountAsync(int householdId, CancellationToken cancellationToken);

    Task<Reward> InsertAsync(Reward reward, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(Reward reward, CancellationToken cancellationToken);

    Task<bool> ClaimAsync(int rewardId, int userId, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

public class RewardRepository : IRewardRepository
{
    private readonly IDbConnectionFactory _connections;

    public RewardRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public Task<Reward?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'get reward by id' does not exist yet.");
    }

    public Task<IReadOnlyList<Reward>> GetPageAsync(int householdId, int offset, int limit, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'list rewards paged' does not exist yet.");
    }

    public Task<int> CountAsync(int householdId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'count rewards' does not exist yet.");
    }

    public Task<Reward> InsertAsync(Reward reward, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'insert reward' does not exist yet.");
    }

    public Task<bool> UpdateAsync(Reward reward, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'update reward' does not exist yet.");
    }

    public Task<bool> ClaimAsync(int rewardId, int userId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'claim reward' does not exist yet.");
    }

    public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'delete reward' does not exist yet.");
    }
}
