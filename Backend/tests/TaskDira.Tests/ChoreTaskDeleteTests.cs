using TaskDira.Api.Models;
using TaskDira.Api.Repositories;
using TaskDira.Api.Services;

namespace TaskDira.Tests;

public class ChoreTaskDeleteTests
{
    private const int HouseholdId = 7;
    private const int CallerUserId = 3;
    private const int TaskId = 42;

    private sealed class StubChoreTaskRepository : IChoreTaskRepository
    {
        private readonly ChoreTask? _task;

        public StubChoreTaskRepository(ChoreTask? task)
        {
            _task = task;
        }

        public bool DeleteCalled { get; private set; }

        public Task<ChoreTask?> GetByIdAsync(int id, CancellationToken cancellationToken)
        {
            return Task.FromResult(_task is not null && _task.Id == id ? _task : null);
        }

        public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
        {
            DeleteCalled = true;
            return Task.FromResult(true);
        }

        public Task<IReadOnlyList<ChoreTask>> GetPageAsync(int householdId, int offset, int limit, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<int> CountAsync(int householdId, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<ChoreTask> InsertAsync(ChoreTask task, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> UpdateAsync(ChoreTask task, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> UpdateStatusAsync(int id, string status, DateTime? completedAt, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class StubMemberRepository : IHouseholdMemberRepository
    {
        public Task<HouseholdMember?> GetAsync(int householdId, int userId, CancellationToken cancellationToken)
        {
            return Task.FromResult<HouseholdMember?>(new HouseholdMember
            {
                Householdid = householdId,
                Userid = userId,
                Role = HouseholdRoles.Admin,
            });
        }

        public Task<IReadOnlyList<HouseholdMember>> GetPageAsync(int householdId, int offset, int limit, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<int> CountAsync(int householdId, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<HouseholdMember> InsertAsync(HouseholdMember member, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> UpdateRoleAsync(int householdId, int userId, string role, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> DeleteAsync(int householdId, int userId, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class StubLedgerRepository : IPointsLedgerRepository
    {
        private readonly int _countForTask;

        public StubLedgerRepository(int countForTask)
        {
            _countForTask = countForTask;
        }

        public Task<int> CountForTaskAsync(int taskId, CancellationToken cancellationToken) => Task.FromResult(_countForTask);

        public Task<PointsLedgerEntry?> GetByIdAsync(int id, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<IReadOnlyList<PointsLedgerEntry>> GetPageForHouseholdAsync(int householdId, int offset, int limit, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<int> CountForHouseholdAsync(int householdId, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<int> GetTotalForUserAsync(int householdId, int userId, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<int> GetBalanceForUserAsync(int householdId, int userId, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<PointsLedgerEntry?> InsertAsync(PointsLedgerEntry entry, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<PointsLedgerEntry?> InsertSpendAsync(int householdId, int userId, int rewardId, int points, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private static (ChoreTaskService Service, StubChoreTaskRepository Tasks) CreateService(int ledgerRows)
    {
        var tasks = new StubChoreTaskRepository(new ChoreTask
        {
            Id = TaskId,
            Householdid = HouseholdId,
            Title = "wash dishes",
            Status = ChoreTaskStatus.Done,
        });

        var service = new ChoreTaskService(tasks, new StubMemberRepository(), new StubLedgerRepository(ledgerRows));
        return (service, tasks);
    }

    [Fact]
    public async Task Delete_RemovesTask_WhenNoPointsWereAwarded()
    {
        var (service, tasks) = CreateService(ledgerRows: 0);

        var deleted = await service.DeleteAsync(TaskId, CallerUserId, CancellationToken.None);

        Assert.True(deleted);
        Assert.True(tasks.DeleteCalled);
    }

    [Fact]
    public async Task Delete_ThrowsConflict_WhenTaskHasAwardedPoints()
    {
        var (service, tasks) = CreateService(ledgerRows: 1);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.DeleteAsync(TaskId, CallerUserId, CancellationToken.None));

        Assert.Contains("cannot be deleted", ex.Message);
        Assert.False(tasks.DeleteCalled);
    }

    [Fact]
    public async Task Delete_ReturnsFalse_WhenTaskIsNotVisibleToCaller()
    {
        var tasks = new StubChoreTaskRepository(null);
        var service = new ChoreTaskService(tasks, new StubMemberRepository(), new StubLedgerRepository(0));

        var deleted = await service.DeleteAsync(TaskId, CallerUserId, CancellationToken.None);

        Assert.False(deleted);
        Assert.False(tasks.DeleteCalled);
    }
}
