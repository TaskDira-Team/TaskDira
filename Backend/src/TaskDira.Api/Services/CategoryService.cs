using TaskDira.Api.Models;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

public interface ICategoryService
{
    Task<CategoryResponse?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<PagedResult<CategoryResponse>> GetPageAsync(PaginationQuery query, CancellationToken cancellationToken);

    Task<CategoryResponse> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categories;

    public CategoryService(ICategoryRepository categories)
    {
        _categories = categories;
    }

    public async Task<CategoryResponse?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        if (id <= 0)
            return null;

        var category = await _categories.GetByIdAsync(id, cancellationToken);
        return category is null ? null : ToResponse(category);
    }

    public async Task<PagedResult<CategoryResponse>> GetPageAsync(PaginationQuery query, CancellationToken cancellationToken)
    {
        var (page, pageSize, offset) = Pagination.Normalize(query);

        var categories = await _categories.GetPageAsync(offset, pageSize, cancellationToken);
        var total = await _categories.CountAsync(cancellationToken);

        return new PagedResult<CategoryResponse>
        {
            Items = categories.Select(ToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
        };
    }

    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("Name is required.", nameof(request));
        }

        var category = new Category
        {
            Name = request.Name.Trim(),
            Description = request.Description,
        };

        var created = await _categories.InsertAsync(category, cancellationToken);
        return ToResponse(created);
    }

    public async Task<bool> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        if (id <= 0)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("Name is required.", nameof(request));
        }

        var category = await _categories.GetByIdAsync(id, cancellationToken);
        if (category is null)
        {
            return false;
        }

        category.Name = request.Name.Trim();
        category.Description = request.Description;

        return await _categories.UpdateAsync(category, cancellationToken);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        if (id <= 0)
        {
            return false;
        }

        return await _categories.DeleteAsync(id, cancellationToken);
    }

    private static CategoryResponse ToResponse(Category category) => new()
    {
        Id = category.Id,
        Name = category.Name,
        Description = category.Description,
    };
}
