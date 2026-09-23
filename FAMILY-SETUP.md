# Family profiles and invitations

Open **My team → Grow your crew** in the redesigned app.

- **Little hero:** a parent/admin creates a child with a nickname and character. No child email or password is requested. The child is a real household member with their own task assignments, XP and wallet.
- **Grown-up:** create a one-person link and copy it, use the device share sheet, or scan its locally generated QR code. No email is sent. The recipient explicitly accepts with an existing account or creates an account directly in that home, without creating another household. New adults join as members; the existing role controls can make an adult an admin.
- **Who’s playing?:** choose a child on a shared device. The server replaces the current parent session with an eight-hour child session and revokes that parent token. Returning to parent controls requires a fresh sign-in. Changes of signed-in identity also refresh other tabs.
- **Pair a device:** on the child device open **Sign in → I’m a little hero**. A parent enters its ten-character code and selects the child in their own household. Approval lasts ten minutes; the child device exchanges its separate secret once for a child session. Approval does not sign the parent out of their own device.

Invitations expire after seven days, are single-use, can be cancelled, and stop working if their creator is no longer an admin. The most recent 50 invitations and up to 100 active child profiles are shown. Only token hashes are stored on the server. Child profiles cannot become admins, invite people, create a home, edit quest values or change someone else’s profile. Removing their household membership invalidates their sessions. Children can update their own character, finish assigned quests, earn only the configured points for those completed quests, and redeem affordable rewards.

The existing users table requires an email string. Managed profiles therefore have a random internal identifier in the reserved `children.taskdira.invalid` domain and an unknowable password. This is **not a child email address**: it is suppressed in API responses and cannot be used for password login. The server’s `managedprofiles` record determines restrictions, not the editable `familyRole` label.

## Local preview

The demo at port 3002 stores family setup in this browser’s local storage. Demo invitation links and pairing work between tabs sharing that storage. Use fictitious details. Other demo game changes still reset on reload. A localhost link cannot invite someone on another device over the internet.

## Database changes before real deployment

Apply exactly the migration matching the selected database provider **before starting the updated API**:

- PostgreSQL: `Backend/db/migrations/006_family_access.sql`, after the existing migrations.
- SQL Server: `Backend/db/sqlserver/003_family_access.sql`, after schema and procedures 001/002.

Both add `managedprofiles`, `familyinvitations`, `familypairings` and the transactional `neondb_stp_family_access` routine. Scripts are repeatable and do not remove existing data. Only the isolated local SQL Server `TaskDira_MigrationDev` was migrated during development; no hosted database was changed.

The old direct member-add endpoint now returns 409 and instructs the client to create an invitation. Global user enumeration and direct public user creation are closed; user reads require self/shared household membership, user edits/deletion require self. Profile responses include `isManagedProfile`, and email addresses are only returned to the adult account owner. Existing chore/member APIs remain in use.

The real site needs a public frontend origin, HTTPS API URL, matching CORS configuration, and real API flags. Deployment and email delivery are not part of this change. Configure the API’s family rate limiter for the hosting proxy/IP arrangement during deployment; the current policy uses the direct remote IP and permits 90 requests per minute.

## Verification

From `Frontend`: `npm test` and `npm run build`.

From `Backend`: `dotnet build` and `dotnet test`. To include the local SQL Server integration suite in PowerShell:

```powershell
$env:TASKDIRA_SQLSERVER_TESTS = '1'
dotnet test
```

The integration suite applies migration 003 to its fixed local test database, creates synthetic accounts, exercises real HTTP endpoints, and cleans up its records. It checks concurrent invite acceptance, expiry/revocation, child isolation, parent token revocation, correct quest earnings and single-use device pairing.

From `Backend/tools/family-postgres-tests`: `npm ci` then `npm test`. This uses an in-memory PostgreSQL engine (PGlite) to execute migration 006 and exercise consent, transaction rollback, expiry, child sessions and pairing. It does not connect to a hosted database or replace the SQL Server HTTP integration suite.

Browser checks cover email-free child creation, invitation registration into the existing home, parent-approved pairing, returning to parent sign-in and phone layouts. The original sign-in page remains free of page scrolling at 375×667.
