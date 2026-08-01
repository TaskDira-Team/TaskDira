namespace TaskDira.Api.Models.Dtos;

public class TaskSubItemResponse
{
    public int Id { get; set; }

    public int TaskId { get; set; }

    public string ItemText { get; set; } = string.Empty;

    public bool IsCompleted { get; set; }
}

public class CreateTaskSubItemRequest
{
    public string ItemText { get; set; } = string.Empty;
}

public class UpdateTaskSubItemRequest
{
    public string ItemText { get; set; } = string.Empty;

    public bool IsCompleted { get; set; }
}
