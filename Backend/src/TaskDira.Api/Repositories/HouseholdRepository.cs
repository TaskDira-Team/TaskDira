using Dapper;
using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface IHouseholdRepository
{
    Task<Household?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<IReadOnlyList<Household>> GetPageForUserAsync(int userId, int offset, int limit, CancellationToken cancellationToken);

    Task<int> CountForUserAsync(int userId, CancellationToken cancellationToken);

    Task<Household> InsertAsync(Household household, string adminRole, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(Household household, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

public class HouseholdRepository : IHouseholdRepository
{
    private readonly IDbConnectionFactory _connections;

    public HouseholdRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public async Task<Household?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_household_by_id(@p_id)",
            new { p_id = id },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<Household>(command);
    }

    public async Task<IReadOnlyList<Household>> GetPageForUserAsync(int userId, int offset, int limit, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_households_page(@p_userid, @p_offset, @p_limit)",
            new { p_userid = userId, p_offset = offset, p_limit = limit },
            cancellationToken: cancellationToken);

        var households = await connection.QueryAsync<Household>(command);
        return households.ToList();
    }

    public async Task<int> CountForUserAsync(int userId, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_count_households(@p_userid)",
            new { p_userid = userId },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<Household> InsertAsync(Household household, string adminRole, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_insert_household_with_admin(@p_name, @p_adminuserid, @p_role)",
            new
            {
                p_name = household.Name,
                p_adminuserid = household.Adminuserid,
                p_role = adminRole,
            },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleAsync<Household>(command);
    }

    public async Task<bool> UpdateAsync(Household household, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_update_household(@p_id, @p_name)",
            new { p_id = household.Id, p_name = household.Name },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_delete_household(@p_id)",
            new { p_id = id },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }
}
