using Dapper;
using TaskDira.Api.Data;

namespace TaskDira.Api.Repositories;

public interface IHealthRepository
{
    Task PingAsync(CancellationToken cancellationToken);
}

public class HealthRepository : IHealthRepository
{
    private readonly IDbConnectionFactory _connections;

    public HealthRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public async Task PingAsync(CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_count_categories()",
            cancellationToken: cancellationToken);

        await connection.ExecuteScalarAsync<int>(command);
    }
}
