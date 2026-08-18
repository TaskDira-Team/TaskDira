using Microsoft.AspNetCore.Identity;
using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

public interface IUserService
{
    Task<UserResponse?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<PagedResult<UserResponse>> GetPageAsync(PaginationQuery query, CancellationToken cancellationToken);

    Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(int id, UpdateUserRequest request, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

public class UserService : IUserService
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher<User> _passwordHasher;

    public UserService(IUserRepository users, IPasswordHasher<User> passwordHasher)
    {
        _users = users;
        _passwordHasher = passwordHasher;
    }

    public async Task<UserResponse?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        if (id <= 0)
            return null;

        var user = await _users.GetByIdAsync(id, cancellationToken);
        return user is null ? null : ToResponse(user);
    }

    public async Task<PagedResult<UserResponse>> GetPageAsync(PaginationQuery query, CancellationToken cancellationToken)
    {
        var (page, pageSize, offset) = Pagination.Normalize(query);

        var users = await _users.GetPageAsync(offset, pageSize, cancellationToken);
        var total = await _users.CountAsync(cancellationToken);

        return new PagedResult<UserResponse>
        {
            Items = users.Select(ToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
        };
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new ArgumentException("Full name is required.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Password is required.", nameof(request));

        var existing = await _users.GetByEmailAsync(request.Email, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("A user with that email already exists.");

        var user = new User
        {
            Fullname = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Familyrole = string.IsNullOrWhiteSpace(request.FamilyRole) ? "roommate" : request.FamilyRole.Trim(),
        };

        user.Passwordhash = _passwordHasher.HashPassword(user, request.Password);

        var created = await _users.InsertAsync(user, cancellationToken);
        return ToResponse(created);
    }

    public async Task<bool> UpdateAsync(int id, UpdateUserRequest request, CancellationToken cancellationToken)
    {
        if (id <= 0)
            return false;

        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new ArgumentException("Full name is required.", nameof(request));

        var user = await _users.GetByIdAsync(id, cancellationToken);
        if (user is null)
            return false;

        user.Fullname = request.FullName.Trim();
        user.Avatarstate = request.AvatarState;
        if (!string.IsNullOrWhiteSpace(request.FamilyRole))
            user.Familyrole = request.FamilyRole.Trim();

        return await _users.UpdateAsync(user, cancellationToken);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        if (id <= 0)
        {
            return false;
        }

        return await _users.DeleteAsync(id, cancellationToken);
    }

    private static UserResponse ToResponse(User user) => new()
    {
        Id = user.Id,
        FullName = user.Fullname,
        Email = user.Email,
        AvatarState = user.Avatarstate,
        FamilyRole = user.Familyrole,
        CreatedAt = user.Createdat,
    };
}
