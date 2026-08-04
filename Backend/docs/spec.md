# TaskDira — Specification (as built)

Gamified household chore management. **This spec describes the backend that actually exists** — it supersedes the earlier aspirational draft. Where this file and `CLAUDE.md` overlap, `CLAUDE.md` is the authority for coding rules; this file is the authority for product scope and the data model.

Backend: **.NET 9 · PostgreSQL on Neon · Dapper over stored functions.** Client: React Native (Ofek, Amit). Backend: Rafael.

---

## 1. Concept

A shared app for people who share a home. It organizes recurring chores, distributes them fairly, and makes contribution visible through a points-and-rewards layer. Members belong to a **household**; tasks live in the household; completing tasks earns points; points feed a monthly leaderboard and can be spent on rewards.

---

## 2. Architecture

Classic **layered N-tier**, one API project. Not Clean Architecture, not vertical slices.

```
Controller  ->  Service  ->  Repository  ->  Neon function (neondb_stp_*)  ->  table
```

- **Controller** — HTTP only, thin; identifies the caller via `TryGetCallerUserId`.
- **Service** — business logic, household scoping, the task-status state machine, DTO↔entity mapping.
- **Repository** — one Dapper call per method to a `neondb_stp_*` **function**, via an injected `IDbConnectionFactory` (no DbContext at runtime).
- Interface + implementation live in the same file for every service and repository.

### Stack (as built)

| Concern | Choice |
|---|---|
| Runtime | .NET 9, ASP.NET Core Web API |
| Data access | **Dapper** calling PostgreSQL **functions** (`neondb_stp_*`), invoked as `SELECT * FROM ...` with `CommandType.Text` |
| EF Core | present for **scaffolding only** — not used for runtime queries |
| Database | PostgreSQL on **Neon** (direct/unpooled connection for schema work) |
| Connection | `NpgsqlDataSource` → `IDbConnectionFactory`; connection string in gitignored `appsettings.Local.json` |
| Errors | one global `IExceptionHandler` → RFC-7807 ProblemDetails (ArgumentException→400, InvalidOperationException→409) |
| API docs | Swagger UI (`/swagger`, Swashbuckle), over the built-in OpenAPI document at `/openapi/v1.json` — Development only |
| Tests | xUnit — *planned, not yet written*. `tests/TaskDira.Tests` holds only the empty template; the pagination clamp and status state machine are the first two targets |
| DTOs | plain classes (not records); DTOs cross the controller boundary, entities never do |
| Entities | flat POCOs, no navigation collections |

Conventions in full live in `CLAUDE.md`. The codebase is comment-free; async + `CancellationToken` throughout.

---

## 3. Gamification (as built)

