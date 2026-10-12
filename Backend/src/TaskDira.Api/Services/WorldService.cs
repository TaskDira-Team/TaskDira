using System.Text.Json;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

public interface IWorldService
{
    Task<JsonElement> ReadAsync(int household, int caller, CancellationToken ct);
    Task<JsonElement> PlaceAsync(int household, int caller, WorldPlacementRequest request, CancellationToken ct);
    Task<JsonElement> SupportAsync(int household, int caller, WorldSupportRequest request, CancellationToken ct);
}

public class WorldService(IWorldRepository repository, IHouseholdMemberRepository members) : IWorldService
{
    private async Task<JsonElement> Run(string action, int household, int caller, object data, CancellationToken ct)
    {
        if (await members.GetAsync(household, caller, ct) is null) throw new KeyNotFoundException("Household not found.");
        var result = await repository.ExecuteAsync(action, data, ct);
        if (result.TryGetProperty("error", out var error))
        {
            if (error.GetString() == "forbidden") throw new UnauthorizedAccessException("This action is not available for this family member.");
            throw new InvalidOperationException(error.GetString());
        }
        return result;
    }

    public Task<JsonElement> ReadAsync(int household, int caller, CancellationToken ct) => Run("read", household, caller, new { household, caller }, ct);
    public Task<JsonElement> PlaceAsync(int household, int caller, WorldPlacementRequest request, CancellationToken ct) =>
        Run("place", household, caller, new { household, caller, piece = request.Piece, position = request.Position }, ct);
    public Task<JsonElement> SupportAsync(int household, int caller, WorldSupportRequest request, CancellationToken ct) =>
        Run("support", household, caller, new { household, caller, target = request.UserId, skill = request.Skill, level = request.Level }, ct);
}
