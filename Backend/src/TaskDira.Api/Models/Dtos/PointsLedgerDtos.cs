namespace TaskDira.Api.Models.Dtos;

public class PointsLedgerEntryResponse
{
    public int Id { get; set; }

    public int HouseholdId { get; set; }

    public int UserId { get; set; }

    public int? TaskId { get; set; }

    public int? RewardId { get; set; }

    public int PointsEarned { get; set; }

    public DateTime? EarnedAt { get; set; }
}
public class CreatePointsLedgerEntryRequest
{
    public int UserId { get; set; }

    public int? TaskId { get; set; }

    public int PointsEarned { get; set; }
}
