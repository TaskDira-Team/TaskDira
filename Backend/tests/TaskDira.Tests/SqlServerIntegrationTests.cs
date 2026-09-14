using System.Data;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Dapper;
using Microsoft.Data.SqlClient;
using TaskDira.Api.Data;
using TaskDira.Api.Models;
using TaskDira.Api.Repositories;

namespace TaskDira.Tests;

public sealed class SqlServerFactAttribute : FactAttribute
{
    public SqlServerFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("TASKDIRA_SQLSERVER_TESTS") != "1")
            Skip = "Enable TASKDIRA_SQLSERVER_TESTS=1 for the isolated local SQL Server integration suite.";
    }
}

[CollectionDefinition("SQL Server migration", DisableParallelization = true)]
public class SqlServerCollection;

[Collection("SQL Server migration")]
public class SqlServerIntegrationTests : IAsyncLifetime
{
    private Process? _api;
    private HttpClient _http = null!;
    private readonly List<int> _users = [];
    private readonly List<int> _households = [];
    private readonly System.Collections.Concurrent.ConcurrentQueue<string> _diagnostics = new();
    private const string Password = "Migration-test-only!42";
    private static readonly string SqlConnectionString = new SqlConnectionStringBuilder
    {
        DataSource = @"lpc:.\SQLEXPRESS", InitialCatalog = "TaskDira_MigrationDev",
        IntegratedSecurity = true, Encrypt = SqlConnectionEncryptOption.Optional
    }.ConnectionString;
    private sealed record Account(int User, int Household, string Token, string Email);

