# CLAUDE.md — TaskDira Backend

**Read this file completely before doing anything in this repository.**

This is the shared source of truth for how the TaskDira backend is built. When a rule here conflicts with a task instruction, the rule wins — flag the conflict instead of silently choosing.

---

## 1. What this project is

TaskDira is a gamified household chore management app. This repository folder (`Backend/`) is the **backend only**: an ASP.NET Core Web API over PostgreSQL, consumed by a React Native client built by a separate team that lives in the sibling `Frontend/` folder.

**Never** touch anything in `Frontend/`. **Never** add UI code, Razor pages, or client assets here. The only deliverable is a JSON API.

`docs/spec.md` describes **the backend that actually exists**, not an aspirational product. It is the authority for product scope and the data model; this file is the authority for coding rules. Its section 8 lists what is deliberately **out of scope** — recurrence, notifications, SignalR, shopping list, expenses, badges, activity feed, scoring periods, invite codes, refresh tokens. None of those have tables. Do not build against them.

---

## 2. Stack — fixed, do not substitute

| Concern | Choice |
|---|---|
| Runtime | .NET 9 |
| API | ASP.NET Core Web API, **controller-based** |
| Data access | **Dapper** calling PostgreSQL **functions** named `neondb_stp_*` |
| Schema tooling | EF Core 9 + Npgsql — **scaffolding only**, never in the request path |
| Database | PostgreSQL on **Neon** (use the direct/unpooled connection for schema work) |
| Connection | `NpgsqlDataSource` → `IDbConnectionFactory` |
| Secrets | gitignored `appsettings.Local.json`. **Never commit a connection string.** |
| API docs | built-in OpenAPI document at `/openapi/v1.json`, rendered by Swagger UI at `/swagger` (Development only) |
| Tests | xUnit |

**Package versions must match the target framework.** For Microsoft's framework-versioned packages (EF Core, ASP.NET Core, Npgsql providers) pin to the latest `9.x` — never the floating latest, which resolves to 10.x and breaks the build. Install with an explicit `--version 9.x.y`.

Third-party packages version independently of .NET and are pinned to their own latest stable: Dapper `2.x`, Swashbuckle.AspNetCore.SwaggerUI `10.x`. Pin them explicitly too; just don't force a `9.x` that doesn't exist.

Adding a NuGet package not already in the project requires a clear reason stated in the task. Do not add one on your own initiative.

---

## 3. Architecture — layered, this exact shape

The architecture is classic layered N-tier — **not Clean Architecture, not vertical slices**, one API project. Every request flows in one direction:

```
Controller  →  Service  →  Repository  →  Neon function (neondb_stp_*)  →  table
```

- **Controller** — HTTP only. Model binding, calling the service, returning the right status code. Identifies the caller via `TryGetCallerUserId`. No business logic, no data access.
- **Service** — business logic. Orchestrates repositories, enforces rules (the task state machine, household membership checks), maps entity ↔ DTO. Knows nothing about HTTP or SQL.
- **Repository** — data access only. One Dapper call per method to a `neondb_stp_*` function, on a connection taken from `IDbConnectionFactory`, and maps the results. No business logic. A repository never takes the DbContext.

A controller never calls a repository directly. A service never touches HTTP. A repository never contains a business rule. If a piece of code doesn't fit its layer, it's in the wrong layer.

### Project layout

```
src/TaskDira.Api/
  Controllers/     one controller per entity (UsersController, TasksController ...)
  Services/        one file per entity, each holding I<Name>Service + <Name>Service
  Repositories/    one file per entity, each holding I<Name>Repository + <Name>Repository
  Models/          entities (scaffolded from DB)
    Dtos/          DTOs, kept out of the scaffolder's output directory
  Data/            DbConnectionFactory (request path) + the DbContext (scaffolding only)
  Program.cs       DI registration, middleware
tests/TaskDira.Tests/
docs/spec.md
```

---

## 4. Conventions that are not optional

### 4.1 Interface + implementation in the same file
This applies to **every** service and **every** repository, without exception — `User` below is just an example, not a special case.

Each service file holds its interface directly above its implementation: `IUserService` then `UserService` in `Services/UserService.cs`; `ITaskService` then `TaskService` in `Services/TaskService.cs`; and so on for every entity. Repositories follow the identical pattern in `Repositories/`: `I<Name>Repository` then `<Name>Repository` in `Repositories/<Name>Repository.cs`.

There is **no** separate `Interfaces/` folder, and an interface never lives in its own file. Every new service or repository is created this paired way from the start.

### 4.2 Lifetimes
Services and repositories are registered **Scoped** (one instance per HTTP request). Never singleton — a singleton holding a database connection breaks under concurrent requests, and two roommates hitting the API at once would corrupt each other's data.

