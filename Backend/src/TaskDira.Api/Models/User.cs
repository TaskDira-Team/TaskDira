namespace TaskDira.Api.Models;

public class User
{
    public int Id { get; set; }

    public string Fullname { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Passwordhash { get; set; } = null!;

    public string? Avatarstate { get; set; }

    public string Familyrole { get; set; } = null!;

    public DateTime? Createdat { get; set; }
}
