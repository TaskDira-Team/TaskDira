# Open TaskDira

This project turns shared household chores into quests, earned XP, spendable coins, household rewards, character customisation and team progress. The redesign includes the public 3D home, sign-in/onboarding and the signed-in app.

In VS Code, open the **TaskDira-inspect** folder. In its terminal:

```powershell
cd Frontend
npm ci
npm run demo
```

Open the local URL printed by Vite (normally `http://localhost:3001`). Choose **Start the adventure!**, then **Explore the sample home** on the login page. This explicit development preview uses a clearly labelled sample household, requires no backend and resets sample mutations when the page reloads. If Vite chooses another port, use the URL it prints.

To use real accounts and household data, run `npm run dev` instead and start/configure the existing .NET backend following the original README. Real API defaults are preserved. No database or remote deployment was changed. Demo fixtures are gated behind development mode and are excluded from a normal production build.

## Explore

- Play home: interactive miniature house, room selection, evening lighting, exploded floors and a winding quest path.
- Quest road: checkpoints, searchable tasks, saved tasks, list/date alternatives and task management.
- Power stats: task/XP activity, member contribution, cumulative points, category workload, 84-day activity calendar, period/member filters and CSV export.
- Reward shop: spendable coin wallet and unlock requirements separated from lifetime XP.
- Badge trail: milestones derived from available completed tasks, XP and current streak.
- Team stars, My team and My character: rankings, membership, invitations and avatar/profile editing.
- English/Hebrew, RTL, responsive phone navigation, keyboard focus and reduced-motion support.

Charts reflect available task records and their current point values, not a full accounting ledger. Deleted tasks and missing completion dates cannot contribute historical activity. Milestones do not grant extra coins.

## Validate

```powershell
npm test
npm run build
```

Skills and agent profile provenance: [design/TOOLS-AND-SOURCES.md](design/TOOLS-AND-SOURCES.md).
