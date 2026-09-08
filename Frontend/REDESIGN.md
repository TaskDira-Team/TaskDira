# TaskDira — Same home. New game.

The public experience has been rebuilt around a warm, miniature-home visual identity. This change covers the landing page, an interactive demo, login, and the existing registration wizard. The signed-in dashboard also has a personal saved-chores shelf. Existing task assignment, completion, and reward APIs are preserved.

## Run

Use Node.js 22.12+ (or another version supported by the repository's Vite version).

```sh
cd Frontend
npm ci
npm run dev
npm run build
node --test src/components/landing/demoState.test.js src/components/landing/tourContent.test.js src/hooks/savedChores.test.js
```

GSAP 3.15.0 and Three.js 0.185.1 were added through npm, with package-lock.json updated. Verification uses the npm-locked dependencies (Vite 8.1.5). The 3D scene is dynamically imported only after the visitor chooses to explore. Its approximately 623KB minified chunk triggers Vite’s advisory size warning; it is not part of the initial landing download.

## What changed

- A real Three.js miniature home with GSAP roof and hinged-door animation, three room camera transitions, orbit controls, responsive rendering, and reduced-motion support. Rendering is on demand; closing the explorer disposes geometry, materials, controls, and the renderer. A static illustrated fallback remains available when WebGL fails.
- An optional Hebrew/English narrated homepage tour. Browser speech synthesis starts only after activation, follows the current section, and supports pause, replay, captions, and close. Speech stops when the page is hidden or the component unmounts. A matching device voice is required; Hebrew may need an installed OS voice. Captions remain available without one. No paid speech API or microphone is used.
- Saved chores in the playground and signed-in dashboard, with a sidebar shelf and Saved filter. Bookmarks persist in this browser, scoped by user and household. They are not synchronized between devices. Storage failures fall back to the current session. Deleted tasks are not displayed in the shelf.
- Signed-in public-route redirects now happen in an effect, fixing a React state-update-during-render warning seen during login testing.

- Responsive Hebrew/English landing page with room selectors, real section navigation, explanatory feature panels, native FAQ disclosures, and reduced-motion support.
- A clearly labeled, browser-only playground. Complete quests, earn points, redeem rewards, and compare an example family's rankings. Reload-safe storage is independent from account data. Reset affects only the playground.
- New `/register` route; sign-up buttons open registration rather than the login tab.
- Login supports accessible labels, password visibility, required-field validation, loading state, and existing API error handling.
- Registration retains the existing wizard and API contract, with accessible label associations and no duplicate brand heading.
- On-demand page loading and confetti, an optimized 161KB WebP hero, custom favicon, and page metadata.
- The old unverifiable marketing counters and example testimonials were removed.

## Verification

Production build succeeded. Ten Node tests cover voice-language selection, scroll-section selection, per-user/household bookmark keys, invalid bookmark data, save/remove round trips, and duplicate completion, insufficient funds, reward deductions, preservation of earned XP, storage round trips, and invalid saved state. Browser checks covered desktop and 390px/320px viewport overrides, Hebrew/English layout, room controls, task completion, reward redemption, refresh persistence, modal dismissal, mobile navigation, FAQ, public routes, and login validation. The update also exercises 3D room controls, bookmark refresh persistence in the playground and a local sample dashboard, and scroll-following narration captions. Hebrew gracefully falls back to captions when no Hebrew voice is installed.

The dashboard was checked using the repository’s local sample API mode in a separate temporary development server; the delivered production build retains the normal real-API defaults. Account creation and authenticated API calls were not exercised against a live server. To use real accounts locally, run the existing backend or configure `VITE_API_URL` using the normal deployment environment. Production environment variables, database records, and the Railway deployment are unchanged. The update is intended for a separate Git review branch before merging into the deployment branch.

## Main files

- `src/pages/Landing.jsx`
- `src/pages/AuthRoute.jsx`
- `src/components/landing/Playhouse.jsx`
- `src/components/landing/demoState.js` and `demoState.test.js`
- `src/components/landing/landing.css`
- `public/images/taskdira-house.webp`

## Hero asset provenance

Generated using the built-in imagegen tool. The final project asset is `public/images/taskdira-house.webp`; the generated PNG was converted to WebP at quality 88 without changing its content.

Final prompt:

> Use case: stylized-concept. Asset type: hero illustration for a premium family chore game website. Create a stunning highly detailed isometric 3D miniature open dollhouse, two floors on a rounded warm terracotta platform, viewed from above at a three-quarter angle. A cozy contemporary home with coral-orange kitchen on lower left, pale sage green sofa and rounded ivory rug on lower right, bedroom with yellow blanket upstairs, a laundry basket with folded towels, small leafy potted trees, books and warm wood details. Roof partially removed as an architectural cutaway, rear walls cream, playful tiny stairway. No people. Premium tactile clay-render aesthetic, matte ceramic and soft plastic, like a beautifully crafted physical miniature, subtle ambient occlusion and warm afternoon studio light. Color palette orange terracotta, butter yellow, sage green, warm ivory. Entire isolated miniature centered with generous negative space on all four sides, subject takes up 80% of square frame. Seamless flat warm off-white background #f7f5ef and gentle contact shadow. Sophisticated design object, polished octane-render quality. No text, no letters, no UI cards, no logos, no watermarks. Square image.
