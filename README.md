# TaskDira

**Same home. New game.** TaskDira turns shared household chores into a game. Every chore is a quest that earns XP and coins. The family spends coins in a shared reward shop and climbs a monthly leaderboard together. It works for families, couples and roommates, in Hebrew (RTL) and English.

## What's inside

- **Home**: a living family world, today's missions, and the household's monthly goal.
- **Quests (המשימות שלנו)**: a golden quest road of chores, plus list and calendar views, search, rooms and saved quests.
- **Reward shop (חנות הפרסים)**: rewards bought with coins, some unlocked by XP, with dated reward tickets.
- **Leaderboard (לוח המנצחים)**: the monthly podium for the household.
- **Achievements and People**: badges, member cards, roles and progress.
- **Family invitations**: invite adults with a one-time link or QR code (valid for 7 days). Add kids as managed profiles and pair their own devices with a code.
- **Live updates**: when anyone saves something, every open screen refreshes within a fraction of a second over a WebSocket.
- **Install on your phone**: the landing page offers "download to phone" (a PWA). This needs https.

## Tech stack

| Part | Stack |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, plain CSS layers (`src/redesign.css` is the final polish layer) |
| Backend | ASP.NET Core (.NET 9) Web API, Dapper, stored procedures |
| Database | SQL Server (scripts in `Backend/db/sqlserver`). PostgreSQL is also supported (`Backend/db/migrations`). |
| Live updates | Raw WebSocket endpoint `/live` that sends "changed" pings, with 5-second polling as a fallback |

```
TaskDira/
├── Frontend/          React app (Vite)
│   ├── src/pages/     Screens (Home, Rewards, Leaderboard, Household, Landing, ...)
│   ├── src/context/   App, auth, household and i18n state
│   ├── src/services/  API clients (familyApi, tasksRemote, installPrompt, ...)
│   └── public/        PWA manifest, service worker, icons
└── Backend/
    ├── src/TaskDira.Api/   Controllers, services, repositories, Program.cs
    ├── db/sqlserver/       000–005 SQL Server schema and procedures
    └── tests/
```

## Run it locally

You need the .NET 9 SDK, Node.js 20 or newer, and SQL Server (Express is fine).

### 1. Database

Create an empty database and run the scripts in `Backend/db/sqlserver` in order (`000_preflight.sql` → `005_family_play.sql`), for example in SSMS.

In Development, if no connection string is set, the API uses `.\SQLEXPRESS` with the database `TaskDira_MigrationDev` and Windows authentication. To use any other server, set the connection string:

```bash
dotnet user-secrets set "ConnectionStrings:TaskDiraSqlServer" "Server=...;Database=...;..." --project Backend/src/TaskDira.Api
```

### 2. API (port 5188)

```bash
dotnet run --project Backend/src/TaskDira.Api --no-launch-profile -- --environment Development --Database:Provider SqlServer --urls http://localhost:5188
```

Always pass `Database:Provider SqlServer`. Without it, the API expects PostgreSQL and won't start.

### 3. Web app (port 3000)

```bash
cd Frontend
npm ci
npm run dev
```

Open http://localhost:3000. The app talks to `http://localhost:5188` by default. Set `VITE_API_URL` to point it elsewhere.

**No backend?** `npm run demo` starts a sample household that lives entirely in the browser on port 3001.

### Tests and build

```bash
cd Frontend && npm test && npm run build
dotnet build Backend/TaskDira.sln
```

## Deploying

Three pieces go online:

1. **Database**: a hosted SQL Server, such as Azure SQL. You can copy a local database with SSMS: *Tasks → Deploy Database to Microsoft Azure SQL Database*.
2. **API**: for example Azure App Service. Required settings:
   - `Database__Provider=SqlServer`
   - `ConnectionStrings__TaskDiraSqlServer=<connection string>`
   - `Cors__AllowedOrigins__0=https://<your-site>`
   - **WebSockets turned on** in the host, for live updates.
3. **Web app**: build it with `VITE_API_URL=https://<your-api>` (`npm run build`) and serve `Frontend/dist` from any static host with https, such as Azure Static Web Apps, Netlify or Vercel.

Invite links and phone install only work over https on the public address.

## More docs

- [PRODUCT.md](PRODUCT.md): product overview
- [DESIGN.md](DESIGN.md): design system
- [FAMILY-SETUP.md](FAMILY-SETUP.md): family profiles, invitations and adventures
- [RUN-THE-REDESIGN.md](RUN-THE-REDESIGN.md): exploring the redesign
- [Backend/CLAUDE.md](Backend/CLAUDE.md): backend notes
