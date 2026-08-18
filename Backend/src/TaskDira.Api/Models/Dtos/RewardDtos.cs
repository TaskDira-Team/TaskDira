namespace TaskDira.Api.Models.Dtos;

public class RewardResponse
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public int RequiredPoints { get; set; }

    public int? ClaimedByUserId { get; set; }

    public int HouseholdId { get; set; }

    public string? Emoji { get; set; }

    public string? Description { get; set; }

    public int Cost { get; set; }

    public string? Category { get; set; }
}

public class CreateRewardRequest
{
    public string Title { get; set; } = string.Empty;

    public int RequiredPoints { get; set; }

    public string? Emoji { get; set; }

    public string? Description { get; set; }

    public int? Cost { get; set; }

    public string? Category { get; set; }
}

public class UpdateRewardRequest
{
    public string Title { get; set; } = string.Empty;

    public int RequiredPoints { get; set; }

    public string? Emoji { get; set; }

    public string? Description { get; set; }

    public int? Cost { get; set; }

    public string? Category { get; set; }
}

public class ClaimRewardRequest
{
    public int UserId { get; set; }
}
