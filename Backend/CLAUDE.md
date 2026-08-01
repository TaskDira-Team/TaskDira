# CLAUDE.md — TaskDira Backend

**Read this file completely before doing anything in this repository.**

This is the shared source of truth for how the TaskDira backend is built. When a rule here conflicts with a task instruction, the rule wins — flag the conflict instead of silently choosing.

---

## 1. What this project is

TaskDira is a gamified household chore management app. This repository folder (`Backend/`) is the **backend only**: an ASP.NET Core Web API over PostgreSQL, consumed by a React Native client built by a separate team that lives in the sibling `Frontend/` folder.

**Never** touch anything in `Frontend/`. **Never** add UI code, Razor pages, or client assets here. The only deliverable is a JSON API.

The full functional specification lives in `docs/spec.md`. It describes the eventual product; not all of it is built yet. The database schema in section 6 below is the real, current scope — build against that, not against features in the spec that have no tables.

---

## 2. Stack — fixed, do not substitute

| Concern | Choice |
|---|---|
| Runtime | .NET 9 |
| API | ASP.NET Core Web API, **controller-based** |
| Data access | **Dapper** over hand-written stored procedures |
| Schema tooling | EF Core 9 + Npgsql — **scaffolding only**, never in the request path |
| Database | PostgreSQL (hosted) |
| Secrets | .NET user-secrets in development. **Never commit a connection string.** |
| Tests | xUnit |

**Package versions must match the target framework.** This project is .NET 9, so every NuGet package is pinned to its latest `9.x` version — never the floating latest, which now resolves to 10.x and breaks the build. Always install with an explicit `--version 9.x.y`.

Adding a NuGet package not already in the project requires a clear reason stated in the task. Do not add one on your own initiative.

---

## 3. Architecture — layered, this exact shape

The architecture is classic layered N-tier. Every request flows in one direction:

```
Controller  →  Service  →  Repository  →  PostgreSQL (stored procedures)
```

- **Controller** — HTTP only. Model binding, calling the service, returning the right status code. No business logic, no data access.
- **Service** — business logic. Orchestrates repositories, enforces rules (e.g. the task state machine, household membership checks). Knows nothing about HTTP or SQL.
- **Repository** — data access only. Calls the database's **stored procedures** via Dapper, on a connection taken from `IDbConnectionFactory`, and maps the results. No business logic. A repository never takes the DbContext.

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
Services and repositories are registered **Scoped** (one instance per HTTP request). Never singleton — a singleton holding a DbContext breaks under concurrent requests, and two roommates hitting the API at once would corrupt each other's data. The DbContext itself is Scoped (the EF Core default via `AddDbContext`).

### 4.3 Stored procedures via Dapper, not LINQ and not EF
Business data access goes through **stored procedures written by hand in the database** — not LINQ, not EF query building.

Every repository takes `IDbConnectionFactory` in its constructor, never `TaskDiraDbContext`. A method opens a connection from the factory and makes exactly one Dapper call against a procedure:

- reads → `QueryAsync` / `QueryFirstOrDefaultAsync` / `ExecuteScalarAsync`
- writes → `ExecuteAsync`
- always `CommandType.StoredProcedure`, and always `await using` on the connection

**Never build SQL by string concatenation with user input.** Every value is a Dapper parameter (`new { id }`); string-concatenating one is a SQL-injection hole and is banned.

`FromSqlRaw` / `FromSqlInterpolated` / `ExecuteSqlInterpolatedAsync` are **no longer used** — the DbContext is a scaffolding target only and nothing in the request path resolves it.

Do not write new business logic in C# that belongs in a procedure, and do not invent procedures — if a task needs a procedure that doesn't exist yet, stop and say so. Rafael writes the procedures.

### 4.4 Async all the way
Every data-access and controller method is `async` and takes a `CancellationToken`. No `.Result`, no `.Wait()`, no `async void`.

### 4.5 DTOs cross the boundary, entities do not
Controllers accept and return DTOs, never raw entities. This keeps the database shape from leaking into the API contract the React Native team depends on.

DTOs are **plain classes with `{ get; set; }` properties**, not records, and live in `Models/Dtos/`. Construct them with object initializers (`new UserResponse { Id = ..., }`), never positionally. Computed members stay expression-bodied and read-only (`PagedResult.TotalPages`); defaults are declared on the property (`PaginationQuery.PageSize = 25`).

Classes rather than records because these types are mutated during mapping, bound from query strings by the MVC model binder, and read by a React Native client that cares about the JSON shape and nothing about value equality.

### 4.6 Nothing secret in the repo
Connection strings and passwords live in user-secrets locally and environment variables in deployment. If you find a secret committed anywhere, stop and report it.

---

## 5. Security invariants — checked on every change

The app is multi-tenant: many households share one database. These rules are what keep one household from seeing another's data. They are the most important correctness properties in the project.

1. **Household scoping.** Every query for household data is filtered by the household the authenticated user actually belongs to — taken from their verified membership, never trusted from a route parameter or request body alone. This check usually lives in the stored procedure's parameters plus a membership check in the service.
2. **No IDOR (broken object-level authorization).** Before acting on any entity ID that came from the client, verify the caller is allowed to touch that entity's household. A repository call like "get task by id" is a data leak if the service didn't first confirm the caller belongs to that task's household.
3. **Task status transitions are validated in the service**, against an explicit state machine (`ToDo → InProgress → Done`, plus defined reversals). `tasks.status` is a free-text column in the DB, so nothing but service-layer code stops an invalid value — that code must exist.
4. **Points are awarded through the ledger** (`pointsledger`), one row per award. Never silently overwrite a running total.
5. **404 over 403 for cross-household access.** Do not confirm that a resource exists in a household the caller can't see.

