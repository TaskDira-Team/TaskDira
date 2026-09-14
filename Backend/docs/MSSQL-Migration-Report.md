# TaskDira local MSSQL migration

## Follow-up review fixes (2026-09-14)

Resolved the ranking, avatar localization, mobile account navigation, dependency advisories and bundle warning recorded in the merge review below.

- Ranking now uses the authoritative household roster, removes stale cached memberships/ledger participants, and assigns contiguous ordinal ranks with deterministic user-ID ordering for ties. The leaderboard uses that same ordering. Regression tests cover a zero-XP solo member, stale cached members, other-household isolation, ties, reordered rosters, removal and an empty roster.
- Emoji, sticker, custom-image, ring and badge labels now resolve through stable Hebrew/English keys, including image alternatives and accessible button names. Existing avatar IDs and legacy JSON remain compatible. Catalog/resolver coverage includes every preset and both languages.
- Mobile has visible Profile and Logout buttons with native keyboard activation, focus indicators, current-page semantics and 44px minimum height. The coin widget now sits in the header instead of overlapping page content. Component regression coverage verifies both languages and navigation/logout callbacks.
- Updated transitive nanoid 3.3.16 -> 3.3.19 and postcss 8.5.20 -> 8.5.28 within compatible ranges. The audited advisories were nanoid GHSA-2v37-7h3g-55p8 (high, zero-size custom-generator loop) and postcss GHSA-fxqj-rqcc-2cmp (moderate, source-map file access). Regenerated the lockfile, completed a clean `npm ci`, checked the installed dependency tree, and ran full `npm audit`: **zero vulnerabilities**. No forced major upgrades or declared dependency changes.
- Split Three.js core and renderer into separate chunks while retaining the asynchronous scene import. The generated manifest confirms the initial static import graph excludes Three.js and houseScene. The build emits no large-chunk warning; this reduces individual chunk sizes, not the total 3D download.

### Validation

- Backend solution build passed (two existing xUnit2031 warnings); migration-tool build passed without warnings; frontend production build passed.
- All **43 backend tests**, including eight real MSSQL integration tests, passed with zero skips. All **22 frontend tests** passed, including four new regression tests.
- Focused browser checks ran against the production frontend build and local SqlServer API: existing zero-XP solo account logged in and showed **Rank 1 of 1** on the dashboard and rank 1 with one participant on the leaderboard. Profile also showed family rank #1.
- English Profile exposed translated character/ring/badge labels; switching to Hebrew exposed their Hebrew equivalents and RTL layout. At 390 x 844, Profile and Logout were visible, Profile accepted Enter, and Logout accepted Enter and navigated from `/#/profile` to `/#/landing`. Neither language produced document horizontal overflow. Existing bottom-tab labels remain crowded at this width; this follow-up does not redesign that navigation.
- The split 3D scene rendered on mobile and desktop. Night mode, room selection and separated floors worked. Existing demo progress remained 210 XP with the previously completed quest. No captured browser console errors occurred during these checks. These are focused checks, not exhaustive device/GPU or screen-reader coverage.

| Production asset | Minified kB | gzip kB |
|---|---:|---:|
| Main index | 381.37 | 121.47 |
| houseScene | 101.10 | 36.61 |
| Three.js core | 183.68 | 49.77 |
| Three.js renderer | 343.83 | 83.35 |
| CSS | 172.10 | 32.57 |

The former ~627.25 kB scene is now three chunks totaling ~628.61 kB; the largest 3D chunk is 343.83 kB. The immersive house remains a browser-only demo, as documented below.

Local review servers: production frontend preview at `http://127.0.0.1:3000/` and API at `http://localhost:5188`, using `TaskDira_MigrationDev` on `.\SQLEXPRESS`. Restart commands, in separate terminals from the repository root:

```powershell
dotnet run --project Backend/src/TaskDira.Api --no-build --no-launch-profile -- --environment Development --Database:Provider SqlServer --urls http://localhost:5188
```

