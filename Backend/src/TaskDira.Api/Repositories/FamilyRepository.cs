using System.Text.Json;
using Dapper;
using TaskDira.Api.Data;

namespace TaskDira.Api.Repositories;

public interface IFamilyRepository
{
    Task<JsonElement> ExecuteAsync(string operation, object data, CancellationToken cancellationToken);
}

public class FamilyRepository(IDbConnectionFactory connections) : IFamilyRepository
{
    public async Task<JsonElement> ExecuteAsync(string operation, object data, CancellationToken cancellationToken)
    {
        await using var connection = await connections.CreateOpenConnectionAsync(cancellationToken);
        var json = await connection.ExecuteScalarAsync<string>(RoutineCommand.Create(connection,
            "SELECT neondb_stp_family_access(@p_action, @p_data)",
            new { p_action = operation, p_data = JsonSerializer.Serialize(data) }, cancellationToken));
        return JsonSerializer.Deserialize<JsonElement>(json ?? "{}");
    }
}
