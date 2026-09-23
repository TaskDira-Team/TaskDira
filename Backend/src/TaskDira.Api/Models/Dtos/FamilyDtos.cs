using System.ComponentModel.DataAnnotations;

namespace TaskDira.Api.Models.Dtos;

public class CreateChildRequest
{
    [Required, StringLength(40, MinimumLength = 1)] public string Nickname { get; set; } = "";
    [StringLength(8000)] public string AvatarState { get; set; } = "{}";
}

public class InviteTokenRequest
{
    [Required, StringLength(128)] public string Token { get; set; } = "";
}

public class JoinFamilyRequest : InviteTokenRequest
{
    [Required, StringLength(100)] public string FullName { get; set; } = "";
    [Required, EmailAddress, StringLength(150)] public string Email { get; set; } = "";
    [Required, StringLength(128, MinimumLength = 8)] public string Password { get; set; } = "";
}

public class ApprovePairingRequest
{
    [Required, StringLength(12)] public string Code { get; set; } = "";
    public int ChildId { get; set; }
}

public class FamilySessionResponse
{
    public string Token { get; set; } = "";
    public int UserId { get; set; }
    public int HouseholdId { get; set; }
    public bool IsManagedProfile { get; set; }
    public DateTime ExpiresAt { get; set; }
}