```powershell
cd Frontend
npm run preview -- --host 127.0.0.1 --port 3000 --strictPort
```

Reviewed the complete change set and checked ignored private exports/build outputs. No credentials, private data, generated build assets or test-account secrets are included. Existing local test data is retained. Production, PostgreSQL and Railway remain unchanged; nothing was pushed or deployed.

Local migration completed on 2026-09-13 on `feat/mssql-migration-preparation`. Production remains on its existing PostgreSQL configuration. No push, merge, deployment, or source modification was performed.

## Integration with immersive frontend (2026-09-14)

The migration and five regression fixes were committed as `1670ada` (`feat: add local MSSQL migration and fix household UI regressions`). Fetched `origin/main` at `a505b1b`, the merge of PR #2, and verified that commit is an ancestor of the fetched main branch. Main was merged into `feat/mssql-migration-preparation` without textual conflicts. Manual integration corrections removed a duplicate `useEffect` import and redundant redirect effect in App.jsx while retaining lazy loading, Suspense, registration routing, and the logout-to-landing fix. The test script now runs both the five regression tests and thirteen upstream demo/bookmark tests.

The upstream package lock initially failed `npm ci` because optional `@emnapi` dependencies were missing/inconsistent. Regenerated those lockfile entries without changing declared dependency versions, then verified a successful clean install. Local Vite/API processes were stopped only to release Windows build-file locks and restarted afterward.

### Validation of the merged tree

- Backend solution and migration-tool builds passed. Two existing xUnit2031 analyzer warnings remain in the backend tests.
- Frontend build passed, including the dynamically loaded ~627 kB houseScene chunk (Vite size advisory remains).
- All 43 backend tests passed, including eight real SQL Server integration tests, with zero skips/failures.
- All 18 frontend tests passed with zero skips/failures.
- Browser review used the existing local test session: Dashboard and Profile displayed one completed task, 25 lifetime XP and five coins; Household showed 25 / 400 monthly XP. Profile retained these values after refresh and translated Home hero / גיבור הבית and Coins / מטבעות correctly.
- Logout from `/#/profile` changed the route to `/#/landing`. A separate synthetic account completed browser registration, logout, login and authenticated page refresh through the merged frontend and local MSSQL API. Its generated password remained in memory and was not printed or saved to the repository. Existing manual-test rows were retained; the additional browser-review account/household were also left in the local database.
- Visually reviewed desktop English Profile and mobile Hebrew Profile, plus the immersive house in desktop and 390 x 844 mobile layouts. Both Hebrew RTL and English LTR house layouts rendered without document horizontal overflow. Room selection, night lighting, separated floors, closing/reopening the scene and demo completion worked. Demo points changed from 180 to 210 and persisted into the playground; they were still 210 after page reload. No captured browser console errors were present during the final login/refresh check.
- API health returned 200. CORS preflight returned 204 and allowed exactly `http://127.0.0.1:3000` for the tested origin. Frontend uses a process-local VITE_API_URL override for `http://localhost:5188`.

### 3D data boundary and remaining issues

The immersive house is **a browser-only public demo**, not the authenticated household. HouseJourney uses usePlayground/createPlaygroundStore, static demo quests and localStorage; it does not call task/ledger/reward APIs. The signed-in dashboard still uses authenticated household API data. Its new saved-chores shelf stores bookmarks locally, scoped by user and household; bookmarks are not synchronized to MSSQL.

Observed remaining frontend issues: a newly registered solo account displayed `Rank 2 of 1` (also after re-login); avatar icon/ring accessibility labels and some onboarding ring text remain Hebrew in English mode even though badge labels translate; the mobile app navigation exposes neither Profile nor Logout. These were recorded rather than bundled into the merge. npm audit reports nanoid (high) and postcss (moderate), both with fixes available; no automatic dependency upgrade was applied. The existing large 3D chunk warning remains. Audio narration and exhaustive device/GPU coverage were not validated.

