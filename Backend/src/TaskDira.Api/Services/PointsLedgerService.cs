using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

public interface IPointsLedgerService
{
    Task<PagedResult<PointsLedgerEntryResponse>?> GetPageAsync(int householdId, int callerUserId, PaginationQuery query, CancellationToken cancellationToken);

    Task<int?> GetTotalForUserAsync(int householdId, int userId, int callerUserId, CancellationToken cancellationToken);

    Task<int?> GetBalanceForUserAsync(int householdId, int userId, int callerUserId, CancellationToken cancellationToken);

    Task<PointsLedgerEntryResponse?> AwardAsync(int householdId, CreatePointsLedgerEntryRequest request, int callerUserId, CancellationToken cancellationToken);
}


public class PointsLedgerService : IPointsLedgerService
{
    private readonly IPointsLedgerRepository _ledger;
    private readonly IHouseholdMemberRepository _members;

    public PointsLedgerService(IPointsLedgerRepository ledger, IHouseholdMemberRepository members)
    {
        _ledger = ledger;
        _members = members;
    }

    public async Task<PagedResult<PointsLedgerEntryResponse>?> GetPageAsync(int householdId, int callerUserId, PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!await IsMemberAsync(householdId, callerUserId, cancellationToken))
            return null;

        var (page, pageSize, offset) = Pagination.Normalize(query);

        var entries = await _ledger.GetPageForHouseholdAsync(householdId, offset, pageSize, cancellationToken);
        var total = await _ledger.CountForHouseholdAsync(householdId, cancellationToken);

        return new PagedResult<PointsLedgerEntryResponse>
        {
            Items = entries.Select(ToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
        };
    }

    public async Task<int?> GetTotalForUserAsync(int householdId, int userId, int callerUserId, CancellationToken cancellationToken)
    {
        if (!await IsMemberAsync(householdId, callerUserId, cancellationToken))
            return null;

        if (!await IsMemberAsync(householdId, userId, cancellationToken))
            return null;

        return await _ledger.GetTotalForUserAsync(householdId, userId, cancellationToken);
    }

    public async Task<int?> GetBalanceForUserAsync(int householdId, int userId, int callerUserId, CancellationToken cancellationToken)
    {
        if (!await IsMemberAsync(householdId, callerUserId, cancellationToken))
            return null;

        if (!await IsMemberAsync(householdId, userId, cancellationToken))
            return null;

        return await _ledger.GetBalanceForUserAsync(householdId, userId, cancellationToken);
    }

    public async Task<PointsLedgerEntryResponse?> AwardAsync(int householdId, CreatePointsLedgerEntryRequest request, int callerUserId, CancellationToken cancellationToken)
    {
        if (request.UserId <= 0)
            throw new ArgumentException("A user id is required.", nameof(request));

        if (request.PointsEarned == 0)
            throw new ArgumentException("An award of zero points is not a ledger event.", nameof(request));

        if (request.TaskId is not int taskId || taskId <= 0)
            throw new ArgumentException("A task id is required for a points award.", nameof(request));

        if (!await EnsureAdminAsync(householdId, callerUserId, cancellationToken))
            return null;

        if (!await IsMemberAsync(householdId, request.UserId, cancellationToken))
            throw new ArgumentException("That user is not a member of this household.", nameof(request));

        var entry = new PointsLedgerEntry
        {
            Householdid = householdId,
            Userid = request.UserId,
            Taskid = taskId,
            Pointsearned = request.PointsEarned,
        };

        var created = await _ledger.InsertAsync(entry, cancellationToken);
        if (created is null)
        {
            throw new InvalidOperationException("That task has already awarded points.");
        }

        return ToResponse(created);
    }

    private async Task<bool> IsMemberAsync(int householdId, int userId, CancellationToken cancellationToken)
    {
        var membership = await _members.GetAsync(householdId, userId, cancellationToken);
        return membership is not null;
    }

    private async Task<bool> EnsureAdminAsync(int householdId, int callerUserId, CancellationToken cancellationToken)
    {
        var membership = await _members.GetAsync(householdId, callerUserId, cancellationToken);
        if (membership is null)
            return false;

        if (!HouseholdRoles.IsAdmin(membership.Role))
            throw new UnauthorizedAccessException("Only a household admin can perform that action.");

        return true;
    }

    private static PointsLedgerEntryResponse ToResponse(PointsLedgerEntry entry) => new()
    {
        Id = entry.Id,
        HouseholdId = entry.Householdid,
        UserId = entry.Userid,
        TaskId = entry.Taskid,
        RewardId = entry.Rewardid,
        PointsEarned = entry.Pointsearned,
        EarnedAt = entry.Earnedat,
    };
}
