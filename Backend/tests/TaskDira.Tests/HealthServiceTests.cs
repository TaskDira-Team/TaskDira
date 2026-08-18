using TaskDira.Api.Repositories;
using TaskDira.Api.Services;

namespace TaskDira.Tests;

public class HealthServiceTests
{
    private sealed class StubHealthRepository : IHealthRepository
    {
        private readonly Exception? _exception;

        public StubHealthRepository(Exception? exception = null)
        {
            _exception = exception;
        }

        public Task PingAsync(CancellationToken cancellationToken)
        {
            return _exception is null ? Task.CompletedTask : Task.FromException(_exception);
        }
    }

    [Fact]
    public async Task IsDatabaseHealthy_ReturnsTrue_WhenPingSucceeds()
    {
        var service = new HealthService(new StubHealthRepository());

        var healthy = await service.IsDatabaseHealthyAsync(CancellationToken.None);

        Assert.True(healthy);
    }

    [Fact]
    public async Task IsDatabaseHealthy_ReturnsFalse_WhenPingThrows()
    {
        var service = new HealthService(new StubHealthRepository(new InvalidOperationException("connection refused")));

        var healthy = await service.IsDatabaseHealthyAsync(CancellationToken.None);

        Assert.False(healthy);
    }

    [Fact]
    public async Task IsDatabaseHealthy_Rethrows_WhenCancelled()
    {
        var service = new HealthService(new StubHealthRepository(new OperationCanceledException()));

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => service.IsDatabaseHealthyAsync(CancellationToken.None));
    }
}
