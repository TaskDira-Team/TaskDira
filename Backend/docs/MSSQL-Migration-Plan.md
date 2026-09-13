# TaskDira MSSQL migration preparation

Status: local migration implemented and imported on 2026-09-13. `TaskDira_MigrationDev` contains the read-only PostgreSQL snapshot. PostgreSQL remains the application's default provider; MSSQL is selected explicitly for local development. No production configuration, push, merge, or deployment was performed. See `MSSQL-Migration-Report.md` for completed work, validation and remaining production decisions.

## Earlier blocked attempt — 2026-09-13 (resolved)

The source became available after Railway services were brought online. The following paragraphs retain the initial diagnostic history; they are superseded by the migration report.

Migration is blocked on source availability. `TASKDIRA_SOURCE_DB` is present; its value has not been printed or persisted. Added `tools/TaskDira.Migration`, a connectivity-only Npgsql probe with read-only transaction settings and sanitized diagnostics.

Both an approved outside-sandbox Npgsql connection attempt and a credential-free transport probe fail with `ConnectionReset`. The public endpoint accepts TCP but closes before responding to the PostgreSQL SSL negotiation request. This occurs before authentication or catalog queries. It is consistent with an inactive database service, but Railway service status has not been independently verified.

Required next input/state: restore availability of the source Railway PostgreSQL service and verify its current public URL, or supply a complete PostgreSQL schema-and-data backup. No live routine reconciliation, source-export files, MSSQL schema translation, target creation, data import, or MSSQL application integration tests have been completed. The existing 59-routine inventory remains a code inventory only.

Validation for this attempt: solution build passed with zero warnings/errors; all 35 existing tests passed; probe build passed with one NU1900 warning because NuGet vulnerability metadata could not be fetched (also reported after an approved outside-sandbox restore). `git diff --check` passed, and the probe's bin/obj files are ignored. No application source/provider configuration was changed. Existing preparation files were preserved; only this plan was updated and the connectivity tool/project/README were added.

## Confirmed baseline

- Repository baseline: `861bef7`; preparation branch: `feat/mssql-migration-preparation`.
- .NET 9 API, Dapper repositories, Npgsql connection factory. EF Core is scaffolding-only.
- PostgreSQL on Railway per the handoffs. The live PostgreSQL catalog has not been inspected in this task.
- Local Windows-authenticated connection to `.\SQLEXPRESS` succeeded outside the command sandbox on 2026-09-12. Server: SQL Server 2022 Express, version `16.0.1000.6`.
- Read-only preflight confirmed database creation permission, no existing `TaskDira_MigrationDev` database, scalar/object JSON support and microsecond timestamp precision. The server default collation is `SQL_Latin1_General_CP1_CI_AS`; do not inherit it without checking source string semantics.
- The sandbox connection failed with an ODBC security/SSL error; the same command succeeded outside it. Do not change SQL Server authentication or disable certificate validation to address that sandbox failure.
- Five incremental PostgreSQL migrations exist. The procedures Markdown is an older reference, not a current full database backup. The scaffolded DbContext omits foreign-key relationships and cannot reconstruct the complete schema.
- Handoffs report 10 tables and 62 functions. Reconcile those counts against the live catalog before translating; the generated repository inventory records the functions actually called by this checkout.
- This checkout calls 59 distinct routines across 11 repositories. The difference from 62 reported live functions is not itself evidence of missing code: catalog-only helpers may account for it.

## Scope and architecture

The user has requested migration to MSSQL, superseding the PostgreSQL-only rule in Backend/CLAUDE.md for this migration. Preserve the existing controller/service/repository layering, Dapper, opaque sessions, API routes and DTOs. Moving runtime data access to EF Core is a separate rewrite and is not required here.

Use a separate local target named `TaskDira_MigrationDev`. If that name already exists, inspect it before any schema operation; never drop or overwrite it automatically. Keep source PostgreSQL migrations intact and place SQL Server scripts in `db/sqlserver/`.

## Step 1: capture the source of truth

1. Obtain PostgreSQL client tools compatible with the source server; `psql` and `pg_dump` were not found on this shell's PATH.
2. Read source connection configuration privately. Never print credentials, session hashes, password hashes, or database dumps into terminal/chat logs.
3. Export the live schema, function definitions/signatures, constraints, indexes, identity/sequence settings, database collation, and column metadata. Check for overloads and unused functions.
4. Record table counts, source size, orphan checks and per-household/user XP and balances. Store exports in an ignored, access-controlled location, not tracked documentation.
5. Reconcile this export against `MSSQL-Repository-Inventory.md` and migrations 001-005. Resolve missing definitions before implementation.

## Step 2: build and verify the target schema

| PostgreSQL | Proposed SQL Server 2022 mapping | Verification |
|---|---|---|
| serial / sequence-backed integer | int IDENTITY | Preserve IDs during import; reseed after import. |
| varchar / text | nvarchar(n) / nvarchar(max) | Hebrew, emoji, supplementary characters and length boundaries. PostgreSQL character counts and UTF-16 code units differ. |
| boolean | bit | Preserve nullability and defaults. |
| timestamp without time zone | datetime2(6) | Preserve stored values first; establish their timezone meaning before transforming any values. Never use SQL Server timestamp, which means rowversion. |
| jsonb avatarstate | nvarchar(max), CHECK ISJSON(avatarstate, VALUE) = 1 | Both the scalar default `"neutral"` and object avatars must be valid. Preserve SQL NULL behavior. |
| partial unique task-earn index | filtered unique index with pointsearned > 0 AND taskid IS NOT NULL | SQL Server unique-index NULL behavior differs; block duplicate task earns without blocking unrelated reward rows. |
| PostgreSQL string comparisons | explicitly chosen database/column collations | Preserve email uniqueness, token-hash lookup, case/accent sensitivity and trailing-space behavior; scan for collisions before import. |

