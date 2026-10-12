using System.Text.Json;
using Dapper;
using TaskDira.Api.Data;

namespace TaskDira.Api.Repositories;

public interface IWorldRepository
{
    Task<JsonElement> ExecuteAsync(string action, object data, CancellationToken ct);
}

public class WorldRepository(IDbConnectionFactory connections) : IWorldRepository
{
    public async Task<JsonElement> ExecuteAsync(string action, object data, CancellationToken ct)
    {
        await using var connection = await connections.CreateOpenConnectionAsync(ct);
        var json = await connection.ExecuteScalarAsync<string>(RoutineCommand.Create(connection,
            "SELECT neondb_stp_family_world(@p_action, @p_data)",
            new { p_action = action, p_data = JsonSerializer.Serialize(data) }, ct));
        return JsonSerializer.Deserialize<JsonElement>(json ?? "{}");
    }
}
