namespace TaskDira.Api.Models;

public class Session
{
    public int Id { get; set; }

    public int Userid { get; set; }

    public string Tokenhash { get; set; } = null!;

    public DateTime Createdat { get; set; }

    public DateTime Expiresat { get; set; }
}
