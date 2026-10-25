<div align="center">

<img src="Frontend/public/icons/icon-192.png" width="96" alt="TaskDira mascot" />

# TaskDira

### Same home. New game. 🏠🎮

**TaskDira turns household chores into a game the whole home plays together.**<br/>
Each chore is a quest that earns XP and coins. The family spends coins in a shared reward shop and climbs a monthly leaderboard. Everyone sees it all happen live.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-9-512BD4?logo=dotnet&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL%20Server-2022-CC2927?logo=microsoftsqlserver&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)
![Hebrew + English](https://img.shields.io/badge/עברית%20%2B%20English-RTL%20ready-087963)

<img src="docs/screenshots/landing.jpg" width="900" alt="TaskDira landing page" />

</div>

---

## ✨ Why TaskDira

Nobody fights over a game. TaskDira gives every chore a reward and every member a place on the podium. The home keeps a shared monthly goal, so families, couples and roommates stop nagging and start playing.

| 🗺️ Quest road | 🪙 Earn and spend | 🏆 Compete together | ⚡ Live |
|:---:|:---:|:---:|:---:|
| Chores become stops on a golden road | XP for progress, coins for rewards | A monthly podium and a household goal | Everyone sees changes in about 0.1 s |

## 📸 A look inside

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/home.jpg" alt="Home" /><p align="center"><b>Home</b>: the family world and today's missions</p></td>
    <td width="50%"><img src="docs/screenshots/quests.jpg" alt="Quest road" /><p align="center"><b>Quest road</b>: chores on a golden path</p></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/shop.jpg" alt="Reward shop" /><p align="center"><b>Reward shop</b>: spend the coins you earned</p></td>
    <td width="50%"><img src="docs/screenshots/leaderboard.jpg" alt="Leaderboard" /><p align="center"><b>Leaderboard</b>: the monthly podium</p></td>
  </tr>
</table>

### 📱 Made for phones too

<p align="center">
  <img src="docs/screenshots/phone-home.jpg" width="240" alt="Phone home" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/phone-tasks.jpg" width="240" alt="Phone quests" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/phone-rewards.jpg" width="240" alt="Phone shop" />
</p>

Phone screens use 2- and 3-up card grids, a bottom tab bar and a menu that fits without scrolling. You can install TaskDira on your home screen straight from the landing page.

---

## 🎮 The game loop

```mermaid
flowchart LR
    A["🧹 Chore<br/>(a quest)"] -->|"complete it"| B["⭐ XP<br/>+ 🪙 coins"]
    B --> C["🏆 Leaderboard<br/>monthly podium"]
    B --> D["🎯 Household goal<br/>shared progress"]
    B --> E["🛍️ Reward shop<br/>spend coins"]
    E --> F["🎟️ Reward ticket<br/>pick a date"]
    C -.->|"motivation"| A
    D -.->|"teamwork"| A
    F -.->|"fun earned"| A
```

## 🧩 Features at a glance

```mermaid
mindmap
  root((TaskDira))
    Quests
      Golden quest road
      List and calendar views
      Rooms and search
      Saved quests
      Checklists and help requests
    Rewards
      Coin shop
      XP-locked prizes
      Dated reward tickets
    Family
      Invite links and QR
      Kids as managed profiles
      Device pairing codes
      Roles and avatars
    Progress
      Monthly leaderboard
      Household goal
      Achievements and badges
    Experience
      Live sync for everyone
      Hebrew RTL and English
      Installable PWA
      Phone-first layouts
```

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Client["🖥️ / 📱 Browser (React 19 + Vite, PWA)"]
        UI["Screens<br/>Home · Quests · Shop · Leaderboard · People"]
        CTX["AppContext<br/>state + change-aware refresh"]
        UI <--> CTX
    end

    subgraph API["⚙️ ASP.NET Core 9 API"]
        AUTH["Session auth<br/>middleware"]
        CTRL["15 controllers<br/>63 endpoints"]
        LIVE["LiveUpdates<br/>/live WebSocket"]
        AUTH --> CTRL
    end

    DB[("🗄️ SQL Server<br/>tables + stored procedures")]

    CTX -- "REST / JSON" --> AUTH
    CTRL -- "Dapper" --> DB
    CTRL -- "after each save" --> LIVE
    LIVE -- "📣 'changed' ping" --> CTX
```

### ⚡ How live updates work

When anyone saves something, every open screen refreshes almost at once. The ping never carries the data itself; each screen fetches the new data through the normal API.

```mermaid
sequenceDiagram
    autonumber
    participant K as 📱 Karina
    participant API as ⚙️ API
    participant DB as 🗄️ SQL Server
    participant R as 💻 Rafael
    R->>API: open /live WebSocket + session token
    K->>API: POST complete chore
    API->>DB: save
    API-->>K: 200 OK
    API--)R: "changed"
    R->>API: refresh data
    API-->>R: new chores, points, leaderboard
    Note over R: Screen updates in about 0.1 s ✨
