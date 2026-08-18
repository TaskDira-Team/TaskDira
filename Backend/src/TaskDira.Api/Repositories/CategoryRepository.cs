using Dapper;
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

public class CategoryRepository : ICategoryRepository
{
    private readonly IDbConnectionFactory _connections;

    public CategoryRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public async Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_category_by_id(@p_id)",
            new { p_id = id },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<Category>(command);
    }

    public async Task<IReadOnlyList<Category>> GetPageAsync(int offset, int limit, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_get_categories_page(@p_offset, @p_limit)",
            new { p_offset = offset, p_limit = limit },
            cancellationToken: cancellationToken);

        var categories = await connection.QueryAsync<Category>(command);
        return categories.ToList();
    }

    public async Task<int> CountAsync(CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_count_categories()",
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<Category> InsertAsync(Category category, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT * FROM neondb_stp_insert_category(@p_name, @p_description)",
            new
            {
                p_name = category.Name,
                p_description = category.Description,
            },
            cancellationToken: cancellationToken);

        return await connection.QuerySingleAsync<Category>(command);
    }

    public async Task<bool> UpdateAsync(Category category, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_update_category(@p_id, @p_name, @p_description)",
            new
            {
                p_id = category.Id,
                p_name = category.Name,
                p_description = category.Description,
            },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await _connections.CreateOpenConnectionAsync(cancellationToken);

        var command = new CommandDefinition(
            "SELECT neondb_stp_delete_category(@p_id)",
            new { p_id = id },
            cancellationToken: cancellationToken);

        return await connection.ExecuteScalarAsync<int>(command) > 0;
    }
}
