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

    public Task<IReadOnlyList<MonthlyLeaderboardEntry>> GetPageAsync(
        int householdId, int month, int year, int offset, int limit, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'list leaderboard paged' does not exist yet.");
    }

    public Task<int> CountAsync(int householdId, int month, int year, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'count leaderboard entries' does not exist yet.");
    }

    public Task<MonthlyLeaderboardEntry?> GetForUserAsync(
        int householdId, int userId, int month, int year, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'get leaderboard entry for user' does not exist yet.");
    }
}
