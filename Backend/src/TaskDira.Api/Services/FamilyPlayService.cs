using System.Text.Json.Nodes;
using Dapper;
using TaskDira.Api.Data;

namespace TaskDira.Api.Services;

public class FamilyPlayService(IDbConnectionFactory connections)
{
    public async Task<JsonObject> ExecuteAsync(int household, int caller, JsonObject? command, CancellationToken ct)
    {
        await using var connection = await connections.CreateOpenConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);
        // One row lock serializes reads that snapshot progress and all play commands,
        // including the first insert. Revision checks reject stale client intent.
        var lockSql = connections.IsSqlServer
            ? "SELECT id FROM householdinfo WITH (UPDLOCK,HOLDLOCK) WHERE id=@household"
            : "SELECT id FROM householdinfo WHERE id=@household FOR UPDATE";
        await connection.ExecuteScalarAsync<int?>(new CommandDefinition(lockSql, new { household }, transaction, cancellationToken: ct));
        var members = (await connection.QueryAsync<PlayMember>(new CommandDefinition("""
            SELECT CAST(m.userid AS varchar(20)) AS UserId,m.role AS Role,
            CASE WHEN p.userid IS NULL THEN 0 ELSE 1 END AS Managed
            FROM householdmembers m LEFT JOIN managedprofiles p ON p.userid=m.userid WHERE m.householdid=@household
            """, new { household }, transaction, cancellationToken: ct))).ToList();
        var member = members.FirstOrDefault(m => m.UserId == caller.ToString()) ?? throw new KeyNotFoundException("Household not found.");
        var admin = member.Managed == 0 && string.Equals(member.Role, "Admin", StringComparison.OrdinalIgnoreCase);
        var tasks = (await connection.QueryAsync<PlayMission>(new CommandDefinition("""
            SELECT CAST(t.id AS varchar(20)) AS Id,COALESCE(CAST(t.assigneduserid AS varchar(20)),'') AS UserId,
            t.title AS Title,t.status AS Status,COALESCE(c.description,c.name,'other') AS Category,
            (SELECT CAST(COUNT(*) AS int) FROM tasksubitems s WHERE s.taskid=t.id) AS Steps
            FROM tasks t LEFT JOIN categories c ON t.categoryid=c.id WHERE t.householdid=@household
            """, new { household }, transaction, cancellationToken: ct))).ToList();
        var rewards = (await connection.QueryAsync<PlayReward>(new CommandDefinition("""
            SELECT CAST(id AS varchar(20)) AS Id,CAST(claimedbyuserid AS varchar(20)) AS UserId,title AS Title,emoji AS Emoji
            FROM rewards WHERE householdid=@household
            """, new { household }, transaction, cancellationToken: ct))).ToList();
        var document = await connection.ExecuteScalarAsync<string>(new CommandDefinition("SELECT document FROM familyplay WHERE householdid=@household", new { household }, transaction, cancellationToken: ct));
        var state = document is null ? FamilyPlayRules.Empty() : JsonNode.Parse(document)!.AsObject();
        var revision = state["revision"]!.GetValue<long>();
        if (command is not null && (command["revision"] is not JsonValue value || !value.TryGetValue<long>(out var expected) || expected != revision))
            throw new InvalidOperationException("Your family made a change. The latest version is loaded; please try again.");
        var before = state.ToJsonString();
        var now = DateTimeOffset.UtcNow;
        var context = new PlayContext(caller.ToString(), admin, members, tasks, rewards);
        FamilyPlayRules.Reconcile(state, context, now);
        if (command is not null) FamilyPlayRules.Apply(state, command, context, now);
        if (document is null || before != state.ToJsonString()) {
            state["revision"] = revision + 1;
            var sql = document is null ? "INSERT INTO familyplay(householdid,document) VALUES(@household,@document)" : "UPDATE familyplay SET document=@document WHERE householdid=@household";
            await connection.ExecuteAsync(new CommandDefinition(sql, new { household, document = state.ToJsonString() }, transaction, cancellationToken: ct));
        }
        await transaction.CommitAsync(ct);
        if (!admin) state["help"] = new JsonArray(state["help"]!.AsArray().Where(h => FamilyPlayRules.Text(h,"userId") == caller.ToString()).Select(h => h!.DeepClone()).ToArray());
        state["currentWeek"] = FamilyPlayRules.Week(now); state["canManage"] = admin;
        return state;
    }
}