Running URLs: frontend `http://127.0.0.1:3000/`, immersive house via `/#/landing`, API `http://localhost:5188`, Swagger `/swagger`. The feature branch remains local; no push, deployment, PostgreSQL deletion, or Railway configuration change occurred. Private snapshots remain ignored and no build artifacts or actual test-account credentials were staged.

## Source capture and local target

Railway PostgreSQL 18.6 accepted a connection with transaction read-only mode verified as `on`. Source session timezone is UTC. A repeatable-read snapshot captured the 10 public application tables, 62 functions, constraints, indexes, sequences and their state, dependency catalog, and 70 data rows. All 59 original routines used by this checkout exist in the live export. The extra three are `neondb_stp_delete_expired_sessions`, `neondb_stp_insert_household`, and `neondb_stp_is_household_member`.

The local target is `TaskDira_MigrationDev` on `.\SQLEXPRESS` (SQL Server 2022 Express).

| Table | Imported rows |
|---|---:|
| users | 12 |
| categories | 11 |
| householdinfo | 11 |
| householdmembers | 11 |
| tasks | 10 |
| tasksubitems | 0 |
| rewards | 2 |
| pointsleader | 8 |
| monthlyleaderboard | 0 |
| sessions | 5 |

Source data is a snapshot at the timestamp in `db/mssql/source-export/manifest.json`, not live synchronization. Data and matching catalog are in `Backend/.migration-private/source`, ignored by Git. Public source metadata and reconstructed DDL are in `Backend/db/mssql/source-export`. There were no application triggers, views or RLS policies in this export. All routines are SQL-language functions; their bodies and recorded dependencies are retained. PostgreSQL owners/grants are intentionally not copied to Windows-authenticated SQL Server.

## Runtime changes

- Added pinned `Microsoft.Data.SqlClient` 6.1.4 while retaining Dapper and the original PostgreSQL provider.
- `Database:Provider=SqlServer` explicitly selects MSSQL. PostgreSQL remains the default, and existing Railway secrets/configuration files were not altered.
- Development mode supplies a local Windows-authenticated shared-memory target when no separate `ConnectionStrings:TaskDiraSqlServer` value is configured. That fallback is unavailable outside Development. Optional encryption applies only to the local shared-memory fallback; remote hosting requires an explicit connection and TLS configuration.
- Environment/command-line settings now override `appsettings.Local.json`.
- All 11 existing repositories use `RoutineCommand`: existing PostgreSQL SELECT calls remain intact for that provider, while SqlConnection calls become schema-qualified stored procedure calls. DateTime parameters use DateTime2 for MSSQL to preserve microseconds.
- Added transactional registration and reward-claim procedures/repository paths. MSSQL now has 62 parity procedures plus two atomic operations (64 total).
- Registration inserts user, household, membership and session as one transaction.
- Claims serialize by household/member wallet and reward, checking balance and XP threshold inside the transaction. A losing claim never leaves a debit. Free rewards create no zero-value ledger row. Concurrent purchases of different rewards cannot overspend. Existing raw spend operations use the same wallet lock.
- SQL constraint/duplicate-key conflicts map to generic HTTP 409 without exposing database error details.
- Points awards check that their task belongs to the requested household; cross-household task references return 404.

The original EF context remains PostgreSQL scaffolding/reference tooling; it is not registered or used by the MSSQL request path. A runtime rewrite to EF Core was not performed.

## Compatibility decisions