---

## 6. The database (already exists)

The schema is already created in PostgreSQL. Column names are **lowercase, unquoted** (`householdid`, `pointsvalue`, `createdat`). Schema changes happen in the database first, then re-scaffold — never the other way round.

Entities are **flat POCOs**: scalar columns only, `int` primary keys, no `ICollection<>` navigation collections and no reference navigations. Relationships are not modelled in C# at all — a repository returns exactly the rows its procedure returned, and anything that needs data from two tables gets a procedure that joins them. `TaskDiraDbContext.OnModelCreating` therefore carries table names, column names and keys (including the `householdmembers` composite key) but **no** `HasMany`/`WithOne` configuration.

`tasks` maps to the entity `ChoreTask`, not `Task`, to avoid colliding with `System.Threading.Tasks.Task` in every async signature. `householdinfo` maps to `Household`.

Tables:

- **users** — id, fullname, email (unique), passwordhash, avatarstate (default 'neutral'), createdat
- **categories** — id, name, description
- **householdinfo** — id, name, adminuserid → users, createdat
- **householdmembers** — (householdid, userid) composite PK, role, joinedat; FKs to householdinfo and users
- **tasks** — id, householdid, title, description, categoryid, pointsvalue (default 0), assigneduserid, status (default 'ToDo'), duedate, proofimageurl; FKs to households, categories, users
- **tasksubitems** — id, taskid → tasks (ON DELETE CASCADE), itemtext, iscompleted (default false)
- **pointsledger** — id, userid, taskid, pointsearned, earnedat; FKs to users and tasks
- **rewards** — id, title, requiredpoints, claimedbyuserid, householdid; FKs to users and households
- **monthlyleaderboard** — id, householdid, userid, month, year, totalpoints (default 0), rank; FKs to households and users

Note what is **not** here: no separate roles table (role is a column on `householdmembers`), no recurrence, no notifications tables, no activity log, no expenses. Those are future spec items, not current work. Don't build against tables that don't exist.

---

## 7. API conventions

- Routes: `/api/households/{householdId}/tasks`, plural nouns.
- Verbs only for non-CRUD actions: `/api/tasks/{id}/claim`, `/complete`.
- Status codes: 200 read, 201 + Location on create, 204 on delete, 400 validation, 401 unauthenticated, 403 permitted-but-forbidden, 404 not found or not visible, 409 state conflict.
- Every list endpoint is paginated. No unbounded lists.
- Controllers are thin. If a controller action is more than a few lines, logic has leaked out of the service.

---

## 8. Code style

- C# 12+, file-scoped namespaces, nullable reference types enabled.
- Guard clauses and early returns over deep nesting.
- Comments explain *why*, not *what*.
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

Building the first vertical slice (Users, end to end) is being done in plain Claude Code so the pattern can be seen and steered. Once that slice is the working template, the planner / implementer / reviewer agents in `.claude/agents/` take over the repetitive slices. Until then, those agents are defined but idle.

When the agents are activated, the loop is: planner writes one numbered task with observable acceptance criteria → implementer builds exactly that one task with tests and a green build → reviewer checks it against the criteria and the section 5 invariants. The reviewer reports; it does not rewrite.

---

## 12. Current state

<!-- Keep this updated — it is the first thing every session reads. -->

- **Phase:** full 3-layer skeleton exists for all 9 entities and builds clean (0 warnings, 0 errors). No database has been connected yet.
- **Done:**
  - `Backend/.gitignore` and a pinned local tool manifest (`.config/dotnet-tools.json`, `dotnet-ef 9.0.13`)
  - 9 flat entity POCOs, `TaskDiraDbContext`, `IDbConnectionFactory` / `NpgsqlConnectionFactory`
  - 9 repositories, 9 services, 9 controllers, all registered Scoped
  - Service-layer rules that need no database: the `ChoreTask` state machine, pagination clamp, household membership / IDOR checks, role checks
- **Temporary, and known:**
  - Entities are **hand-written stubs**, each marked `// TEMPORARY hand-written stub`. Replace by scaffolding once the DB is connected. Column types, nullability and `int` PKs are best guesses from section 6.
  - Every repository method throws `NotImplementedException` — the stored procedures do not exist yet. Nothing works end to end.
  - No password hashing (no hashing package chosen), so user creation throws.
  - No authentication. `ApiControllerBase.TryGetCallerUserId` reads a `NameIdentifier` claim that nothing populates, so every household-scoped endpoint returns 401. This fails closed and is the correct default until JWT lands.
  - Service validation throws `ArgumentException` / `InvalidOperationException`, which currently surface as **500s**. They become 400/409 once a `ProblemDetails` exception handler is registered.
- **Next:** set the connection string in user-secrets → re-scaffold entities over the stubs → write the stored procedures → replace the `NotImplementedException` bodies with Dapper calls, slice by slice.
- **Not started:** tests (section 9 is currently unmet), auth, password hashing, error-to-status mapping.
