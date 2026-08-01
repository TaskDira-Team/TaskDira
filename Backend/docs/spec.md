# TaskDira — Gamified Household Task Management

**Project specification (English rewrite + expanded scope)**
Backend: .NET · PostgreSQL · Client: React Native

---

## 1. Project and Team

**Application name:** TaskDira — a gamified app for managing household chores.

**Team members:**

| Name | Role |
|---|---|
| Ofek Ram Nissim | — |
| Rafael Olaru | Backend (.NET / PostgreSQL) |
| Amit Amos | — |

*(ID numbers and personal emails from the original document are intentionally omitted here; keep them in the submission cover page only.)*

---

## 2. Core Concept

TaskDira is a collaborative application for people who share a home — roommates, couples, or families. Its purpose is to organize, prioritize, and fairly distribute recurring household work (cleaning, shopping, errands, maintenance).

The problem it solves is coordination failure: nobody knows who was supposed to do what, the same person ends up doing most of the work, and resentment builds. TaskDira addresses this with a shared task board, a clear ownership model, a permissions system, and a scoring layer that makes contribution visible and measurable.

---

## 3. Gamification Layer

### 3.1 Points
Every task carries a point value derived from difficulty and estimated duration. When a task is marked **Done**, the points are credited to the member who completed it.

- Point values are suggested automatically from `difficulty × estimated_minutes`, and can be overridden by an admin.
- Points are recorded as immutable **ledger entries**, not as a mutable counter on the user. Any balance is the sum of its entries. This makes history auditable and makes "reset the month" a matter of starting a new period, not deleting data.

### 3.2 Dynamic Avatar
Each member has a profile avatar whose visual state reflects their recent activity — bright and energetic for an active member, faded and tired for someone who hasn't completed anything.

The backend does not render anything. It exposes a computed **`avatar_state`** enum (`Thriving`, `Steady`, `Slipping`, `Idle`) plus the raw signals behind it (7-day completion count, overdue count, current streak) so the React Native client can animate freely.

### 3.3 Monthly Leaderboard
At the end of each period the system aggregates all members' scores, exposes a performance breakdown, and crowns the **Household Champion** of the month.

- Periods are explicit rows (`ScoringPeriod`), closed by a scheduled job on the 1st of each month.
- Closing a period snapshots the standings, so historical results never change even if old tasks are edited.
- A **Hall of Fame** endpoint returns all past champions.

### 3.4 Additional Gamification (new)
- **Streaks** — consecutive days with at least one completed task.
- **Badges / achievements** — e.g. *Dish Slayer* (50 kitchen tasks), *Early Bird* (20 tasks done before the due date), *Rescuer* (10 tasks claimed that were assigned to someone else and overdue).
- **Fairness index** — a per-household metric showing how evenly points are distributed (based on a simple Gini-style calculation). This is the honest counterweight to the leaderboard: it tells the household whether the load is actually balanced, not just who is winning.
- **Effort decay for overdue work** — a task completed after its due date awards reduced points (configurable percentage per household), instead of a punishment mechanic.

---

## 4. Core Features

### 4.1 User Management
- **Registration & login** — account creation (display name, email, password) with secure password hashing (ASP.NET Core Identity or Argon2/BCrypt), JWT access tokens plus refresh-token rotation.
- **Email verification** and **password reset** via time-limited signed tokens.
- **Profile** — display name, avatar selection, timezone, notification preferences.

