namespace TaskDira.Api.Models;

public class TaskSubItem
{
    public int Id { get; set; }

    public int Taskid { get; set; }

    public string Itemtext { get; set; } = null!;

    public bool Iscompleted { get; set; }
}
