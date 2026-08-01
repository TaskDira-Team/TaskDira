namespace TaskDira.Api.Models;

public class HouseholdMember
{
    public int Householdid { get; set; }

    public int Userid { get; set; }

    public string Role { get; set; } = null!;

    public DateTime? Joinedat { get; set; }
}