### 4.2 Households (Groups)
- Create a household; invite other users **by email** or via a **join code / invite link** with expiry.
- A user may belong to **multiple households** (e.g. apartment + parents' house) and switches context per request.
- **Roles:** `Owner`, `Admin`, `Member`. The creator is the Owner.
  - Admins may edit household settings, remove members, manage categories, adjust point values, and close/reset the scoring period.
  - Members may create, claim, complete, and comment on tasks.
- **Leave / transfer ownership / archive household** flows, with the rule that a household always has at least one Owner.

### 4.3 Task Management (full CRUD)
- **Create** — title, description, category (Kitchen, Living Room, Bathroom, Balcony, Outdoors, Errand…), difficulty, estimated duration, point value, optional due date and time, optional assignee, or left **open to anyone**.
- **Read** — a central dashboard listing tasks by status (`ToDo`, `InProgress`, `Done`, `Archived`), with filtering by assignee, category, due date range, and text search; cursor-based pagination and sorting.
- **Update** — edit details, reassign, or move through the status workflow.
- **Delete** — soft delete, so completed history and points stay intact.

### 4.4 Task Lifecycle Rules
Explicit state machine, enforced server-side:

```
ToDo ──claim──> InProgress ──complete──> Done
  ▲                  │                     │
  └──── release ─────┘        └── reopen (admin, within N days) ──┘
```

Illegal transitions are rejected with a clear error rather than silently accepted.

---

## 5. Extended Features (added beyond the original spec)

### 5.1 Recurring Tasks
A `RecurrenceRule` (daily / weekly on specific days / every N weeks / monthly on day-of-month) attached to a **task template**. A scheduled job materializes the next concrete occurrence when the previous one is completed or when its window opens. This is essential for real household use — taking out the trash is not a one-off.

### 5.2 Rotation / Fair Assignment
A recurring task can define a **rotation order** among household members, so "dishes" cycles automatically. Optional *auto-balance* mode assigns each new open task to whoever currently has the lowest point total for the period.

### 5.3 Claiming, Swapping, and Nudging
- **Claim** an open task.
- **Swap request** — ask a specific member to take a task; they accept or decline.
- **Nudge** — a rate-limited reminder one member can send another about an overdue task (max N per day, so it can't become harassment).

### 5.4 Proof and Verification
Optional per-household setting: certain tasks require a **photo proof** or **peer confirmation** before points are awarded. Introduces a `PendingVerification` state and a small dispute flow where an admin makes the final call.

### 5.5 Shopping List
A shared, real-time list of items (name, quantity, category, requested-by). Turning a completed shopping run into a task grants points. Simple, and the single most-requested feature in roommate apps.

### 5.6 Expense Splitting (optional, stretch)
Record a household expense, split evenly or by custom shares, and view a running balance of who owes whom. Deliberately kept minimal — no payment integration.

### 5.7 Notifications and Reminders
- **Scheduling** — due date and time per task.
- **Delivery** — push notifications (Firebase Cloud Messaging / Expo), plus optional email digests.
- **Types** — task due soon, task overdue, task assigned to you, nudge received, swap request, monthly results published.
- **Quiet hours** and per-type opt-outs per user.
- Implemented with a background scheduler (Quartz.NET or Hangfire) and an **outbox pattern** so a notification is never lost or double-sent when the process restarts.

### 5.8 Real-Time Board Updates
SignalR hub per household so a task claimed on one phone appears instantly on another. Falls back to polling.

### 5.9 Activity Feed and Audit Log
Every meaningful mutation (created, claimed, completed, reassigned, points adjusted, member removed) is appended to an activity log — one endpoint feeds the in-app social feed, and the same data serves as the admin audit trail.

### 5.10 Household Settings
Per-household configuration: overdue point decay %, verification requirement, auto-balance on/off, period length, custom categories, quiet hours default, currency for expenses.

---

## 6. Backend Architecture (.NET)

### 6.1 Stack
| Concern | Choice |
|---|---|
| Runtime | .NET 8 (LTS) or .NET 9, ASP.NET Core Web API |
| ORM | EF Core with Npgsql |
| Database | PostgreSQL 16 |
| Auth | JWT access + rotating refresh tokens; ASP.NET Core Identity |
| Validation | FluentValidation |
| Mapping | Mapperly or manual mapping (avoid AutoMapper's runtime surprises) |
| Background jobs | Quartz.NET or Hangfire |
| Real-time | SignalR |
| Logging | Serilog → structured JSON |
| Docs | Swagger / OpenAPI, generated client for the RN team |
| Testing | xUnit + FluentAssertions + Testcontainers (real Postgres in integration tests) |
| Containerization | Docker + docker-compose (api + postgres + pgadmin) |
| CI | GitHub Actions — build, test, analyzers on every PR |

### 6.2 Structure
**Vertical slice architecture** organized by feature, not by technical layer:

```
src/
  TaskDira.Api/            endpoints, DI, middleware, auth
    Features/
      Households/
      Tasks/
      Scoring/
      Notifications/
  TaskDira.Domain/         entities, value objects, state machine, scoring rules
  TaskDira.Infrastructure/ EF Core, repositories, jobs, push provider
tests/
  TaskDira.UnitTests/
  TaskDira.IntegrationTests/
```

Each feature folder holds its request, handler, validator, and response together. This is the structure that pairs best with an agentic workflow: one agent task ≈ one folder.

### 6.3 Cross-Cutting Rules
- **Multi-tenancy by household** — every query is scoped by `HouseholdId` taken from the authenticated membership, enforced by an EF Core global query filter. This is the single most important security invariant in the app.
- **Authorization** — policy-based (`RequireHouseholdMember`, `RequireHouseholdAdmin`), never checked ad-hoc inside handlers.
- **Concurrency** — `xmin` as a concurrency token on tasks, so two roommates claiming simultaneously produces one winner and one clean 409.
- **Idempotency** — client-supplied `Idempotency-Key` on completion endpoints so a double-tap can't award points twice.
- **Errors** — RFC 7807 ProblemDetails everywhere.
- **Time** — all timestamps stored as `timestamptz` in UTC; user timezone applied only for display and reminder scheduling.

---

## 7. Data Model (PostgreSQL)

```
users              (id, email, password_hash, display_name, avatar_key,
                    timezone, email_verified_at, created_at)

households         (id, name, owner_id, invite_code, settings_json,
                    created_at, archived_at)

household_members  (id, household_id, user_id, role, joined_at, left_at)
                    UNIQUE(household_id, user_id) WHERE left_at IS NULL

categories         (id, household_id, name, icon_key, sort_order)

task_templates     (id, household_id, title, description, category_id,
                    difficulty, estimated_minutes, base_points,
                    recurrence_rule, rotation_json, is_active)

tasks              (id, household_id, template_id, title, description,
                    category_id, difficulty, estimated_minutes, points,
                    status, assignee_id, created_by, due_at,
                    started_at, completed_at, completed_by,
                    requires_proof, proof_url, deleted_at, xmin)

point_entries      (id, household_id, user_id, task_id, period_id,
                    points, reason, created_at)      -- append-only ledger

scoring_periods    (id, household_id, starts_at, ends_at, closed_at)

period_standings   (id, period_id, user_id, total_points, rank,
                    tasks_completed)                  -- snapshot on close

badges             (id, key, name, description, criteria_json)
user_badges        (id, user_id, household_id, badge_id, awarded_at)

shopping_items     (id, household_id, name, quantity, category_id,
                    requested_by, purchased_at, purchased_by)

expenses           (id, household_id, payer_id, amount, description,
                    occurred_at)
expense_shares     (id, expense_id, user_id, share_amount)

notifications      (id, user_id, household_id, type, payload_json,
                    scheduled_for, sent_at, read_at)

activity_log       (id, household_id, actor_id, entity_type, entity_id,
                    action, metadata_json, created_at)

refresh_tokens     (id, user_id, token_hash, expires_at, revoked_at,
                    replaced_by)
```

Key indexes: `tasks(household_id, status, due_at)`, `point_entries(period_id, user_id)`, `household_members(user_id)`, `notifications(scheduled_for) WHERE sent_at IS NULL`.

---

## 8. API Surface (representative)

**Auth**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

**Households**
```
GET    /api/households                      my households
POST   /api/households
GET    /api/households/{id}
PATCH  /api/households/{id}                 admin
POST   /api/households/{id}/invites         email or code
POST   /api/households/join                 { code }
GET    /api/households/{id}/members
PATCH  /api/households/{id}/members/{uid}   change role (admin)
DELETE /api/households/{id}/members/{uid}   remove (admin)
```

**Tasks**
```
GET    /api/households/{id}/tasks           filters + pagination
POST   /api/households/{id}/tasks
GET    /api/tasks/{taskId}
PATCH  /api/tasks/{taskId}
DELETE /api/tasks/{taskId}
POST   /api/tasks/{taskId}/claim
POST   /api/tasks/{taskId}/release
POST   /api/tasks/{taskId}/complete         Idempotency-Key
POST   /api/tasks/{taskId}/reopen           admin
POST   /api/tasks/{taskId}/nudge
POST   /api/tasks/{taskId}/swap-request
POST   /api/tasks/{taskId}/proof
```

**Templates & recurrence**
```
GET/POST/PATCH/DELETE  /api/households/{id}/templates
```

**Scoring**
```
GET    /api/households/{id}/leaderboard?periodId=
GET    /api/households/{id}/periods
POST   /api/households/{id}/periods/close        admin
GET    /api/households/{id}/hall-of-fame
GET    /api/households/{id}/stats                fairness index, trends
GET    /api/me/avatar-state?householdId=
GET    /api/me/badges?householdId=
```

**Shopping / expenses / feed / notifications**
```
GET/POST/PATCH/DELETE  /api/households/{id}/shopping-items
GET/POST               /api/households/{id}/expenses
GET                    /api/households/{id}/balances
GET                    /api/households/{id}/activity
GET/PATCH              /api/me/notifications
POST                   /api/me/devices          register push token
```

**Real-time:** `/hubs/household` — events `TaskCreated`, `TaskClaimed`, `TaskCompleted`, `MemberJoined`, `ShoppingItemAdded`.

---

## 9. Scoring Rules (explicit)

```
base_points   = round(difficulty_weight × estimated_minutes / 10)
                difficulty_weight: Easy 1.0, Medium 1.5, Hard 2.2

awarded       = base_points
                × (on_time ? 1.0 : household.overdue_decay)   default 0.6
                × (claimed_someone_elses_overdue ? 1.25 : 1.0)
```

Every award writes one `point_entry`. Reopening a task writes a compensating negative entry rather than deleting the original — the ledger is append-only.

---

## 10. Non-Functional Requirements

- **Security** — HTTPS only, hashed passwords, hashed refresh tokens at rest, rate limiting on auth and nudge endpoints, strict household scoping on every query, no IDOR (never trust an ID from the client without a membership check).
- **Privacy** — members see only their own household's data; account deletion anonymizes the user while preserving aggregate history.
- **Performance** — dashboard for a 6-member household with 500 tasks returns in under 200 ms; all list endpoints paginated.
- **Reliability** — background jobs idempotent and safe to re-run; outbox for notifications.
- **Testability** — integration tests run against a real Postgres via Testcontainers; no in-memory provider (it hides Npgsql-specific behaviour).
- **Observability** — structured logs with correlation IDs, `/health` and `/health/ready` endpoints.

---

## 11. Delivery Plan

| Sprint | Backend scope |
|---|---|
| 1 | Solution skeleton, Docker compose, EF Core + first migration, auth (register/login/refresh), CI pipeline |
| 2 | Households, memberships, invites, roles, authorization policies, global query filter |
| 3 | Tasks CRUD, state machine, categories, filtering, pagination |
| 4 | Scoring ledger, periods, leaderboard, avatar state, badges |
| 5 | Recurrence, rotation, background scheduler, notifications + push |
| 6 | Shopping list, activity feed, SignalR, hardening, load test, docs |
| 7 | Stretch: expenses, proof/verification, fairness index |

**Tooling:** Jira for sprint tracking, GitHub for source control with PR-per-feature and required review.
