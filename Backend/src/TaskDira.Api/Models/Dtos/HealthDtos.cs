namespace TaskDira.Api.Models.Dtos;

public class HealthResponse
{
    public string Status { get; set; } = string.Empty;

    public DateTime CheckedAt { get; set; }
}
