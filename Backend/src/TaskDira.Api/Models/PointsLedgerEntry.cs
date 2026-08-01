namespace TaskDira.Api.Models;

public class PointsLedgerEntry
{
    public int Id { get; set; }

    public int Userid { get; set; }

    public int Taskid { get; set; }

    public int Pointsearned { get; set; }

    public DateTime? Earnedat { get; set; }
}
