using Microsoft.AspNetCore.Identity;
using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;
using TaskDira.Api.Services;

namespace TaskDira.Tests;

public class AuthServiceTests
{
    private const string KnownEmail = "noam@example.com";
    private const string KnownPassword = "correct-horse-battery";

    private sealed class StubUserRepository : IUserRepository
    {
        private readonly User? _user;

        public StubUserRepository(User? user)
        {
            _user = user;
        }

        public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken)
        {
            return Task.FromResult(_user is not null && _user.Email == email ? _user : null);
        }

        public Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<IReadOnlyList<User>> GetPageAsync(int offset, int limit, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<int> CountAsync(CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<User> InsertAsync(User user, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> UpdateAsync(User user, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class StubSessionRepository : ISessionRepository
    {
        private readonly List<Session> _sessions = [];
        private int _nextId = 1;

        public IReadOnlyList<Session> Sessions => _sessions;

        public Task<Session> InsertAsync(Session session, CancellationToken cancellationToken)
        {
            session.Id = _nextId++;
            session.Createdat = DateTime.UtcNow;
            _sessions.Add(session);
            return Task.FromResult(session);
        }

        public Task<Session?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken)
        {
            return Task.FromResult(_sessions.SingleOrDefault(s => s.Tokenhash == tokenHash));
        }

        public Task<bool> DeleteByTokenHashAsync(string tokenHash, CancellationToken cancellationToken)
        {
            return Task.FromResult(_sessions.RemoveAll(s => s.Tokenhash == tokenHash) > 0);
        }
    }

    private sealed class StubHouseholdRepository : IHouseholdRepository
    {
        private int _nextId = 100;

        public List<(Household Household, string Role)> Inserted { get; } = [];

        public Task<Household> InsertAsync(Household household, string adminRole, CancellationToken cancellationToken)
        {
            household.Id = _nextId++;
            Inserted.Add((household, adminRole));
            return Task.FromResult(household);
        }

        public Task<Household?> GetByIdAsync(int id, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<IReadOnlyList<Household>> GetPageForUserAsync(int userId, int offset, int limit, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<int> CountForUserAsync(int userId, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> UpdateAsync(Household household, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class RecordingUserRepository : IUserRepository
    {
        private readonly List<User> _users = [];
        private int _nextId = 10;

        public RecordingUserRepository(User? seed = null)
        {
            if (seed is not null) _users.Add(seed);
        }

        public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken)
        {
            return Task.FromResult(_users.SingleOrDefault(u => u.Email == email));
        }

        public Task<User> InsertAsync(User user, CancellationToken cancellationToken)
        {
            user.Id = _nextId++;
            _users.Add(user);
            return Task.FromResult(user);
        }

        public Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<IReadOnlyList<User>> GetPageAsync(int offset, int limit, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<int> CountAsync(CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> UpdateAsync(User user, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private static User CreateKnownUser()
    {
        var user = new User
        {
            Id = 4,
            Fullname = "Noam Berkovich",
            Email = KnownEmail,
        };

        user.Passwordhash = new PasswordHasher<User>().HashPassword(user, KnownPassword);
        return user;
    }

    private static (AuthService Service, StubSessionRepository Sessions) CreateService(User? user)
    {
        var sessions = new StubSessionRepository();
        var service = new AuthService(
            new StubUserRepository(user),
            sessions,
            new StubHouseholdRepository(),
            new PasswordHasher<User>());
        return (service, sessions);
    }

    private static (AuthService Service, RecordingUserRepository Users, StubHouseholdRepository Households) CreateRegisterService(User? seed = null)
    {
        var users = new RecordingUserRepository(seed);
        var households = new StubHouseholdRepository();
        var service = new AuthService(users, new StubSessionRepository(), households, new PasswordHasher<User>());
        return (service, users, households);
    }

    [Fact]
    public async Task Register_CreatesUserHouseholdAndSession_AndReturnsToken()
    {
        var (service, _, households) = CreateRegisterService();

        var response = await service.RegisterAsync(
            new RegisterRequest
            {
                FullName = "Michal Berkovich",
                Email = "  MICHAL@Example.com ",
                Password = "family-secret",
                HouseholdName = "  The Berkovich family  ",
            },
            CancellationToken.None);

        Assert.False(string.IsNullOrWhiteSpace(response.Token));
        Assert.Equal("michal@example.com", response.Email);
        Assert.Equal("The Berkovich family", response.HouseholdName);
        Assert.True(response.HouseholdId > 0);
        Assert.True(response.UserId > 0);

        var (household, role) = Assert.Single(households.Inserted);
        Assert.Equal(response.UserId, household.Adminuserid);
        Assert.Equal(HouseholdRoles.Admin, role);
    }

    [Fact]
    public async Task Register_AllowsImmediateLogin_WithTheChosenPassword()
    {
        var (service, _, _) = CreateRegisterService();

        await service.RegisterAsync(
            new RegisterRequest
            {
                FullName = "Ron Berkovich",
                Email = "ron@example.com",
                Password = "family-secret",
                HouseholdName = "Berkovich",
            },
            CancellationToken.None);

        var login = await service.LoginAsync(
            new LoginRequest { Email = "ron@example.com", Password = "family-secret" },
            CancellationToken.None);

        Assert.NotNull(login);
    }

    [Fact]
    public async Task Register_Throws_WhenEmailAlreadyExists()
    {
        var (service, _, households) = CreateRegisterService(CreateKnownUser());

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RegisterAsync(
            new RegisterRequest
            {
                FullName = "Impostor",
                Email = KnownEmail,
                Password = "another-password",
                HouseholdName = "Other",
            },
            CancellationToken.None));

        Assert.Empty(households.Inserted);
    }

    [Theory]
    [InlineData("", "e@x.com", "pw", "House")]
    [InlineData("Name", "", "pw", "House")]
    [InlineData("Name", "e@x.com", "", "House")]
    [InlineData("Name", "e@x.com", "pw", "")]
    public async Task Register_Throws_WhenRequiredFieldIsMissing(string fullName, string email, string password, string householdName)
    {
        var (service, _, _) = CreateRegisterService();

        await Assert.ThrowsAsync<ArgumentException>(() => service.RegisterAsync(
            new RegisterRequest
            {
                FullName = fullName,
                Email = email,
                Password = password,
                HouseholdName = householdName,
            },
            CancellationToken.None));
    }

    [Fact]
    public async Task Login_ReturnsTokenAndUser_WhenCredentialsAreValid()
    {
        var (service, _) = CreateService(CreateKnownUser());

        var response = await service.LoginAsync(
            new LoginRequest { Email = KnownEmail, Password = KnownPassword },
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.False(string.IsNullOrWhiteSpace(response!.Token));
        Assert.Equal(4, response.UserId);
        Assert.Equal(KnownEmail, response.Email);
        Assert.True(response.ExpiresAt > DateTime.UtcNow);
    }

    [Fact]
    public async Task Login_NormalizesEmailCasingAndWhitespace()
    {
        var (service, _) = CreateService(CreateKnownUser());

        var response = await service.LoginAsync(
            new LoginRequest { Email = "  NOAM@Example.COM  ", Password = KnownPassword },
            CancellationToken.None);

        Assert.NotNull(response);
    }

    [Fact]
    public async Task Login_ReturnsNull_WhenPasswordIsWrong()
    {
        var (service, sessions) = CreateService(CreateKnownUser());

        var response = await service.LoginAsync(
            new LoginRequest { Email = KnownEmail, Password = "wrong-password" },
            CancellationToken.None);

        Assert.Null(response);
        Assert.Empty(sessions.Sessions);
    }

    [Fact]
    public async Task Login_ReturnsNull_WhenEmailIsUnknown()
    {
        var (service, sessions) = CreateService(CreateKnownUser());

        var response = await service.LoginAsync(
            new LoginRequest { Email = "stranger@example.com", Password = KnownPassword },
            CancellationToken.None);

        Assert.Null(response);
        Assert.Empty(sessions.Sessions);
    }

    [Fact]
    public async Task Login_StoresHashedToken_NeverTheRawToken()
    {
        var (service, sessions) = CreateService(CreateKnownUser());

        var response = await service.LoginAsync(
            new LoginRequest { Email = KnownEmail, Password = KnownPassword },
            CancellationToken.None);

        var stored = Assert.Single(sessions.Sessions);
        Assert.NotEqual(response!.Token, stored.Tokenhash);
        Assert.DoesNotContain(response.Token, stored.Tokenhash);
        Assert.Equal(64, stored.Tokenhash.Length);
    }

    [Fact]
    public async Task Login_IssuesDistinctTokens_ForRepeatedLogins()
    {
        var (service, _) = CreateService(CreateKnownUser());
        var request = new LoginRequest { Email = KnownEmail, Password = KnownPassword };

        var first = await service.LoginAsync(request, CancellationToken.None);
        var second = await service.LoginAsync(request, CancellationToken.None);

        Assert.NotEqual(first!.Token, second!.Token);
    }

    [Fact]
    public async Task ValidateToken_ReturnsUserId_ForActiveSession()
    {
        var (service, _) = CreateService(CreateKnownUser());

        var login = await service.LoginAsync(
            new LoginRequest { Email = KnownEmail, Password = KnownPassword },
            CancellationToken.None);

        var userId = await service.ValidateTokenAsync(login!.Token, CancellationToken.None);

        Assert.Equal(4, userId);
    }

    [Fact]
    public async Task ValidateToken_ReturnsNull_ForUnknownToken()
    {
        var (service, _) = CreateService(CreateKnownUser());

        var userId = await service.ValidateTokenAsync("not-a-real-token", CancellationToken.None);

        Assert.Null(userId);
    }

    [Fact]
    public async Task ValidateToken_ReturnsNull_AndDeletesSession_WhenExpired()
    {
        var (service, sessions) = CreateService(CreateKnownUser());

        var login = await service.LoginAsync(
            new LoginRequest { Email = KnownEmail, Password = KnownPassword },
            CancellationToken.None);

        sessions.Sessions[0].Expiresat = DateTime.UtcNow.AddMinutes(-1);

        var userId = await service.ValidateTokenAsync(login!.Token, CancellationToken.None);

        Assert.Null(userId);
        Assert.Empty(sessions.Sessions);
    }

    [Fact]
    public async Task Logout_DeletesSession_AndTokenStopsValidating()
    {
        var (service, sessions) = CreateService(CreateKnownUser());

        var login = await service.LoginAsync(
            new LoginRequest { Email = KnownEmail, Password = KnownPassword },
            CancellationToken.None);

        var deleted = await service.LogoutAsync(login!.Token, CancellationToken.None);

        Assert.True(deleted);
        Assert.Empty(sessions.Sessions);
        Assert.Null(await service.ValidateTokenAsync(login.Token, CancellationToken.None));
    }

    [Fact]
    public async Task Logout_LeavesOtherSessionsIntact()
    {
        var (service, sessions) = CreateService(CreateKnownUser());
        var request = new LoginRequest { Email = KnownEmail, Password = KnownPassword };

        var first = await service.LoginAsync(request, CancellationToken.None);
        var second = await service.LoginAsync(request, CancellationToken.None);

        await service.LogoutAsync(first!.Token, CancellationToken.None);

        Assert.Single(sessions.Sessions);
        Assert.Equal(4, await service.ValidateTokenAsync(second!.Token, CancellationToken.None));
    }

    [Fact]
    public async Task Login_ReturnsExpiryAsUtc_SoJsonCarriesTheZoneSuffix()
    {
        var (service, _) = CreateService(CreateKnownUser());

        var response = await service.LoginAsync(
            new LoginRequest { Email = KnownEmail, Password = KnownPassword },
            CancellationToken.None);

        Assert.Equal(DateTimeKind.Utc, response!.ExpiresAt.Kind);
    }

    [Fact]
    public async Task Login_ReturnsNull_WhenCredentialsAreBlank()
    {
        var (service, _) = CreateService(CreateKnownUser());

        Assert.Null(await service.LoginAsync(new LoginRequest { Email = "", Password = "" }, CancellationToken.None));
        Assert.Null(await service.LoginAsync(new LoginRequest { Email = KnownEmail, Password = "  " }, CancellationToken.None));
    }
}
