namespace TaskDira.Api.Models.Dtos;

public class UserResponse
{
    public int Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? AvatarState { get; set; }

    public string FamilyRole { get; set; } = string.Empty;

    public DateTime? CreatedAt { get; set; }
}

public class CreateUserRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string? FamilyRole { get; set; }
}

public class UpdateUserRequest
{
    public string FullName { get; set; } = string.Empty;

    public string? AvatarState { get; set; }

    public string? FamilyRole { get; set; }
}
