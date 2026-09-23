---
name: TaskDira
description: A colourful household quest game with a miniature home, shiny coins and winding progress trails.
colors:
  canvas: "#f1f7fc"
  paper: "#fff9e9"
  ink: "#244c49"
  public-ink: "#244942"
  muted: "#526963"
  teal: "#087963"
  game-teal: "#27b697"
  teal-edge: "#138c73"
  coral: "#d3483e"
  lilac: "#8150b5"
  yellow: "#ffe568"
  mint-fill: "#bdeace"
  coral-fill: "#ffc5b3"
  lilac-fill: "#dfcafa"
  gold-fill: "#ffe796"
  field: "#fffef9"
  line: "#d7dac2"
  white: "#ffffff"
  secondary-fill: "#eee1ff"
  secondary-ink: "#624584"
  coin: "#ffd34a"
  coin-ink: "#956001"
typography:
  display:
    fontFamily: "'Fredoka Variable', 'Fredoka', 'Heebo', sans-serif"
    fontSize: "clamp(65px, 7.4vw, 104px)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Fredoka Variable', 'Heebo', sans-serif"
    fontSize: "clamp(30px, 3.1vw, 46px)"
    fontWeight: 600
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Fredoka Variable', 'Nunito Variable', sans-serif"
    fontSize: "26px"
    fontWeight: 600
  body:
    fontFamily: "'Nunito Variable', 'Heebo', sans-serif"
    fontSize: "15px"
    lineHeight: 1.55
  label:
    fontFamily: "'Nunito Variable', 'Heebo', sans-serif"
    fontSize: "14px"
    fontWeight: 850
rounded:
  input: "15px"
  button: "17px"
  reward-button: "18px"
  hero-button: "24px"
  dialog: "30px"
  pill: "99px"
  circle: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  page-gap: "30px"
  section-gap: "42px"
components:
  button-primary:
    backgroundColor: "{colors.game-teal}"
    textColor: "#103f35"
    rounded: "{rounded.button}"
    height: "46px"
  button-primary-hover:
    backgroundColor: "#4ec6aa"
  button-secondary:
    backgroundColor: "{colors.secondary-fill}"
    textColor: "{colors.secondary-ink}"
    rounded: "{rounded.button}"
  button-public:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.white}"
    rounded: "{rounded.hero-button}"
    padding: "16px 26px"
    height: "64px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.public-ink}"
    rounded: "{rounded.input}"
    padding: "12px 15px"
    height: "53px"
  nav-current:
    backgroundColor: "#d7f2df"
    textColor: "#155b4c"
    rounded: "{rounded.reward-button}"
    padding: "10px 13px"
    height: "50px"
  chip:
    backgroundColor: "{colors.mint-fill}"
    textColor: "#174d43"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  quest-checkpoint:
    backgroundColor: "#45c6a2"
    textColor: "#eaffee"
    rounded: "{rounded.circle}"
    width: "85px"
    height: "79px"
  reward-shelf:
    backgroundColor: "transparent"
    rounded: "0"
  coin:
    backgroundColor: "{colors.coin}"
    textColor: "{colors.coin-ink}"
    rounded: "{rounded.circle}"
    size: "24px"
---

# Design System: TaskDira

## Overview

**Creative North Star: "The Chore Adventure Toy World"**

TaskDira is a deliberately childish, colourful household game: oversized shiny coins, chunky checkpoints, wiggly trails, floating toy prizes and a friendly original companion. The visual ambition is the delight of a kids' App Store game, with the winding-road clarity of Duolingo, expressed through TaskDira's own home, mascot and palette.

Open compositions let objects, paths and characters carry the hierarchy. The user explicitly rejected a boxed-component look; ordinary statistics, graphs, rewards and member content sit directly on the soft sky-blue and lilac world. Tactile controls and functional dialogs retain their own clear boundaries. The public miniature home, account entry and signed-in household all inhabit the same playful world.

**Key Characteristics:**

- Cream canvases with teal, coral, lilac and yellow toy colours.
- Shiny collectible coins and separate lifetime XP.
- Round checkpoints, dotted quest trails and floating collectible prizes.
- Fredoka display lettering, Nunito body text and Hebrew support.
- An original companion, a miniature 3D home and purposeful game feedback.

This document captures the final game-layer cascade in `Frontend/src/game-world.css`, `world.css`, `components/ui/community.css`, `components/landing/landingWorld.css` and `components/onboarding/gameOnboarding.css`. Earlier quiet-world declarations are compatibility foundations, not the current visual direction.

