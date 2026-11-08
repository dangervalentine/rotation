# Quickstart: Validating Page Flow & Design Refinement

## Prerequisites

- Node and npm as used by the repo (`npm install` done)
- A Chromium browser for the audit. Set `CHROME_PATH` if Chrome isn't installed, for example on this machine:
  `CHROME_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"`

## 1. Automated checks

```sh
npm run typecheck
npm test          # existing suites + route.ts + dek contrast pairs
npm run build
```

Expected: all pass. `tokens.test.ts` asserts `ink` on `paper` and `paper-raised` ≥ 7:1 in both themes.

## 2. Lighthouse audit (before and after)

```sh
npm run build && npm run preview &                       # http://localhost:4173
node scripts/lighthouse.mjs --phase before   # run once on the unchanged app
node scripts/lighthouse.mjs --phase after    # after implementation
```

Expected: `specs/001-page-flow-refinement/lighthouse/REPORT.md` lists, for `#wardrobe`, `#outfits`, `#rotation`, `#rotation/day/0` and `#print` in light and dark themes at desktop and mobile sizes, **Accessibility = 100** and **Best Practices ≥ 95** in the *after* phase. Any exception is listed with a reason.

## 3. Manual scenarios (`npm run dev`, http://localhost:5173)

| # | Do | Expect | Spec |
|---|---|---|---|
| 1 | Open `/` with no hash | Nav reads 01 Wardrobe & costs · 02 Outfits · 03 Rotation · 04 Print, and Wardrobe is active | US2 |
| 2 | Open `/#rotation` | Rotation view, with no builder anywhere on the page | US1-1, FR-005 |
| 3 | At 1440 px wide, click Wed of week 1 | A panel slides in from the right titled "Wed · Week 01", focus is on its title, and every day of the week stays readable on the left | US1-2/3 |
| 4 | Change the pants | The Wed card updates live, shows "Edited, not applied", and a flag appears on Thu if it repeats | US1-4 |
| 5 | Click Thu in the calendar | Confirm dialog: Apply / Discard / Keep editing. Choose Keep editing and focus returns to the panel | US1-7 |
| 6 | Click Apply in the panel, then click Thu | The panel switches to Thu without closing, and the URL becomes `#rotation/day/3` | US1-5/8 |
| 7 | Press Escape | The panel closes, focus is on the Thu day, and the URL is `#rotation` | US1-6 |
| 8 | Open a day, then press browser Back | The panel closes and the view stays Rotation | Edge case |
| 9 | Tab through the open wide panel, then press F6 | Focus moves between the panel and the day grid | FR-012 |
| 10 | At 375 px wide, tap a day | A bottom sheet with a dimmed backdrop appears, Tab stays inside it, tapping the backdrop closes it, and nothing scrolls sideways | US1-10, FR-021 |
| 11 | Turn on OS reduced motion and open a day | The panel appears without sliding | FR-013 |
| 12 | Change weeks from 2 to 1 while a week-2 day is open | The panel closes and the URL is `#rotation` | Edge case |
| 13 | Outfits: use the Keep checkboxes and "Try every" by keyboard | Space toggles Keep, arrow keys move within the segmented group, and the focus ring is visible | US4 |
| 14 | Toggle dark theme (OS) and view the masthead | The subtitle is italic in solid ink, with visibly sturdier strokes than before, and legible in both themes | US3 |
| 15 | Print preview on `#print` | No panel, nav or save bar in the output | Edge case |
| 16 | Use a screen reader (NVDA or Narrator) on the Rotation view | Day buttons are announced as "…, collapsed/expanded, has popup dialog", and the panel is announced by its title | US4-3/4 |

## Results (2026-11-08)

Checked against the dev server, using Playwright with Chromium.

| # | Result |
|---|---|
| 1 | ✅ Nav reads 01 Wardrobe & costs · 02 Outfits · 03 Rotation · 04 Print, and `/` opens Wardrobe |
| 2 | ✅ No builder on `#rotation` |
| 3 | ✅ At 1440 px the panel is docked right, titled "Week 1, Wed" with focus on the title, and both weeks stay fully readable beside it |
| 4 | ✅ A shuffle in the panel updates the day card live and shows "Editing · not applied" |
| 5 | ✅ Clicking Thu with changes opens "Unapplied changes to Week 1, Wed". **Keep editing** has focus by default and returns focus to the panel title |
| 6 | ✅ **Discard** in the confirm, then Thu: the panel switches to "Week 1, Thu" and the URL becomes `#rotation/day/3` |
| 7 | ✅ Escape closes the panel, the URL is `#rotation`, and focus is on the Thu day |
| 8 | ✅ Back closes the panel and stays on Rotation, with focus on the day. Back with unapplied changes asks first, and Discard then closes the panel |
| 9 | ✅ F6 moves focus from the panel title to the open day |
| 10 | ✅ At 375 px: bottom sheet, backdrop present, tapping the backdrop closes it, and focus returns to the day. There is no sideways scroll at 360 px on any view or on the open sheet |
| 11 | ✅ Under reduced motion the sheet has `animation: none` |
| 12 | ✅ Weeks 2 → 1 with a week-2 day open: the panel closes and the URL is `#rotation` |
| 13 | ✅ "Try every" is a radiogroup, and the arrow keys move and select. Space toggles **Keep**, and the focus ring is visible |
| 14 | ✅ The dek is in ink at opsz 14 / weight 450, and the light and dark contrast tests (≥ 7:1) pass |
| 15 | ✅ Print media: sheet, masthead/nav and save bar are `display: none`, and the body padding resets to 0 |
| 16 | ⚠️ Not run with a real screen reader. The accessibility tree shows the day as `button … expanded, haspopup=dialog`, the panel as `dialog "Week 1, Wed"`, and the confirm as `alertdialog` with a heading |

SC-004: at 1280×800 with the panel closed, the Rotation section (settings and the 2×5 calendar) is 457 px tall (y 398–855), so it fits on one screen. The page is 1025 px tall, with no builder below the calendar.
