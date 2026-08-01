namespace TaskDira.Api.Models.Dtos;

public class MonthlyLeaderboardEntryResponse
{
    public int Id { get; set; }

    public int HouseholdId { get; set; }

    public int UserId { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }

    public int TotalPoints { get; set; }

    public int? Rank { get; set; }
}

public class LeaderboardPeriodQuery
{
    public int Month { get; set; }

    public int Year { get; set; }
}
