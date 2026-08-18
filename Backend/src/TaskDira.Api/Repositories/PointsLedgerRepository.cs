using Dapper;
using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface IPointsLedgerRepository
{
    Task<PointsLedgerEntry?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<IReadOnlyList<PointsLedgerEntry>> GetPageForHouseholdAsync(int householdId, int offset, int limit, CancellationToken cancellationToken);

    Task<int> CountForHouseholdAsync(int householdId, CancellationToken cancellationToken);

    Task<int> CountForTaskAsync(int taskId, CancellationToken cancellationToken);

    Task<int> GetTotalForUserAsync(int householdId, int userId, CancellationToken cancellationToken);

    Task<int> GetBalanceForUserAsync(int householdId, int userId, CancellationToken cancellationToken);

    Task<PointsLedgerEntry?> InsertAsync(PointsLedgerEntry entry, CancellationToken cancellationToken);

    Task<PointsLedgerEntry?> InsertSpendAsync(int householdId, int userId, int rewardId, int points, CancellationToken cancellationToken);
}

public class PointsLedgerRepository : IPointsLedgerRepository
{
    private readonly IDbConnectionFactory _connections;

    public PointsLedgerRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public async Task<PointsLedgerEntry?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_points_ledger_by_id(@p_id)",
            new { p_id = id },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<PointsLedgerEntry>(command);
    }

    public async Task<int> CountForTaskAsync(int taskId, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_count_points_ledger_for_task(@p_taskid)",
            new { p_taskid = taskId },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<IReadOnlyList<PointsLedgerEntry>> GetPageForHouseholdAsync(int householdId, int offset, int limit, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_points_ledger_page(@p_householdid, @p_offset, @p_limit)",
            new { p_householdid = householdId, p_offset = offset, p_limit = limit },
            cancellationToken: cancellationToken);

        var entries = await connection.QueryAsync<PointsLedgerEntry>(command);
        return entries.ToList();
    }

    public async Task<int> CountForHouseholdAsync(int householdId, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_count_points_ledger(@p_householdid)",
            new { p_householdid = householdId },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<int> GetTotalForUserAsync(int householdId, int userId, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_get_user_points_total(@p_householdid, @p_userid)",
            new { p_householdid = householdId, p_userid = userId },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<int> GetBalanceForUserAsync(int householdId, int userId, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_get_user_points_balance(@p_householdid, @p_userid)",
            new { p_householdid = householdId, p_userid = userId },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<PointsLedgerEntry?> InsertAsync(PointsLedgerEntry entry, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_insert_points_ledger(@p_householdid, @p_userid, @p_taskid, @p_pointsearned)",
            new
            {
                p_householdid = entry.Householdid,
                p_userid = entry.Userid,
                p_taskid = entry.Taskid,
                p_pointsearned = entry.Pointsearned,
            },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<PointsLedgerEntry>(command);
    }

    public async Task<PointsLedgerEntry?> InsertSpendAsync(int householdId, int userId, int rewardId, int points, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_insert_points_spend(@p_householdid, @p_userid, @p_rewardid, @p_points)",
            new
            {
                p_householdid = householdId,
                p_userid = userId,
                p_rewardid = rewardId,
                p_points = points,
            },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<PointsLedgerEntry>(command);
    }
}
