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
| Database | PostgreSQL on **Railway** (host in `appsettings.Local.json`). Migrated off Neon; the `neondb_stp_*` function prefix is historical and stays — renaming 60 functions buys nothing |
| Connection | `NpgsqlDataSource` → `IDbConnectionFactory` |
| Auth | opaque bearer token + server-side `sessions` table. **Not JWT** |
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
Controller  →  Service  →  Repository  →  SQL function (neondb_stp_*)  →  table
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

### 4.3 Dapper over SQL functions — not LINQ, not EF at runtime
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
| **sessions** | id, userid → users ON DELETE CASCADE, tokenhash UNIQUE, createdat, expiresat | `Session` |

Two classes are deliberately renamed away from their table: `tasks` → **`ChoreTask`** (so it doesn't collide with `System.Threading.Tasks.Task` in every async signature — the scaffolder's own output doesn't compile for this reason), and `householdinfo` → **`Household`**.

### Known schema quirks — deferred, do not "fix" in passing

- **The ledger table is physically named `pointsleader`.** Every original constraint on it is still named `pointsledger_*` (`pointsledger_pkey`, `nextval('pointsledger_id_seq')`), so it was created as *ledger* and renamed to *leader* by accident. Code maps to `pointsleader`; the C# class stays `PointsLedgerEntry`. Changing this means renaming in the database first, then re-scaffolding.
- **`pointsleader` carries mixed constraint prefixes, and this is not a bug.** Historical `pointsledger_*` (pkey, both FKs, the id sequence) sit alongside constraints added in migration 004, which use the correct `pointsleader_*`: `pointsleader_householdid_fkey`, `pointsleader_pointsearned_nonzero`, `pointsleader_task_or_reward`, plus the index `ux_pointsleader_task_earn`. Both sets are live and correct. Do not "tidy" one into the other without renaming in the database first.
- **`pointsleader.taskid` is nullable** as of migration 004. An earn row carries `taskid`; a spend row carries `rewardid` with a null `taskid`. `CHECK (taskid IS NOT NULL OR rewardid IS NOT NULL)` guarantees at least one. The partial index `ux_pointsleader_task_earn ON (taskid) WHERE pointsearned > 0` is what enforces one earn per task — the duplicate-award guard lives in the database, not the client.
- **`users.avatarstate` is `jsonb`** (migration 004), not `varchar(50)`. Npgsql maps it to `string` in both directions, so the POCO stays `string?` and functions take a `text` parameter cast with `::jsonb`. The old 50-character limit silently rejected real avatar payloads.
- **Timestamps are plain `timestamp`, not `timestamptz`.** `createdat`, `joinedat`, `duedate`, `earnedat`, `expiresat` all carry no time zone. **This has bitten twice.** Npgsql maps a `DateTime` with `Kind == Utc` to `timestamptz`, and Postgres then reports `42883: function ... does not exist` because no overload matches. Any repository passing a `DateTime` into one of these parameters must first call `DateTime.SpecifyKind(value, DateTimeKind.Unspecified)` — see `SessionRepository.InsertAsync` and `ChoreTaskRepository.ToTimestamp`. A browser sending `new Date().toISOString()` always carries `Z`, so this is not a rare edge case.
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

Repository wiring was done in plain Claude Code so the pattern could be seen and steered; that work is complete and now serves as the template. The planner / implementer / reviewer agents in `.claude/agents/` remain defined but idle.

When the agents are activated, the loop is: planner writes one numbered task with observable acceptance criteria → implementer builds exactly that one task with tests and a green build → reviewer checks it against the criteria and the section 5 invariants. The reviewer reports; it does not rewrite.

---

## 12. Current state

<!-- Keep this updated — it is the first thing every session reads. -->

- **Phase:** working end to end. Backend builds clean (0 warnings, 0 errors), **27 xUnit tests pass**, and the React frontend runs against the real API for five domains. The database is **Railway**, not Neon.
- **Done:**
  - `Backend/.gitignore`; pinned local tool manifest (`.config/dotnet-tools.json`, `dotnet-ef 9.0.13`); first push to `origin` done
  - Connection config: `appsettings.Local.json` (gitignored) overriding a committed empty placeholder, with fail-fast startup
  - 9 entities scaffolded and reconciled to flat POCOs, plus a hand-written `Session`; `TaskDiraDbContext` (scaffolding only); `IDbConnectionFactory` / `NpgsqlConnectionFactory`
  - 9 repositories, 9 services, 9 controllers, all Scoped; every endpoint has a unique route `Name`; no `[ProducesResponseType]`
  - **All repositories are wired** to `neondb_stp_*` functions via Dapper. No `NotImplementedException` remains.
  - **Authentication is live** — opaque bearer tokens over a server-side `sessions` table (see below)
  - `GlobalExceptionHandler` maps `ArgumentException` → **400** and `InvalidOperationException` → **409**
  - Password hashing via `IPasswordHasher<User>` (`Microsoft.AspNetCore.Identity`), registered Scoped
  - `GET /health` — unauthenticated, executes `neondb_stp_count_categories()` for a real DB round trip; 200 healthy / 503 unhealthy
  - CORS policy for the frontend dev origin (**`http://localhost:3000`** — the Vite config uses `port: 3000, strictPort: true`, not 5173). Override with `Cors:AllowedOrigins`.
  - Swagger UI at `/swagger` in Development, over the built-in OpenAPI document
  - **62 `neondb_stp_*` functions live** across **10 tables**, verified against the repository interfaces (55 original + 4 session + 1 ledger-count + 2 points-model)

### 12.1 Authentication (built — opaque token, not JWT)

| Endpoint | Behaviour |
|---|---|
| `POST /api/auth/register` | atomic-ish user + household + admin membership, returns a session. Reuses `neondb_stp_insert_household_with_admin` |
| `POST /api/auth/login` | 200 with token, or **401** on unknown email *or* wrong password (deliberately indistinguishable) |
| `POST /api/auth/logout` | 204, deletes that one session |

- Token: 32 random bytes, Base64Url (~43 chars). **Only its SHA-256 hex hash is stored** — never the raw token. A leaked `sessions` table yields nothing usable.
- Clients send `Authorization: Bearer <token>`. Sessions last **30 days**, no sliding renewal.
- `SessionAuthenticationMiddleware` validates the token and sets the `NameIdentifier` claim, so **`ApiControllerBase.TryGetCallerUserId` is now real** and all 9 controllers unblocked with no edits. A request with no header passes through anonymous (endpoints still 401); a present-but-invalid token short-circuits to 401.
- Expiry is checked in the **service** against `DateTime.UtcNow`, not by the database; an expired row is deleted lazily on use.

### 12.2 Migrations — run these against Railway by hand

`db/migrations/` is applied manually; there is no migration runner. All are idempotent, and **all three are already applied to Railway** (verified against the live catalog).

| File | Purpose |
|---|---|
| `001_sessions.sql` | `sessions` table + 4 functions (insert / get-by-hash / delete-by-hash / delete-expired) |
| `002_seed_categories.sql` | 11 global categories. `description` holds the frontend's stable key (`kitchen`, `other`), `name` the Hebrew label — this pairing **is** the category mapping |
| `003_count_points_ledger_for_task.sql` | `neondb_stp_count_points_ledger_for_task`, used to block deleting a task that has awarded points |
| `004_column_gaps_and_points_model.sql` | closes every column gap (see §6) and reshapes `pointsleader` for the dual-counter model |
| `005_points_model_functions.sql` | 9 DROP+recreate signature changes, 3 semantics rewrites, and 2 new functions |

### 12.2.1 The points model — dual counter

The ledger is append-only. An **earn** is a positive row carrying `taskid`; a **spend** is a negative row carrying `rewardid`. Two readings come off the same rows:

- **XP / lifetime score** — `neondb_stp_get_user_points_total` sums **positive rows only**, so redeeming a reward can never lower a leaderboard position.
- **Balance / wallet** — `neondb_stp_get_user_points_balance` sums **all rows**, so it is earns minus spends.

`rewards.requiredpoints` is the **XP threshold** that unlocks a reward; `rewards.cost` is the **balance price** paid for it. They are backfilled equal, so they only diverge once someone edits a reward. `neondb_stp_insert_points_spend` refuses to write when the balance is short (returns zero rows), and `RewardService.ClaimAsync` turns that into a 409.

**Any future function that sums or joins `pointsleader` must scope by `pointsleader.householdid` directly** — never through `tasks`, because a spend row has no task and an inner join silently discards it.

### 12.3 Open items — real, not speculative

**Closed by migrations 004/005 and the Phase 1 backend work** — all column gaps now have real columns, the points-spend model exists, the double-award guard is a database constraint, and admin-only actions return 403 (`UnauthorizedAccessException` → 403 in `GlobalExceptionHandler`) while cross-household access still returns 404.

**Still open:**
  - **A reward can be claimed once, ever, by one person** — `claimedbyuserid` is a single nullable column. No recurring or per-member rewards without a redemptions table.
  - **Claim ordering has a narrow race.** `ClaimAsync` runs verify → spend → claim. If two members claim the same reward simultaneously, both may write a debit while only one wins the CAS, leaving the loser debited for a reward they did not get. Closing this needs a refund function (a positive row carrying `rewardid`), which no function currently writes.
  - **`PendingApproval` is not a backend status.** `ChoreTaskStatus` knows only ToDo / InProgress / Done, and the machine forbids ToDo → Done directly, so the client walks it through InProgress. The whole proof/approval flow is still client-side mock. `tasks.approvedbyid` and `tasks.rejectedreason` exist but are deliberately never written until it lands.
  - **The leaderboard has no populating step.** Nothing writes to `monthlyleaderboard`; it returns zero rows. The frontend computes the board from members + real ledger totals instead. Whatever eventually populates it **must use the positive-only XP sum**, or spends leak into rankings.
  - **No streak storage**; streaks are computed client-side and do not persist.
  - `neondb_stp_is_household_member` exists but is unused — services read the member row for `.Role`.
  - **Frontend is one phase behind.** `services/` still reads XP where it means balance, and still carries the client-side double-award guard. Phase 2 closes this.

### 12.4 Frontend integration (context, not a licence to edit `Frontend/`)

The sibling app is **React 19 + Vite (web)** — plain JSX, no TypeScript. Its `services/` layer talks to this API behind per-domain flags in `services/config.js`: **auth, users, households, tasks and rewards are all live**; the proof flow, achievements, streaks, notifications, the assistant bot and monthly rollover remain mock because no backend supports them. Changes to DTO shapes or status codes break it — check `services/*Remote.js` before altering a contract.

- **Next:** decide the points-spend model and the `familyrole` column (both block the gamification UX), then extend the state machine for the proof pipeline.
