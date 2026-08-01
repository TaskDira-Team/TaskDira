using TaskDira.Api.Data;
using TaskDira.Api.Models;

namespace TaskDira.Api.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken);

    Task<IReadOnlyList<User>> GetPageAsync(int offset, int limit, CancellationToken cancellationToken);

    Task<int> CountAsync(CancellationToken cancellationToken);

    Task<User> InsertAsync(User user, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(User user, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

public class UserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _connections;

    public UserRepository(IDbConnectionFactory connections)
    {
        _connections = connections;
    }

    public Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'get user by id' does not exist yet.");
    }

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'get user by email' does not exist yet.");
    }

    public Task<IReadOnlyList<User>> GetPageAsync(int offset, int limit, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'list users paged' does not exist yet.");
    }

    public Task<int> CountAsync(CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'count users' does not exist yet.");
    }

    public Task<User> InsertAsync(User user, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'insert user' does not exist yet.");
    }

    public Task<bool> UpdateAsync(User user, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'update user' does not exist yet.");
    }

    public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("Stored procedure for 'delete user' does not exist yet.");
    }
}