- PostgreSQL serial IDs become int IDENTITY. Import preserves IDs and reseeds safely from sequence state/max IDs. Test inserts subsequently advance local counters; exact counter equality is not promised after testing.
- Plain PostgreSQL timestamps become datetime2(6). Stored values are preserved; UTC defaults match the source's UTC timezone.
- VARCHAR(n) becomes NVARCHAR(2n) with a supplementary-character-aware length check. This preserves Hebrew/emoji and the original character-count limit.
- JSONB avatars become NVARCHAR(MAX) with `ISJSON(..., VALUE)`, supporting scalar/object/array/JSON-null values. SQL NULL remains distinct. Existing JSONB text is preserved; future SQL Server writes retain supplied JSON formatting rather than PostgreSQL's canonical formatting.
- Database collation is Latin1_General_100_BIN2 for ordinal case/accent-sensitive equality. Email and session-token comparisons include byte length; their unique keys include persisted byte-length columns, preserving significant trailing spaces. No application list sorts by those text columns, so the source's en_US linguistic ordering is not reproduced as a general SQL sorting guarantee.
- Session token hashes are NVARCHAR(450) for indexability; the app always generates 64-character SHA-256 hex hashes. All imported values fit. Arbitrarily long non-application token strings supported by PostgreSQL text are outside this target contract.
- Source primary/foreign keys and checks are enforced. The task-earn partial unique index becomes a filtered index excluding NULL task IDs. Added wallet lookup index supports serialized balance operations.
- Ledger table keeps the historical physical name `pointsleader`. XP sums positive rows; balance sums all rows, scoped directly by household. No refund entries were generated.
- The three catalog-only helpers are retained. PostgreSQL functions become SQL Server procedures; PostgreSQL sequence ownership is reconstructed in the sanitized source DDL, while the target uses identity columns.

## Verification

- Solution builds successfully. Two pre-existing xUnit2031 warnings remain in `PointsModelTests.cs`.
- Existing 35 tests plus 8 real SQL Server integration tests: 43 passed, no skips with SQL Server testing enabled.
- Integration tests start an isolated API on an ephemeral loopback port, use actual SQL Server connections and HTTP routes, and remove only their synthetic rows afterward.
- Tested registration/login/wrong-password/logout/expiry, registration rollback, unauthenticated 401, member/admin 403 and cross-household 404, task/subitem workflows, microsecond due dates, duplicate awards, and deletion guard for awarded tasks.
- Concurrent tests cover multiple attempts to earn for the same task, two members claiming one reward, one wallet buying different rewards, and raw competing spends. Also tested free rewards, XP locks and XP remaining unchanged after spending.
- Tested Hebrew/emoji, 100 supplementary characters at the source length boundary, JSON object/JSON-null values, case-sensitive email lookup, and distinct trailing-space emails.
- All 62 source routines have matching target procedure parameter names/counts; key write/read workflows execute through the API/repositories. This is not a claim that every possible branch of every routine was exercised.
- Every imported column value matches the stored source snapshot, including IDs, timestamps, JSON, password hashes and session hashes. Foreign keys/checks are valid and trusted; per-wallet XP and balances match. Aggregate results are in `db/sqlserver/verification.json`. Verification is repeated after test cleanup.

## Start locally

From `C:\Dev\TaskDira`:

```powershell
dotnet run --project Backend/src/TaskDira.Api --no-launch-profile -- --environment Development --Database:Provider SqlServer --urls http://localhost:5188
```

Swagger is at `http://localhost:5188/swagger`; health is at `/health`. In a second PowerShell terminal:

```powershell
Set-Location C:\Dev\TaskDira\Frontend
$env:VITE_API_URL = 'http://localhost:5188'
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:3000`. The frontend API override exists only in the development server process environment; no frontend or production configuration files were modified. Keep the same frontend hostname when checking localStorage/session persistence. Stop an existing review server before starting another on these ports.

## Manual browser findings and UI fixes (2026-09-13)

The user completed manual browser testing against local MSSQL and confirmed registration, household creation, task creation/completion, refresh persistence, completed-task persistence, login/logout, Hebrew RTL and English LTR. The test account earned 25 lifetime XP, claimed a reward costing 20, and retained 5 spendable coins while leaderboard XP stayed at 25. These are user-reported browser results, superseding the earlier browser-access blocker below.

