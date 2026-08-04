using Dapper;
using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken);

    Task<IReadOnlyList<User>> GetPageAsync(int offset, int limit, CancellationToken cancellationToken);

    Task<int> CountAsync(CancellationToken cancellationToken);

    Task<User> InsertAsync(User user, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(User user, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

public class UserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _connections;

    public UserRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_user_by_id(@p_id)",
            new { p_id = id },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<User>(command);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_user_by_email(@p_email)",
            new { p_email = email },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<User>(command);
    }

    public async Task<IReadOnlyList<User>> GetPageAsync(int offset, int limit, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_users_page(@p_offset, @p_limit)",
            new { p_offset = offset, p_limit = limit },
            cancellationToken: cancellationToken);

        var users = await connection.QueryAsync<User>(command);
        return users.ToList();
    }

    public async Task<int> CountAsync(CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_count_users()",
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<User> InsertAsync(User user, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_insert_user(@p_fullname, @p_email, @p_passwordhash)",
            new
            {
                p_fullname = user.Fullname,
                p_email = user.Email,
                p_passwordhash = user.Passwordhash,
            },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleAsync<User>(command);
    }

    public async Task<bool> UpdateAsync(User user, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_update_user(@p_id, @p_fullname, @p_avatarstate)",
            new
            {
                p_id = user.Id,
                p_fullname = user.Fullname,
                p_avatarstate = user.Avatarstate,
            },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_delete_user(@p_id)",
            new { p_id = id },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }
}
