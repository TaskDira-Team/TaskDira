# Redesign verification — 23 September 2026

- Production build: `npm run build` passed.
- Automated tests: `npm test` passed, **38/38**, including analytics date boundaries and missing history, member scoping, milestone streaks, wallet versus lifetime XP, repeat claims and proof-aware completion routing.
- `git diff --check` passed.
- Production output contains no `preview-history-` fixture records.
- Independent design/code review completed. Fixed the RTL quest-road geometry, mobile menu focus and hidden controls, and nested category-picker keyboard focus.

Browser checks used the explicit local demo at port 3002. Real backend endpoints and real account registration were not exercised.

## Verified browser flows

- Created a 12-point quest; searched for it; completed it. Coins and XP both changed from 180 to 192.
- Redeemed the 50-coin reward. Coins became 142 while lifetime XP remained 192; redeemed state and success feedback appeared.
- Opened pending quest review and approved it. The quest left the open path and its 25 points were awarded.
- Opened a category picker with Enter, moved between category buttons with Tab, selected with Enter, then closed the task dialog with Escape.
- Changed avatar, saved it and saw the update in household membership.
- Changed the graph period to 90 days, selected a day, returned to seven days and filtered by a member. The long-period chart scrolls horizontally so daily targets remain usable on a phone.
- Walked through all three onboarding checkpoints with disposable form inputs, without submitting account creation.
- Inspected public landing, login, home, quests, rewards, achievements, stats, household, leaderboard and profile.
- Checked desktop, 390px phone, 320px narrow phone, English and Hebrew RTL. Verified the small-screen navigation focus returns after Escape and the accessibility button does not cover bottom navigation.
- A clean final browser reload/walkthrough reported no new console errors. Earlier logs from intermediate development/HMR edits are not part of that check.

Screenshots beginning `game-` in `design/screenshots/` document the implemented direction. Full-page screenshots are larger than viewport screenshots; older unprefixed captures are the superseded initial design.

Photo upload, invitation delivery, membership role mutations and backend failure modes were not tested against a live backend. Their existing service contracts and permission gates remain in place.


## Follow-up: floating rewards, reactive auth and fixed sidebar

- Production build and all 38 existing tests passed.
- Browser checked at 1440px desktop and 390px phone widths, including English and Hebrew. No horizontal document overflow at phone width.
- Redeeming a sample 50-coin reward showed the full-screen reveal, actual voucher, 130 remaining coins and preserved 180 XP. Closing returned to the redeemed item state.
- Signup advanced through all three checkpoints using synthetic input without creating an account. Companion speech updated for name/home/checkpoint; password focus showed the sleep mask.
- Sidebar at 720px and 600px height had equal client/scroll height, overflow clip, and logout inside the viewport.
- Motion hook pauses loops for offscreen/hidden-tab/reduced-motion conditions; reduced-motion CSS disables entrances and transitions, and confetti uses disableForReducedMotion.
- Screenshots: floating-shop-desktop.png, floating-shop-mobile.png, reward-reveal.png, auth-reactive-signin.png, auth-signup-mobile-hebrew.png.


## Auth fit and permanent source checkpoint

- Sign-in and all three signup steps fit a 1366 x 768 laptop viewport.
- At 375 x 667, profile fields, avatar icons and badges fit with document height equal to viewport height. English and Hebrew layouts checked in the in-app Chromium browser.
- Avatar Color selection updates the preview and remains selected when switching panels. Registration was not submitted; no account was created.
- Compact avatar mode is only enabled for the public signup screen; the existing profile editor retains the full chooser.
- Natural overflow remains available for browser zoom, software keyboards and exceptionally short screens rather than clipping controls. Physical mobile keyboards were not tested.
- Final build and the existing 38-test suite passed.
