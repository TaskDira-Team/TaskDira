using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface IHouseholdRepository
{
    Task<Household?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<IReadOnlyList<Household>> GetPageForUserAsync(int userId, int offset, int limit, CancellationToken cancellationToken);

    Task<int> CountForUserAsync(int userId, CancellationToken cancellationToken);

    Task<Household> InsertAsync(Household household, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(Household household, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

public class HouseholdRepository : IHouseholdRepository
{
    private readonly IDbConnectionFactory _connections;

    public HouseholdRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public Task<Household?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'get household by id' does not exist yet.");
    }

    public Task<IReadOnlyList<Household>> GetPageForUserAsync(int userId, int offset, int limit, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'list households for user paged' does not exist yet.");
    }

    public Task<int> CountForUserAsync(int userId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'count households for user' does not exist yet.");
    }

    public Task<Household> InsertAsync(Household household, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'insert household' does not exist yet.");
    }

    public Task<bool> UpdateAsync(Household household, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'update household' does not exist yet.");
    }

    public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'delete household' does not exist yet.");
    }
}