## Colors

The palette feels like painted toys and collectible stickers on warm paper. Frontmatter records the actual reused colours; the public/auth and signed-in canvases retain their observed small differences.

### Primary
- **Adventure Teal:** public/auth actions and the home identity.
- **Game Teal:** bright signed-in action faces with a darker structural edge.
- **Candy Coral:** public calls to action and enthusiastic headline accents.

### Secondary
- **Collectible Lilac:** XP, reward motifs, selected filters and the current onboarding checkpoint.
- **Butter Yellow:** coins, prices, count badges and celebrations.

### Tertiary
- **Mint, Peach, Lilac and Gold Fills:** toy shapes, sticker faces and category motifs. Pair semantic colour with an icon or label.

### Neutral
- **Cream Canvas / Warm Paper:** signed-in and public/auth worlds.
- **Deep Green Ink / Muted Green:** headings, labels and supporting copy.
- **Warm Field / Soft Line / White:** field surfaces, structural edges and highlights.

**The Two Treasures Rule.** Gold coins represent spendable balance; lilac XP represents accumulated progress. Keep the labels and data distinct.

## Typography

**Display Font:** Fredoka Variable, with Fredoka and Heebo where supplied by the surface.
**Body Font:** Nunito Variable, with Heebo and sans-serif fallback.

Round oversized headings create the childlike personality; heavy labels make controls feel like game pieces. Hebrew uses the existing Heebo treatment and surface-specific RTL rules.

### Hierarchy
- **Display:** public hero lettering follows the frontmatter clamp, with a slight tilt and layered highlight.
- **Headline:** app headings use the headline role; community headings expand to `clamp(36px, 4.4vw, 58px)` at weight 650.
- **Title:** rounded section labels; reward names use 24px and 1.2 line height.
- **Body:** app copy uses 15px and 1.55 line height; explanatory community copy uses 14–16px and 1.5–1.7.
- **Label:** heavy Nunito for controls and form labels. Counters use tabular figures.

Preserve wrapping and readable primary labels on mobile. Small decorative annotations never replace accessible names or essential state labels.

## Layout

The signed-in main canvas is capped at 1440px. The desktop sidebar is 228px, reduces at 1200px, and becomes a 260px drawer at 1023px; short bottom navigation appears at that breakpoint. Mobile main content retains 110px bottom clearance.

Open columns, generous spacing and dashed separators replace routine panel grids. Page gaps are 30px. The home pairs an irregular home island with a reward object, then a quest road with activity; these compositions collapse at 760px.

The quest road is centered within 440px and narrows on mobile. Rewards use four compact open columns, three at 1200px and two at 760px. Milestones become a vertical dotted trail at 750px. Landing compositions change at 1150px, 900px and 700px; auth becomes one column at 750px. Preserve these context-specific breakpoints.

Use logical inline properties and explicit RTL treatments for paths, price tags, drawers and model placement. EN and HE are first-class layouts.

## Elevation & Depth

Depth is structural and playful: thick darker undersides make buttons pressable, shiny rims give coins substance, badges stand proud of paths and soft shadows ground floating reward objects. Routine content panels are transparent without borders or shadows.

### Shadow Vocabulary
- **Game control:** `0 5px 0 #138c73`; compresses when pressed.
- **Quest checkpoint:** `0 8px 0 #199775, 0 13px 0 #e1dfc3`; hover lifts and active presses into the road.
- **Reward action:** `0 5px 0 #105141`; disabled state uses a muted underside.
- **Large coin:** `inset 0 3px 0 #fff5b4, 0 7px 0 #b87b11, 0 13px 20px #bd8c292a`; paired with a warm gradient and glint.
- **Dialog:** `0 12px 0 #173e3b22, 0 24px 80px #173e3b30`; reserved for focused temporary work.

**The Open World Rule.** Put routine content on the canvas; reserve enclosed surfaces for controls, inputs, temporary dialogs and intentional scenes.

## Shapes

Controls are pillowy rounded rectangles; coins and checkpoints are circles. Home scenes use asymmetric percentage radii, while milestones use irregular rounded badge silhouettes. Illustrations tilt slightly like stuck-on toys. Thick edges identify controls; dotted roads connect real tasks and milestones.

