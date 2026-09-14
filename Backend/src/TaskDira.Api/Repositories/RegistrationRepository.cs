using System.Data;
using Dapper;
using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface IRegistrationRepository
{
    bool IsSupported { get; }
    Task<(User User, Household Household, Session Session)> RegisterAsync(User user, string householdName, string role, string tokenHash, DateTime expiresAt, CancellationToken cancellationToken);
}

public class RegistrationRepository : IRegistrationRepository
{
    private readonly IDbConnectionFactory _connections;
    public bool IsSupported => _connections.IsSqlServer;

    public RegistrationRepository(IDbConnectionFactory connections) => _connections = connections;

    public async Task<(User User, Household Household, Session Session)> RegisterAsync(User user, string householdName, string role, string tokenHash, DateTime expiresAt, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters(new { p_fullname = user.Fullname, p_email = user.Email, p_passwordhash = user.Passwordhash, p_familyrole = user.Familyrole, p_householdname = householdName, p_role = role, p_tokenhash = tokenHash });
        parameters.Add("p_expiresat", expiresAt, DbType.DateTime2);
        var command = new CommandDefinition("dbo.neondb_stp_register_atomic", parameters, commandType: CommandType.StoredProcedure, cancellationToken: cancellationToken);
        using var result = await connection.QueryMultipleAsync(command);
        return (await result.ReadSingleAsync<User>(), await result.ReadSingleAsync<Household>(), await result.ReadSingleAsync<Session>());
    }
}
