using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;
using TaskDira.Api.Services;

namespace TaskDira.Tests;

public class PointsModelTests
{
    private const int HouseholdId = 4;
    private const int AdminUserId = 9;
    private const int MemberUserId = 13;
    private const int OutsiderUserId = 99;
    private const int TaskId = 11;
    private const int RewardId = 1;

    /// <summary>Mirrors the SQL: XP sums positive rows, balance sums every row.</summary>
    private sealed class FakeLedgerRepository : IPointsLedgerRepository
    {
        private readonly List<PointsLedgerEntry> _rows = [];
        private int _nextId = 1;

        public IReadOnlyList<PointsLedgerEntry> Rows => _rows;

        public Task<int> GetTotalForUserAsync(int householdId, int userId, CancellationToken cancellationToken) =>
            Task.FromResult(_rows
                .Where(r => r.Householdid == householdId && r.Userid == userId && r.Pointsearned > 0)
                .Sum(r => r.Pointsearned));

        public Task<int> GetBalanceForUserAsync(int householdId, int userId, CancellationToken cancellationToken) =>
            Task.FromResult(_rows
                .Where(r => r.Householdid == householdId && r.Userid == userId)
                .Sum(r => r.Pointsearned));

        public Task<PointsLedgerEntry?> InsertAsync(PointsLedgerEntry entry, CancellationToken cancellationToken)
        {
            if (entry.Pointsearned > 0 && entry.Taskid is int taskId &&
                _rows.Any(r => r.Taskid == taskId && r.Pointsearned > 0))
            {
                return Task.FromResult<PointsLedgerEntry?>(null);
            }

            entry.Id = _nextId++;
            entry.Earnedat = DateTime.UtcNow;
            _rows.Add(entry);
            return Task.FromResult<PointsLedgerEntry?>(entry);
        }

        public Task<PointsLedgerEntry?> InsertSpendAsync(int householdId, int userId, int rewardId, int points, CancellationToken cancellationToken)
        {
            var balance = _rows.Where(r => r.Householdid == householdId && r.Userid == userId).Sum(r => r.Pointsearned);
            if (balance < Math.Abs(points))
            {
                return Task.FromResult<PointsLedgerEntry?>(null);
            }

            var entry = new PointsLedgerEntry
            {
                Id = _nextId++,
                Householdid = householdId,
                Userid = userId,
                Rewardid = rewardId,
                Taskid = null,
                Pointsearned = -Math.Abs(points),
                Earnedat = DateTime.UtcNow,
            };
            _rows.Add(entry);
            return Task.FromResult<PointsLedgerEntry?>(entry);
        }

