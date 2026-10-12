using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("api/family/{household:int}/play")]
[EnableRateLimiting("family")]
public class FamilyPlayController(FamilyPlayService play) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Read(int household, CancellationToken ct) => TryGetCallerUserId(out var caller) ? Ok(await play.ExecuteAsync(household, caller, null, ct)) : Unauthorized();
    [HttpPost]
    [RequestSizeLimit(16384)]
    public async Task<IActionResult> Change(int household, [FromBody] JsonObject command, CancellationToken ct) => TryGetCallerUserId(out var caller) ? Ok(await play.ExecuteAsync(household, caller, command, ct)) : Unauthorized();
}