```

If the socket drops, the app reconnects on its own. A 5-second poll stays as a backup.

### 💌 Joining a family

```mermaid
flowchart LR
    A["👑 Admin taps<br/>'Who's playing?' → Adult"] --> B["🔗 Invite link + QR<br/>one use · 7 days"]
    B --> C{"Has an account?"}
    C -->|"No"| D["Create account<br/>& join"]
    C -->|"Yes"| E["Sign in<br/>& accept"]
    D --> F["🎉 In the home<br/>appears live for everyone"]
    E --> F
```

---

## 📊 By the numbers

```mermaid
pie showData
    title Lines of code
    "React (JSX)" : 16701
    "CSS" : 18745
    "JavaScript" : 8244
    "C# (.NET)" : 7446
    "SQL" : 1214
```

| 13 | 50 | 15 | 63 | 680+ |
|:---:|:---:|:---:|:---:|:---:|
| screens | UI components | API controllers | endpoints | Hebrew/English strings |

---

## 🧰 Tech stack

| Layer | Tech |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, layered CSS (`src/redesign.css` is the final polish layer), PWA (manifest + service worker) |
| **Backend** | ASP.NET Core (.NET 9) Web API, Dapper, stored procedures, raw WebSockets for live updates |
| **Database** | SQL Server (`Backend/db/sqlserver`). PostgreSQL is also supported (`Backend/db/migrations`). |
| **Languages** | Hebrew (RTL) and English, switchable anywhere |

```
TaskDira/
├── Frontend/              React app (Vite)
│   ├── src/pages/         Screens: Home, Rewards, Leaderboard, Household, Landing, ...
│   ├── src/components/    UI building blocks
│   ├── src/context/       App, auth, household, i18n state
│   ├── src/services/      API clients, install prompt, ...
│   └── public/            PWA manifest, service worker, icons
├── Backend/
│   ├── src/TaskDira.Api/  Controllers, services, repositories, Program.cs
│   ├── db/sqlserver/      000–005 schema + stored procedures
│   └── tests/
└── docs/screenshots/      Images used in this README
```

---

## 🚀 Run it locally

You need the **.NET 9 SDK**, **Node.js 20+** and **SQL Server** (Express is fine).

**1. Database.** Create an empty database and run `Backend/db/sqlserver/000_preflight.sql` → `005_family_play.sql` in order, for example in SSMS.

In Development, if no connection string is set, the API uses `.\SQLEXPRESS` with the database `TaskDira_MigrationDev` and Windows authentication. To use another server:

```bash
dotnet user-secrets set "ConnectionStrings:TaskDiraSqlServer" "Server=...;Database=...;..." --project Backend/src/TaskDira.Api
```

**2. API** (http://localhost:5188):

```bash
dotnet run --project Backend/src/TaskDira.Api --no-launch-profile -- --environment Development --Database:Provider SqlServer --urls http://localhost:5188
```

> ⚠️ Always pass `Database:Provider SqlServer`. Without it, the API expects PostgreSQL and won't start.

**3. Web app** (http://localhost:3000):

```bash
cd Frontend
npm ci
npm run dev
```

The app calls `http://localhost:5188` by default. Set `VITE_API_URL` to point it elsewhere.

> 💡 **No backend?** `npm run demo` starts a sample household that lives entirely in the browser (port 3001).

**Tests and build:**

```bash
cd Frontend && npm test && npm run build
dotnet build Backend/TaskDira.sln
```

---

## ☁️ Deploying

```mermaid
flowchart LR
    U["👨‍👩‍👧 Phones & laptops"] -- "https" --> W["🌐 Static host<br/>Frontend/dist"]
    U -- "https + wss" --> A["⚙️ API host<br/>WebSockets ON"]
    A --> S[("🗄️ Azure SQL")]
```

1. **Database**: a hosted SQL Server, such as Azure SQL. You can copy a local database with SSMS: *Tasks → Deploy Database to Microsoft Azure SQL Database*.
2. **API**: for example Azure App Service, with these settings:
   - `Database__Provider=SqlServer`
   - `ConnectionStrings__TaskDiraSqlServer=<connection string>`
   - `Cors__AllowedOrigins__0=https://<your-site>`
   - **WebSockets turned on**, for live updates
3. **Web app**: build with `VITE_API_URL=https://<your-api>` (`npm run build`) and serve `Frontend/dist` from any static host with https, such as Azure Static Web Apps, Netlify or Vercel.

> Invite links and "install on your phone" need https on the public address.

---

## 📚 More docs

| Doc | What's in it |
|---|---|
| [PRODUCT.md](PRODUCT.md) | Product overview |
| [DESIGN.md](DESIGN.md) | Design system |
| [FAMILY-SETUP.md](FAMILY-SETUP.md) | Family profiles, invitations, adventures |
| [RUN-THE-REDESIGN.md](RUN-THE-REDESIGN.md) | Exploring the redesign |
| [Backend/CLAUDE.md](Backend/CLAUDE.md) | Backend notes |

<div align="center">

**Made with 💚 by the TaskDira team**

</div>
