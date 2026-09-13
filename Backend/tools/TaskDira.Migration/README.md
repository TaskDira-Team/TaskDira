# TaskDira local migration tool

This tool probes/exports read-only PostgreSQL and generates, imports and verifies the isolated local SQL Server target. Run from the repository root. The source variable is only required for source operations.

It reads `TASKDIRA_SOURCE_DB` from the process environment. PostgreSQL URLs and Npgsql connection-string syntax are accepted. URL connections require SSL. The tool never prints or persists the connection value, host, credentials, or arbitrary exception messages. Errors report only exception types, fixed categories, SQLSTATE and socket status.

From the repository root:

```powershell
dotnet run --project Backend/tools/TaskDira.Migration/TaskDira.Migration.csproj --no-restore
```

Restore the project first if its assets are not present. A successful probe opens a repeatable-read transaction with `default_transaction_read_only=on`, reports server version and public table/routine counts, then rolls back. Windows sandbox networking may require approval for the command.

For a credential-free transport check using the endpoint from the same variable:

```powershell
dotnet run --project Backend/tools/TaskDira.Migration/TaskDira.Migration.csproj --no-restore -- --transport
```

This connects to TCP and sends only the standard PostgreSQL SSL negotiation request. It does not send authentication credentials or execute SQL. Successful transport negotiation does not establish database access.

## Export, generate, import and verify

```powershell
dotnet run --project Backend/tools/TaskDira.Migration/TaskDira.Migration.csproj --no-restore -- --export
dotnet run --project Backend/tools/TaskDira.Migration/TaskDira.Migration.csproj --no-restore -- --generate
dotnet run --project Backend/tools/TaskDira.Migration/TaskDira.Migration.csproj --no-restore -- --import
dotnet run --project Backend/tools/TaskDira.Migration/TaskDira.Migration.csproj --no-restore -- --verify
```

- `--export`: metadata goes to `Backend/db/mssql/source-export`; private row data and its matching catalog go to the Git-ignored `Backend/.migration-private/source`. JSONB is exported as text to distinguish JSON null from SQL NULL. No database owner/ACL statements are included in sanitized DDL.
- `--generate`: derives source reconstruction DDL and target scripts from the inspected catalog. This is specific to TaskDira, not a general PostgreSQL translator. Unsupported types and triggers/views/policies stop generation for review.
- `--import`: uses Windows authentication over shared memory to local `TaskDira_MigrationDev` only. Creates the database if absent, refuses to overwrite existing tables, and applies schema/procedures/data in one transaction. Preserves IDs, NULLs and microsecond dates; reseeds identity values from source sequences and maximum imported IDs.
- `--verify`: compares all stored source values against the target without printing private values. Checks constraints, trusted foreign keys and wallet totals. Saves aggregate results to `Backend/db/sqlserver/verification.json`.

A new export replaces the source snapshot; it does not synchronize the populated target. Keep the matching catalog and data together. PostgreSQL sequence state is nontransactional; counters are sampled and target identity reseeding also considers maximum imported IDs. A production cutover requires a final export with source writes paused.

Reapply procedures only to the existing local target:

```powershell
sqlcmd -S '.\SQLEXPRESS' -E -d TaskDira_MigrationDev -b -i Backend/db/sqlserver/002_procedures.sql
```

The scripts explicitly set ANSI_NULLS and QUOTED_IDENTIFIER across GO batches, as required by filtered/computed indexes.

## Latest result (2026-09-13)

Source service recovered; exported 10 tables, 70 rows and 62 routines. All 59 original application routines were present. Local SQL Server import and full value/constraint/wallet verification passed. See `Backend/docs/MSSQL-Migration-Report.md` for application/test commands and compatibility decisions.
