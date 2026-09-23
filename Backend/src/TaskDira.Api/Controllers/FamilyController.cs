using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("api/family")]
[EnableRateLimiting("family")]
public class FamilyController(IFamilyService family) : ApiControllerBase
{
    [HttpGet("{household:int}", Name = "GetFamilyAccess")]
    public async Task<IActionResult> List(int household, CancellationToken ct) => TryGetCallerUserId(out var caller) ? Ok(await family.ListAsync(household, caller, ct)) : Unauthorized();

    [HttpPost("{household:int}/invitations", Name = "CreateFamilyInvitation")]
    public async Task<IActionResult> Invite(int household, CancellationToken ct) => TryGetCallerUserId(out var caller) ? Ok(await family.CreateInviteAsync(household, caller, ct)) : Unauthorized();

    [HttpDelete("{household:int}/invitations/{id}", Name = "RevokeFamilyInvitation")]
    public async Task<IActionResult> Revoke(int household, string id, CancellationToken ct)
    {
        if (!TryGetCallerUserId(out var caller)) return Unauthorized();
        await family.RevokeAsync(household, caller, id, ct);
        return NoContent();
    }

    [HttpPost("invitations/preview", Name = "PreviewFamilyInvitation")]
    public async Task<IActionResult> Preview(InviteTokenRequest request, CancellationToken ct) => Ok(await family.PreviewAsync(request.Token, ct));

    [HttpPost("invitations/accept", Name = "AcceptFamilyInvitation")]
    public async Task<IActionResult> Accept(InviteTokenRequest request, CancellationToken ct) => TryGetCallerUserId(out var caller) ? Ok(await family.AcceptAsync(request.Token, caller, ct)) : Unauthorized();

    [HttpPost("invitations/join", Name = "RegisterIntoFamily")]
    public async Task<IActionResult> Join(JoinFamilyRequest request, CancellationToken ct) => Ok(await family.JoinAsync(request, ct));

    [HttpPost("{household:int}/children", Name = "CreateManagedChild")]
    public async Task<IActionResult> Child(int household, CreateChildRequest request, CancellationToken ct) => TryGetCallerUserId(out var caller) ? Ok(await family.CreateChildAsync(household, caller, request, ct)) : Unauthorized();

    [HttpPost("{household:int}/children/{child:int}/play", Name = "SwitchToChild")]
    public async Task<IActionResult> Play(int household, int child, CancellationToken ct) => TryGetCallerUserId(out var caller)
        ? Ok(await family.SwitchAsync(household, caller, child, Request.Headers.Authorization.ToString()[7..].Trim(), ct)) : Unauthorized();

    [HttpPost("pairings", Name = "StartChildPairing")]
    public async Task<IActionResult> Pair(CancellationToken ct) => Ok(await family.StartPairingAsync(ct));

    [HttpPost("{household:int}/pairings/approve", Name = "ApproveChildPairing")]
    public async Task<IActionResult> Approve(int household, ApprovePairingRequest request, CancellationToken ct)
    {
        if (!TryGetCallerUserId(out var caller)) return Unauthorized();
        await family.ApprovePairingAsync(household, caller, request, ct);
        return NoContent();
    }

    [HttpPost("pairings/poll", Name = "PollChildPairing")]
    public async Task<IActionResult> Poll(InviteTokenRequest request, CancellationToken ct)
    {
        var session = await family.PollPairingAsync(request.Token, ct);
        return session is null ? Accepted(new { pending = true }) : Ok(session);
    }
}
