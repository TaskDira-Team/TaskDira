using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

public interface IMonthlyLeaderboardService
{
    Task<PagedResult<MonthlyLeaderboardEntryResponse>?> GetPageAsync(int householdId, LeaderboardPeriodQuery period, int callerUserId, PaginationQuery query, CancellationToken cancellationToken);

    Task<MonthlyLeaderboardEntryResponse?> GetForUserAsync(int householdId, int userId, LeaderboardPeriodQuery period, int callerUserId, CancellationToken cancellationToken);
}

public class MonthlyLeaderboardService : IMonthlyLeaderboardService
{
    private readonly IMonthlyLeaderboardRepository _leaderboard;
    private readonly IHouseholdMemberRepository _members;

    public MonthlyLeaderboardService(IMonthlyLeaderboardRepository leaderboard, IHouseholdMemberRepository members)
    {
        _leaderboard = leaderboard;
        _members = members;
    }

    public async Task<PagedResult<MonthlyLeaderboardEntryResponse>?> GetPageAsync(
        int householdId, LeaderboardPeriodQuery period, int callerUserId, PaginationQuery query, CancellationToken cancellationToken)
    {
        var (month, year) = NormalizePeriod(period);

        if (!await IsMemberAsync(householdId, callerUserId, cancellationToken))
            return null;

        var (page, pageSize, offset) = Pagination.Normalize(query);

        var entries = await _leaderboard.GetPageAsync(householdId, month, year, offset, pageSize, cancellationToken);
        var total = await _leaderboard.CountAsync(householdId, month, year, cancellationToken);

        return new PagedResult<MonthlyLeaderboardEntryResponse>
        {
            Items = entries.Select(ToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
        };
    }

    public async Task<MonthlyLeaderboardEntryResponse?> GetForUserAsync(
        int householdId, int userId, LeaderboardPeriodQuery period, int callerUserId, CancellationToken cancellationToken)
    {
        var (month, year) = NormalizePeriod(period);

        if (!await IsMemberAsync(householdId, callerUserId, cancellationToken))
            return null;

        if (!await IsMemberAsync(householdId, userId, cancellationToken))
            return null;

        var entry = await _leaderboard.GetForUserAsync(householdId, userId, month, year, cancellationToken);
        return entry is null ? null : ToResponse(entry);
    }

    private static (int Month, int Year) NormalizePeriod(LeaderboardPeriodQuery period)
    {
        var now = DateTime.UtcNow;
        var month = period.Month == 0 ? now.Month : period.Month;
        var year = period.Year == 0 ? now.Year : period.Year;

        if (month is < 1 or > 12)
            throw new ArgumentException("Month must be between 1 and 12.", nameof(period));

        if (year < 2000)
            throw new ArgumentException("Year is out of range.", nameof(period));

        return (month, year);
    }

    private async Task<bool> IsMemberAsync(int householdId, int userId, CancellationToken cancellationToken)
    {
        var membership = await _members.GetAsync(householdId, userId, cancellationToken);
        return membership is not null;
    }

    private static MonthlyLeaderboardEntryResponse ToResponse(MonthlyLeaderboardEntry entry) => new()
    {
        Id = entry.Id,
        HouseholdId = entry.Householdid,
        UserId = entry.Userid,
        Month = entry.Month,
        Year = entry.Year,
        TotalPoints = entry.Totalpoints,
        Rank = entry.Rank,
    };
}
