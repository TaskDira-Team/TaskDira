namespace TaskDira.Api.Models;

public class Household
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int Adminuserid { get; set; }

    public string? Address { get; set; }

    public int Monthlygoalpoints { get; set; }

    public bool Requireproofapproval { get; set; }

    public DateTime? Createdat { get; set; }
}
