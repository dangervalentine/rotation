# Research: Page Flow & Design Refinement

Phase 0 output for [plan.md](plan.md). Each entry gives the decision, the reason for it, and the alternatives considered.

## R1. Day editing surface: modal, side sheet, or inline?

- **Decision**: On wide screens (≥ 1024 px), a **non-modal side panel** docked to the right edge. While it is open, the calendar reflows into the remaining width, or the panel overlays the calendar's far edge when there is too little room. On narrow screens (< 1024 px), a **modal bottom sheet** with a dimmed backdrop.
- **Rationale**: The user wants to "see other days' outfits" while editing, and wants something more elegant than "a new row of content". A non-modal inspector keeps the calendar visible and operable, so clicking another day switches days (spec US1 #8) and repeat flags update live beside the panel. On phones there is no room beside the calendar, so a modal bottom sheet is the platform convention, and there focus trapping is correct. Google Calendar, Linear, Figma and Notion all use this split for editing one item in a collection.
- **Alternatives considered**:
  - *Centered modal*: covers the calendar, which defeats the purpose.
  - *Inline row or expanding cell*: this is the "new row of content" the user asked to avoid, and it reflows the grid on every selection.
  - *Popover anchored to the day*: too small for the five-slot builder and the actions, and it covers neighbouring days.
  - *Modal side sheet on desktop as well*: the focus trap and click-outside-to-close conflict with switching days by clicking the calendar.

## R2. Accessible component foundation

- **Decision**: Extend the **Radix UI Primitives** family the app already uses (`@radix-ui/react-select` 2.x). Add:
  - `@radix-ui/react-dialog`: side panel (`modal={false}` on wide screens) and bottom sheet (`modal` on narrow screens)
  - `@radix-ui/react-alert-dialog`: "Apply or discard changes?" confirmation
  - `@radix-ui/react-checkbox`: `Check`
  - `@radix-ui/react-toggle-group`: `Segmented` (single-select, roving focus with arrow keys)
- **Rationale**: Radix is unstyled, so the Rotation design system keeps full control of the look (spec FR-018). It is among the most widely used React primitive libraries (it underlies shadcn/ui), follows the WAI-ARIA Authoring Practices, handles focus scope, return focus, Escape, scroll lock and portals, and supports React 19. Staying in one family avoids two competing systems (spec Assumptions).
- **Alternatives considered**:
  - *React Aria Components (Adobe)*: excellent accessibility, but a second system next to Radix Select, and a larger API to restyle.
  - *Headless UI*: smaller component set, and no toggle-group or alert-dialog equivalents.
  - *MUI, Chakra, Mantine*: styled systems whose visual defaults fight the editorial design system.
  - *Native `<dialog>`*: good for the modal case, but non-modal `show()` gives no return focus or Escape handling, and it would have to be rebuilt by hand.
- **Not changed**: The `Tabs` component stays as **links with `aria-current="page"`** inside `<nav>`. These are view routes, not in-page tab panels, so a link nav is the correct pattern, and Radix Tabs (`role="tablist"`) would be wrong here. `Button`, `Field` and `TextArea` stay native elements, because native already gives the correct semantics.

## R3. Panel state in the URL (back button and deep links)

- **Decision**: Use the hash route `#rotation/day/<index>` (0-based look index) for an open panel. Opening a day uses `history.pushState`. Switching days while the panel is open uses `replaceState`, so Back always closes the panel and leaves the person on `#rotation` (spec edge case). `#rotation` alone means the panel is closed.
- **Rationale**: The browser back action has to close the panel (FR-010) without changing views. A URL also lets the audit load the "panel open" state directly (FR-023). It reuses the hash routing the app already has, so no router dependency is needed.
- **Alternatives considered**: Component state only (Back would leave the view); a router library (too heavy for five routes).

## R4. View order and default view

- **Decision**: `VIEWS = wardrobe, outfits, rotation, print`. An empty or unknown hash resolves to `wardrobe`. `Tabs` already renders step numbers (`01`–`04`), which satisfies FR-004 once the order is right.
- **Rationale**: This follows the spec. Existing `#rotation`, `#outfits` and `#print` bookmarks keep working (FR-003).

## R5. Subtitle (dek) legibility

- **Findings**: The dek is Bodoni Moda italic 400, 20 px, in `ink-muted`. Light theme: `#5c564c` on `#f3efe6` measures about **6.3:1**, below the 7:1 target. Dark theme: `#a79f92` on `#12110f` measures about **7.2:1**. At 20 px, the italic's display optical size (`opsz` 96 inherited from the masthead's setting style) gives hairline strokes close to 1 px, which is the "hard to read" symptom.
- **Decision**:
  1. Colour: use `ink` (about 16:1 or more in both themes) instead of `ink-muted`. Hierarchy comes from size and italic, which is what design principle 5 already prescribes ("type does the hierarchy … not colour").
  2. Optical size: set `font-variation-settings: "opsz" 14` on the dek, which is Bodoni Moda's text optical size, with thicker hairlines and more open counters.
  3. Weight: 450 (the variable axis allows it). Size: 20 px desktop and 18 px phone (up from 17), with line-height 1.45.
  4. Record the change in `design-system/components/Masthead.md` and the README's type table (FR-016).
- **Alternatives considered**: Switching the dek to Hanken Grotesk (loses the editorial italic the system is built on); keeping `ink-muted` and adding weight only (still 6.3:1 in light).

## R6. Lighthouse audit method

- **Decision**: Add a dev script, `scripts/lighthouse.mjs`, that drives the `lighthouse` Node API (13.x) through `puppeteer-core` (25.x) against `npm run preview` (the production build). Before each run it sets `prefers-color-scheme` emulation for each theme. It uses the system's Chromium browser through `CHROME_PATH`. On this machine that is Microsoft Edge, since Chrome is not installed. It audits the categories `accessibility` and `best-practices` (and records `performance` and `seo` for information only) on these URLs: `#wardrobe`, `#outfits`, `#rotation`, `#rotation/day/0`, `#print`, at desktop and mobile form factors. It writes JSON and HTML reports to `specs/001-page-flow-refinement/lighthouse/` and a summary table to `lighthouse/REPORT.md`.
- **Rationale**: The Lighthouse CLI cannot emulate dark mode, and the Node API with a puppeteer page can. Auditing the preview build matches what is published.
- **Alternatives considered**: Chrome DevTools manually (not repeatable); `@lhci/cli` (more CI infrastructure than this project needs, though it remains a possible follow-up).
- **Baseline**: Run the script once **before** any change and save the results as `lighthouse/before/` (FR-025).

## R7. Reduced motion and sheet animation

- **Decision**: Panel enter and exit use CSS transforms keyed off Radix's `data-state="open|closed"`, using the existing motion tokens if present (or new `motion-*` tokens added to `tokens.json`). `@media (prefers-reduced-motion: reduce)` sets the duration to 0 (FR-013).

## R8. Testing approach

- **Decision**: Keep Vitest, in a node environment, for pure logic. Add unit tests for the route parse/format functions (`parseHash`, `formatHash`) and the subtitle contrast pair (`ink` on `paper*` ≥ 7:1, added to `tokens.test.ts`). Interaction behaviour (focus return, Escape, Back) is checked through the quickstart scenarios and the Lighthouse runs, rather than by adding a DOM test environment, which matches how the project tests today.
- **Alternatives considered**: Adding jsdom with Testing Library. It is useful, but it adds infrastructure beyond this feature's scope, so it is noted as a possible follow-up.
