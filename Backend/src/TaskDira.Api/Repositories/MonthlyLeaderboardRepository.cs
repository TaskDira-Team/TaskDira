using Dapper;
using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface IMonthlyLeaderboardRepository
{
    Task<IReadOnlyList<MonthlyLeaderboardEntry>> GetPageAsync(
        int householdId, int month, int year, int offset, int limit, CancellationToken cancellationToken);

    Task<int> CountAsync(int householdId, int month, int year, CancellationToken cancellationToken);

    Task<MonthlyLeaderboardEntry?> GetForUserAsync(
        int householdId, int userId, int month, int year, CancellationToken cancellationToken);
}

public class MonthlyLeaderboardRepository : IMonthlyLeaderboardRepository
{
    private readonly IDbConnectionFactory _connections;

    public MonthlyLeaderboardRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public async Task<IReadOnlyList<MonthlyLeaderboardEntry>> GetPageAsync(
        int householdId, int month, int year, int offset, int limit, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_leaderboard(@p_householdid, @p_month, @p_year, @p_offset, @p_limit)",
            new
            {
                p_householdid = householdId,
                p_month = month,
                p_year = year,
                p_offset = offset,
                p_limit = limit,
            },
            cancellationToken: cancellationToken);

        var entries = await connection.QueryAsync<MonthlyLeaderboardEntry>(command);
        return entries.ToList();
    }

    public async Task<int> CountAsync(int householdId, int month, int year, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_count_leaderboard(@p_householdid, @p_month, @p_year)",
            new { p_householdid = householdId, p_month = month, p_year = year },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<MonthlyLeaderboardEntry?> GetForUserAsync(
        int householdId, int userId, int month, int year, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_user_leaderboard_entry(@p_householdid, @p_userid, @p_month, @p_year)",
            new
            {
                p_householdid = householdId,
                p_userid = userId,
                p_month = month,
                p_year = year,
            },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<MonthlyLeaderboardEntry>(command);
    }
}
