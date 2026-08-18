using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

public interface IHouseholdService
{
    Task<HouseholdResponse?> GetByIdAsync(int id, int callerUserId, CancellationToken cancellationToken);

    Task<PagedResult<HouseholdResponse>> GetPageForCallerAsync(int callerUserId, PaginationQuery query, CancellationToken cancellationToken);

    Task<HouseholdResponse> CreateAsync(CreateHouseholdRequest request, int callerUserId, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(int id, UpdateHouseholdRequest request, int callerUserId, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, int callerUserId, CancellationToken cancellationToken);
}

public class HouseholdService : IHouseholdService
{
    private readonly IHouseholdRepository _households;
    private readonly IHouseholdMemberRepository _members;

    public HouseholdService(IHouseholdRepository households, IHouseholdMemberRepository members)
    {
        _households = households;
        _members = members;
    }

    public async Task<HouseholdResponse?> GetByIdAsync(int id, int callerUserId, CancellationToken cancellationToken)
    {
        if (id <= 0)
            return null;

        var membership = await _members.GetAsync(id, callerUserId, cancellationToken);
        if (membership is null)
            return null;

        var household = await _households.GetByIdAsync(id, cancellationToken);
        return household is null ? null : ToResponse(household);
    }

    public async Task<PagedResult<HouseholdResponse>> GetPageForCallerAsync(int callerUserId, PaginationQuery query, CancellationToken cancellationToken)
    {
        var (page, pageSize, offset) = Pagination.Normalize(query);

        var households = await _households.GetPageForUserAsync(callerUserId, offset, pageSize, cancellationToken);
        var total = await _households.CountForUserAsync(callerUserId, cancellationToken);

        return new PagedResult<HouseholdResponse>
        {
            Items = households.Select(ToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
        };
    }

    public async Task<HouseholdResponse> CreateAsync(CreateHouseholdRequest request, int callerUserId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required.", nameof(request));

        var household = new Household
        {
            Name = request.Name.Trim(),
            Adminuserid = callerUserId,
            Address = request.Address,
            Monthlygoalpoints = request.MonthlyGoalPoints ?? 400,
            Requireproofapproval = request.RequireProofApproval ?? false,
        };

        var created = await _households.InsertAsync(household, HouseholdRoles.Admin, cancellationToken);
        return ToResponse(created);
    }

    public async Task<bool> UpdateAsync(int id, UpdateHouseholdRequest request, int callerUserId, CancellationToken cancellationToken)
    {
        if (id <= 0)
            return false;

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required.", nameof(request));

        if (!await EnsureAdminAsync(id, callerUserId, cancellationToken))
            return false;

        var household = await _households.GetByIdAsync(id, cancellationToken);
        if (household is null)
            return false;

        household.Name = request.Name.Trim();
        household.Address = request.Address;
        if (request.MonthlyGoalPoints is int goal)
            household.Monthlygoalpoints = goal;
        if (request.RequireProofApproval is bool requireProof)
            household.Requireproofapproval = requireProof;

        return await _households.UpdateAsync(household, cancellationToken);
    }

    public async Task<bool> DeleteAsync(int id, int callerUserId, CancellationToken cancellationToken)
    {
        if (id <= 0)
            return false;

        if (!await EnsureAdminAsync(id, callerUserId, cancellationToken))
            return false;

        return await _households.DeleteAsync(id, cancellationToken);
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

    private static HouseholdResponse ToResponse(Household household) => new()
    {
        Id = household.Id,
        Name = household.Name,
        AdminUserId = household.Adminuserid,
        Address = household.Address,
        MonthlyGoalPoints = household.Monthlygoalpoints,
        RequireProofApproval = household.Requireproofapproval,
        CreatedAt = household.Createdat,
    };
}

public static class HouseholdRoles
{
    public const string Admin = "Admin";

    public const string Member = "Member";

    public static bool IsKnown(string role) =>
        string.Equals(role, Admin, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(role, Member, StringComparison.OrdinalIgnoreCase);

    public static bool IsAdmin(string role) =>
        string.Equals(role, Admin, StringComparison.OrdinalIgnoreCase);
}