Import all 10 source tables, including sessions, unless a deliberate session-reset policy is chosen. Preserve `pointsleader`'s physical name, nullable task/reward IDs and direct household scope. Review cascade paths, CHECK constraints, defaults, and all foreign keys against the export rather than relying only on EF scaffolding.

SQL Server 2022 Express has a 10 GB relational database size limit. Check source size before using it for the rehearsal. The local Windows-authenticated instance is a development target, not a hosting plan for the Railway backend. Production SQL Server hosting, TLS/networking, authentication, backups and cost remain to be selected.

## Step 3: port the data-access contract

- Translate PostgreSQL functions into `dbo` stored procedures; retain existing routine names initially to keep the mapping traceable.
- Replace SELECT-function invocation with procedure execution and `CommandType.StoredProcedure`. Preserve `p_` parameter names, returned column names, no-row outcomes, scalar counts, ordering and pagination.
- Use `SET NOCOUNT ON`; explicitly SELECT mutation row counts where callers expect ExecuteScalarAsync. Use OUTPUT INSERTED for inserted rows. Translate data-modifying CTEs into transactionally equivalent T-SQL.
- Add a pinned, compatible Microsoft.Data.SqlClient package and SqlConnection-based factory. Adapt Program.cs configuration and scaffolding provider. Do not register both incompatible providers accidentally.
- Keep DTOs and service interfaces stable unless atomic operations below require a narrow repository change.
- Use a separate local configuration key/profile for SQL Server. `appsettings.Local.json` is currently loaded after environment variables; fix precedence before relying on environment overrides. Never replace the working Railway secret with a local development connection.
- Re-scaffold flat POCO mappings from the verified target, keeping entity names and DTO boundaries. Audit provider-specific exception handling and DateTime conversions.

## Step 4: transaction and behavior gates

Code inspection found these existing issues to cover explicitly in the migration implementation:

1. RewardService currently checks balance, inserts a debit, and claims a reward through separate repository connections. Claim and debit must become one transaction; a losing concurrent claimant must not lose balance.
2. The current spend function checks an aggregate balance without serializing competing spends. Serialize by household/member wallet using a stable lock target and consistent lock order; test simultaneous purchases of different rewards too.
3. A zero-cost reward currently tries to insert a zero ledger row, conflicting with the nonzero CHECK. A free claim should skip the debit while still completing atomically.
4. ClaimAsync does not check RequiredPoints despite documentation describing it as an XP unlock threshold. Establish and test the intended server-side rule.
5. Current lifetime XP is the sum of positive ledger rows. Do not repair claim failures using positive refund rows that would inflate XP; prefer rolling back the atomic claim. Any future refund model needs an explicit event classification.
6. Review user/household/session registration as one transaction; the handoffs document a partial-registration failure window.

These are identified implementation requirements, not fixes already applied. Keep family feature expansion separate from database parity work.

## Step 5: rehearsal and acceptance

- Build and run existing unit tests; run database integration tests against the isolated SQL Server target.
- Verify login/register/logout, expired sessions, cross-household 404, member/admin 403, task/subtask operations and pagination.
- Verify duplicate earns, concurrent spends/claims, free claims, insufficient balance, XP versus balance, and completed-task deletion guards using independent connections.
- Compare source/target counts, primary keys, foreign keys, text/JSON values, timestamps, per-wallet balances and XP. Verify the first post-import identity insert does not collide.
- Run the React app against the local API and check Hebrew/English, avatars, task completion and reward balances after refresh.
- Rehearse backup restoration and transfer duration. A successful build alone is not migration evidence.

## Production cutover (future)

After rehearsal, prepare a concrete deployment and rollback package. Pause source writes, take a final consistent export, import and validate, switch backend configuration, then smoke-test before enabling writes. Keep the source intact. Once target writes begin, rollback requires reconciling those writes; switching the connection string back alone would lose data. No production changes are part of this preparation task.

## Read-only local preflight

From the repository root, run under the Windows identity that owns SQL Server access:

```powershell
sqlcmd -S '.\SQLEXPRESS' -E -d master -b -l 5 -i Backend/db/sqlserver/000_preflight.sql -W
```

This reports version, collation, creation permission, target-name availability and JSON/date compatibility. It does not create or modify a database. Sandbox execution may require a specific escalation for Windows authentication.

## Preparation validation

- `000_preflight.sql`: passed against local SQL Server; read-only.
- `dotnet build Backend/TaskDira.sln --no-restore`: passed, with two existing xUnit2031 warnings in PointsModelTests.cs.
- `dotnet test Backend/TaskDira.sln --no-build --no-restore`: all 35 tests passed outside the sandbox.
- `git diff --check`: passed. Changes are preparation documents and a read-only script only.
- These tests establish the existing PostgreSQL application's unit-test baseline; no SQL Server application integration or data parity has been claimed.

## Sources

- [SQL Server ISJSON, including VALUE support in SQL Server 2022](https://learn.microsoft.com/en-us/sql/t-sql/functions/isjson-transact-sql?view=sql-server-ver16)
- [SQL Server 2022 editions and limits](https://learn.microsoft.com/en-us/sql/sql-server/editions-and-components-of-sql-server-2022?view=sql-server-ver16)