`NpgsqlDataSource` is the exception: `AddNpgsqlDataSource` registers it as a **singleton** on purpose, because it owns the connection pool. `IDbConnectionFactory` is Scoped and hands out one connection at a time from it.

### 4.3 Dapper over Neon functions — not LINQ, not EF at runtime
Business data access goes through hand-written PostgreSQL routines named `neondb_stp_<action>`. Not LINQ, not EF query building.

**They are `FUNCTION`s, not `PROCEDURE`s.** This determines how they are called, and getting it wrong fails at runtime:

- Always **`CommandType.Text`**. **Never `CommandType.StoredProcedure`** — Npgsql translates that to `CALL`, which errors against a function.
- Row-returning functions: `SELECT * FROM neondb_stp_get_user_by_id(@p_id)`.
- Scalar functions: `SELECT neondb_stp_count_users()` — no `* FROM`.

Every repository takes `IDbConnectionFactory` in its constructor, never `TaskDiraDbContext`. A method opens a connection from the factory and makes exactly one Dapper call:

- row-returning (`RETURNS SETOF <table>`) → `QueryAsync` / `QueryFirstOrDefaultAsync`
- scalar (`RETURNS integer` / `boolean`) → `ExecuteScalarAsync`
- always `await using` on the connection

Writes follow the same shape: the `insert_*` functions `RETURN SETOF <table>` (read the inserted row back with `QueryFirstOrDefaultAsync`), and the `update_*` / `delete_*` functions return an `integer` row count (`ExecuteScalarAsync`, then `> 0` for the repository's `bool`).

Parameter names in the database are prefixed `p_` (`p_id`, `p_householdid`). Dapper anonymous-object members must match: `new { p_id = id }`.

**Never build SQL by string concatenation with user input.** Every value is a Dapper parameter; string-concatenating one is a SQL-injection hole and is banned.

`FromSqlRaw` / `FromSqlInterpolated` / `ExecuteSqlInterpolatedAsync` are **not used** — the DbContext is a scaffolding target only and nothing in the request path resolves it.

**Function authorship is collaborative.** Either side may write a `neondb_stp_*` function, but the database is the source of truth: check the live catalog before assuming a function's name, parameters or return type, and say so when a task needs one that doesn't exist yet. Do not write business logic in C# that belongs in a function, and do not silently invent a function name.

### 4.4 Async all the way
Every data-access and controller method is `async` and takes a `CancellationToken`. No `.Result`, no `.Wait()`, no `async void`.

### 4.5 DTOs cross the boundary, entities do not
Controllers accept and return DTOs, never raw entities. This keeps the database shape from leaking into the API contract the React Native team depends on.

DTOs are **plain classes with `{ get; set; }` properties**, not records, and live in `Models/Dtos/`. Construct them with object initializers (`new UserResponse { Id = ..., }`), never positionally. Computed members stay expression-bodied and read-only (`PagedResult.TotalPages`); defaults are declared on the property (`PaginationQuery.PageSize = 25`).

Classes rather than records because these types are mutated during mapping, bound from query strings by the MVC model binder, and read by a React Native client that cares about the JSON shape and nothing about value equality.

### 4.6 Nothing secret in the repo
The real connection string lives in **`src/TaskDira.Api/appsettings.Local.json`**, which is gitignored. `appsettings.json` is committed and carries an empty-string placeholder, so a missing value fails fast at startup with a clear message. In deployment the value comes from an environment variable instead; `appsettings.Local.json` is loaded `optional: true` and simply won't exist there.

If you find a secret committed anywhere, stop and report it.

---

## 5. Security invariants — checked on every change

The app is multi-tenant: many households share one database. These rules are what keep one household from seeing another's data. They are the most important correctness properties in the project.

1. **Household scoping.** Every query for household data is filtered by the household the authenticated user actually belongs to — taken from their verified membership, never trusted from a route parameter or request body alone. This check lives in the function's parameters (it joins `householdmembers`) plus a membership check in the service. Both halves are required: a function that ignores the caller leaks every tenant's data no matter how careful the service is.
2. **No IDOR (broken object-level authorization).** Before acting on any entity ID that came from the client, verify the caller is allowed to touch that entity's household. A repository call like "get task by id" is a data leak if the service didn't first confirm the caller belongs to that task's household.
3. **Task status transitions are validated in the service**, against an explicit state machine (`ToDo → InProgress → Done`, plus defined reversals). `tasks.status` is a free-text column in the DB, so nothing but service-layer code stops an invalid value — that code must exist.
4. **Points are awarded through the ledger** (physical table `pointsleader`, C# class `PointsLedgerEntry`), one append-only row per award. A balance is always the sum of its entries, scoped to the household — never a stored running total.
5. **404 over 403 for cross-household access.** Do not confirm that a resource exists in a household the caller can't see.

---

## 6. The database (already exists)

The schema is already created in PostgreSQL. Column names are **lowercase, unquoted** (`householdid`, `pointsvalue`, `createdat`). Schema changes happen in the database first, then re-scaffold — never the other way round.

Entities are **flat POCOs**: scalar columns only, `int` primary keys, no `ICollection<>` navigation collections and no reference navigations. Relationships are not modelled in C# at all — a repository returns exactly the rows its procedure returned, and anything that needs data from two tables gets a procedure that joins them. `TaskDiraDbContext.OnModelCreating` therefore carries table names, column names and keys (including the `householdmembers` composite key) but **no** `HasMany`/`WithOne` configuration.

`tasks` maps to the entity `ChoreTask`, not `Task`, to avoid colliding with `System.Threading.Tasks.Task` in every async signature. `householdinfo` maps to `Household`.

All PKs are `SERIAL` (int). Nullability below is what the database actually reports — it was verified by scaffolding, not assumed.

| Table | Columns | C# class |
|---|---|---|
| **users** | id, fullname, email UNIQUE, passwordhash, avatarstate (default `'neutral'`), createdat | `User` |
| **categories** | id, name, description — **global, not per-household** | `Category` |
| **householdinfo** | id, name, **adminuserid NOT NULL** → users, createdat | `Household` |
| **householdmembers** | (householdid, userid) composite PK, role, joinedat | `HouseholdMember` |
| **tasks** | id, householdid, title, description, categoryid, pointsvalue (default 0), assigneduserid, status (default `'ToDo'`), duedate, proofimageurl | `ChoreTask`, `[Table("tasks")]` |
| **tasksubitems** | id, taskid → tasks ON DELETE CASCADE, itemtext, iscompleted (default false) | `TaskSubItem` |
| **pointsleader** | id, userid, **taskid NOT NULL**, pointsearned, earnedat — append-only | `PointsLedgerEntry` |
| **rewards** | id, title, requiredpoints, claimedbyuserid, **householdid NULLABLE** | `Reward` |
| **monthlyleaderboard** | id, householdid, userid, month, year, totalpoints (default 0), rank | `MonthlyLeaderboardEntry` |

Two classes are deliberately renamed away from their table: `tasks` → **`ChoreTask`** (so it doesn't collide with `System.Threading.Tasks.Task` in every async signature — the scaffolder's own output doesn't compile for this reason), and `householdinfo` → **`Household`**.

### Known schema quirks — deferred, do not "fix" in passing

- **The ledger table is physically named `pointsleader`.** Every constraint on it is still named `pointsledger_*` (`pointsledger_pkey`, `nextval('pointsledger_id_seq')`), so it was created as *ledger* and renamed to *leader* by accident. Code maps to `pointsleader`; the C# class stays `PointsLedgerEntry`. Changing this means renaming in the database first, then re-scaffolding.
- **Timestamps are plain `timestamp`, not `timestamptz`.** `createdat`, `joinedat`, `duedate`, `earnedat` all carry no time zone.
- **`rewards.householdid` is nullable** — the only nullable household column in the schema. A reward with no household cannot be scoped to a caller, so the service treats it as **invisible** (fail-closed) rather than visible to everyone.

Note what is **not** here: no roles table (role is a column on `householdmembers`), no recurrence, no notifications, no activity log, no expenses, no scoring periods, no badges, no refresh tokens. See `docs/spec.md` §8 — those are explicitly out of scope, not pending work. Don't build against tables that don't exist.

---

## 7. API conventions

- Routes: plural nouns. Collections hang off their parent (`/api/households/{householdId}/tasks`); single entities are flat (`/api/tasks/{id}`).
- Verbs only for non-CRUD actions: `PUT /api/tasks/{id}/status`, `POST /api/rewards/{id}/claim`.
- Status codes: 200 read, 201 + Location on create, 204 on delete, 400 validation, 401 unauthenticated, 403 permitted-but-forbidden, 404 not found or not visible, 409 state conflict.
- Every list endpoint is paginated (page/size, clamped in the service by `Pagination.Normalize`). No unbounded lists.
- Controllers are thin. If a controller action is more than a few lines, logic has leaked out of the service.

**Every verb attribute carries a descriptive, entity-qualified route `Name`** — `[HttpGet("{id:int}", Name = "GetTaskById")]`, never a bare `GetById`. Route names must be unique across the whole app; duplicates throw at runtime, not compile time, so a green build proves nothing here.

**No `[ProducesResponseType]` attributes.** The generated OpenAPI document therefore describes only each action's success type. The other statuses are still returned; they are simply not documented.

Do not rename a C# action method to match a route name — `CreatedAtAction(nameof(...))` resolves by method name and will break.

---

## 8. Code style

- C# 12+, file-scoped namespaces, nullable reference types enabled.
- Guard clauses and early returns over deep nesting.
- **The codebase is comment-free.** No `//` explanations, no `///` XML doc blocks. Names and structure carry the meaning; anything that genuinely needs prose belongs in this file or `docs/spec.md`, not in a source file. Do not add comments to existing code, and do not reintroduce them when editing.
- No commented-out code — git history is the archive.

---

## 9. Testing

- A feature is not done without tests.
- Service logic (state machine, membership checks, scoring rules) is unit-tested — these are the rules that matter.
- Test names describe behaviour: `Complete_ReturnsConflict_WhenTaskAlreadyDone`.

Before any handoff, run and confirm green:

```bash
dotnet build
dotnet test
```

---

## 10. Git

- Work only inside `Backend/`. Never commit `Frontend/` changes.
- Branch names: `feat/tasks-claim`, `fix/leaderboard-rank`.
- One feature per commit/PR. Small diffs.
- `.gitignore` must exclude `bin/`, `obj/`, and any secrets. Confirm before the first push.

---

## 11. The three-agent workflow (not yet in use)

Wiring the first repository (Users, end to end) is being done in plain Claude Code so the pattern can be seen and steered. Once that slice is the working template, the planner / implementer / reviewer agents in `.claude/agents/` take over the repetitive slices. Until then, those agents are defined but idle.

When the agents are activated, the loop is: planner writes one numbered task with observable acceptance criteria → implementer builds exactly that one task with tests and a green build → reviewer checks it against the criteria and the section 5 invariants. The reviewer reports; it does not rewrite.

---

## 12. Current state

<!-- Keep this updated — it is the first thing every session reads. -->

- **Phase:** full 3-layer skeleton for all 9 entities, connected to a live Neon database, building clean (0 warnings, 0 errors). Repository wiring has not started.
- **Done:**
  - `Backend/.gitignore`; pinned local tool manifest (`.config/dotnet-tools.json`, `dotnet-ef 9.0.13`); first push to `origin` done
  - Connection config: `appsettings.Local.json` (gitignored) overriding a committed empty placeholder, with fail-fast startup
  - 9 entities **scaffolded from Neon** and reconciled to flat POCOs; `TaskDiraDbContext` (scaffolding only); `IDbConnectionFactory` / `NpgsqlConnectionFactory`
  - 9 repositories, 9 services, 9 controllers, all Scoped; every endpoint has a unique route `Name`; no `[ProducesResponseType]`
  - Service-layer rules that need no database: the `ChoreTask` state machine, pagination clamp, household membership / IDOR checks, role checks
  - Swagger UI at `/swagger` in Development, over the built-in OpenAPI document
  - **55 `neondb_stp_*` functions live in Neon**, verified against the repository interfaces
- **Known gaps — these are real, do not assume otherwise:**
  - **No repository is wired.** All 53 repository methods still throw `NotImplementedException`. Nothing works end to end.
  - **No authentication.** `ApiControllerBase.TryGetCallerUserId` reads a `NameIdentifier` claim that nothing populates, so every household-scoped endpoint returns 401. It fails closed, which is the correct default until JWT lands. Only `/api/users` and `/api/categories` are reachable.
  - **No exception handler.** Service `ArgumentException` / `InvalidOperationException` surface as **500s**, not 400/409. Section 7's status-code table is the target, not the current behaviour.
  - **No password hashing** — no hashing package chosen, so user creation throws.
  - **No tests.** `tests/TaskDira.Tests` holds only the empty template. Section 9 is currently unmet; the pagination clamp and status state machine are testable today with no database.
  - **`neondb_stp_insert_household` does not add the creator to `householdmembers`** — it writes only the `householdinfo` row. Until the function or the service adds the membership row, the creator is locked out of the household they just made (every membership check reads `householdmembers`).
  - **The leaderboard has no populating step.** Nothing writes to `monthlyleaderboard`; it will return zero rows.
  - `neondb_stp_get_points_ledger_entry_by_id` does not exist, so `IPointsLedgerRepository.GetByIdAsync` cannot be wired. No service calls it today.
  - `neondb_stp_is_household_member` exists but is unused — services read the member row for `.Role`.
  - All tables are currently **empty**.
- **Next:** wire repositories to the functions via Dapper, one entity at a time, starting with User.
