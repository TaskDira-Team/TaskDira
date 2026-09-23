using System.Net;
using TaskDira.Api.Services;

namespace TaskDira.Tests;

public partial class SqlServerIntegrationTests
{
    private async Task<(string Token, string Id)> Invitation(Account adult)
    {
        var result = await Request(HttpMethod.Post, $"/api/family/{adult.Household}/invitations", token: adult.Token);
        Assert.Equal(HttpStatusCode.OK, result.Status);
        return (result.Body.GetProperty("token").GetString()!, result.Body.GetProperty("invitation").GetProperty("id").GetString()!);
    }

    private async Task<int> Child(Account adult)
    {
        var result = await Request(HttpMethod.Post, $"/api/family/{adult.Household}/children", new { nickname = "Tiny test hero", avatarState = "{\"baseIconId\":\"fox\"}" }, adult.Token);
        Assert.Equal(HttpStatusCode.OK, result.Status);
        var id = result.Body.GetProperty("userId").GetInt32();
        _users.Add(id);
        return id;
    }

    [SqlServerFact]
    public async Task Family_InvitationIsSingleUse_AndNewAccountDoesNotCreateAnotherHome()
    {
        var adult = await Register();
        var invite = await Invitation(adult);
        Assert.Equal(HttpStatusCode.OK, (await Request(HttpMethod.Post, "/api/family/invitations/preview", new { token = invite.Token })).Status);
        var email = $"join-{Guid.NewGuid():N}@example.invalid";
        var responses = await Task.WhenAll(Enumerable.Range(0, 2).Select(_ => Request(HttpMethod.Post, "/api/family/invitations/join", new { token = invite.Token, email, fullName = "Invited adult", password = Password })));
        var success = Assert.Single(responses, r => r.Status == HttpStatusCode.OK);
        Assert.Single(responses, r => r.Status == HttpStatusCode.Conflict);
        var id = success.Body.GetProperty("userId").GetInt32(); _users.Add(id);
        Assert.Equal(adult.Household, success.Body.GetProperty("householdId").GetInt32());
        Assert.Equal(0, await Scalar<int>("SELECT COUNT(*) FROM dbo.householdinfo WHERE adminuserid=@id", new { id }));
        Assert.Equal(1, await Scalar<int>("SELECT COUNT(*) FROM dbo.householdmembers WHERE userid=@id", new { id }));
        Assert.Equal(HttpStatusCode.Conflict, (await Request(HttpMethod.Post, "/api/family/invitations/preview", new { token = invite.Token })).Status);
        Assert.Equal(0, await Scalar<int>("SELECT COUNT(*) FROM dbo.familyinvitations WHERE tokenhash=@token", new { token = invite.Token }));
    }

