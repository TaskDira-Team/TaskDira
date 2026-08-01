using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface ICategoryRepository
{
    Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<IReadOnlyList<Category>> GetPageAsync(int offset, int limit, CancellationToken cancellationToken);

    Task<int> CountAsync(CancellationToken cancellationToken);

    Task<Category> InsertAsync(Category category, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(Category category, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

/// <summary>
/// Data access for <c>categories</c>. Dapper-over-stored-procedures; see
/// <see cref="UserRepository"/> for the call shape each method takes once the
/// procedures exist.
/// </summary>
public class CategoryRepository : ICategoryRepository
{
    private readonly IDbConnectionFactory _connections;

    public CategoryRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'get category by id' does not exist yet.");
    }

    public Task<IReadOnlyList<Category>> GetPageAsync(int offset, int limit, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'list categories paged' does not exist yet.");
    }

    public Task<int> CountAsync(CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'count categories' does not exist yet.");
    }

    public Task<Category> InsertAsync(Category category, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'insert category' does not exist yet.");
    }

    public Task<bool> UpdateAsync(Category category, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'update category' does not exist yet.");
    }

    public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'delete category' does not exist yet.");
    }
}
