using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

public interface ITaskSubItemService
{
    Task<PagedResult<TaskSubItemResponse>?> GetPageAsync(int taskId, int callerUserId, PaginationQuery query, CancellationToken cancellationToken);

    Task<TaskSubItemResponse?> GetByIdAsync(int taskId, int id, int callerUserId, CancellationToken cancellationToken);

    Task<TaskSubItemResponse?> CreateAsync(int taskId, CreateTaskSubItemRequest request, int callerUserId, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(int taskId, int id, UpdateTaskSubItemRequest request, int callerUserId, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int taskId, int id, int callerUserId, CancellationToken cancellationToken);
}

public class TaskSubItemService : ITaskSubItemService
{
    private readonly ITaskSubItemRepository _subItems;
    private readonly IChoreTaskRepository _tasks;
    private readonly IHouseholdMemberRepository _members;

    public TaskSubItemService(
        ITaskSubItemRepository subItems,
        IChoreTaskRepository tasks,
        IHouseholdMemberRepository members)
    {
        _subItems = subItems;
        _tasks = tasks;
        _members = members;
    }

    public async Task<PagedResult<TaskSubItemResponse>?> GetPageAsync(int taskId, int callerUserId, PaginationQuery query, CancellationToken cancellationToken)
    {
        if (!await CanSeeTaskAsync(taskId, callerUserId, cancellationToken))
            return null;

        var (page, pageSize, offset) = Pagination.Normalize(query);

        var subItems = await _subItems.GetPageAsync(taskId, offset, pageSize, cancellationToken);
        var total = await _subItems.CountAsync(taskId, cancellationToken);

        return new PagedResult<TaskSubItemResponse>
        {
            Items = subItems.Select(ToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
        };
    }

    public async Task<TaskSubItemResponse?> GetByIdAsync(int taskId, int id, int callerUserId, CancellationToken cancellationToken)
    {
        var subItem = await LoadVisibleSubItemAsync(taskId, id, callerUserId, cancellationToken);
        return subItem is null ? null : ToResponse(subItem);
    }

    public async Task<TaskSubItemResponse?> CreateAsync(int taskId, CreateTaskSubItemRequest request, int callerUserId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ItemText))
            throw new ArgumentException("Item text is required.", nameof(request));

        if (!await CanSeeTaskAsync(taskId, callerUserId, cancellationToken))
            return null;

        var subItem = new TaskSubItem
        {
            Taskid = taskId,
            Itemtext = request.ItemText.Trim(),
        };

        var created = await _subItems.InsertAsync(subItem, cancellationToken);
        return ToResponse(created);
    }

    public async Task<bool> UpdateAsync(int taskId, int id, UpdateTaskSubItemRequest request, int callerUserId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ItemText))
            throw new ArgumentException("Item text is required.", nameof(request));

        var subItem = await LoadVisibleSubItemAsync(taskId, id, callerUserId, cancellationToken);
        if (subItem is null)
            return false;

        subItem.Itemtext = request.ItemText.Trim();
        subItem.Iscompleted = request.IsCompleted;

        return await _subItems.UpdateAsync(subItem, cancellationToken);
    }

    public async Task<bool> DeleteAsync(int taskId, int id, int callerUserId, CancellationToken cancellationToken)
    {
        var subItem = await LoadVisibleSubItemAsync(taskId, id, callerUserId, cancellationToken);
        if (subItem is null)
            return false;

        return await _subItems.DeleteAsync(id, cancellationToken);
    }

    private async Task<TaskSubItem?> LoadVisibleSubItemAsync(int taskId, int id, int callerUserId, CancellationToken cancellationToken)
    {
        if (id <= 0 || !await CanSeeTaskAsync(taskId, callerUserId, cancellationToken))
            return null;

        var subItem = await _subItems.GetByIdAsync(id, cancellationToken);

        return subItem is not null && subItem.Taskid == taskId ? subItem : null;
    }

    private async Task<bool> CanSeeTaskAsync(int taskId, int callerUserId, CancellationToken cancellationToken)
    {
        if (taskId <= 0)
            return false;

        var task = await _tasks.GetByIdAsync(taskId, cancellationToken);
        if (task is null)
            return false;

        var membership = await _members.GetAsync(task.Householdid, callerUserId, cancellationToken);
        return membership is not null;
    }

    private static TaskSubItemResponse ToResponse(TaskSubItem subItem) => new()
    {
        Id = subItem.Id,
        TaskId = subItem.Taskid,
        ItemText = subItem.Itemtext,
        IsCompleted = subItem.Iscompleted,
    };
}
