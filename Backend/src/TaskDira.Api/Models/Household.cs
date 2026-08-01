namespace TaskDira.Api.Models;

public class Household
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int Adminuserid { get; set; }

    public DateTime? Createdat { get; set; }
}
