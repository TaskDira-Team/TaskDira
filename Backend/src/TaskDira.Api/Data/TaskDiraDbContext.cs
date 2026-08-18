using Microsoft.EntityFrameworkCore;
using TaskDira.Api.Models;

namespace TaskDira.Api.Data;
public class TaskDiraDbContext : DbContext
{
    public TaskDiraDbContext(DbContextOptions<TaskDiraDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<User> Users => Set<User>();

    public virtual DbSet<Category> Categories => Set<Category>();

    public virtual DbSet<Household> Households => Set<Household>();

    public virtual DbSet<HouseholdMember> HouseholdMembers => Set<HouseholdMember>();

    public virtual DbSet<ChoreTask> ChoreTasks => Set<ChoreTask>();

    public virtual DbSet<TaskSubItem> TaskSubItems => Set<TaskSubItem>();

    public virtual DbSet<PointsLedgerEntry> PointsLedger => Set<PointsLedgerEntry>();

    public virtual DbSet<Reward> Rewards => Set<Reward>();

    public virtual DbSet<MonthlyLeaderboardEntry> MonthlyLeaderboard => Set<MonthlyLeaderboardEntry>();

    public virtual DbSet<Session> Sessions => Set<Session>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Session>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("sessions_pkey");

            entity.ToTable("sessions");

            entity.HasIndex(e => e.Tokenhash, "sessions_tokenhash_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Userid).HasColumnName("userid");
            entity.Property(e => e.Tokenhash).HasColumnName("tokenhash");
            entity.Property(e => e.Createdat)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Expiresat)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("expiresat");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("users_pkey");

            entity.ToTable("users");

            entity.HasIndex(e => e.Email, "users_email_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Avatarstate)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'\"neutral\"'::jsonb")
                .HasColumnName("avatarstate");
            entity.Property(e => e.Familyrole)
                .HasMaxLength(30)
                .HasDefaultValueSql("'roommate'::character varying")
                .HasColumnName("familyrole");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Email)
                .HasMaxLength(150)
                .HasColumnName("email");
            entity.Property(e => e.Fullname)
                .HasMaxLength(100)
                .HasColumnName("fullname");
            entity.Property(e => e.Passwordhash)
                .HasMaxLength(255)
                .HasColumnName("passwordhash");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("categories_pkey");

            entity.ToTable("categories");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Name)
                .HasMaxLength(150)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Household>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("householdinfo_pkey");

            entity.ToTable("householdinfo");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Adminuserid).HasColumnName("adminuserid");
            entity.Property(e => e.Address)
                .HasMaxLength(200)
                .HasColumnName("address");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Monthlygoalpoints)
                .HasDefaultValue(400)
                .HasColumnName("monthlygoalpoints");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.Requireproofapproval)
                .HasDefaultValue(false)
                .HasColumnName("requireproofapproval");
        });

        modelBuilder.Entity<HouseholdMember>(entity =>
        {
            entity.HasKey(e => new { e.Householdid, e.Userid }).HasName("householdmembers_pkey");

            entity.ToTable("householdmembers");

            entity.Property(e => e.Householdid).HasColumnName("householdid");
            entity.Property(e => e.Userid).HasColumnName("userid");
            entity.Property(e => e.Joinedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("joinedat");
            entity.Property(e => e.Role)
                .HasMaxLength(30)
                .HasColumnName("role");
        });

        modelBuilder.Entity<ChoreTask>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("tasks_pkey");

            entity.ToTable("tasks");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Approvedbyid).HasColumnName("approvedbyid");
            entity.Property(e => e.Assigneduserid).HasColumnName("assigneduserid");
            entity.Property(e => e.Categoryid).HasColumnName("categoryid");
            entity.Property(e => e.Completedat)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("completedat");
            entity.Property(e => e.Createdbyid).HasColumnName("createdbyid");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Rejectedreason).HasColumnName("rejectedreason");
            entity.Property(e => e.Duedate)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("duedate");
            entity.Property(e => e.Householdid).HasColumnName("householdid");
            entity.Property(e => e.Pointsvalue)
                .HasDefaultValue(0)
                .HasColumnName("pointsvalue");
            entity.Property(e => e.Proofimageurl)
                .HasMaxLength(255)
                .HasColumnName("proofimageurl");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValueSql("'ToDo'::character varying")
                .HasColumnName("status");
            entity.Property(e => e.Title)
                .HasMaxLength(150)
                .HasColumnName("title");
        });

        modelBuilder.Entity<TaskSubItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("tasksubitems_pkey");

            entity.ToTable("tasksubitems");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Iscompleted)
                .HasDefaultValue(false)
                .HasColumnName("iscompleted");
            entity.Property(e => e.Itemtext)
                .HasMaxLength(150)
                .HasColumnName("itemtext");
            entity.Property(e => e.Taskid).HasColumnName("taskid");
        });

        modelBuilder.Entity<PointsLedgerEntry>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pointsledger_pkey");

            entity.ToTable("pointsleader");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("nextval('pointsledger_id_seq'::regclass)")
                .HasColumnName("id");
            entity.Property(e => e.Earnedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("earnedat");
            entity.Property(e => e.Householdid).HasColumnName("householdid");
            entity.Property(e => e.Pointsearned).HasColumnName("pointsearned");
            entity.Property(e => e.Rewardid).HasColumnName("rewardid");
            entity.Property(e => e.Taskid).HasColumnName("taskid");
            entity.Property(e => e.Userid).HasColumnName("userid");
        });

        modelBuilder.Entity<Reward>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("rewards_pkey");

            entity.ToTable("rewards");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Category)
                .HasMaxLength(30)
                .HasColumnName("category");
            entity.Property(e => e.Claimedbyuserid).HasColumnName("claimedbyuserid");
            entity.Property(e => e.Cost)
                .HasDefaultValue(0)
                .HasColumnName("cost");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Emoji)
                .HasMaxLength(16)
                .HasColumnName("emoji");
            entity.Property(e => e.Householdid).HasColumnName("householdid");
            entity.Property(e => e.Requiredpoints).HasColumnName("requiredpoints");
            entity.Property(e => e.Title)
                .HasMaxLength(150)
                .HasColumnName("title");
        });

        modelBuilder.Entity<MonthlyLeaderboardEntry>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("monthlyleaderboard_pkey");

            entity.ToTable("monthlyleaderboard");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Householdid).HasColumnName("householdid");
            entity.Property(e => e.Month).HasColumnName("month");
            entity.Property(e => e.Rank).HasColumnName("rank");
            entity.Property(e => e.Totalpoints)
                .HasDefaultValue(0)
                .HasColumnName("totalpoints");
            entity.Property(e => e.Userid).HasColumnName("userid");
            entity.Property(e => e.Year).HasColumnName("year");
        });
    }
}
