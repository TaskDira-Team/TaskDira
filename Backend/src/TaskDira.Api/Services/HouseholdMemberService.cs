using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

public interface IHouseholdMemberService
{
    Task<PagedResult<HouseholdMemberResponse>?> GetPageAsync(int householdId, int callerUserId, PaginationQuery query, CancellationToken cancellationToken);

    Task<HouseholdMemberResponse?> GetAsync(int householdId, int userId, int callerUserId, CancellationToken cancellationToken);

    Task<HouseholdMemberResponse?> AddAsync(int householdId, AddHouseholdMemberRequest request, int callerUserId, CancellationToken cancellationToken);

    Task<bool> UpdateRoleAsync(int householdId, int userId, UpdateHouseholdMemberRoleRequest request, int callerUserId, CancellationToken cancellationToken);

    Task<bool> RemoveAsync(int householdId, int userId, int callerUserId, CancellationToken cancellationToken);
}

public class HouseholdMemberService : IHouseholdMemberService
{
    private readonly IHouseholdMemberRepository _members;

    public HouseholdMemberService(IHouseholdMemberRepository members)
    {
        _members = members;
    }

    public async Task<PagedResult<HouseholdMemberResponse>?> GetPageAsync(int householdId, int callerUserId, PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!await IsMemberAsync(householdId, callerUserId, cancellationToken))
            return null;

        var (page, pageSize, offset) = Pagination.Normalize(query);

        var members = await _members.GetPageAsync(householdId, offset, pageSize, cancellationToken);
        var total = await _members.CountAsync(householdId, cancellationToken);

        return new PagedResult<HouseholdMemberResponse>
        {
            Items = members.Select(ToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
        };
    }

    public async Task<HouseholdMemberResponse?> GetAsync(int householdId, int userId, int callerUserId, CancellationToken cancellationToken)
    {
        if (!await IsMemberAsync(householdId, callerUserId, cancellationToken))
            return null;

        var member = await _members.GetAsync(householdId, userId, cancellationToken);
        return member is null ? null : ToResponse(member);
    }

    public async Task<HouseholdMemberResponse?> AddAsync(int householdId, AddHouseholdMemberRequest request, int callerUserId, CancellationToken cancellationToken)
    {
        if (request.UserId <= 0)
            throw new ArgumentException("A user id is required.", nameof(request));

        if (!HouseholdRoles.IsKnown(request.Role))
            throw new ArgumentException($"Unknown role '{request.Role}'.", nameof(request));

        if (!await EnsureAdminAsync(householdId, callerUserId, cancellationToken))
            return null;

        var existing = await _members.GetAsync(householdId, request.UserId, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("That user is already a member of this household.");

        var member = new HouseholdMember
        {
            Householdid = householdId,
            Userid = request.UserId,
            Role = request.Role,
        };

        var created = await _members.InsertAsync(member, cancellationToken);
        return ToResponse(created);
    }

    public async Task<bool> UpdateRoleAsync(int householdId, int userId, UpdateHouseholdMemberRoleRequest request, int callerUserId, CancellationToken cancellationToken)
    {
        if (!HouseholdRoles.IsKnown(request.Role))
            throw new ArgumentException($"Unknown role '{request.Role}'.", nameof(request));

        if (!await EnsureAdminAsync(householdId, callerUserId, cancellationToken))
            return false;

        if (userId == callerUserId && !HouseholdRoles.IsAdmin(request.Role))
            throw new InvalidOperationException("An admin cannot remove their own admin role.");

        return await _members.UpdateRoleAsync(householdId, userId, request.Role, cancellationToken);
    }

    public async Task<bool> RemoveAsync(int householdId, int userId, int callerUserId, CancellationToken cancellationToken)
    {
        var isSelf = userId == callerUserId;
        if (!isSelf && !await EnsureAdminAsync(householdId, callerUserId, cancellationToken))
            return false;

        if (isSelf && !await IsMemberAsync(householdId, callerUserId, cancellationToken))
            return false;

        return await _members.DeleteAsync(householdId, userId, cancellationToken);
    }

    private async Task<bool> IsMemberAsync(int householdId, int callerUserId, CancellationToken cancellationToken)
    {
        var membership = await _members.GetAsync(householdId, callerUserId, cancellationToken);
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

    private static HouseholdMemberResponse ToResponse(HouseholdMember member) => new()
    {
        HouseholdId = member.Householdid,
        UserId = member.Userid,
        Role = member.Role,
        JoinedAt = member.Joinedat,
    };
}
