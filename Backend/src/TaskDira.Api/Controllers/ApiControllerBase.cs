using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace TaskDira.Api.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected bool TryGetCallerUserId(out int callerUserId)
    {
        callerUserId = 0;

        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

        return claim is not null && int.TryParse(claim, out callerUserId);
    }
}
