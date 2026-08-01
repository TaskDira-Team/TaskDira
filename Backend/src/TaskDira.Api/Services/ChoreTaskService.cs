using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

public interface IChoreTaskService
{
    Task<ChoreTaskResponse?> GetByIdAsync(int id, int callerUserId, CancellationToken cancellationToken);

    Task<PagedResult<ChoreTaskResponse>?> GetPageAsync(int householdId, int callerUserId, PaginationQuery query, CancellationToken cancellationToken);

    Task<ChoreTaskResponse?> CreateAsync(int householdId, CreateChoreTaskRequest request, int callerUserId, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(int id, UpdateChoreTaskRequest request, int callerUserId, CancellationToken cancellationToken);

    Task<bool> UpdateStatusAsync(int id, UpdateChoreTaskStatusRequest request, int callerUserId, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, int callerUserId, CancellationToken cancellationToken);
}

public class ChoreTaskService : IChoreTaskService
{
    private readonly IChoreTaskRepository _tasks;
    private readonly IHouseholdMemberRepository _members;

    public ChoreTaskService(IChoreTaskRepository tasks, IHouseholdMemberRepository members)
    {
        _tasks = tasks;
        _members = members;
    }

    public async Task<ChoreTaskResponse?> GetByIdAsync(int id, int callerUserId, CancellationToken cancellationToken)
    {
        var task = await LoadVisibleTaskAsync(id, callerUserId, cancellationToken);
        return task is null ? null : ToResponse(task);
    }

    public async Task<PagedResult<ChoreTaskResponse>?> GetPageAsync(int householdId, int callerUserId, PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!await IsMemberAsync(householdId, callerUserId, cancellationToken))
            return null;

        var (page, pageSize, offset) = Pagination.Normalize(query);

        var tasks = await _tasks.GetPageAsync(householdId, offset, pageSize, cancellationToken);
        var total = await _tasks.CountAsync(householdId, cancellationToken);

        return new PagedResult<ChoreTaskResponse>
        {
            Items = tasks.Select(ToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
        };
    }

    public async Task<ChoreTaskResponse?> CreateAsync(int householdId, CreateChoreTaskRequest request, int callerUserId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Title is required.", nameof(request));

        if (request.PointsValue < 0)
            throw new ArgumentException("Points value cannot be negative.", nameof(request));

        if (!await IsMemberAsync(householdId, callerUserId, cancellationToken))
            return null;

        if (request.AssignedUserId is int assignee && !await IsMemberAsync(householdId, assignee, cancellationToken))
            throw new ArgumentException("The assignee is not a member of this household.", nameof(request));

        var task = new ChoreTask
        {
            Householdid = householdId,
            Title = request.Title.Trim(),
            Description = request.Description,
            Categoryid = request.CategoryId,
            Pointsvalue = request.PointsValue,
            Assigneduserid = request.AssignedUserId,
            Status = ChoreTaskStatus.ToDo,
            Duedate = request.DueDate,
        };

        var created = await _tasks.InsertAsync(task, cancellationToken);
        return ToResponse(created);
    }

    public async Task<bool> UpdateAsync(int id, UpdateChoreTaskRequest request, int callerUserId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Title is required.", nameof(request));

        if (request.PointsValue < 0)
            throw new ArgumentException("Points value cannot be negative.", nameof(request));

        var task = await LoadVisibleTaskAsync(id, callerUserId, cancellationToken);
        if (task is null)
            return false;

        if (request.AssignedUserId is int assignee && !await IsMemberAsync(task.Householdid, assignee, cancellationToken))
            throw new ArgumentException("The assignee is not a member of this household.", nameof(request));

        task.Title = request.Title.Trim();
        task.Description = request.Description;
        task.Categoryid = request.CategoryId;
        task.Pointsvalue = request.PointsValue;
        task.Assigneduserid = request.AssignedUserId;
        task.Duedate = request.DueDate;

        return await _tasks.UpdateAsync(task, cancellationToken);
    }

    public async Task<bool> UpdateStatusAsync(int id, UpdateChoreTaskStatusRequest request, int callerUserId, CancellationToken cancellationToken)
    {
        if (!ChoreTaskStatus.IsKnown(request.Status))
            throw new ArgumentException($"Unknown status '{request.Status}'.", nameof(request));

        var task = await LoadVisibleTaskAsync(id, callerUserId, cancellationToken);
        if (task is null)
            return false;

        if (!ChoreTaskStatus.CanTransition(task.Status, request.Status))
            throw new InvalidOperationException($"Cannot move a task from '{task.Status}' to '{request.Status}'.");

        return await _tasks.UpdateStatusAsync(id, ChoreTaskStatus.Canonical(request.Status), cancellationToken);
    }

    public async Task<bool> DeleteAsync(int id, int callerUserId, CancellationToken cancellationToken)
    {
        var task = await LoadVisibleTaskAsync(id, callerUserId, cancellationToken);
        if (task is null)
            return false;

        return await _tasks.DeleteAsync(id, cancellationToken);
    }

    private async Task<ChoreTask?> LoadVisibleTaskAsync(int id, int callerUserId, CancellationToken cancellationToken)
    {
        if (id <= 0)
            return null;

        var task = await _tasks.GetByIdAsync(id, cancellationToken);
        if (task is null)
            return null;

        return await IsMemberAsync(task.Householdid, callerUserId, cancellationToken) ? task : null;
    }

    private async Task<bool> IsMemberAsync(int householdId, int userId, CancellationToken cancellationToken)
    {
        var membership = await _members.GetAsync(householdId, userId, cancellationToken);
        return membership is not null;
    }

    private static ChoreTaskResponse ToResponse(ChoreTask task) => new()
    {
        Id = task.Id,
        HouseholdId = task.Householdid,
        Title = task.Title,
        Description = task.Description,
        CategoryId = task.Categoryid,
        PointsValue = task.Pointsvalue,
        AssignedUserId = task.Assigneduserid,
        Status = task.Status,
        DueDate = task.Duedate,
        ProofImageUrl = task.Proofimageurl,
    };
}

public static class ChoreTaskStatus
{
    public const string ToDo = "ToDo";

    public const string InProgress = "InProgress";

    public const string Done = "Done";

    private static readonly Dictionary<string, string[]> Allowed = new(StringComparer.OrdinalIgnoreCase)
    {
        [ToDo] = [InProgress],
        [InProgress] = [Done, ToDo],
        [Done] = [InProgress],
    };

    public static bool IsKnown(string status) =>
        status is not null && Allowed.ContainsKey(status);

    public static bool CanTransition(string from, string to)
    {
        if (from is null || to is null || !Allowed.TryGetValue(from, out var targets))
            return false;

        if (string.Equals(from, to, StringComparison.OrdinalIgnoreCase))
            return true;

        return targets.Contains(to, StringComparer.OrdinalIgnoreCase);
    }

    public static string Canonical(string status) => status switch
    {
        _ when string.Equals(status, ToDo, StringComparison.OrdinalIgnoreCase) => ToDo,
        _ when string.Equals(status, InProgress, StringComparison.OrdinalIgnoreCase) => InProgress,
        _ when string.Equals(status, Done, StringComparison.OrdinalIgnoreCase) => Done,
        _ => throw new ArgumentException($"Unknown status '{status}'.", nameof(status)),
    };
}