Five defects from that review are fixed in the working tree:

1. AppContext derives each member's monthly completed count from persisted `Done` tasks assigned to that member, replacing the stale cached zero consumed by Dashboard and Profile. Household task counts use the same date helper. Missing/invalid completion dates and other months are excluded.
2. Household goal progress uses positive `pointsEarned` ledger entries for the active household and current UTC month, fetched through the existing paginated API. Spending, older earnings and other households do not contribute. The reported example is 25 / 400 XP, independent of its one completed task and five remaining coins. No database schema change is needed.
3. Avatar badges retain existing `profileBadgeId` values and now resolve stable `badge.<id>` translation keys. Profile, badge pickers, onboarding preview and avatar tooltips translate at render time. Existing IDs, legacy Hebrew/English label values and key-based JSON resolve without rewriting stored avatars; unrelated JSON fields are preserved.
4. Profile's spendable balance metric is labeled `Coins` / `מטבעות`. Its XP indicator and leaderboard continue to use lifetime XP.
5. The new UI router redirects signed-out private routes to `/#/landing` in an effect, including logout from `/#/profile`. Signed-in public-route redirects also moved out of render.

UTC month boundaries match stored completion/ledger timestamps: SQL timestamps without a timezone suffix are interpreted as UTC for these calculations. Due-date wall-clock handling is unchanged.

Validation after fixes: backend build passed (zero warnings on this incremental run); all 43 backend tests passed, including eight real MSSQL integration tests, with no skips. Frontend build passed with the existing large-chunk warning (~635 kB main bundle). Added `npm test` using Node's built-in runner: five regression tests passed for task counts, monthly positive XP, UTC boundaries, badge translations and legacy avatar compatibility. `git diff --check` passed. Post-fix browser interaction has not been independently repeated by the agent.

Existing local manual-test data was retained. Integration cleanup targets only the synthetic account/household IDs created by those tests. The original 70-row snapshot verifier was not rerun because it intentionally rejects the additional manual-test rows; the earlier verification remains historical evidence. No PostgreSQL/Railway operations, production configuration changes, push, merge, deployment, or local-data reset occurred.

Additional commit candidates from this pass: `Frontend/package.json`; `src/App.jsx`; `src/context/AppContext.jsx` and `I18nContext.jsx`; `src/data/avatars.js`; `src/pages/Household.jsx` and `Profile.jsx`; `src/components/gamification/AvatarFrame.jsx` and `onboarding/AvatarCreator.jsx`; new `src/services/pointsRemote.js`, `src/utils/monthlyStats.js`, and `tests/*.test.js`; this report. Private exports remain Git-ignored.

## Earlier automated local application review (2026-09-13)

The rebuilt API and React development server were started on the addresses above. HTTP health and frontend document requests returned 200. A CORS preflight from `http://127.0.0.1:3000` returned 204 with that exact allowed origin.

At this earlier stage, manual browser review was blocked for the agent. The browser controller returned no apps or browsers, and opening the in-app browser failed with `Browser is not available: iab`. The user subsequently performed the manual review recorded above. The table below records the earlier automated coverage, not the latest manual status.

| Requested area | Verified evidence | Still requires browser review |
|---|---|---|
| Registration/login/logout | Real HTTP registration, valid/invalid login, token revocation, expiry, registration rollback | Forms, onboarding, redirects, localStorage |
| Session/data persistence | Restarted the test API process; the original token, edited task, assignment, due date and subtask still worked | Actual page refresh and sign-in restoration |
| Households/permissions | Household creation, creator ownership, member/admin restrictions, outsider isolation | Household switching and visible controls |
| Tasks/subtasks | Create, edit, reassign, reject outsider assignment, status transitions, subitem update/delete, task deletion cascade, awarded-task deletion conflict | Dialogs, checklist interaction, completion feedback |
| XP/balance/rewards | Duplicate earn prevention, unchanged XP after spending, free/locked rewards, concurrent single-reward claims and competing wallet purchases | Display refresh, reward dialogs and celebrations |
| Leaderboard | Empty response, seeded synthetic ranking, paging, null ranks last, per-user lookup, household isolation | Rendered ranking; frontend ranks roster lifetime XP |
| Hebrew/English/RTL | Unicode and emoji database/API round-trips; language/direction code inspected | All visual layouts and language switching |

