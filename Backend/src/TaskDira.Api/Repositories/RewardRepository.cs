using Dapper;
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

    public async Task<Reward?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_reward_by_id(@p_id)",
            new { p_id = id },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<Reward>(command);
    }

    public async Task<IReadOnlyList<Reward>> GetPageAsync(int householdId, int offset, int limit, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_household_rewards_page(@p_householdid, @p_offset, @p_limit)",
            new { p_householdid = householdId, p_offset = offset, p_limit = limit },
            cancellationToken: cancellationToken);

        var rewards = await connection.QueryAsync<Reward>(command);
        return rewards.ToList();
    }

    public async Task<int> CountAsync(int householdId, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_count_household_rewards(@p_householdid)",
            new { p_householdid = householdId },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<Reward> InsertAsync(Reward reward, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_insert_reward(@p_title, @p_requiredpoints, @p_householdid)",
            new
            {
                p_title = reward.Title,
                p_requiredpoints = reward.Requiredpoints,
                p_householdid = reward.Householdid,
            },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleAsync<Reward>(command);
    }

    public async Task<bool> UpdateAsync(Reward reward, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_update_reward(@p_id, @p_title, @p_requiredpoints)",
            new
            {
                p_id = reward.Id,
                p_title = reward.Title,
                p_requiredpoints = reward.Requiredpoints,
            },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }

    public async Task<bool> ClaimAsync(int rewardId, int userId, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_claim_reward(@p_id, @p_userid)",
            new { p_id = rewardId, p_userid = userId },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_delete_reward(@p_id)",
            new { p_id = id },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }
}
