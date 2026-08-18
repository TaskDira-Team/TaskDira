using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);

    Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken);

    Task<int?> ValidateTokenAsync(string token, CancellationToken cancellationToken);

    Task<bool> LogoutAsync(string token, CancellationToken cancellationToken);
}

public class AuthService : IAuthService
{
    private static readonly TimeSpan SessionLifetime = TimeSpan.FromDays(30);

    private static readonly Lazy<string> DummyPasswordHash = new(() =>
        new PasswordHasher<User>().HashPassword(new User(), "timing-equalization-placeholder"));

    private readonly IUserRepository _users;
    private readonly ISessionRepository _sessions;
    private readonly IHouseholdRepository _households;
    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthService(
        IUserRepository users,
        ISessionRepository sessions,
        IHouseholdRepository households,
        IPasswordHasher<User> passwordHasher)
    {
        _users = users;
        _sessions = sessions;
        _households = households;
        _passwordHasher = passwordHasher;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new ArgumentException("Full name is required.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Password is required.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.HouseholdName))
            throw new ArgumentException("Household name is required.", nameof(request));

        var email = request.Email.Trim().ToLowerInvariant();

        var existing = await _users.GetByEmailAsync(email, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("A user with that email already exists.");

        var user = new User
        {
            Fullname = request.FullName.Trim(),
            Email = email,
            Familyrole = string.IsNullOrWhiteSpace(request.FamilyRole) ? "roommate" : request.FamilyRole.Trim(),
        };

        user.Passwordhash = _passwordHasher.HashPassword(user, request.Password);

        var createdUser = await _users.InsertAsync(user, cancellationToken);

        var household = await _households.InsertAsync(
            new Household
            {
                Name = request.HouseholdName.Trim(),
                Adminuserid = createdUser.Id,
            },
            HouseholdRoles.Admin,
            cancellationToken);

        var token = GenerateToken();

        var session = await _sessions.InsertAsync(
            new Session
            {
                Userid = createdUser.Id,
                Tokenhash = HashToken(token),
                Expiresat = DateTime.UtcNow.Add(SessionLifetime),
            },
            cancellationToken);

        return new RegisterResponse
        {
            Token = token,
            ExpiresAt = DateTime.SpecifyKind(session.Expiresat, DateTimeKind.Utc),
            UserId = createdUser.Id,
            FullName = createdUser.Fullname,
            Email = createdUser.Email,
            HouseholdId = household.Id,
            HouseholdName = household.Name,
        };
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return null;

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _users.GetByEmailAsync(email, cancellationToken);

        if (user is null)
        {
            _passwordHasher.VerifyHashedPassword(new User(), DummyPasswordHash.Value, request.Password);
            return null;
        }

        var verification = _passwordHasher.VerifyHashedPassword(user, user.Passwordhash, request.Password);
        if (verification == PasswordVerificationResult.Failed)
            return null;

        var token = GenerateToken();

        var session = await _sessions.InsertAsync(
            new Session
            {
                Userid = user.Id,
                Tokenhash = HashToken(token),
                Expiresat = DateTime.UtcNow.Add(SessionLifetime),
            },
            cancellationToken);

        return new LoginResponse
        {
            Token = token,
            ExpiresAt = DateTime.SpecifyKind(session.Expiresat, DateTimeKind.Utc),
            UserId = user.Id,
            FullName = user.Fullname,
            Email = user.Email,
        };
    }

    public async Task<int?> ValidateTokenAsync(string token, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
            return null;

        var tokenHash = HashToken(token);
        var session = await _sessions.GetByTokenHashAsync(tokenHash, cancellationToken);

        if (session is null)
            return null;

        if (session.Expiresat <= DateTime.UtcNow)
        {
            await _sessions.DeleteByTokenHashAsync(tokenHash, cancellationToken);
            return null;
        }

        return session.Userid;
    }

    public async Task<bool> LogoutAsync(string token, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
            return false;

        return await _sessions.DeleteByTokenHashAsync(HashToken(token), cancellationToken);
    }

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Base64UrlEncode(bytes);
    }

    private static string HashToken(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string Base64UrlEncode(byte[] bytes)
    {
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
