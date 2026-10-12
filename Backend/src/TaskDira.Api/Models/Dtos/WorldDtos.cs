using System.ComponentModel.DataAnnotations;

namespace TaskDira.Api.Models.Dtos;

public class WorldPlacementRequest
{
    [Required, RegularExpression("^(garden|picnic|observatory)$")]
    public string Piece { get; set; } = "";
    [Required, RegularExpression("^(left|right|back|stored)$")]
    public string Position { get; set; } = "";
}

public class WorldSupportRequest
{
    [Range(1, int.MaxValue)] public int UserId { get; set; }
    [Required, RegularExpression("^(tidying|caring|kitchen|other)$")]
    public string Skill { get; set; } = "";
    [Required, RegularExpression("^(together|hints|independent)$")]
    public string Level { get; set; } = "";
}