Backend solution build passed with the two existing xUnit2031 warnings. The migration tool build passed without warnings. React production build passed with a 634 kB main-chunk warning. Frontend package.json defines no automated test command. All 43 backend tests passed, including eight real MSSQL integration tests. Synthetic fixtures were removed and the snapshot verifier then confirmed all 70 rows/every imported column, constraints, trusted foreign keys and wallet values still match.

One migration-tool bug was found and fixed during this review: after adding the two SQL-only atomic procedures, re-export inventory would incorrectly demand them from PostgreSQL. SourceExport now excludes those two names; an offline comparison confirms the original 59 calls match the saved live catalog. No new source export or Railway request was performed. No additional runtime MSSQL failure was reproduced by this review.

Existing product behavior remains: the monthly leaderboard table has no imported entries or automatic refresh job; the frontend derives its ranking from roster lifetime XP. Backend household members can edit household tasks; admin-only task editing is not an enforced rule. These were not changed as part of SQL compatibility work.

Commit review covered tracked diffs and untracked migration files. The source URL/password and imported emails/password hashes/session hashes were checked in memory against commit candidates, with no matches. No production configuration changes, private row exports, bin/obj, node_modules or dist files are in those candidates. Private exports and build output remain Git-ignored; `git diff --check` passed. Sanitized source DDL/catalog and aggregate verification JSON are intentional generated artifacts ready for review. Nothing was staged, committed, pushed, merged or deployed.

Run the full suite:

```powershell
dotnet build Backend/TaskDira.sln --no-restore
$env:TASKDIRA_SQLSERVER_TESTS = '1'
dotnet test Backend/TaskDira.sln --no-build --no-restore
Remove-Item Env:TASKDIRA_SQLSERVER_TESTS
dotnet run --project Backend/tools/TaskDira.Migration/TaskDira.Migration.csproj --no-restore -- --verify
```

Do not run the importer again against the populated database: it intentionally refuses to overwrite existing tables.

## Changed files

- `Backend/.gitignore`: ignores private migration snapshots.
- `Backend/CLAUDE.md` and `Backend/docs/MSSQL-Migration-Plan.md`: migration status/override notes; this report records results.
- `Backend/db/mssql/source-export/`: manifest, catalog, source function definitions and reconstructed source schema.
- `Backend/db/sqlserver/001_schema.sql`, `002_procedures.sql`, `verification.json`: target schema, procedures and parity results. Existing preflight script retained.
- `Backend/tools/TaskDira.Migration/`: project, entry point, exporter, script generator, importer/verifier and README.
- `Backend/src/TaskDira.Api/TaskDira.Api.csproj`, `Program.cs`, `Data/DbConnectionFactory.cs`, new `Data/RoutineCommand.cs`: local MSSQL provider/command handling.
- All 11 existing repository files; new `Repositories/RegistrationRepository.cs`.
- `Services/AuthService.cs`, `RewardService.cs`, `PointsLedgerService.cs`, and `Middleware/GlobalExceptionHandler.cs`: atomic workflows, household scope and SQL conflict responses.
- `Backend/tests/TaskDira.Tests/SqlServerIntegrationTests.cs`: opt-in integration suite.

## Production work remains separate

No production SQL Server host has been selected or configured. Local SQL Express is the development rehearsal target. Hosting, backups/restore rehearsal, remote TLS/access, final source write pause/export, cutover and rollback accounting for new writes remain future work. Keep PostgreSQL intact. The source was available throughout the successful export; there are no outstanding blockers to running this local MSSQL build.
