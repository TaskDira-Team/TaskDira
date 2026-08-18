namespace TaskDira.Api.Models.Dtos;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string HouseholdName { get; set; } = string.Empty;

    public string? FamilyRole { get; set; }
}

public class RegisterResponse
{
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public int HouseholdId { get; set; }

    public string HouseholdName { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
}