    public async Task InitializeAsync()
    {
        if (Environment.GetEnvironmentVariable("TASKDIRA_SQLSERVER_TESTS") != "1") return;
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root is not null && !Directory.Exists(Path.Combine(root.FullName, "Backend", "src"))) root = root.Parent;
        Assert.NotNull(root);
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        var info = new ProcessStartInfo("dotnet") { UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true, CreateNoWindow = true, WorkingDirectory = root.FullName };
        var configuration = new DirectoryInfo(AppContext.BaseDirectory).Parent!.Name;
        info.ArgumentList.Add(Path.Combine(root.FullName, "Backend", "src", "TaskDira.Api", "bin", configuration, "net9.0", "TaskDira.Api.dll"));
        info.Environment["ASPNETCORE_ENVIRONMENT"] = "Development";
        info.Environment["ASPNETCORE_URLS"] = $"http://127.0.0.1:{port}";
        info.Environment["Database__Provider"] = "SqlServer";
        info.Environment["ConnectionStrings__TaskDiraSqlServer"] = SqlConnectionString;
        info.Environment["Logging__LogLevel__Default"] = "Error";
        info.Environment.Remove("TASKDIRA_SOURCE_DB");
        _api = Process.Start(info)!;
        void Capture(object sender, DataReceivedEventArgs e)
        {
            if (e.Data is null) return;
            var match = System.Text.RegularExpressions.Regex.Match(e.Data, @"(?:System|Microsoft|Dapper)[\w.]+Exception[^:]*");
            if (match.Success) _diagnostics.Enqueue(match.Value);
            if (e.Data.TrimStart().StartsWith("at TaskDira.", StringComparison.Ordinal)) _diagnostics.Enqueue(e.Data.Trim());
        }
        _api.OutputDataReceived += Capture;
        _api.ErrorDataReceived += Capture;
        _api.BeginOutputReadLine();
        _api.BeginErrorReadLine();
        _http = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}"), Timeout = TimeSpan.FromSeconds(20) };
        for (var attempt = 0; attempt < 100; attempt++)
        {
            if (_api.HasExited) throw new InvalidOperationException("Isolated SQL Server API exited during startup.");
            try { if ((await _http.GetAsync("/health")).IsSuccessStatusCode) return; } catch (HttpRequestException) { }
            await Task.Delay(100);
        }
        throw new TimeoutException("Isolated API health check timed out.");
    }

    public async Task DisposeAsync()
    {
        if (_api is not null)
        {
            if (!_api.HasExited) { _api.Kill(entireProcessTree: true); await _api.WaitForExitAsync(); }
            _api.Dispose();
        }
        _http?.Dispose();
        if (_users.Count == 0) return;
        await using var connection = new SqlConnection(SqlConnectionString);
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        await connection.ExecuteAsync("""
            DELETE FROM dbo.pointsleader WHERE householdid IN @Households;
            DELETE FROM dbo.tasksubitems WHERE taskid IN (SELECT id FROM dbo.tasks WHERE householdid IN @Households);
            DELETE FROM dbo.tasks WHERE householdid IN @Households;
            DELETE FROM dbo.rewards WHERE householdid IN @Households;
            DELETE FROM dbo.monthlyleaderboard WHERE householdid IN @Households;
            DELETE FROM dbo.householdmembers WHERE householdid IN @Households OR userid IN @Users;
            DELETE FROM dbo.householdinfo WHERE id IN @Households;
            DELETE FROM dbo.sessions WHERE userid IN @Users;
            DELETE FROM dbo.users WHERE id IN @Users;
            """, new { Households = _households, Users = _users }, transaction);
        await transaction.CommitAsync();
    }

    private async Task<(HttpStatusCode Status, JsonElement Body)> Request(HttpMethod method, string path, object? body = null, string? token = null)
    {
        using var request = new HttpRequestMessage(method, path);
        if (token is not null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        if (body is not null) request.Content = JsonContent.Create(body);
        using var response = await _http.SendAsync(request);
        var text = await response.Content.ReadAsStringAsync();
        return (response.StatusCode, string.IsNullOrWhiteSpace(text) ? default : JsonDocument.Parse(text).RootElement.Clone());
    }

    private async Task<Account> Register()
    {
        var email = $"mssql-{Guid.NewGuid():N}@example.invalid";
        var result = await Request(HttpMethod.Post, "/api/auth/register", new { fullName = "משפחת בדיקה 🏡", email, password = Password, householdName = "Migration verification" });
        Assert.True(result.Status == HttpStatusCode.OK, $"Registration status {result.Status}; sanitized diagnostics: {string.Join(" | ", _diagnostics)}");
        var account = new Account(result.Body.GetProperty("userId").GetInt32(), result.Body.GetProperty("householdId").GetInt32(), result.Body.GetProperty("token").GetString()!, email);
        _users.Add(account.User); _households.Add(account.Household);
        return account;
    }

    private async Task<T> Scalar<T>(string sql, object? args = null)
    {
        await using var connection = new SqlConnection(SqlConnectionString);
        return (await connection.ExecuteScalarAsync<T>(sql, args))!;
    }

    private async Task<int> TaskFor(Account account, int points = 100, int? beneficiary = null)
    {
        var result = await Request(HttpMethod.Post, $"/api/households/{account.Household}/tasks", new { title = "סידור 🧸", pointsValue = points, assignedUserId = beneficiary ?? account.User, dueDate = "2026-09-15T07:30:12.123456Z" }, account.Token);
        Assert.Equal(HttpStatusCode.Created, result.Status);
        return result.Body.GetProperty("id").GetInt32();
    }

    private async Task Fund(Account admin, int user, int points)
    {
        var task = await TaskFor(admin, points, user);
        Assert.Equal(HttpStatusCode.NoContent, (await Request(HttpMethod.Put, $"/api/tasks/{task}/status", new { status = "InProgress" }, admin.Token)).Status);
        Assert.Equal(HttpStatusCode.NoContent, (await Request(HttpMethod.Put, $"/api/tasks/{task}/status", new { status = "Done" }, admin.Token)).Status);
        Assert.Equal(HttpStatusCode.Created, (await Request(HttpMethod.Post, $"/api/households/{admin.Household}/points-ledger", new { userId = user, taskId = task, pointsEarned = points }, admin.Token)).Status);
    }

    private async Task<int> Reward(Account admin, int cost, int threshold = 0)
    {
        var response = await Request(HttpMethod.Post, $"/api/households/{admin.Household}/rewards", new { title = "בחירת סרט 🍿", cost, requiredPoints = threshold }, admin.Token);
        Assert.Equal(HttpStatusCode.Created, response.Status);
        return response.Body.GetProperty("id").GetInt32();
    }

    private async Task AddMember(Account admin, Account member)
    {
        Assert.Equal(HttpStatusCode.Created, (await Request(HttpMethod.Post, $"/api/households/{admin.Household}/members", new { userId = member.User, role = "member" }, admin.Token)).Status);
    }

    [SqlServerFact]
    public async Task Authentication_RoundTrips_AndRegistrationRollsBackOnFailure()
    {
        var account = await Register();
        var login = await Request(HttpMethod.Post, "/api/auth/login", new { email = account.Email, password = Password });
        Assert.Equal(HttpStatusCode.OK, login.Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Request(HttpMethod.Post, "/api/auth/login", new { email = account.Email, password = "wrong" })).Status);
        var token = login.Body.GetProperty("token").GetString()!;
        Assert.Equal(HttpStatusCode.OK, (await Request(HttpMethod.Get, "/api/households", token: token)).Status);
        Assert.Equal(HttpStatusCode.NoContent, (await Request(HttpMethod.Post, "/api/auth/logout", token: token)).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Request(HttpMethod.Get, "/api/households", token: token)).Status);
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(account.Token))).ToLowerInvariant();
        await Scalar<int>("UPDATE dbo.sessions SET expiresat=DATEADD(day,-1,SYSUTCDATETIME()) WHERE tokenhash=@hash; SELECT @@ROWCOUNT", new { hash });
        Assert.Equal(HttpStatusCode.Unauthorized, (await Request(HttpMethod.Get, "/api/households", token: account.Token)).Status);
        var badEmail = $"rollback-{Guid.NewGuid():N}@example.invalid";
        var bad = await Request(HttpMethod.Post, "/api/auth/register", new { fullName = "Rollback", email = badEmail, password = Password, householdName = new string('x', 101) });
        Assert.Equal(HttpStatusCode.Conflict, bad.Status);
        Assert.Equal(0, await Scalar<int>("SELECT COUNT(*) FROM dbo.users WHERE email=@email", new { email = badEmail }));
    }

    [SqlServerFact]
    public async Task HouseholdPermissions_TaskLifecycle_Subitems_AndDuplicateAwardsWork()
    {
        var admin = await Register(); var member = await Register(); var outsider = await Register();
        await AddMember(admin, member);
        Assert.Equal(HttpStatusCode.NotFound, (await Request(HttpMethod.Get, $"/api/households/{admin.Household}/tasks", token: outsider.Token)).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Request(HttpMethod.Get, $"/api/households/{admin.Household}/tasks")).Status);
        Assert.Equal(HttpStatusCode.Forbidden, (await Request(HttpMethod.Post, $"/api/households/{admin.Household}/rewards", new { title = "Forbidden", requiredPoints = 0 }, member.Token)).Status);
        var task = await TaskFor(admin);
        Assert.Equal(HttpStatusCode.NotFound, (await Request(HttpMethod.Get, $"/api/tasks/{task}", token: outsider.Token)).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await Request(HttpMethod.Post, $"/api/households/{outsider.Household}/points-ledger", new { userId = outsider.User, taskId = task, pointsEarned = 100 }, outsider.Token)).Status);
        var read = await Request(HttpMethod.Get, $"/api/tasks/{task}", token: admin.Token);
        Assert.Equal("סידור 🧸", read.Body.GetProperty("title").GetString());
        Assert.Equal(1234560, read.Body.GetProperty("dueDate").GetDateTime().Ticks % TimeSpan.TicksPerSecond);
        var sub = await Request(HttpMethod.Post, $"/api/tasks/{task}/subitems", new { itemText = "ספרים" }, admin.Token);
        Assert.Equal(HttpStatusCode.Created, sub.Status);
        var subId = sub.Body.GetProperty("id").GetInt32();
        Assert.Equal(HttpStatusCode.NoContent, (await Request(HttpMethod.Put, $"/api/tasks/{task}/subitems/{subId}", new { itemText = "ספרים", isCompleted = true }, admin.Token)).Status);
        Assert.Equal(HttpStatusCode.OK, (await Request(HttpMethod.Get, $"/api/tasks/{task}/subitems", token: admin.Token)).Status);
        Assert.Equal(HttpStatusCode.Conflict, (await Request(HttpMethod.Put, $"/api/tasks/{task}/status", new { status = "Done" }, admin.Token)).Status);
        foreach (var status in new[] { "InProgress", "Done" })
            Assert.Equal(HttpStatusCode.NoContent, (await Request(HttpMethod.Put, $"/api/tasks/{task}/status", new { status }, admin.Token)).Status);
        var award = new { userId = admin.User, taskId = task, pointsEarned = 100 };
        var awards = await Task.WhenAll(Enumerable.Range(0, 5).Select(_ => Request(HttpMethod.Post, $"/api/households/{admin.Household}/points-ledger", award, admin.Token)));
        Assert.Single(awards, r => r.Status == HttpStatusCode.Created);
        Assert.Equal(4, awards.Count(r => r.Status == HttpStatusCode.Conflict));
        Assert.Equal(HttpStatusCode.Conflict, (await Request(HttpMethod.Delete, $"/api/tasks/{task}", token: admin.Token)).Status);
        Assert.Equal(HttpStatusCode.OK, (await Request(HttpMethod.Get, $"/api/households/{admin.Household}/tasks?page=1&pageSize=1", token: admin.Token)).Status);
        Assert.Equal(100, (await Request(HttpMethod.Get, $"/api/households/{admin.Household}/points-ledger/totals/{admin.User}", token: admin.Token)).Body.GetInt32());
    }

    [SqlServerFact]
    public async Task ConcurrentClaim_HasOneWinner_AndDoesNotDebitLoser()
    {
        var admin = await Register(); var member = await Register(); await AddMember(admin, member);
        await Fund(admin, admin.User, 100); await Fund(admin, member.User, 100);
        var reward = await Reward(admin, 60, 50);
        var responses = await Task.WhenAll(Request(HttpMethod.Post, $"/api/rewards/{reward}/claim", token: admin.Token), Request(HttpMethod.Post, $"/api/rewards/{reward}/claim", token: member.Token));
        Assert.Single(responses, r => r.Status == HttpStatusCode.NoContent);
        Assert.Single(responses, r => r.Status == HttpStatusCode.Conflict);
        Assert.Equal(1, await Scalar<int>("SELECT COUNT(*) FROM dbo.pointsleader WHERE rewardid=@reward AND pointsearned<0", new { reward }));
        Assert.Equal(140, await Scalar<int>("SELECT SUM(pointsearned) FROM dbo.pointsleader WHERE householdid=@hid", new { hid = admin.Household }));
        Assert.Equal(200, await Scalar<int>("SELECT SUM(pointsearned) FROM dbo.pointsleader WHERE householdid=@hid AND pointsearned>0", new { hid = admin.Household }));
        Assert.Equal(100, await Scalar<int>("SELECT SUM(pointsearned) FROM dbo.pointsleader WHERE householdid=@hid AND userid<>(SELECT claimedbyuserid FROM dbo.rewards WHERE id=@reward)", new { hid = admin.Household, reward }));
    }

    [SqlServerFact]
    public async Task ConcurrentPurchases_DoNotOverspend_AndFreeAndLockedRewardsBehave()
    {
        var admin = await Register(); await Fund(admin, admin.User, 100);
        var rewards = new[] { await Reward(admin, 70), await Reward(admin, 70) };
        var responses = await Task.WhenAll(rewards.Select(r => Request(HttpMethod.Post, $"/api/rewards/{r}/claim", token: admin.Token)));
        Assert.Single(responses, r => r.Status == HttpStatusCode.NoContent);
        Assert.Single(responses, r => r.Status == HttpStatusCode.Conflict);
        var free = await Reward(admin, 0);
        Assert.Equal(HttpStatusCode.NoContent, (await Request(HttpMethod.Post, $"/api/rewards/{free}/claim", token: admin.Token)).Status);
        Assert.Equal(0, await Scalar<int>("SELECT COUNT(*) FROM dbo.pointsleader WHERE rewardid=@free", new { free }));
        var locked = await Reward(admin, 1, 101);
        Assert.Equal(HttpStatusCode.Conflict, (await Request(HttpMethod.Post, $"/api/rewards/{locked}/claim", token: admin.Token)).Status);
        Assert.Equal(30, (await Request(HttpMethod.Get, $"/api/households/{admin.Household}/points-ledger/balance/{admin.User}", token: admin.Token)).Body.GetInt32());
        Assert.Equal(100, (await Request(HttpMethod.Get, $"/api/households/{admin.Household}/points-ledger/totals/{admin.User}", token: admin.Token)).Body.GetInt32());
    }

    [SqlServerFact]
    public async Task Unicode_Json_Case_TrailingSpaces_AndTimestampPrecisionArePreserved()
    {
        var admin = await Register();
        var factory = new SqlServerConnectionFactory(SqlConnectionString);
        var users = new UserRepository(factory);
        var user = await users.GetByIdAsync(admin.User, default);
        Assert.NotNull(user);
        user.Fullname = string.Concat(Enumerable.Repeat("🧸",100));
        user.Avatarstate = "{\"name\":\"משפחה 🏡\"}";
        Assert.True(await users.UpdateAsync(user, default));
        var roundTrip = await users.GetByIdAsync(admin.User, default);
        Assert.Equal(user.Fullname, roundTrip!.Fullname);
        Assert.Equal(user.Avatarstate, roundTrip.Avatarstate);
        Assert.Null(await users.GetByEmailAsync(admin.Email.ToUpperInvariant(), default));
        Assert.Null(await users.GetByEmailAsync(admin.Email + " ", default));
        user.Avatarstate = "null";
        Assert.True(await users.UpdateAsync(user, default));
        Assert.Equal("null", (await users.GetByIdAsync(admin.User, default))!.Avatarstate);
        var trailing = await users.InsertAsync(new User { Fullname = "Trailing", Email = admin.Email + " ", Passwordhash = "test-only", Familyrole = "roommate" }, default);
        _users.Add(trailing.Id);
        Assert.NotEqual(admin.User, trailing.Id);
        Assert.Equal(trailing.Id, (await users.GetByEmailAsync(admin.Email + " ", default))!.Id);
    }

    [SqlServerFact]
    public async Task Edits_Assignment_Deletion_AndSessionsSurviveApiRestart()
    {
        var admin = await Register(); var member = await Register(); var outsider = await Register();
        await AddMember(admin, member);
        var created = await Request(HttpMethod.Post, "/api/households", new { name = "Local review בית", monthlyGoalPoints = 700 }, admin.Token);
        Assert.Equal(HttpStatusCode.Created, created.Status);
        var household = created.Body.GetProperty("id").GetInt32();
        _households.Add(household);
        Assert.Equal(admin.User, created.Body.GetProperty("adminUserId").GetInt32());
        Assert.Equal(HttpStatusCode.Forbidden, (await Request(HttpMethod.Put, $"/api/households/{admin.Household}", new { name = "Not allowed" }, member.Token)).Status);
        var task = await TaskFor(admin);
        var edit = new { title = "Arrange books ספרים 🧸", description = "English ועברית", pointsValue = 75, assignedUserId = member.User, dueDate = "2026-09-16T18:45:00" };
        Assert.Equal(HttpStatusCode.NoContent, (await Request(HttpMethod.Put, $"/api/tasks/{task}", edit, admin.Token)).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await Request(HttpMethod.Put, $"/api/tasks/{task}", new { edit.title, pointsValue = 75, assignedUserId = outsider.User }, admin.Token)).Status);
        var sub = await Request(HttpMethod.Post, $"/api/tasks/{task}/subitems", new { itemText = "Books ספרים" }, member.Token);
        Assert.Equal(HttpStatusCode.Created, sub.Status);
        var subId = sub.Body.GetProperty("id").GetInt32();
        Assert.Equal(HttpStatusCode.NotFound, (await Request(HttpMethod.Delete, $"/api/tasks/{task}/subitems/{subId}", token: outsider.Token)).Status);

        _api!.Kill(entireProcessTree: true);
        await _api.WaitForExitAsync();
        _api.Dispose();
        _http.Dispose();
        await InitializeAsync();

        Assert.Equal(HttpStatusCode.OK, (await Request(HttpMethod.Get, $"/api/users/{admin.User}", token: admin.Token)).Status);
        var read = await Request(HttpMethod.Get, $"/api/tasks/{task}", token: member.Token);
        Assert.Equal(HttpStatusCode.OK, read.Status);
        Assert.Equal(edit.title, read.Body.GetProperty("title").GetString());
        Assert.Equal(edit.description, read.Body.GetProperty("description").GetString());
        Assert.Equal(member.User, read.Body.GetProperty("assignedUserId").GetInt32());
        Assert.Equal(75, read.Body.GetProperty("pointsValue").GetInt32());
        Assert.Equal(DateTime.Parse(edit.dueDate, System.Globalization.CultureInfo.InvariantCulture), read.Body.GetProperty("dueDate").GetDateTime());
        Assert.Equal(HttpStatusCode.OK, (await Request(HttpMethod.Get, $"/api/tasks/{task}/subitems/{subId}", token: member.Token)).Status);
        Assert.Equal(HttpStatusCode.NoContent, (await Request(HttpMethod.Delete, $"/api/tasks/{task}/subitems/{subId}", token: member.Token)).Status);
        Assert.Equal(HttpStatusCode.Created, (await Request(HttpMethod.Post, $"/api/tasks/{task}/subitems", new { itemText = "Cascade cleanup" }, admin.Token)).Status);
        Assert.Equal(HttpStatusCode.NoContent, (await Request(HttpMethod.Delete, $"/api/tasks/{task}", token: admin.Token)).Status);
        Assert.Equal(0, await Scalar<int>("SELECT COUNT(*) FROM dbo.tasksubitems WHERE taskid=@task", new { task }));
        Assert.Equal(HttpStatusCode.NotFound, (await Request(HttpMethod.Get, $"/api/tasks/{task}", token: admin.Token)).Status);
    }

    [SqlServerFact]
    public async Task Leaderboard_Paging_NullRanks_AndHouseholdScopeWork()
    {
        var admin = await Register(); var member = await Register(); var outsider = await Register();
        await AddMember(admin, member);
        var path = $"/api/households/{admin.Household}/leaderboard";
        var empty = await Request(HttpMethod.Get, path + "?month=9&year=2026", token: admin.Token);
        Assert.Equal(HttpStatusCode.OK, empty.Status);
        Assert.Equal(0, empty.Body.GetProperty("totalCount").GetInt32());
        await Scalar<int>("""
            INSERT INTO dbo.monthlyleaderboard(householdid,userid,month,year,totalpoints,rank)
            VALUES (@household,@admin,9,2026,30,NULL),(@household,@member,9,2026,90,1);
            SELECT @@ROWCOUNT;
            """, new { household = admin.Household, admin = admin.User, member = member.User });
        var first = await Request(HttpMethod.Get, path + "?month=9&year=2026&page=1&pageSize=1", token: admin.Token);
        Assert.Equal(HttpStatusCode.OK, first.Status);
        Assert.Equal(2, first.Body.GetProperty("totalCount").GetInt32());
        Assert.Equal(member.User, first.Body.GetProperty("items")[0].GetProperty("userId").GetInt32());
        var second = await Request(HttpMethod.Get, path + "?month=9&year=2026&page=2&pageSize=1", token: member.Token);
        Assert.Equal(admin.User, second.Body.GetProperty("items")[0].GetProperty("userId").GetInt32());
        Assert.Equal(JsonValueKind.Null, second.Body.GetProperty("items")[0].GetProperty("rank").ValueKind);
        var individual = await Request(HttpMethod.Get, path + $"/users/{member.User}?month=9&year=2026", token: admin.Token);
        Assert.Equal(90, individual.Body.GetProperty("totalPoints").GetInt32());
        Assert.Equal(HttpStatusCode.NotFound, (await Request(HttpMethod.Get, path, token: outsider.Token)).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await Request(HttpMethod.Get, path + "?month=13", token: admin.Token)).Status);
    }

    [SqlServerFact]
    public async Task AllExportedRoutinesHaveMatchingParameterContracts_AndSpendIsSerialized()
    {
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root is not null && !Directory.Exists(Path.Combine(root.FullName,"Backend","db"))) root=root.Parent;
        using var catalog = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(root!.FullName,"Backend","db","mssql","source-export","catalog.json")));
        await using var sql = new SqlConnection(SqlConnectionString);
        await sql.OpenAsync();
        foreach (var routine in catalog.RootElement.GetProperty("routines").EnumerateArray())
        {
            var name=routine.GetProperty("name").GetString()!;
            var expected=routine.GetProperty("arguments").GetString()!.Split(',',StringSplitOptions.TrimEntries|StringSplitOptions.RemoveEmptyEntries).Select(p=>"@"+p.Split(' ')[0]).ToArray();
            var actual=(await sql.QueryAsync<string>("SELECT name FROM sys.parameters WHERE object_id=OBJECT_ID(@name) ORDER BY parameter_id",new{name="dbo."+name})).ToArray();
            Assert.Equal(expected,actual);
            Assert.Equal(1,await sql.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM sys.procedures WHERE name=@name",new{name}));
        }
        var admin=await Register(); await Fund(admin,admin.User,100);
        var first=await Reward(admin,80); var second=await Reward(admin,80);
        var ledger=new PointsLedgerRepository(new SqlServerConnectionFactory(SqlConnectionString));
        var spends=await Task.WhenAll(ledger.InsertSpendAsync(admin.Household,admin.User,first,80,default),ledger.InsertSpendAsync(admin.Household,admin.User,second,80,default));
        Assert.Single(spends,r=>r is not null);
        Assert.Equal(20,await ledger.GetBalanceForUserAsync(admin.Household,admin.User,default));
        Assert.Equal(100,await ledger.GetTotalForUserAsync(admin.Household,admin.User,default));
    }
}