The original companion at `Frontend/public/images/dira-mascot.png` is a reusable identity asset. Preserve its proportions and transparent silhouette. Input, button and dialog radii are recorded in frontmatter.

## Components

### Buttons
Use a coloured face and darker underside. App primary actions are bright teal with dark text; public calls to action are coral with white text, with deep teal alternatives. App secondary controls are lilac. Hover lifts, active compresses, and disabled controls lose emphasis. Preserve explicit keyboard focus; onboarding uses a lilac outline with offset. Sizes are context-specific minimum heights rather than fixed content clipping.

### Inputs / Fields
Native warm-white fields have a two-pixel soft border and rounded corners. Auth fields are 56px high; onboarding fields are at least 53px. Keep labels, validation and submission behavior intact. Focus uses a teal border and lilac keyboard outline; errors use warm red surfaces and explicit messages.

### Navigation
Bold labels and chunky coloured icons occupy the desktop rail. The active destination is a mint tile with a darker underside. Drawer and mobile bottom navigation preserve the same selected-state language. Use `aria-current` and readable labels.

### Chips / Filters
Status chips are mint pills. Raised filters use lilac selection and `aria-pressed` for real toggles. Informational chips do not imitate actionable controls.

### Open Shelves / Containers
Rewards float above soft shadows, backed by pastel light pools and small gold price tags. Names, descriptions and redeem controls sit on the canvas below. Profile, household, ranking and statistical content use space, objects and dashed rules. Enclosed dialogs remain intentional focused surfaces.

### Quest Checkpoints / Milestone Trail
Quests are actionable round checkpoints with names, coin/XP rewards and completed states. Keep search, filters and list/calendar alternatives. Milestone badges show genuine progress; their road does not impose sequential unlocking. Onboarding checkpoints represent actual form steps and allow revisiting completed steps.

### Wallet / XP
Coins have a bright rim, darker underside and small highlight. XP uses separate lilac imagery and a label. Redemption changes spendable balance without rewriting lifetime XP. Short wallet feedback communicates actual value changes.

### Home / Companion / Graphs
The interactive 3D home has clear room controls beside its copy. The companion encourages progress throughout the world. Open charts use chunky rounded bars, clear labels and truthful readings; public sample values are explicitly examples and account graphs derive from household records.

Control responses use 160–260ms transitions; progress uses 400ms, the companion bobs over four seconds, and coins glint slowly. Every surface honours `prefers-reduced-motion`; state and actions remain understandable without animation.

## Do's and Don'ts

### Do:
- **Do** give quests, milestones and rewards recognizable physical forms and clear actions.
- **Do** keep ordinary graphs, statistics and reward displays open on the sky-blue and lilac canvas.
- **Do** label coins as spendable balance and XP as lifetime progress.
- **Do** use the original mascot asset at Frontend/public/images/dira-mascot.png.
- **Do** preserve native controls, visible focus, EN/HE directionality and reduced-motion support.
- **Do** show only real account progress; clearly label the public playground and local sample data.

### Don't:
- **Don't** return to a corporate dashboard of bordered cards.
- **Don't** replace the selected palette with the former purple/neon dark theme.
- **Don't** imply that decorative milestone paths impose sequential unlock rules.
- **Don't** make motion, colour or a 3D canvas the sole way to understand or operate the product.
- **Don't** invent activity, adoption figures or reward balances.


## Floating shop and reactive account entry - 23 September 2026

The signed-in app and authentication screens use a smooth sky-blue/lilac/mint background without a dot texture. Public landing colors remain warm. Reward art is deliberately smaller; only the collectible and its shadow float, while redeem controls stay steady. Successful redemption opens a full-screen, unboxed celebration with the actual prize, optional voucher code and remaining wallet balance.

The house companion reacts to email readiness, password focus, submission, errors and the three registration checkpoints. It greets the entered name and household without receiving credentials. Mobile uses a compact companion beside a speech bubble. Continuous decorative motion pauses offscreen, on hidden tabs and with reduced motion; checkpoint changes use short entrance transitions.

The sidebar has no independent scrolling. Height breakpoints tighten navigation and hide optional mascot decoration before reducing control spacing. Navigation, profile and logout remain available on shorter screens.


Authentication now fits standard laptop and phone viewports using compact field groups and a Look/Color/Badge avatar chooser. All choices remain available; profile editing keeps its full chooser. The explicit sample-home link sits in the header. Very short windows, browser zoom and software keyboards retain natural overflow so controls cannot be clipped.
