using Dapper;
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

    public async Task<HouseholdMember?> GetAsync(int householdId, int userId, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_household_member_by_id(@p_householdid, @p_userid)",
            new { p_householdid = householdId, p_userid = userId },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<HouseholdMember>(command);
    }

    public async Task<IReadOnlyList<HouseholdMember>> GetPageAsync(int householdId, int offset, int limit, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_household_members_page(@p_householdid, @p_offset, @p_limit)",
            new { p_householdid = householdId, p_offset = offset, p_limit = limit },
            cancellationToken: cancellationToken);

        var members = await connection.QueryAsync<HouseholdMember>(command);
        return members.ToList();
    }

    public async Task<int> CountAsync(int householdId, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_count_household_members(@p_householdid)",
            new { p_householdid = householdId },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<HouseholdMember> InsertAsync(HouseholdMember member, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_insert_household_member(@p_householdid, @p_userid, @p_role)",
            new
            {
                p_householdid = member.Householdid,
                p_userid = member.Userid,
                p_role = member.Role,
            },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleAsync<HouseholdMember>(command);
    }

    public async Task<bool> UpdateRoleAsync(int householdId, int userId, string role, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_update_household_member_role(@p_householdid, @p_userid, @p_role)",
            new { p_householdid = householdId, p_userid = userId, p_role = role },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }

    public async Task<bool> DeleteAsync(int householdId, int userId, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_delete_household_member(@p_householdid, @p_userid)",
            new { p_householdid = householdId, p_userid = userId },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }
}
