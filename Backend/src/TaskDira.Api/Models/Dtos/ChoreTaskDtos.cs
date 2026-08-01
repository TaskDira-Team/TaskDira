namespace TaskDira.Api.Models.Dtos;

public class ChoreTaskResponse
{
    public int Id { get; set; }

    public int HouseholdId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int? CategoryId { get; set; }

    public int PointsValue { get; set; }

    public int? AssignedUserId { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime? DueDate { get; set; }

    public string? ProofImageUrl { get; set; }
}

public class CreateChoreTaskRequest
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int? CategoryId { get; set; }

    public int PointsValue { get; set; }

    public int? AssignedUserId { get; set; }

    public DateTime? DueDate { get; set; }
}

public class UpdateChoreTaskRequest
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int? CategoryId { get; set; }

    public int PointsValue { get; set; }

    public int? AssignedUserId { get; set; }

    public DateTime? DueDate { get; set; }
}
public class UpdateChoreTaskStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
