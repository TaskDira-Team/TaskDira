using System.Net;

namespace TaskDira.Tests;

public partial class SqlServerIntegrationTests
{
    [SqlServerFact]
    public async Task World_UsesCompletedTasks_RestrictsSupport_AndPersistsChildDecorations()
    {
        var adult = await Register();
        var outsider = await Register();
        var child = await Child(adult);
        var route = $"/api/family/{adult.Household}/world";
        Assert.Equal(HttpStatusCode.Unauthorized, (await Request(HttpMethod.Get, route)).Status);
        Assert.Equal(HttpStatusCode.NotFound, (await Request(HttpMethod.Get, route, token: outsider.Token)).Status);
        Assert.Equal(HttpStatusCode.Conflict, (await Request(HttpMethod.Put, route + "/placement", new { piece = "garden", position = "left" }, adult.Token)).Status);
        var support = await Request(HttpMethod.Put, route + "/support", new { userId = child, skill = "tidying", level = "together" }, adult.Token);
        Assert.Equal(HttpStatusCode.OK, support.Status);
        Assert.Equal("together", support.Body.GetProperty("support")[0].GetProperty("level").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await Request(HttpMethod.Put, route + "/support", new { userId = outsider.User, skill = "tidying", level = "together" }, adult.Token)).Status);
        for (var i = 0; i < 3; i++) await Fund(adult, child, 10);
        await TaskFor(adult, 999, child);
        var reads = await Task.WhenAll(Enumerable.Range(0,3).Select(_ => Request(HttpMethod.Get, route, token: adult.Token)));
        Assert.All(reads, r => { Assert.Equal(HttpStatusCode.OK,r.Status); Assert.Equal(3,r.Body.GetProperty("completed").GetInt32()); });
        var childSession = await Request(HttpMethod.Post, $"/api/family/{adult.Household}/children/{child}/play", token: adult.Token);
        var token = childSession.Body.GetProperty("token").GetString()!;
        Assert.Equal(HttpStatusCode.Forbidden, (await Request(HttpMethod.Put, route + "/support", new { userId = child, skill = "tidying", level = "independent" }, token)).Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await Request(HttpMethod.Put, route + "/placement", new { piece = "anything", position = "left" }, token)).Status);
        var placed = await Request(HttpMethod.Put, route + "/placement", new { piece = "garden", position = "right" }, token);
        Assert.Equal(HttpStatusCode.OK, placed.Status);
        Assert.Equal("right", placed.Body.GetProperty("placements").GetProperty("garden").GetString());
        await Scalar<int>("UPDATE dbo.tasks SET status=N'ToDo' WHERE householdid=@hid; SELECT @@ROWCOUNT",new { hid=adult.Household });
        var restored = await Request(HttpMethod.Get, route, token: token);
        Assert.Equal(3,restored.Body.GetProperty("completed").GetInt32());
        Assert.Equal("right",restored.Body.GetProperty("placements").GetProperty("garden").GetString());
        Assert.Equal(HttpStatusCode.Conflict,(await Request(HttpMethod.Put,route+"/placement",new {piece="observatory",position="left"},token)).Status);
    }
}
