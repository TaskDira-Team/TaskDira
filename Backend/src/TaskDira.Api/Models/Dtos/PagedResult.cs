namespace TaskDira.Api.Models.Dtos;

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = new List<T>();

    public int Page { get; set; }

    public int PageSize { get; set; }

    public int TotalCount { get; set; }

    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public class PaginationQuery
{
    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 25;
}
