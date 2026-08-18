using Dapper;
using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface ISessionRepository
{
    Task<Session> InsertAsync(Session session, CancellationToken cancellationToken);

    Task<Session?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    Task<bool> DeleteByTokenHashAsync(string tokenHash, CancellationToken cancellationToken);
}

public class SessionRepository : ISessionRepository
{
    private readonly IDbConnectionFactory _connections;

    public SessionRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public async Task<Session> InsertAsync(Session session, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_insert_session(@p_userid, @p_tokenhash, @p_expiresat)",
            new
            {
                p_userid = session.Userid,
                p_tokenhash = session.Tokenhash,
                p_expiresat = DateTime.SpecifyKind(session.Expiresat, DateTimeKind.Unspecified),
            },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleAsync<Session>(command);
    }

    public async Task<Session?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_session_by_token_hash(@p_tokenhash)",
            new { p_tokenhash = tokenHash },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<Session>(command);
    }

    public async Task<bool> DeleteByTokenHashAsync(string tokenHash, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_delete_session_by_token_hash(@p_tokenhash)",
            new { p_tokenhash = tokenHash },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }
}
