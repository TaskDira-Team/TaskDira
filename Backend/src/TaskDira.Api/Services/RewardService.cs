using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

public interface IRewardService
{
    Task<PagedResult<RewardResponse>?> GetPageAsync(int householdId, int callerUserId, PaginationQuery query, CancellationToken cancellationToken);

    Task<RewardResponse?> GetByIdAsync(int id, int callerUserId, CancellationToken cancellationToken);

    Task<RewardResponse?> CreateAsync(int householdId, CreateRewardRequest request, int callerUserId, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(int id, UpdateRewardRequest request, int callerUserId, CancellationToken cancellationToken);

    Task<bool> ClaimAsync(int id, int callerUserId, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, int callerUserId, CancellationToken cancellationToken);
}

public class RewardService : IRewardService
{
    private readonly IRewardRepository _rewards;
    private readonly IPointsLedgerRepository _ledger;
    private readonly IHouseholdMemberRepository _members;

    public RewardService(
        IRewardRepository rewards,
        IPointsLedgerRepository ledger,
        IHouseholdMemberRepository members)
    {
        _rewards = rewards;
        _ledger = ledger;
        _members = members;
    }

    public async Task<PagedResult<RewardResponse>?> GetPageAsync(int householdId, int callerUserId, PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!await IsMemberAsync(householdId, callerUserId, cancellationToken))
            return null;

        var (page, pageSize, offset) = Pagination.Normalize(query);

        var rewards = await _rewards.GetPageAsync(householdId, offset, pageSize, cancellationToken);
        var total = await _rewards.CountAsync(householdId, cancellationToken);

        return new PagedResult<RewardResponse>
        {
            Items = rewards.Select(ToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
        };
    }

    public async Task<RewardResponse?> GetByIdAsync(int id, int callerUserId, CancellationToken cancellationToken)
    {
        var visible = await LoadVisibleRewardAsync(id, callerUserId, cancellationToken);
        return visible is null ? null : ToResponse(visible.Value.Reward);
    }

    public async Task<RewardResponse?> CreateAsync(int householdId, CreateRewardRequest request, int callerUserId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Title is required.", nameof(request));

        if (request.RequiredPoints < 0)
            throw new ArgumentException("Required points cannot be negative.", nameof(request));

        if (!await EnsureAdminAsync(householdId, callerUserId, cancellationToken))
            return null;

        var reward = new Reward
        {
            Householdid = householdId,
            Title = request.Title.Trim(),
            Requiredpoints = request.RequiredPoints,
            Emoji = request.Emoji,
            Description = request.Description,
            Cost = request.Cost ?? request.RequiredPoints,
            Category = request.Category,
        };

        var created = await _rewards.InsertAsync(reward, cancellationToken);
        return ToResponse(created);
    }

    public async Task<bool> UpdateAsync(int id, UpdateRewardRequest request, int callerUserId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Title is required.", nameof(request));

        if (request.RequiredPoints < 0)
            throw new ArgumentException("Required points cannot be negative.", nameof(request));

        var visible = await LoadVisibleRewardAsync(id, callerUserId, cancellationToken);
        if (visible is null)
            return false;

        var (reward, householdId) = visible.Value;

        if (!await EnsureAdminAsync(householdId, callerUserId, cancellationToken))
            return false;

        reward.Title = request.Title.Trim();
        reward.Requiredpoints = request.RequiredPoints;
        reward.Emoji = request.Emoji;
        reward.Description = request.Description;
        reward.Cost = request.Cost ?? request.RequiredPoints;
        reward.Category = request.Category;

        return await _rewards.UpdateAsync(reward, cancellationToken);
    }

    public async Task<bool> ClaimAsync(int id, int callerUserId, CancellationToken cancellationToken)
    {
        var visible = await LoadVisibleRewardAsync(id, callerUserId, cancellationToken);
        if (visible is null)
            return false;

        var (reward, householdId) = visible.Value;

        if (reward.Claimedbyuserid is not null)
            throw new InvalidOperationException("That reward has already been claimed.");

        var balance = await _ledger.GetBalanceForUserAsync(householdId, callerUserId, cancellationToken);
        if (balance < reward.Cost)
            throw new InvalidOperationException("Not enough points to claim that reward.");

        var spend = await _ledger.InsertSpendAsync(householdId, callerUserId, id, reward.Cost, cancellationToken);
        if (spend is null)
            throw new InvalidOperationException("Not enough points to claim that reward.");

        // The repository claims only if claimedbyuserid is still null, so two members
        // racing produce one winner and one conflict rather than a silent overwrite.
        return await _rewards.ClaimAsync(id, callerUserId, cancellationToken);
    }

    public async Task<bool> DeleteAsync(int id, int callerUserId, CancellationToken cancellationToken)
    {
        var visible = await LoadVisibleRewardAsync(id, callerUserId, cancellationToken);
        if (visible is null)
            return false;

        if (!await EnsureAdminAsync(visible.Value.HouseholdId, callerUserId, cancellationToken))
            return false;

        return await _rewards.DeleteAsync(id, cancellationToken);
    }

    private async Task<(Reward Reward, int HouseholdId)?> LoadVisibleRewardAsync(int id, int callerUserId, CancellationToken cancellationToken)
    {
        if (id <= 0)
            return null;

        var reward = await _rewards.GetByIdAsync(id, cancellationToken);
        if (reward is null || reward.Householdid is not int householdId)
            return null;

        return await IsMemberAsync(householdId, callerUserId, cancellationToken) ? (reward, householdId) : null;
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

    private static RewardResponse ToResponse(Reward reward) => new()
    {
        Id = reward.Id,
        Title = reward.Title,
        RequiredPoints = reward.Requiredpoints,
        ClaimedByUserId = reward.Claimedbyuserid,
        HouseholdId = reward.Householdid ?? 0,
        Emoji = reward.Emoji,
        Description = reward.Description,
        Cost = reward.Cost,
        Category = reward.Category,
    };
}
