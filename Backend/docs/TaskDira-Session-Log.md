# TaskDira — Session Log & Handoff

A complete record of this working session. Paste it at the start of a new chat to resume with full context. Structured by what was decided and done, in order, then current state and next steps.

---

## The project (unchanged baseline)

**TaskDira** — a gamified household chore-management app (team academic project). Rafael does the **backend only**; teammates Ofek and Amit do the React Native frontend.

- Stack: **.NET 9 Web API + PostgreSQL on Neon** (the earlier handoff guessed Supabase — it is actually **Neon**).
- Repo: `github.com/ofeknissim/TaskDira`, top-level `Backend/` and `Frontend/`. Rafael works only in `Backend/`, cloned to `C:\Dev\TaskDira`.
- Architecture: classic **layered N-tier**, one API project: **Controller → Service → Repository → Postgres stored procedures**. Not Clean Architecture, not vertical slices.

---

## What happened this session, in order

### 1. Code-style conventions changed (applied project-wide via Claude Code)
- **DTOs are plain classes, not `record`s.**
- **Entities are flat POCOs** — all EF `ICollection<>` navigation properties removed.
- **Repositories inject a DB connection, not the DbContext** — via an `IDbConnectionFactory` (interface + `NpgsqlConnectionFactory` impl in one file) wrapping `NpgsqlDataSource`. This factory was later reviewed and **kept** (it fits the interface-plus-impl convention and reserves a per-connection seam).

### 2. Database connected (Neon)
- Discovered the DB is **Neon**, not Supabase.
- Connection string stored in **`appsettings.Local.json`** (gitignored); `appsettings.json` holds an empty placeholder; `Program.cs` loads the Local file via `AddJsonFile` and fail-fasts if the string is missing. (`user-secrets` was abandoned as the store; only one source of truth.)
- Used Neon's **direct / unpooled** connection for scaffolding (Connection pooling toggled OFF → no `-pooler` in host), `SSL Mode=Require;Channel Binding=Require`, no `Trust Server Certificate` (Neon has valid certs). Neon compute is scale-to-zero, so first connect wakes it.
- Verified with `dotnet dotnet-ef dbcontext info` → clean connect to `neondb`.

### 3. Scaffolded 9 entities from the live DB
- Build clean; `householdmembers` composite PK confirmed.
- Scaffolder corrected 3 guessed types: `householdinfo.adminuserid` is **NOT NULL**, `pointsledger.taskid` is **NOT NULL**, `rewards.householdid` is **NULLABLE**. Services adjusted accordingly.
- 3 live-schema findings **deferred (no SQL changes for now)**: timestamps are plain `timestamp` (not `timestamptz`); `rewards.householdid` nullable; the points table is physically named **`pointsleader`** (its constraints all say `pointsledger` — accidental rename). Entity maps to `pointsleader`; class stays `PointsLedgerEntry`.

### 4. Controller cleanup (project-wide)
- Removed **all `[ProducesResponseType]`** attributes.
- Added a descriptive, entity-qualified **route `Name`** to every HTTP verb (e.g. `GetCategoryById`, `DeleteTask`) — 42 total, all unique.
- **CancellationTokens kept** (real cancellation plumbing, not clutter).

### 5. Removed all comments project-wide
- Every XML `///` doc block and every `//` / `/* */` comment gone. URLs/strings and preprocessor directives preserved.

### 6. Scalar API UI
- .NET 9 dropped the built-in Swagger UI; only `/openapi/v1.json` is served. Added **Scalar** (`Scalar.AspNetCore`, `MapScalarApiReference()`) for a real UI. Confirmed rendering all 42 endpoints.

### 7. Stored procedures authored
- **Reversed the earlier rule** that only Rafael writes procs — they were drafted collaboratively.
- Naming: **`neondb_stp_<snake_case_action>`**.
- Implemented as Postgres **FUNCTIONS**, not `CREATE PROCEDURE` — because true Postgres procedures can't return result sets to a query. Reads `RETURN SETOF <table>`; called via `SELECT * FROM neondb_stp_x(...)` with Dapper and **`CommandType.Text`** (never `CommandType.StoredProcedure`, which emits `CALL` and fails on a function).
- 52 functions pasted into Neon; `pg_proc` self-test confirmed all 52 registered.

