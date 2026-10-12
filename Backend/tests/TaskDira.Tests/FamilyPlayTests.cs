using System.Net;
using System.Text.Json.Nodes;
using TaskDira.Api.Services;

namespace TaskDira.Tests;

public class FamilyPlayRulesTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.Parse("2026-10-12T12:00:00Z");
    private static PlayContext Context(bool admin = false) => new("2",admin,[new("1","Admin",0),new("2","Member",1)], [new("10","2","Tidy","ToDo","room",1),new("11","1","Cook","ToDo","kitchen",0)], []);
    private static JsonObject Command(string json) => JsonNode.Parse(json)!.AsObject();
    [Fact]
    public void ChildCannotManageFamilyOrAskForAnotherPersonsTask()
    {
        Assert.Throws<UnauthorizedAccessException>(() => FamilyPlayRules.Apply(FamilyPlayRules.Empty(),Command("""{"action":"week.offer","taskIds":["10"]}"""),Context(),Now));
        Assert.Throws<UnauthorizedAccessException>(() => FamilyPlayRules.Apply(FamilyPlayRules.Empty(),Command("""{"action":"help.ask","taskId":"11","kind":"show","step":0}"""),Context(),Now));
        Assert.Throws<ArgumentException>(() => FamilyPlayRules.Apply(FamilyPlayRules.Empty(),Command("""{"action":"room.save","color":"mint","items":["moon"]}"""),Context(),Now));
    }
    [Fact]
    public void CompletedAdventureAndKeepsakesSurviveRemovedTasksWithoutDuplicatingCredit()
    {
        var state = FamilyPlayRules.Empty();
        FamilyPlayRules.Apply(state,Command("""{"action":"adventure.start","theme":"moon","taskIds":["10"]}"""),Context(true),Now);
        var done = Context() with { Tasks = [new("10","2","Tidy","Done","room",1)] };
        FamilyPlayRules.Reconcile(state,done,Now); FamilyPlayRules.Reconcile(state,done,Now);
        Assert.Single(state["credits"]!.AsArray());
        Assert.Contains("moon",FamilyPlayRules.Unlocks(state,"2"));
        Assert.DoesNotContain("moon",FamilyPlayRules.Unlocks(state,"1"));
        FamilyPlayRules.Reconcile(state,done with { Tasks = [] },Now);
        Assert.Contains("moon",FamilyPlayRules.Unlocks(state,"2"));
    }
    [Fact]
    public void PromisesRequireClaimedRewardAndValidDate()
    {
        var state = FamilyPlayRules.Empty(); var ctx = Context(true) with { Rewards = [new("5","2","Movie",null)] };
        FamilyPlayRules.Reconcile(state,ctx,Now);
        Assert.Throws<ArgumentException>(() => FamilyPlayRules.Apply(state,Command("""{"action":"ticket.schedule","rewardId":"5","date":"2026-02-31","when":"morning"}"""),ctx,Now));
        FamilyPlayRules.Apply(state,Command("""{"action":"ticket.schedule","rewardId":"5","date":"2026-10-13","when":"after-dinner"}"""),ctx,Now);
        FamilyPlayRules.Reconcile(state,ctx with { Rewards = [] },Now);
        Assert.Equal("planned",FamilyPlayRules.Text(state["tickets"]![0],"status"));
        Assert.Throws<UnauthorizedAccessException>(() => FamilyPlayRules.Apply(state,Command("""{"action":"ticket.enjoy","rewardId":"5"}"""),Context(),Now));
    }
}

