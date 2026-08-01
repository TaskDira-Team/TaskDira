using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface IPointsLedgerRepository
{
    Task<PointsLedgerEntry?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<IReadOnlyList<PointsLedgerEntry>> GetPageForHouseholdAsync(int householdId, int offset, int limit, CancellationToken cancellationToken);

    Task<int> CountForHouseholdAsync(int householdId, CancellationToken cancellationToken);

    Task<int> GetTotalForUserAsync(int householdId, int userId, CancellationToken cancellationToken);

    Task<PointsLedgerEntry> InsertAsync(PointsLedgerEntry entry, CancellationToken cancellationToken);
}

public class PointsLedgerRepository : IPointsLedgerRepository
{
    private readonly IDbConnectionFactory _connections;

    public PointsLedgerRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public Task<PointsLedgerEntry?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'get points ledger entry by id' does not exist yet.");
    }

    public Task<IReadOnlyList<PointsLedgerEntry>> GetPageForHouseholdAsync(int householdId, int offset, int limit, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'list points ledger for household paged' does not exist yet.");
    }

    public Task<int> CountForHouseholdAsync(int householdId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'count points ledger for household' does not exist yet.");
    }

    public Task<int> GetTotalForUserAsync(int householdId, int userId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'sum points for user' does not exist yet.");
    }

    public Task<PointsLedgerEntry> InsertAsync(PointsLedgerEntry entry, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'insert points ledger entry' does not exist yet.");
    }
}
