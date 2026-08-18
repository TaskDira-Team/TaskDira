using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

public interface IHealthService
{
    Task<bool> IsDatabaseHealthyAsync(CancellationToken cancellationToken);
}

public class HealthService : IHealthService
{
    private readonly IHealthRepository _health;

    public HealthService(IHealthRepository health)
    {
        _health = health;
    }

    public async Task<bool> IsDatabaseHealthyAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _health.PingAsync(cancellationToken);
            return true;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception)
        {
            return false;
        }
    }
}
