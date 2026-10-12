# Family world · signed-in home

The approved first release serves mixed ages with support per skill. It extends TaskDira's existing miniature-home art direction; it does not replace the public landing page.

## Direction contract

**Thesis:** helping at home builds a place the family owns together. The home opens on a shared scene and a short set of the current player's assigned missions.

**Own world:** existing Fredoka/Nunito lettering, blue-green ink, grassy toy terrain, coral furniture, lilac clubhouse roof and warm toy materials. Open mission compositions replace a dashboard of statistics.

**Story:** see what the family has built, choose a useful mission, follow parent-authored steps, complete it through the existing task flow, then place an earned decoration.

**First viewport:** a welcoming heading and three destinations precede the scene. The interactive house has the full scene width, with a thick garden island, trees, pond and clubhouse. Building milestones are a compact trail below the scene on every screen size. Decoration controls use object buttons and four explicit placement choices, with no native dropdowns.

**Interaction:** a new clubhouse section or decoration grows into the 3D scene. Physical button edges compress on press. Room camera changes take half a second; first entry fits the whole island immediately. Reduced-motion preferences disable decorative motion. Text milestones and ordinary controls remain usable without WebGL.

**Scope:** one clubhouse, three decorations, per-member/per-skill support, guided existing task checklists, read-aloud when a matching browser voice exists, and three adult-reviewed mission templates. No new currency, rank competition, push notifications or inferred task instructions.

## Data and behavior

- Missions are assigned ToDo/InProgress tasks; pending approvals have their own waiting state. No filler missions are invented for an empty home.
- Together shows one step and a grown-up prompt; hints shows one step; independent shows the whole checklist. Any mode can ask for help.
- A household admin sets support for tidying, kitchen, caring and other skills. Unconfigured skills default to hints. Support never grants permissions or changes rewards.
- The shared clubhouse adds stages at 1, 4 and 8 distinct completed tasks. Garden/picnic/telescope decorations unlock at 3, 8 and 15. All are reusable, free decorations rather than purchases.
- The server snapshots completed task IDs when the world is read/changed. Reopening or removing a credited task does not remove progress. Tasks deleted before the first snapshot cannot be reconstructed.
- Placement is shared across the household; concurrent updates to the same decoration are last-write-wins. Other devices see updates when returning to the page or refreshing.
- Demo world settings/progress persist only in this browser. Sample tasks and reward claims reset on reload. The explicit demo contains 24 open missions with authored three-step checklists, 137 completed missions across six weeks, and 18 rewards covering available, unaffordable, locked and claimed states. XP and wallet balances are calculated from those records. Real households receive no sample records.

## Validation

Frontend selection/progress/support tests, PostgreSQL routine execution, and authenticated SQL Server HTTP integration cover progress deduplication, household isolation, locked decorations, admin support control, and child placement. Browser QA covers desktop, phone, Hebrew, persisted placement and a template mission advancing through its checklist.
