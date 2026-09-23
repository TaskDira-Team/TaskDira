using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

public interface IFamilyService
{
    Task<JsonElement> ContextAsync(int caller, int target, CancellationToken ct);
    Task<JsonElement> ListAsync(int household, int caller, CancellationToken ct);
    Task<JsonElement> CreateInviteAsync(int household, int caller, CancellationToken ct);
    Task RevokeAsync(int household, int caller, string id, CancellationToken ct);
    Task<JsonElement> PreviewAsync(string token, CancellationToken ct);
    Task<JsonElement> AcceptAsync(string token, int caller, CancellationToken ct);
    Task<FamilySessionResponse> JoinAsync(JoinFamilyRequest request, CancellationToken ct);
    Task<JsonElement> CreateChildAsync(int household, int caller, CreateChildRequest request, CancellationToken ct);
    Task<FamilySessionResponse> SwitchAsync(int household, int caller, int child, string oldToken, CancellationToken ct);
    Task<object> StartPairingAsync(CancellationToken ct);
    Task ApprovePairingAsync(int household, int caller, ApprovePairingRequest request, CancellationToken ct);
    Task<FamilySessionResponse?> PollPairingAsync(string secret, CancellationToken ct);
}

public class FamilyService(IFamilyRepository repository, IPasswordHasher<User> hasher) : IFamilyService
{
    public static string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
    private static string Token() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

    private async Task<JsonElement> Run(string action, object data, CancellationToken ct)
    {
        var result = await repository.ExecuteAsync(action, data, ct);
        if (result.TryGetProperty("error", out var error))
        {
            if (error.GetString() == "forbidden") throw new UnauthorizedAccessException("Only a household admin can manage family access.");
            throw new InvalidOperationException(error.GetString() ?? "This request is no longer available.");
        }
        return result;
    }

    public Task<JsonElement> ContextAsync(int caller, int target, CancellationToken ct) => Run("context", new { caller, target }, ct);
    public Task<JsonElement> ListAsync(int household, int caller, CancellationToken ct) => Run("list", new { household, caller }, ct);

    public async Task<JsonElement> CreateInviteAsync(int household, int caller, CancellationToken ct)
    {
        var token = Token();
        var result = await Run("invite", new { household, caller, hash = Hash(token), id = Guid.NewGuid().ToString("N") }, ct);
        return JsonSerializer.SerializeToElement(new { token, invitation = result });
    }

    public async Task RevokeAsync(int household, int caller, string id, CancellationToken ct) =>
        await Run("revoke", new { household, caller, id }, ct);

    public Task<JsonElement> PreviewAsync(string token, CancellationToken ct) => Run("preview", new { hash = Hash(token) }, ct);
    public Task<JsonElement> AcceptAsync(string token, int caller, CancellationToken ct) => Run("accept", new { hash = Hash(token), caller }, ct);

    public async Task<FamilySessionResponse> JoinAsync(JoinFamilyRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (email.EndsWith("@children.taskdira.invalid", StringComparison.Ordinal)) throw new ArgumentException("Use your own email address.");
        var passwordHash = hasher.HashPassword(new User(), request.Password);
        var token = Token();
        var result = await Run("join", new { hash = Hash(request.Token), fullname = request.FullName.Trim(), email, passwordHash, sessionHash = Hash(token) }, ct);
        return Session(result, token, false);
    }

    public Task<JsonElement> CreateChildAsync(int household, int caller, CreateChildRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Nickname)) throw new ArgumentException("Give your little hero a nickname.");
        try
        {
            using var avatar = JsonDocument.Parse(request.AvatarState);
            if (avatar.RootElement.ValueKind != JsonValueKind.Object) throw new ArgumentException("Choose an avatar.");
        }
        catch (JsonException) { throw new ArgumentException("Choose a valid avatar."); }
        return Run("child", new { household, caller, fullname = request.Nickname.Trim(), avatar = request.AvatarState,
            email = $"{Token()}@children.taskdira.invalid", passwordHash = hasher.HashPassword(new User(), Token()) }, ct);
    }

    public async Task<FamilySessionResponse> SwitchAsync(int household, int caller, int child, string oldToken, CancellationToken ct)
    {
        var token = Token();
        var result = await Run("switch", new { household, caller, child, oldHash = Hash(oldToken), sessionHash = Hash(token) }, ct);
        return Session(result, token, true);
    }

    public async Task<object> StartPairingAsync(CancellationToken ct)
    {
        var secret = Token();
        var code = Convert.ToHexString(RandomNumberGenerator.GetBytes(5));
        await Run("pair", new { hash = Hash(secret), codeHash = Hash(code) }, ct);
        return new { secret, code, expiresAt = DateTime.UtcNow.AddMinutes(10) };
    }

    public async Task ApprovePairingAsync(int household, int caller, ApprovePairingRequest request, CancellationToken ct) =>
        await Run("approve", new { household, caller, child = request.ChildId, codeHash = Hash(request.Code.Replace("-", "").Replace(" ", "").ToUpperInvariant()) }, ct);

    public async Task<FamilySessionResponse?> PollPairingAsync(string secret, CancellationToken ct)
    {
        var token = Token();
        var result = await Run("poll", new { hash = Hash(secret), sessionHash = Hash(token) }, ct);
        return result.TryGetProperty("pending", out _) ? null : Session(result, token, true);
    }

    private static FamilySessionResponse Session(JsonElement result, string token, bool child) => new()
    {
        Token = token, UserId = result.GetProperty("userId").GetInt32(), HouseholdId = result.GetProperty("householdId").GetInt32(),
        IsManagedProfile = child, ExpiresAt = DateTime.SpecifyKind(result.GetProperty("expiresAt").GetDateTime(), DateTimeKind.Utc)
    };
}
