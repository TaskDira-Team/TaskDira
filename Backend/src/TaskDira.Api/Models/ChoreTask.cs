using System.ComponentModel.DataAnnotations.Schema;

namespace TaskDira.Api.Models;

[Table("tasks")]
public class ChoreTask
{
    public int Id { get; set; }

    public int Householdid { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public int? Categoryid { get; set; }

    public int Pointsvalue { get; set; }

    public int? Assigneduserid { get; set; }

    public string Status { get; set; } = null!;

    public DateTime? Duedate { get; set; }

    public string? Proofimageurl { get; set; }

    public int? Createdbyid { get; set; }

    public DateTime? Completedat { get; set; }

    public int? Approvedbyid { get; set; }

    public string? Rejectedreason { get; set; }
}
