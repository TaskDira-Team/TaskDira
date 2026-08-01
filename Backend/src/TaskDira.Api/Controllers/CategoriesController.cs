using Microsoft.AspNetCore.Mvc;
using TaskDira.Api.Models.Dtos;
using TaskDira.Api.Services;

namespace TaskDira.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ApiControllerBase
{
    private readonly ICategoryService _categories;

    public CategoriesController(ICategoryService categories)
    {
        _categories = categories;
    }

    [HttpGet(Name = "GetCategories")]
    public async Task<ActionResult<PagedResult<CategoryResponse>>> GetPage([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        return Ok(await _categories.GetPageAsync(query, cancellationToken));
    }

    [HttpGet("{id:int}", Name = "GetCategoryById")]
    public async Task<ActionResult<CategoryResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var category = await _categories.GetByIdAsync(id, cancellationToken);
        return category is null ? NotFound() : Ok(category);
    }

    [HttpPost(Name = "CreateCategory")]
    public async Task<ActionResult<CategoryResponse>> Create([FromBody] CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var created = await _categories.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}", Name = "UpdateCategory")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        var updated = await _categories.UpdateAsync(id, request, cancellationToken);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}", Name = "DeleteCategory")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var deleted = await _categories.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