### 8. First real git push
- Pushed the whole backend skeleton to `ofeknissim/TaskDira` as `rafaolaru` (after Ofek granted collaborator access — an initial 403 was a permissions grant, not a setup problem). `.gitignore` verified: `appsettings.Local.json` stays out.

### 9. PROJECT_MAP.md ("graphify")
- A Mermaid project map (request-flow graph, data-model ER graph, file tree, status) for Claude Code and teammates to orient fast.

### 10. Step 1 verification of procs vs repositories
Claude Code diffed the 52 procs against the real repository interfaces (against the live Neon catalog). Findings:
- **2 missing procs:** ledger `GetById`; leaderboard `Count`.
- **5 signature mismatches:** households page/count not scoped to caller (leak); user points total not scoped by household (cross-household spending); leaderboard missing pagination; task-status proc erasing `proofimageurl`.
- **1 dead proc:** `is_household_member` (unused — services read the whole member row for `.Role`).
- **Household-creator lockout:** creating a household never adds the creator to `householdmembers` → creator gets 404 on their own household.
- **Leaderboard unpopulated:** nothing writes to `monthlyleaderboard`.
- User, Category, TaskSubItem procs were **clean**.

### 11. Fix patch produced (this is the current action item)
All fixes merged into one runnable SQL block (`DO-THIS-NOW-procedure-fixes.md`), decisions pre-made: households/points scoped, leaderboard paginated + counted, task-status no longer touches proof, ledger-by-id added, and the **household-creator lockout fixed** via an atomic `neondb_stp_insert_household_with_admin` (adopted). Expected proc count after running: **55**.

---

## Current state

- Skeleton complete and pushed: 9 entities (real scaffolded types), 9 controllers (named endpoints, comment-free), 9 services, 9 repositories (**all still stubbed — every method throws `NotImplementedException`**), DbContext (scaffold-only), connection factory, global exception handler, Scalar UI.
- 52 procs live in Neon; **patch to bring them to 55 and fix mismatches is pending Rafael running it.**
- Nothing returns real data yet: repos are stubbed, and **auth is a stub** (`TryGetCallerUserId` fails closed → household-scoped endpoints 401).

## Standing conventions

- Layered N-tier; interface + impl in the same file for services and repositories; scoped lifetimes.
- DTOs are plain classes (not records) in `Models/Dtos/`; DTOs cross the controller boundary, entities never do.
- Entities are flat POCOs (no navigation collections).
- Repositories inject `IDbConnectionFactory` and use **Dapper** against `neondb_stp_*` **functions** via `SELECT * FROM ...` / `CommandType.Text`. No DbContext in repos.
- Comment-free codebase. Async + `CancellationToken` everywhere (passed via Dapper `CommandDefinition`).
- No `[ProducesResponseType]`; every endpoint has a descriptive route `Name`.
- Connection string only in gitignored `appsettings.Local.json`; Neon direct/unpooled connection.
- Security invariants (CLAUDE.md §5): household scoping via verified membership, no IDOR, task-status state machine enforced in the service, points via the ledger, 404 (not 403) for cross-household access.

## Next steps (in order)

1. **Run the procedure patch** in Neon (`DO-THIS-NOW-procedure-fixes.md`); confirm 55.
2. **Wire the User repository** first (clean, unblocked) end-to-end via Dapper, then review.
3. **Wire the remaining entities** one at a time, using the patched signatures; `HouseholdService.CreateAsync` calls `neondb_stp_insert_household_with_admin` with the app's admin-role string.
4. **Settle authentication** — the real fork. `TryGetCallerUserId` is a stub; every scoped endpoint depends on it. JWT is the consistent choice given the §5 invariants; decision also affects what the frontend sends.
5. **Populate the leaderboard** — add an aggregation proc/job (nothing writes to `monthlyleaderboard` today).
6. **Housekeeping:** rewrite the stale `docs/spec.md` (still Clean Architecture); update CLAUDE.md §4.3 (proc authorship now shared) and §6/§12 (real scaffolded types, `pointsleader` name).
7. **Activate the 3 agents** (planner/implementer/reviewer) once the manual per-entity pattern is proven.

## Deferred / known gaps

- Deferred schema (no changes for now): plain `timestamp` vs `timestamptz`; nullable `rewards.householdid`; `pointsleader` table misname.
- `is_household_member` proc exists but is unused.
- `monthlyleaderboard` has no populating step.
- `docs/spec.md` is stale.
