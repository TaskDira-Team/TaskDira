namespace TaskDira.Api.Models.Dtos;

public class HouseholdMemberResponse
{
    public int HouseholdId { get; set; }

    public int UserId { get; set; }

    public string Role { get; set; } = string.Empty;

    public DateTime? JoinedAt { get; set; }
}

public class AddHouseholdMemberRequest
{
    public int UserId { get; set; }

    public string Role { get; set; } = string.Empty;
}

public class UpdateHouseholdMemberRoleRequest
{
    public string Role { get; set; } = string.Empty;
}
