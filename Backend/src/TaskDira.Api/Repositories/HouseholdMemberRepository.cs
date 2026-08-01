using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface IHouseholdMemberRepository
{
    Task<HouseholdMember?> GetAsync(int householdId, int userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<HouseholdMember>> GetPageAsync(int householdId, int offset, int limit, CancellationToken cancellationToken);

    Task<int> CountAsync(int householdId, CancellationToken cancellationToken);

    Task<HouseholdMember> InsertAsync(HouseholdMember member, CancellationToken cancellationToken);

    Task<bool> UpdateRoleAsync(int householdId, int userId, string role, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int householdId, int userId, CancellationToken cancellationToken);
}

public class HouseholdMemberRepository : IHouseholdMemberRepository
{
    private readonly IDbConnectionFactory _connections;

    public HouseholdMemberRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public Task<HouseholdMember?> GetAsync(int householdId, int userId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'get household member' does not exist yet.");
    }

    public Task<IReadOnlyList<HouseholdMember>> GetPageAsync(int householdId, int offset, int limit, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'list household members paged' does not exist yet.");
    }

    public Task<int> CountAsync(int householdId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'count household members' does not exist yet.");
    }

    public Task<HouseholdMember> InsertAsync(HouseholdMember member, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'insert household member' does not exist yet.");
    }

    public Task<bool> UpdateRoleAsync(int householdId, int userId, string role, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'update household member role' does not exist yet.");
    }

    public Task<bool> DeleteAsync(int householdId, int userId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'delete household member' does not exist yet.");
    }
}
