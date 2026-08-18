namespace TaskDira.Api.Models.Dtos;

public class CategoryResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}

public class UpdateCategoryRequest
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}


