using System.Globalization;
using System.Text.Json.Nodes;

namespace TaskDira.Api.Services;

public sealed record PlayMission(string Id, string UserId, string Title, string Status, string Category, int Steps);
public sealed record PlayReward(string Id, string? UserId, string Title, string? Emoji);
public sealed record PlayMember(string UserId, string Role, int Managed);
public sealed record PlayContext(string Caller, bool Admin, IReadOnlyList<PlayMember> Members, IReadOnlyList<PlayMission> Tasks, IReadOnlyList<PlayReward> Rewards);

// All commands validate against server-loaded household records. No client totals,
// ownership, completion flags, reward prices, or permissions are trusted.
public static class FamilyPlayRules
{
    public static JsonObject Empty() => JsonNode.Parse("""{"revision":0,"adventures":[],"credits":[],"rooms":{},"tickets":[],"help":[],"weeks":{}}""")!.AsObject();
    public static string Week(DateTimeOffset now) => now.UtcDateTime.Date.AddDays(-((int)now.UtcDateTime.DayOfWeek + 6) % 7).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
    public static string Text(JsonNode? node, string key) => node?[key]?.GetValue<string>() ?? "";
    static JsonArray List(JsonObject state, string key) => state[key]!.AsArray();
    static bool Open(PlayMission? task) => task?.Status is "ToDo" or "InProgress";
    static string Skill(string category) => category switch {
        "kitchen" or "cooking" or "shopping" => "kitchen",
        "living" or "cleaning" or "room" or "bedroom" or "laundry" => "tidying",
        "pets" or "pet" or "plants" or "garden" => "caring", _ => "other"
    };
    public static HashSet<string> Unlocks(JsonObject state, string user)
    {
        var earned = new HashSet<string> { "cushion" };
        foreach (var (item, skill) in new[] { ("lamp", "tidying"), ("plant", "caring"), ("cup", "kitchen") })
            if (List(state, "credits").Count(c => Text(c, "userId") == user && Text(c, "skill") == skill) >= 3) earned.Add(item);
        if (List(state, "adventures").Any(a => a!["completedAt"] is not null && a["missions"]!.AsArray().Any(m => Text(m, "userId") == user))) earned.Add("moon");
        return earned;
    }
    public static void Reconcile(JsonObject state, PlayContext context, DateTimeOffset now)
    {
        if (state["weeks"]![Week(now)] is JsonObject menu) {
            menu["taskIds"] = new JsonArray(menu["taskIds"]!.AsArray().Where(id => context.Tasks.Any(t => t.Id == id!.GetValue<string>())).Select(id => id!.DeepClone()).ToArray());
            var choices = menu["choices"]!.AsObject();
            foreach (var entry in choices.ToList()) choices[entry.Key] = new JsonArray(entry.Value!.AsArray().Where(id => context.Tasks.Any(t => t.Id == id!.GetValue<string>() && (t.Status == "Done" || t.UserId == entry.Key))).Select(id => id!.DeepClone()).ToArray());
        }
        var credits = List(state, "credits");
        foreach (var task in context.Tasks.Where(t => t.Status == "Done" && t.UserId != ""))
            if (!credits.Any(c => Text(c, "taskId") == task.Id)) credits.Add(new JsonObject { ["taskId"] = task.Id, ["userId"] = task.UserId, ["skill"] = Skill(task.Category) });
        foreach (var adventure in List(state, "adventures")) {
            foreach (var mission in adventure!["missions"]!.AsArray())
                if (context.Tasks.Any(t => t.Id == Text(mission, "taskId") && t.Status == "Done")) mission!["done"] = true;
            if (adventure["archived"]?.GetValue<bool>() != true && adventure["completedAt"] is null && adventure["missions"]!.AsArray().All(m => m!["done"]!.GetValue<bool>())) adventure["completedAt"] = now.ToString("O");
        }
        foreach (var reward in context.Rewards.Where(r => !string.IsNullOrEmpty(r.UserId)))
            if (!List(state, "tickets").Any(t => Text(t, "rewardId") == reward.Id)) List(state, "tickets").Add(new JsonObject { ["rewardId"] = reward.Id, ["userId"] = reward.UserId, ["title"] = reward.Title, ["emoji"] = reward.Emoji, ["status"] = "waiting", ["date"] = "", ["when"] = "after-dinner", ["createdAt"] = now.ToString("O") });
        foreach (var help in List(state, "help"))
            if (context.Tasks.Any(t => t.Id == Text(help, "taskId") && t.Status == "Done")) help!["status"] = "resolved";
    }
    public static void Apply(JsonObject state, JsonObject command, PlayContext context, DateTimeOffset now)
    {
        void Admin() { if (!context.Admin) throw new UnauthorizedAccessException("Ask a parent to manage this part of your home."); }
        string Value(string key) => Text(command, key);
        PlayMission? TaskById(string id) => context.Tasks.FirstOrDefault(t => t.Id == id);
        PlayMission OwnTask() { var task = TaskById(Value("taskId")); if (!Open(task) || task!.UserId != context.Caller) throw new UnauthorizedAccessException("Choose one of your open missions."); return task; }
        string[] Ids(string key, int max) {
            if (command[key] is not JsonArray values || values.Count > max || values.Any(v => v is not JsonValue j || !j.TryGetValue<string>(out _))) throw new ArgumentException("Choose missions from your home.");
            return values.Select(v => v!.GetValue<string>()).Distinct().ToArray();
        }
        JsonNode Find(string list, string key, string value) => List(state, list).FirstOrDefault(x => Text(x, key) == value) ?? throw new KeyNotFoundException("This item is no longer available.");
        switch (Value("action")) {
            case "adventure.start": {
                Admin(); var theme = Value("theme");
                if (theme is not ("moon" or "garden" or "camp")) throw new ArgumentException("Choose an adventure.");
                if (List(state, "adventures").Any(a => a!["archived"]?.GetValue<bool>() != true && a["completedAt"] is null)) throw new InvalidOperationException("Finish or put away the current adventure first.");
                var ids = Ids("taskIds", 8);
                if (ids.Length == 0 || ids.Any(id => !Open(TaskById(id)) || !context.Members.Any(m => m.UserId == TaskById(id)!.UserId))) throw new ArgumentException("Choose 1–8 open, assigned missions.");
                var missions = new JsonArray();
                foreach (var id in ids) { var t = TaskById(id)!; missions.Add(new JsonObject { ["taskId"] = id, ["title"] = t.Title, ["userId"] = t.UserId, ["done"] = false }); }
                List(state, "adventures").Add(new JsonObject { ["id"] = Guid.NewGuid().ToString(), ["theme"] = theme, ["createdAt"] = now.ToString("O"), ["completedAt"] = null, ["archived"] = false, ["missions"] = missions }); break;
            }
            case "adventure.archive": Admin(); Find("adventures", "id", Value("id"))["archived"] = true; break;
            case "room.save": {
                var items = Ids("items", 5); var color = Value("color");
                if (color is not ("mint" or "peach" or "lilac" or "sky") || items.Any(id => !Unlocks(state, context.Caller).Contains(id))) throw new ArgumentException("Choose decorations you have earned.");
                state["rooms"]![context.Caller] = new JsonObject { ["color"] = color, ["items"] = new JsonArray(items.Select(id => (JsonNode?)JsonValue.Create(id)).ToArray()) }; break;
            }
            case "help.ask": {
                var task = OwnTask(); var kind = Value("kind");
                if (kind is not ("show" or "start" or "together") || command["step"] is not JsonValue stepValue || !stepValue.TryGetValue<int>(out var step) || step < 0 || step > task.Steps) throw new ArgumentException("Choose the help and step you need.");
                var help = List(state, "help").FirstOrDefault(h => Text(h, "userId") == context.Caller && Text(h, "taskId") == task.Id && Text(h, "status") != "resolved");
                if (help is null) { help = new JsonObject { ["id"] = Guid.NewGuid().ToString() }; List(state, "help").Add(help); }
                help["taskId"] = task.Id; help["userId"] = context.Caller; help["title"] = task.Title; help["kind"] = kind; help["step"] = step; help["status"] = "waiting"; help["reply"] = ""; help["createdAt"] = now.ToString("O"); break;
            }
            case "help.reply": {
                Admin(); var help = Find("help", "id", Value("id")); var reply = Value("reply");
                if (Text(help, "status") == "resolved" || reply is not ("coming" or "after-meal" or "ready")) throw new ArgumentException("Choose an open help request and a reply.");
                help["reply"] = reply; help["status"] = "answered"; break;
            }
            case "help.resolve": {
                var help = Find("help", "id", Value("id")); if (!context.Admin && Text(help, "userId") != context.Caller) throw new UnauthorizedAccessException("This request is not available."); help["status"] = "resolved"; break;
            }
            case "ticket.schedule": {
                Admin(); var ticket = Find("tickets", "rewardId", Value("rewardId")); var when = Value("when");
                if (Text(ticket, "status") == "enjoyed" || !DateOnly.TryParseExact(Value("date"), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date) || date < DateOnly.FromDateTime(now.UtcDateTime) || when is not ("morning" or "afternoon" or "after-dinner" or "anytime")) throw new ArgumentException("Choose today or a future date for this reward.");
                ticket["date"] = Value("date"); ticket["when"] = when; ticket["status"] = "planned"; break;
            }
            case "ticket.enjoy": {
                Admin(); var ticket = Find("tickets", "rewardId", Value("rewardId")); if (Text(ticket, "status") != "planned") throw new InvalidOperationException("Plan this reward before marking it enjoyed."); ticket["status"] = "enjoyed"; ticket["enjoyedAt"] = now.ToString("O"); break;
            }
            case "week.offer": {
                Admin(); var ids = Ids("taskIds", 30); var key = Week(now); var previous = state["weeks"]![key];
                if (ids.Any(id => TaskById(id) is not { } task || (!Open(task) && previous?["taskIds"]?.AsArray().Any(v => v!.GetValue<string>() == id) != true) || !context.Members.Any(m => m.UserId == task.UserId))) throw new ArgumentException("Choose up to 30 assigned missions.");
                if (previous is not null && previous["choices"]!.AsObject().Any(p => p.Value!.AsArray().Any(v => !ids.Contains(v!.GetValue<string>())))) throw new InvalidOperationException("Keep the missions your crew already chose.");
                state["weeks"]![key] = new JsonObject { ["taskIds"] = new JsonArray(ids.Select(id => (JsonNode?)JsonValue.Create(id)).ToArray()), ["choices"] = previous?["choices"]?.DeepClone() ?? new JsonObject() }; break;
            }
            case "week.choose": {
                var task = OwnTask(); var week = state["weeks"]![Week(now)];
                if (week is null || !week["taskIds"]!.AsArray().Any(v => v!.GetValue<string>() == task.Id) || command["selected"] is not JsonValue selectedValue || !selectedValue.TryGetValue<bool>(out var selected)) throw new ArgumentException("This mission is not on this week’s menu.");
                var choices = week["choices"]![context.Caller]?.AsArray().Select(v => v!.GetValue<string>()).Where(id => id != task.Id).ToList() ?? [];
                if (selected) choices.Add(task.Id); if (choices.Count > 3) throw new ArgumentException("Pick up to three missions. You can change an unfinished choice.");
                week["choices"]![context.Caller] = new JsonArray(choices.Select(id => (JsonNode?)JsonValue.Create(id)).ToArray()); break;
            }
            default: throw new ArgumentException("This action is not available.");
        }
    }
}