public partial class SqlServerIntegrationTests
{
    [SqlServerFact]
    public async Task FamilyPlay_PersistsAcrossSessions_EnforcesOwnership_AndRejectsStaleConcurrentWrites()
    {
        var adult = await Register(); var outsider = await Register(); var child = await Child(adult);
        var session = await Request(HttpMethod.Post,$"/api/family/{adult.Household}/children/{child}/play",token:adult.Token);
        var childToken = session.Body.GetProperty("token").GetString()!;
        // Shared-device child play revokes the parent session; use a fresh parent
        // sign-in to model the parent's separate device for the collaboration test.
        var parentLogin = await Request(HttpMethod.Post,"/api/auth/login",new {email=adult.Email,password=Password});
        adult = adult with { Token = parentLogin.Body.GetProperty("token").GetString()! };
        var task = await TaskFor(adult,10,child); var parentTask = await TaskFor(adult,10);
        var route = $"/api/family/{adult.Household}/play";
        Assert.Equal(HttpStatusCode.Unauthorized,(await Request(HttpMethod.Get,route)).Status);
        Assert.Equal(HttpStatusCode.NotFound,(await Request(HttpMethod.Get,route,token:outsider.Token)).Status);
        var read = await Request(HttpMethod.Get,route,token:adult.Token);
        Assert.True(read.Status == HttpStatusCode.OK, $"Play read failed: {read.Status}; {string.Join(" | ",_diagnostics)}");
        var revision = read.Body.GetProperty("revision").GetInt64();
        Assert.Equal(HttpStatusCode.Forbidden,(await Request(HttpMethod.Post,route,new {action="week.offer",revision,taskIds=new[]{task.ToString()}},childToken)).Status);
        var offered = await Request(HttpMethod.Post,route,new {action="week.offer",revision,taskIds=new[]{task.ToString(),parentTask.ToString()}},adult.Token);
        Assert.Equal(HttpStatusCode.OK,offered.Status); revision=offered.Body.GetProperty("revision").GetInt64();
        Assert.Equal(HttpStatusCode.Forbidden,(await Request(HttpMethod.Post,route,new {action="week.choose",revision,taskId=parentTask.ToString(),selected=true},childToken)).Status);
        var writes = await Task.WhenAll(Enumerable.Range(0,2).Select(_ => Request(HttpMethod.Post,route,new {action="week.choose",revision,taskId=task.ToString(),selected=true},childToken)));
        Assert.Single(writes,r=>r.Status==HttpStatusCode.OK); Assert.Single(writes,r=>r.Status==HttpStatusCode.Conflict);
        read = await Request(HttpMethod.Get,route,token:childToken); revision=read.Body.GetProperty("revision").GetInt64();
        var help = await Request(HttpMethod.Post,route,new {action="help.ask",revision,taskId=task.ToString(),kind="together",step=0},childToken);
        Assert.Equal(HttpStatusCode.OK,help.Status);
        var requestId=help.Body.GetProperty("help")[0].GetProperty("id").GetString(); revision=help.Body.GetProperty("revision").GetInt64();
        var replied = await Request(HttpMethod.Post,route,new {action="help.reply",revision,id=requestId,reply="coming"},adult.Token);
        Assert.Equal(HttpStatusCode.OK,replied.Status);
        read=await Request(HttpMethod.Get,route,token:childToken);
        Assert.Equal("coming",read.Body.GetProperty("help")[0].GetProperty("reply").GetString());
        revision=read.Body.GetProperty("revision").GetInt64();
        var room=await Request(HttpMethod.Post,route,new {action="room.save",revision,color="mint",items=new[]{"cushion"}},childToken);
        Assert.Equal(HttpStatusCode.OK,room.Status);
        read=await Request(HttpMethod.Get,route,token:adult.Token);
        Assert.Equal("mint",read.Body.GetProperty("rooms").GetProperty(child.ToString()).GetProperty("color").GetString());
        await Fund(adult,child,30); var reward=await Reward(adult,10);
        Assert.Equal(HttpStatusCode.NoContent,(await Request(HttpMethod.Post,$"/api/rewards/{reward}/claim",token:childToken)).Status);
        read=await Request(HttpMethod.Get,route,token:adult.Token); revision=read.Body.GetProperty("revision").GetInt64();
        Assert.Single(read.Body.GetProperty("tickets").EnumerateArray());
        var planned=await Request(HttpMethod.Post,route,new {action="ticket.schedule",revision,rewardId=reward.ToString(),date=DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd"),when="after-dinner"},adult.Token);
        Assert.Equal(HttpStatusCode.OK,planned.Status);
        Assert.Equal(20,await Scalar<int>("SELECT SUM(pointsearned) FROM dbo.pointsleader WHERE householdid=@h AND userid=@u",new {h=adult.Household,u=child}));
    }
}
