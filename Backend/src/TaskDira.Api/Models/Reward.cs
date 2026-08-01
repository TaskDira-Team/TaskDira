namespace TaskDira.Api.Models;
public class Reward
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public int Requiredpoints { get; set; }

    public int? Claimedbyuserid { get; set; }

    public int? Householdid { get; set; }
}
