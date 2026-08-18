namespace TaskDira.Api.Models.Dtos;

public class HouseholdResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int? AdminUserId { get; set; }

    public string? Address { get; set; }

    public int MonthlyGoalPoints { get; set; }

    public bool RequireProofApproval { get; set; }

    public DateTime? CreatedAt { get; set; }
}

public class CreateHouseholdRequest
{
    public string Name { get; set; } = string.Empty;

    public int AdminUserId { get; set; }

    public string? Address { get; set; }

    public int? MonthlyGoalPoints { get; set; }

    public bool? RequireProofApproval { get; set; }
}

public class UpdateHouseholdRequest
{
    public string Name { get; set; } = string.Empty;

    public string? Address { get; set; }

    public int? MonthlyGoalPoints { get; set; }

    public bool? RequireProofApproval { get; set; }
}
