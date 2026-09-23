# Design tools and sources

GitHub repositories were searched by star count and then checked for relevance to this React app. Counts below were retrieved on **23 September 2026**, not a guarantee of quality or an exhaustive global ranking. Collection-level stars are not individual-skill stars. Exact reference revisions are in `research-sources.json`.

| Repository | Stars at check | Decision |
| --- | ---: | --- |
| [Anthropic skills](https://github.com/anthropics/skills) | 177,722 | Broad collection reviewed; not installed wholesale |
| [Agency Agents](https://github.com/msitarzewski/agency-agents) | 154,252 | UI Designer, UX Architect and Whimsy Injector profiles saved under `design/agents/`, with license |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | 129,984 | Installed `ui-ux-pro-max` |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | 89,412 | Reviewed; avoided overlapping prescriptive design rules |
| [Impeccable](https://github.com/pbakaus/impeccable) | 70,013 | Installed `impeccable`; used design direction, review and documentation workflow |
| [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills) | 31,473 | Installed `web-design-guidelines` for interface review |

Installed skills live in the local Codex skills directory (`$CODEX_HOME/skills`). They are agent instructions and review resources, not JavaScript packages shipped to app visitors. Restart Codex / start a fresh session to load newly installed skills automatically. For subsequent work, ask to use `$ui-ux-pro-max`, `$impeccable`, or `$web-design-guidelines`. The downloaded Agency profiles are reference instructions, not separately registered runtime agents.

Your explicit visual direction takes precedence: a very childish mobile-game world, winding quest and achievement paths, shiny coins, XP, an original house mascot, and fewer repeated boxes. The design tools support this choice; their default aesthetic does not replace it.

The app uses its existing React, Three.js, Framer Motion, GSAP and Lucide stack. Added locally served Fredoka and Nunito variable fonts. No new paid service is needed to run it.

## Original mascot

Built-in ImageGen generated `Frontend/public/images/dira-mascot.png`. The transparent output was copied into the project without image processing. Final generation prompt:

Use case: stylized-concept. Asset type: transparent game mascot PNG for TaskDira, a very childish cheerful household chores game. Create a single adorable original little living house character, chunky rounded cream cottage body, oversized coral-red soft roof like a cap, huge expressive dark teal oval eyes, peach cheeks, joyful open smile, little teal rubber arms and feet, one arm waving, the other holding a big shiny yellow gold coin embossed with a simple star. Bouncy soft 3D clay toy render, premium children's mobile game sticker art, simple bold silhouette, cute and slightly silly. Full body centered, generous transparent margin, friendly front three-quarter angle. Palette cream teal coral yellow lilac. Genuinely transparent background, no environment, no lettering, no watermark, no logos, no owl. One coherent character only.

## Design reference

`DESIGN.md`, `PRODUCT.md` and `.impeccable/design.json` document the implemented system. `screenshots/` includes browser captures; files starting with `game-` show the final childlike direction. The older screenshots record the superseded first pass.
