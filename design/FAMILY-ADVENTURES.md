# Family adventures

An extension of the existing TaskDira toy world. Mode: Operate, with a playful shared adventure as the entry point. Reuse Fredoka/Nunito, the sky canvas, mint controls, lilac and peach toys, and the real miniature house. The first viewport is an open two-column composition: the actual adventure and crew progress beside a clay diorama. On phones the small diorama sits above the story. A staggered mission trail carries the sequence; jobs can be completed in any order. The weekly menu uses open rows, rewards use physical ticket stubs, and personal rooms change the real Three.js bedroom.

## Shipped flows

- `/adventures`: parent chooses one of three themes and 1–8 existing open, assigned missions. Completion uses actual `Done` records, not pending approvals or client counters. Every participant earns a moon keepsake when the adventure finishes. Parent can archive an unfinished adventure without deleting its missions or removing XP. Snapshots preserve earned progress after a mission is removed or reopened.
- `/adventures?tab=room`: each member chooses bedding colour and places earned keepsakes in their own bedroom. Cloud cushion is free; lamp, plant and cup need three completed tidying, caring or kitchen tasks respectively. Moon comes from a completed adventure. Preview changes require an explicit Save. Saved room choices also appear in the home scene. Text controls remain usable if WebGL is unavailable.
- `/adventures?tab=week`: parent offers up to 30 existing assigned jobs. Each person chooses up to three of their own. Unfinished choices can be released; parent edits preserve chosen promises. The menu rolls over each Monday at 00:00 UTC; existing tasks are not silently deleted or duplicated. Parent-reviewed rotation suggestions use completed jobs per skill and exclude active adventure jobs and already chosen promises. Skill counts do not determine a child’s age or safety suitability.
- Mission guide → A little help?: send Show me / Help me start / Do it with me, with the mission and step number. One open request per person and mission. The inbox supports three explicit parent replies and resolution. Completion resolves the request. Non-admins receive only their own requests. No emails, SMS or external notifications are sent.
- Reward shop → Tickets to good times: claimed rewards become tickets, preserving the reward title and owner. A parent sets a date and part of day, can change the plan, and explicitly marks it enjoyed. Children see the plan. Scheduling never spends coins again. Happy memories holds enjoyed tickets. Removed rewards retain tickets once snapshotted.

## Persistence and boundaries

Production uses `GET/POST /api/family/{household}/play`. A server-held household row lock protects each document mutation and its first insert; revisions reject stale intent with 409. The server loads membership, managed-profile status, tasks and claims itself. It validates ownership, permissions, unlocks, dates and limits. Reads reconcile real completions/claims before returning state. Live refresh occurs on focus, visibility return and every 30 seconds while visible. There is no hosted deployment or migration in this change.

Apply `Backend/db/migrations/008_family_play.sql` after migrations 006/007 for PostgreSQL, or `Backend/db/sqlserver/005_family_play.sql` after 003/004 for SQL Server, before starting the updated API. Both add a household-scoped document table and preserve existing data. Authentication and reward spending continue through existing APIs.

The explicit local demo seeds a sample adventure and weekly menu from its actual sample tasks. Play state uses `td.family-play.v1.<household>`; game records (missions, claims and wallets together) use `td.preview-progress.v1`. Demo persistence is local to this browser; it is not a substitute for the server’s cross-device persistence. Native Web Locks serialize demo play commands across tabs when available. The in-memory demo game still needs a refresh to load other tabs’ mission/wallet changes. A failed browser-storage write surfaces an error instead of pretending a save succeeded.

## Validation

Pure frontend tests cover co-op completion, deduplication, room unlock ownership, help lifecycle, ticket date validation, claim prerequisites, weekly limits and preview persistence. C# rule tests exercise parent boundaries and earned progress. Authenticated local SQL Server HTTP integration checks household isolation, child ownership, concurrent stale writes, help replies, saved rooms and scheduling without a second wallet debit. PGlite executes the repeatable document migration, Unicode round trip and cascade behavior. Browser checks cover the real forms and scene on desktop/mobile and Hebrew RTL.

## Artwork

`Frontend/public/images/moon-picnic.png` and `garden-camp-adventures.png` were generated with the built-in image generation tool and copied into the repository. Both retain their generated alpha channel. No remote asset requests or paid services are required at runtime. The second image contains equal left garden and right camp cells, displayed with CSS background positioning. No image processing changed the generated artwork.

Generation direction: premium isometric stop-motion clay toy dioramas using mint, coral peach, lilac, butter yellow and ivory; transparent background, no people, text, UI or frame. The moon diorama combines a crescent moon, coral/teal toy rocket, picnic basket, cups and lilac blanket. The two-cell sheet combines a flower-filled wheelbarrow/gate/watering can and a lilac tent/teal sleeping bag/lantern/pine trees. These are decorative assets; live text and progress are ordinary accessible HTML.
