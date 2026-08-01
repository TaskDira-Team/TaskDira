namespace TaskDira.Api.Models;

public class MonthlyLeaderboardEntry
{
    public int Id { get; set; }

    public int Householdid { get; set; }

    public int Userid { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }

    public int Totalpoints { get; set; }

    public int? Rank { get; set; }
}