    [SqlServerFact]
    public async Task Family_ExpiredRevokedAndForeignInvitationsCannotBeUsed()
    {
        var adult = await Register(); var outsider = await Register();
        var invite = await Invitation(adult);
        Assert.Equal(HttpStatusCode.Forbidden, (await Request(HttpMethod.Delete, $"/api/family/{adult.Household}/invitations/{invite.Id}", token: outsider.Token)).Status);
        Assert.Equal(HttpStatusCode.NoContent, (await Request(HttpMethod.Delete, $"/api/family/{adult.Household}/invitations/{invite.Id}", token: adult.Token)).Status);
        Assert.Equal(HttpStatusCode.Conflict, (await Request(HttpMethod.Post, "/api/family/invitations/accept", new { token = invite.Token }, outsider.Token)).Status);
        invite = await Invitation(adult);
        await Scalar<int>("UPDATE dbo.familyinvitations SET expiresat=DATEADD(minute,-1,SYSUTCDATETIME()) WHERE id=@id; SELECT @@ROWCOUNT", new { id = invite.Id });
        Assert.Equal(HttpStatusCode.Conflict, (await Request(HttpMethod.Post, "/api/family/invitations/accept", new { token = invite.Token }, outsider.Token)).Status);
        Assert.Equal(HttpStatusCode.Conflict, (await Request(HttpMethod.Post, $"/api/households/{adult.Household}/members", new { userId = outsider.User, role = "Member" }, adult.Token)).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await Request(HttpMethod.Get, $"/api/users/{adult.User}", token: outsider.Token)).Status);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Request(HttpMethod.Get, $"/api/users/{adult.User}")).Status);
    }

    [SqlServerFact]
    public async Task Family_ChildSessionRevokesParent_RestrictsControls_AndEarnsOwnQuestPoints()
    {
        var adult = await Register(); var outsider = await Register();
        var child = await Child(adult);
        var task = await TaskFor(adult, 25, child);
        var adultTask = await TaskFor(adult);
        Assert.Equal(HttpStatusCode.Conflict, (await Request(HttpMethod.Put, $"/api/households/{adult.Household}/members/{child}/role", new { role = "Admin" }, adult.Token)).Status);
        Assert.Equal(HttpStatusCode.Forbidden, (await Request(HttpMethod.Post, $"/api/family/{adult.Household}/children/{child}/play", token: outsider.Token)).Status);
        var switched = await Request(HttpMethod.Post, $"/api/family/{adult.Household}/children/{child}/play", token: adult.Token);
        Assert.Equal(HttpStatusCode.OK, switched.Status);
        var childToken = switched.Body.GetProperty("token").GetString()!;
        Assert.Equal(HttpStatusCode.Unauthorized, (await Request(HttpMethod.Get, "/api/households", token: adult.Token)).Status);
        var profile = await Request(HttpMethod.Get, $"/api/users/{child}", token: childToken);
        Assert.True(profile.Body.GetProperty("isManagedProfile").GetBoolean());
        Assert.Equal("", profile.Body.GetProperty("email").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await Request(HttpMethod.Post, "/api/households", new { name = "Escape" }, childToken)).Status);
        Assert.Equal(HttpStatusCode.Forbidden, (await Request(HttpMethod.Delete, $"/api/users/{adult.User}", token: childToken)).Status);
        Assert.Equal(HttpStatusCode.Forbidden, (await Request(HttpMethod.Post, $"/api/family/{adult.Household}/invitations", token: childToken)).Status);
        Assert.Equal(HttpStatusCode.Forbidden, (await Request(HttpMethod.Put, $"/api/tasks/{adultTask}/status", new { status = "InProgress" }, childToken)).Status);
        foreach (var status in new[] { "InProgress", "Done" })
            Assert.Equal(HttpStatusCode.NoContent, (await Request(HttpMethod.Put, $"/api/tasks/{task}/status", new { status }, childToken)).Status);
        Assert.Equal(HttpStatusCode.Forbidden, (await Request(HttpMethod.Post, $"/api/households/{adult.Household}/points-ledger", new { taskId = task, userId = child, pointsEarned = 999 }, childToken)).Status);
        Assert.Equal(HttpStatusCode.Created, (await Request(HttpMethod.Post, $"/api/households/{adult.Household}/points-ledger", new { taskId = task, userId = child, pointsEarned = 25 }, childToken)).Status);
        Assert.Equal(25, (await Request(HttpMethod.Get, $"/api/households/{adult.Household}/points-ledger/balance/{child}", token: childToken)).Body.GetInt32());
        await Scalar<int>("DELETE dbo.householdmembers WHERE householdid=@hid AND userid=@child; SELECT @@ROWCOUNT", new { hid = adult.Household, child });
        Assert.Equal(HttpStatusCode.Unauthorized, (await Request(HttpMethod.Get, "/api/households", token: childToken)).Status);
    }

    [SqlServerFact]
    public async Task Family_PairingRequiresParentApproval_AndSecretIsConsumedOnce()
    {
        var adult = await Register(); var outsider = await Register(); var child = await Child(adult);
        var pairing = await Request(HttpMethod.Post, "/api/family/pairings");
        Assert.Equal(HttpStatusCode.OK, pairing.Status);
        var secret = pairing.Body.GetProperty("secret").GetString(); var code = pairing.Body.GetProperty("code").GetString();
        Assert.Equal(HttpStatusCode.Accepted, (await Request(HttpMethod.Post, "/api/family/pairings/poll", new { token = secret })).Status);
        Assert.Equal(HttpStatusCode.Conflict, (await Request(HttpMethod.Post, "/api/family/pairings/poll", new { token = code })).Status);
        Assert.Equal(HttpStatusCode.Forbidden, (await Request(HttpMethod.Post, $"/api/family/{adult.Household}/pairings/approve", new { code, childId = child }, outsider.Token)).Status);
        Assert.Equal(HttpStatusCode.NoContent, (await Request(HttpMethod.Post, $"/api/family/{adult.Household}/pairings/approve", new { code, childId = child }, adult.Token)).Status);
        var polls = await Task.WhenAll(Enumerable.Range(0, 2).Select(_ => Request(HttpMethod.Post, "/api/family/pairings/poll", new { token = secret })));
        Assert.Single(polls, p => p.Status == HttpStatusCode.OK);
        Assert.Single(polls, p => p.Status == HttpStatusCode.Conflict);
        Assert.Equal(HttpStatusCode.OK, (await Request(HttpMethod.Get, "/api/households", token: adult.Token)).Status);
    }
}