- **Points ledger** — each award is one append-only row in the ledger (physical table `pointsleader`; C# class `PointsLedgerEntry`). A user's total is the sum of their entries, scoped to the household.
- **Avatar state** — `users.avatarstate` is a simple string column (default `neutral`); the client renders it. No computed signal engine.
- **Monthly leaderboard** — precomputed standings rows in `monthlyleaderboard` (household + month + year + totalpoints + rank). Read-only over the API. *(No populating job exists yet — see Open Items.)*
- **Rewards** — a household offers rewards with a `requiredpoints` cost; a member claims one, recorded via `claimedbyuserid`. A reward is claimable once.

---

## 4. Core features (as built)

- **Users** — create, read, update, delete; email is unique; `UserResponse` never exposes `passwordhash`.
- **Households** — create (creator becomes admin **and** a member), read, update, delete. A user can belong to multiple households; every household-scoped query is filtered by verified membership. Creation goes through `neondb_stp_insert_household_with_admin`, which writes the `householdinfo` row and the creator's `householdmembers` row in one statement, so the creator is a member the moment the household exists.
- **Household members** — list, get, add, update role, remove. Composite key `(householdid, userid)`.
- **Tasks (ChoreTask)** — CRUD plus a dedicated status transition. Fields: title, description, category, point value, assignee, status, due date, proof image URL.
- **Task sub-items** — a checklist of sub-items under a task (text + completed flag).
- **Points ledger** — award points (one row per award), list a household's ledger, read a user's household-scoped total.
- **Rewards** — CRUD plus claim.
- **Leaderboard** — read a household's standings for a month/year, and a single user's entry.

### Task status
Free-text `status` in the DB (default `ToDo`); legality is enforced **in the service** by an explicit state machine, since the DB doesn't constrain it. The status-update path changes status only — it does not touch the proof image.

---

## 5. Security invariants (enforced in services)

1. Every household query is filtered by the caller's **verified membership**, never a raw route param.
2. No IDOR — membership is checked before acting on any client-supplied ID.
3. Cross-household access returns **404, not 403**.
4. Points are awarded only through the ledger, one row per award.
5. Status transitions validated by the service state machine.

---

## 6. Data model — the real 9 tables

All PKs are `SERIAL` (int). Columns are lowercase, unquoted.

```
users              (id, fullname, email UNIQUE, passwordhash,
                    avatarstate DEFAULT 'neutral', createdat)

categories         (id, name, description)                 -- global, not per-household

householdinfo      (id, name, adminuserid -> users NOT NULL, createdat)

householdmembers   (householdid, userid) PK, role, joinedat

tasks              (id, householdid, title, description, categoryid,
                    pointsvalue DEFAULT 0, assigneduserid,
                    status DEFAULT 'ToDo', duedate, proofimageurl)
                    -- C# class ChoreTask, [Table("tasks")]

tasksubitems       (id, taskid -> tasks CASCADE, itemtext,
                    iscompleted DEFAULT false)

pointsleader       (id, userid, taskid NOT NULL, pointsearned, earnedat)
                    -- append-only ledger; C# class PointsLedgerEntry

rewards            (id, title, requiredpoints, claimedbyuserid,
                    householdid NULLABLE)

monthlyleaderboard (id, householdid, userid, month, year,
                    totalpoints DEFAULT 0, rank)
```

### Known schema quirks (deferred — no changes for now)
- Timestamps are plain `timestamp` (not `timestamptz`).
- `rewards.householdid` is nullable — a null-household reward is treated as invisible (fail-closed) by the service.
- The ledger table is physically named **`pointsleader`** (its constraints all say `pointsledger` — an accidental rename). Code maps to `pointsleader`; the class stays `PointsLedgerEntry`.

---

## 7. API surface (implemented controllers)

Every endpoint has a descriptive route `Name`; there are no `[ProducesResponseType]` attributes. Representative paths (confirmed ones exact; the rest follow the same nested/flat pattern):

```
Users              GET/POST /api/users · GET/PUT/DELETE /api/users/{id}
Categories         GET/POST /api/categories · GET/PUT/DELETE /api/categories/{id}
Households         GET/POST /api/households · GET/PUT/DELETE /api/households/{id}
Household members  GET/POST /api/households/{householdId}/members
                   GET/PUT/DELETE /api/households/{householdId}/members/{userId}
Tasks              GET/POST /api/households/{householdId}/tasks
                   GET/PUT/DELETE /api/tasks/{id} · PUT /api/tasks/{id}/status
Task sub-items     nested under a task
Points ledger      list by household · user total · award
Rewards            list by household · GET/PUT/DELETE · claim
Leaderboard        read by household + month/year · single user entry
```

All list endpoints are paginated (page/size, clamped in the service).

---

## 8. Out of scope

The earlier draft promised these; they have **no tables and are not built**. Listing them so nothing assumes they exist: recurring tasks / task templates, rotation/auto-balance, swap/nudge flows, proof-verification dispute flow, shopping list, expense splitting, notifications/push, real-time (SignalR), activity/audit feed, badges/achievements, fairness index, scoring periods (the leaderboard uses month/year rows instead), invite codes, refresh-token storage.

---

## 9. Current status & open items

**Built:** solution, 9 entities (scaffolded from Neon), 9 controllers (named endpoints, comment-free), 9 services, 9 repositories, connection factory, exception handler, Scalar UI, 55 `neondb_stp_*` functions in Neon, first git push done.

**Open:**
1. **Repositories are being wired** to the functions via Dapper, one entity at a time (User first).
2. **Authentication is not built** — `TryGetCallerUserId` is a stub, so household-scoped endpoints return 401. JWT is the intended approach.
3. **The leaderboard has no populating step** — `monthlyleaderboard` is read-only and nothing writes to it yet.
4. `neondb_stp_is_household_member` exists but is currently unused (services read the member row for `.Role`).
