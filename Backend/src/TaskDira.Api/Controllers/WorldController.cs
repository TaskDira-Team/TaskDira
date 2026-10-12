using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("api/family/{household:int}/world")]
[EnableRateLimiting("family")]
public class WorldController(IWorldService world) : ApiControllerBase
{
    [HttpGet(Name = "GetFamilyWorld")]
    public async Task<IActionResult> Read(int household, CancellationToken ct) => TryGetCallerUserId(out var caller) ? Ok(await world.ReadAsync(household, caller, ct)) : Unauthorized();
    [HttpPut("placement", Name = "PlaceWorldDecoration")]
    public async Task<IActionResult> Place(int household, WorldPlacementRequest request, CancellationToken ct) => TryGetCallerUserId(out var caller) ? Ok(await world.PlaceAsync(household, caller, request, ct)) : Unauthorized();
    [HttpPut("support", Name = "SetWorldSkillSupport")]
    public async Task<IActionResult> Support(int household, WorldSupportRequest request, CancellationToken ct) => TryGetCallerUserId(out var caller) ? Ok(await world.SupportAsync(household, caller, request, ct)) : Unauthorized();
}
