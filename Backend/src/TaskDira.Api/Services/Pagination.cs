using TaskDira.Api.Models.Dtos;

namespace TaskDira.Api.Services;

internal static class Pagination
{
    internal const int MaxPageSize = 100;

    internal const int DefaultPageSize = 25;

    internal static (int Page, int PageSize, int Offset) Normalize(PaginationQuery query)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize switch
        {
            < 1 => DefaultPageSize,
            > MaxPageSize => MaxPageSize,
            _ => query.PageSize,
        };

        return (page, pageSize, (page - 1) * pageSize);
    }
}