        public Task<PointsLedgerEntry?> GetByIdAsync(int id, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<IReadOnlyList<PointsLedgerEntry>> GetPageForHouseholdAsync(int householdId, int offset, int limit, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<int> CountForHouseholdAsync(int householdId, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<int> CountForTaskAsync(int taskId, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class RoleMemberRepository : IHouseholdMemberRepository
    {
        private readonly Dictionary<int, string> _roles;

        public RoleMemberRepository(Dictionary<int, string> roles)
        {
            _roles = roles;
        }

        public Task<HouseholdMember?> GetAsync(int householdId, int userId, CancellationToken cancellationToken)
        {
            return Task.FromResult(_roles.TryGetValue(userId, out var role)
                ? new HouseholdMember { Householdid = householdId, Userid = userId, Role = role }
                : null);
        }

        public Task<IReadOnlyList<HouseholdMember>> GetPageAsync(int householdId, int offset, int limit, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<int> CountAsync(int householdId, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<HouseholdMember> InsertAsync(HouseholdMember member, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> UpdateRoleAsync(int householdId, int userId, string role, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> DeleteAsync(int householdId, int userId, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class FakeRewardRepository : IRewardRepository
    {
        private readonly Reward _reward;

        public FakeRewardRepository(Reward reward)
        {
            _reward = reward;
        }

        public bool ClaimCalled { get; private set; }

        public Task<Reward?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
            Task.FromResult(_reward.Id == id ? _reward : null);

        public Task<bool> ClaimAsync(int rewardId, int userId, CancellationToken cancellationToken)
        {
            ClaimCalled = true;
            if (_reward.Claimedbyuserid is not null) return Task.FromResult(false);
            _reward.Claimedbyuserid = userId;
            return Task.FromResult(true);
        }

        public Task<IReadOnlyList<Reward>> GetPageAsync(int householdId, int offset, int limit, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<int> CountAsync(int householdId, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<Reward> InsertAsync(Reward reward, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> UpdateAsync(Reward reward, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private static Dictionary<int, string> DefaultRoles() => new()
    {
        [AdminUserId] = HouseholdRoles.Admin,
        [MemberUserId] = HouseholdRoles.Member,
    };

    private static PointsLedgerService LedgerService(FakeLedgerRepository ledger, Dictionary<int, string>? roles = null) =>
        new(ledger, new RoleMemberRepository(roles ?? DefaultRoles()));

    private static RewardService RewardSvc(FakeLedgerRepository ledger, Reward reward, out FakeRewardRepository rewards, Dictionary<int, string>? roles = null)
    {
        rewards = new FakeRewardRepository(reward);
        return new RewardService(rewards, ledger, new RoleMemberRepository(roles ?? DefaultRoles()));
    }

    private static Reward SampleReward(int requiredPoints, int cost) => new()
    {
        Id = RewardId,
        Householdid = HouseholdId,
        Title = "pizza night",
        Requiredpoints = requiredPoints,
        Cost = cost,
    };

    private static CreatePointsLedgerEntryRequest Award(int points, int taskId = TaskId) => new()
    {
        UserId = AdminUserId,
        TaskId = taskId,
        PointsEarned = points,
    };

    [Fact]
    public async Task Award_WritesEntry_OnFirstAwardForTask()
    {
        var ledger = new FakeLedgerRepository();
        var service = LedgerService(ledger);

        var created = await service.AwardAsync(HouseholdId, Award(50), AdminUserId, CancellationToken.None);

        Assert.NotNull(created);
        Assert.Equal(50, created!.PointsEarned);
        Assert.Equal(HouseholdId, created.HouseholdId);
        Assert.Single(ledger.Rows);
    }

    [Fact]
    public async Task Award_ThrowsConflict_WhenTaskAlreadyAwardedPoints()
    {
        var ledger = new FakeLedgerRepository();
        var service = LedgerService(ledger);
        await service.AwardAsync(HouseholdId, Award(50), AdminUserId, CancellationToken.None);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.AwardAsync(HouseholdId, Award(50), AdminUserId, CancellationToken.None));

        Assert.Contains("already awarded", ex.Message);
        Assert.Single(ledger.Rows);
    }

    [Fact]
    public async Task Award_ThrowsForbidden_ForMember_ButReturnsNull_ForOutsider()
    {
        var ledger = new FakeLedgerRepository();
        var service = LedgerService(ledger);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.AwardAsync(HouseholdId, Award(50), MemberUserId, CancellationToken.None));

        var outsider = await service.AwardAsync(HouseholdId, Award(50), OutsiderUserId, CancellationToken.None);
        Assert.Null(outsider);
        Assert.Empty(ledger.Rows);
    }

    [Fact]
    public async Task Claim_DropsBalance_ButLeavesXpUnchanged()
    {
        var ledger = new FakeLedgerRepository();
        var ledgerService = LedgerService(ledger);
        await ledgerService.AwardAsync(HouseholdId, Award(50), AdminUserId, CancellationToken.None);

        var service = RewardSvc(ledger, SampleReward(requiredPoints: 20, cost: 20), out _);

        var claimed = await service.ClaimAsync(RewardId, AdminUserId, CancellationToken.None);

        Assert.True(claimed);
        Assert.Equal(50, await ledger.GetTotalForUserAsync(HouseholdId, AdminUserId, CancellationToken.None));
        Assert.Equal(30, await ledger.GetBalanceForUserAsync(HouseholdId, AdminUserId, CancellationToken.None));
    }

    [Fact]
    public async Task Claim_WritesExactlyOneNegativeRow_TiedToTheReward()
    {
        var ledger = new FakeLedgerRepository();
        var ledgerService = LedgerService(ledger);
        await ledgerService.AwardAsync(HouseholdId, Award(50), AdminUserId, CancellationToken.None);

        var service = RewardSvc(ledger, SampleReward(requiredPoints: 20, cost: 20), out var rewards);

        await service.ClaimAsync(RewardId, AdminUserId, CancellationToken.None);

        var spend = Assert.Single(ledger.Rows.Where(r => r.Pointsearned < 0));
        Assert.Equal(-20, spend.Pointsearned);
        Assert.Equal(RewardId, spend.Rewardid);
        Assert.Null(spend.Taskid);
        Assert.True(rewards.ClaimCalled);
    }

    [Fact]
    public async Task Claim_ThrowsConflict_WhenBalanceIsBelowCost()
    {
        var ledger = new FakeLedgerRepository();
        var ledgerService = LedgerService(ledger);
        await ledgerService.AwardAsync(HouseholdId, Award(10), AdminUserId, CancellationToken.None);

        var service = RewardSvc(ledger, SampleReward(requiredPoints: 10, cost: 40), out var rewards);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ClaimAsync(RewardId, AdminUserId, CancellationToken.None));

        Assert.Contains("Not enough points", ex.Message);
        Assert.DoesNotContain(ledger.Rows, r => r.Pointsearned < 0);
        Assert.False(rewards.ClaimCalled);
    }

    [Fact]
    public async Task Claim_GatesOnCost_NotRequiredPoints()
    {
        var ledger = new FakeLedgerRepository();
        var ledgerService = LedgerService(ledger);
        await ledgerService.AwardAsync(HouseholdId, Award(50), AdminUserId, CancellationToken.None);

        var service = RewardSvc(ledger, SampleReward(requiredPoints: 10, cost: 100), out _);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ClaimAsync(RewardId, AdminUserId, CancellationToken.None));
    }

    [Fact]
    public async Task SecondClaim_IsRejected_AndDoesNotDebitTwice()
    {
        var ledger = new FakeLedgerRepository();
        var ledgerService = LedgerService(ledger);
        await ledgerService.AwardAsync(HouseholdId, Award(100), AdminUserId, CancellationToken.None);

        var reward = SampleReward(requiredPoints: 20, cost: 20);
        var service = RewardSvc(ledger, reward, out _);

        await service.ClaimAsync(RewardId, AdminUserId, CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ClaimAsync(RewardId, AdminUserId, CancellationToken.None));

        Assert.Single(ledger.Rows.Where(r => r.Pointsearned < 0));
        Assert.Equal(80, await ledger.GetBalanceForUserAsync(HouseholdId, AdminUserId, CancellationToken.None));
    }
}
