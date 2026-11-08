# Tasks: Page Flow & Design Refinement

**Input**: Design documents from `specs/001-page-flow-refinement/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ui-contract.md](contracts/ui-contract.md), [quickstart.md](quickstart.md)

**Tests**: The spec does not ask for TDD. Unit tests are included only where the plan calls for them: `test/route.test.ts` and the dek contrast pairs in `test/tokens.test.ts`. The Lighthouse audit (US5) is a requirement of the spec (FR-023–FR-025).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: The user story the task belongs to (US1–US5)

## Path Conventions

Single Vite project at the repo root: `src/`, `test/`, `scripts/`, `design-system/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies and the baseline audit, before any UI change.

- [X] T001 Add runtime deps `@radix-ui/react-dialog@^1.1`, `@radix-ui/react-alert-dialog@^1.1`, `@radix-ui/react-checkbox@^1.3` and `@radix-ui/react-toggle-group@^1.1`, and dev deps `lighthouse@^13` and `puppeteer-core@^25`, using `npm install` (updates `package.json` and `package-lock.json`).
- [X] T002 Create `scripts/lighthouse.mjs`:
  - Accept `--phase before|after` and `--base http://localhost:4173/` (default).
  - Read `CHROME_PATH`. If it is unset, fall back to `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe` when that file exists, otherwise error out.
  - Launch the browser with `puppeteer-core`.
  - For each route in `#wardrobe`, `#outfits`, `#rotation`, `#rotation/day/0`, `#print`, each theme in `light`/`dark` (`page.emulateMediaFeatures([{ name: "prefers-color-scheme", value }])`), and each form factor in `desktop`/`mobile`: check the computed `body` background matches the theme (record it in the report; fail loudly if it does not), then `lighthouse(url, { onlyCategories: ["accessibility","best-practices","performance","seo"], formFactor, screenEmulation }, undefined, page)`.
  - Write `<phase>/<route-slug>.<theme>.<formFactor>.report.json` and `.html` under `specs/001-page-flow-refinement/lighthouse/`.
  - Regenerate `specs/001-page-flow-refinement/lighthouse/REPORT.md` with a table: route × theme × form factor → before/after scores for all four categories, plus a list of failing accessibility and best-practices audits (id, title, node count) for the latest phase, and an "Exceptions" section kept from the existing file if one is present.
  - Add `"audit": "node scripts/lighthouse.mjs"` to `package.json` scripts.
- [X] T003 Run the baseline: `npm run build`, start `npm run preview` in the background, run `npm run audit -- --phase before`, then stop preview. Confirm `specs/001-page-flow-refinement/lighthouse/before/` and `REPORT.md` exist. (`#rotation/day/0` will show the closed panel at this point. That is expected.)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tokens, the route module and the design-system primitives that several stories need.

**⚠️ CRITICAL**: Finish this phase before Phases 3–7.

- [X] T004 Add tokens to `design-system/tokens.json`, each with a `usage` note, following the existing token group structure:
  - `sheet-width` = `420px` (the docked day-editing panel width)
  - `scrim` = light `rgba(20,19,18,.32)`, dark `rgba(0,0,0,.5)` (backdrop behind the bottom sheet only)
  - `motion-sheet-duration` = `220ms` and `motion-sheet-ease` = `cubic-bezier(.2,.8,.2,1)`, unless equivalent motion tokens already exist, in which case reuse them

  Then run `npm run tokens` to regenerate `src/design-system/tokens.css`.
- [X] T005 [P] Create `src/lib/route.ts`:
  - Export `type ViewId = "wardrobe" | "outfits" | "rotation" | "print"`, `VIEW_ORDER: ViewId[] = ["wardrobe","outfits","rotation","print"]`, `interface Route { view: ViewId; day: number | null }`.
  - `parseHash(hash: string, lookCount: number): Route`. Grammar: `#<view>` or `#rotation/day/<n>`. Rules: "An unknown or empty value resolves to `"wardrobe"`". `day` is "an integer `0 ≤ day < rotation.looks.length`. Out of range, or not a number, resolves to `null`". `day` is non-null only when the view is `rotation`.
  - `formatHash(route: Route): string`, which returns `#rotation/day/<n>` when `day !== null`, else `#<view>`.
- [X] T006 [P] Create `test/route.test.ts`. Cover: empty and unknown hash → wardrobe; each of the four views; `#rotation/day/2` with lookCount 10 → day 2; day out of range (10 with lookCount 10), negative, non-integer and non-numeric → day null; `#outfits/day/1` → day null; and a `formatHash` round-trip.
- [X] T007 Add `Sheet` to `src/design-system/components.tsx`, per [contracts/ui-contract.md §2](contracts/ui-contract.md):
  - Build on `@radix-ui/react-dialog`.
  - Props: `open`, `onOpenChange`, `title`, `kicker?`, `description?`, `footer?`, `children`, `returnFocusRef?`.
  - Use `matchMedia("(min-width: 1024px)")` (with a listener) to choose `modal={false}` (docked) or `modal` (bottom sheet with `Dialog.Overlay`).
  - Docked mode: call `preventDefault` in `onInteractOutside` and `onPointerDownOutside` so outside clicks do not close it. Escape still calls `onOpenChange(false)`.
  - In `onOpenAutoFocus`, focus the title (`tabIndex={-1}`). In `onCloseAutoFocus`, focus `returnFocusRef.current` when provided.
  - Render a close button labelled "Close" (an × icon with `aria-label`), plus `Dialog.Title`, and `Dialog.Description` when given (otherwise pass `aria-describedby={undefined}`).
  - Put the footer in a sticky `.rt-sheet-foot`.
- [X] T008 Add `ConfirmDialog` to `src/design-system/components.tsx`, per [contracts/ui-contract.md §3](contracts/ui-contract.md):
  - Build on `@radix-ui/react-alert-dialog`.
  - Props: `open`, `onOpenChange`, `title`, `description`, `actions: { label: string; variant?: ButtonProps["variant"]; onSelect: () => void }[]`.
  - Render actions in order with the existing `Button`, wrapping the last one (Keep editing) in `AlertDialog.Cancel` and the others in `AlertDialog.Action`.
- [X] T009 Add styles to `src/design-system/components.css`, using tokens only:
  - `.rt-sheet` docked: fixed, right 0, top 0, height 100dvh, width `var(--sheet-width)`, `max-width: 100vw`, `background: var(--paper-raised)`, `border-left: var(--rule-hair) solid var(--rule-strong)`, no shadow, overflow-y auto.
  - `.rt-sheet[data-mode="bottom"]`: left 0, right 0, bottom 0, top auto, width auto, max-height 85dvh, top hairline rule instead of the left one.
  - `.rt-sheet-overlay`: `background: var(--scrim)`.
  - `.rt-sheet-head`, `.rt-sheet-body`, `.rt-sheet-foot` (sticky bottom, `paper-raised`, top hairline).
  - Slide-in and slide-out keyframes on `[data-state="open"|"closed"]` using the motion tokens, with `@media (prefers-reduced-motion: reduce)` setting animation to none.
  - `.rt-confirm` (centered, `paper-raised`, hairline, square corners) and `.rt-confirm-overlay` (scrim).
  - `@media print` hides `.rt-sheet`, `.rt-sheet-overlay` and `.rt-confirm`.
- [X] T010 [P] Write `design-system/components/Sheet.md` and `design-system/components/ConfirmDialog.md` (purpose, consumer props, do and don't, the docked vs. bottom behaviour, and the one-accent rule: while a Sheet is open its footer holds the screen's only primary button). Add both rows to the component table in `design-system/README.md`.

**Checkpoint**: `npm run typecheck` and `npm test` pass. The primitives exist but nothing uses them yet.

---

## Phase 3: User Story 1 - Edit a rotation day without losing sight of the week (Priority: P1) 🎯 MVP

**Goal**: No builder on the Rotation view until a day is selected. Selecting a day opens the `Sheet`, docked on the right on wide screens (with the calendar visible and clickable) and as a bottom sheet on narrow ones. The URL holds the open day.

**Independent Test**: [quickstart.md](quickstart.md) scenarios 2–12. Open `#rotation`: there is no builder. Click a day: the docked panel shows while other days stay readable. Edit, apply, switch, Escape, Back, and the reshape behaviour all work as specified.

- [X] T011 [US1] Change `RotationDay` in `src/design-system/components.tsx` to use `forwardRef<HTMLButtonElement>` and add optional props `expanded?: boolean`, which renders `aria-haspopup="dialog"` and `aria-expanded={expanded}` on the button. Keep `aria-pressed={selected}`. Update `design-system/components/RotationDay.md` to match.
- [X] T012 [US1] Add a route hook to `src/App.tsx`:
  - Replace `viewFromHash` with `parseHash(location.hash, data.rotation.looks.length)` from `src/lib/route.ts`.
  - Keep `view` in state, updated on `hashchange` and `popstate`.
  - Pass `day` (number | null) and a `navigate(route: Route, mode: "push" | "replace")` callback (which uses `history.pushState`/`replaceState` with `formatHash`, then updates state) to `RotationView`.
  - Remember in a ref whether the panel was opened by a push in this session, so a UI close can call `history.back()`, else `replaceState("#rotation")` (contract §1 history rules).
- [X] T013 [US1] Restructure `src/components/RotationView.tsx`:
  - Delete the always-rendered "Outfit builder" `<section>`.
  - Replace `sel` state with the `day` prop.
  - Hold `draft`, `dirty` and `pending: null | { kind: "close" } | { kind: "go", index: number } | { kind: "generate" }` (data-model.md).
  - Keep the existing live-preview mapping `shown = rot.looks.map((l, i) => (i === day ? draft : l))`, which drives FR-009 previews and flags. Keep a ref map of day buttons (`useRef<Map<number, HTMLButtonElement>>`).
  - Clicking a day when closed → `navigate({view:"rotation", day:i}, "push")`. When open and clean → `navigate(..., "replace")`. When open and dirty → `pending = {kind:"go", index:i}`.
  - Pass `selected={i === day}`, `expanded={i === day}` and `edited={i === day && dirty}` to each `RotationDay`.
- [X] T014 [US1] Render the builder inside `<Sheet>` in `src/components/RotationView.tsx`:
  - `open={day !== null}`, `kicker="Editing"`, `title={dayLabel(rot, day)}`.
  - Body: the "Wear a saved outfit" `Select` (only when `outfits.length`), `LookEditor`, and `Notice`.
  - `footer`: Apply to {day name} (primary, disabled when clean), Discard changes, Copy previous day, Save as outfit (ghost), and ← Previous day / Next day → (ghost, small; they follow the same clean/dirty rules as clicking a day).
  - `returnFocusRef` points at the current day's button.
  - `onOpenChange(false)` → if dirty, set `pending = {kind:"close"}`, else close via App's close helper.
- [X] T015 [US1] Add the confirm flow in `src/components/RotationView.tsx` using `ConfirmDialog`:
  - Open when `pending !== null`. Title "Unapplied changes to {dayLabel}". Actions: **Apply** (primary: apply, then perform pending), **Discard** (discard, then perform pending), **Keep editing** (clear pending, so focus returns to the panel).
  - "Generate rotation" with a dirty draft sets `pending = {kind:"generate"}` instead of showing the old notice.
- [X] T016 [US1] Handle Back with a dirty draft in `src/App.tsx` and `src/components/RotationView.tsx`. On `popstate` that would close the panel (new route has `day === null`, previous had `day !== null`) while the draft is dirty: re-push `#rotation/day/<previous>` and set `pending = {kind:"close"}` (data-model.md "Back with a dirty draft"). RotationView registers a `guardClose(): boolean` with App through a ref (`closeGuard.current`). It returns `false` (and opens the confirm) when the draft is dirty.
- [X] T017 [US1] Handle rotation reshape in `src/components/RotationView.tsx`. In `setShape`, if the open `day >= next.looks.length`, navigate `{view:"rotation", day:null}` with `"replace"` and drop the draft. Otherwise keep the panel open on the same index.
- [X] T018 [US1] Add F6 handling in `src/components/RotationView.tsx`. A `keydown` listener (active while the docked sheet is open) moves focus to the panel title when focus is in the grid, and to the open day button when focus is in the panel. Add a visually subtle "Back to calendar" ghost button in the sheet head that does the same. Both only apply in docked mode.
- [X] T019 [US1] Add grid reflow to `src/styles.css`:
  - When the Rotation view's container has class `has-sheet` and the viewport is ≥ 1280px, add `padding-inline-end: var(--sheet-width)` (with a transition using the motion tokens, disabled under reduced motion), so no day sits under the panel.
  - From 1024px to 1279px, no padding (the panel overlays). Call `scrollIntoView({block:"nearest", inline:"nearest"})` on the selected day when it opens.
  - Add the `has-sheet` class in `src/components/RotationView.tsx`.
- [X] T020 [US1] Enforce the one-accent rule in `src/components/RotationView.tsx`. While `day !== null`, render "Generate rotation" with `variant="secondary"`. Otherwise use `"primary"`. Also confirm that the global `SaveBar` (`.savebar`) is not covered by the docked sheet: if it is fixed to the bottom, give `.rt-sheet` `bottom` clearance or raise its z-index under the sheet in `src/styles.css`, so both stay reachable and nothing overlaps.
- [X] T021 [US1] Change the lede text in `src/components/RotationView.tsx` to "Select a day to edit its outfit. Flags mark the same pants, shirt or leather shoes two days running." Make sure no empty `section` landmark remains.

**Checkpoint**: Quickstart scenarios 2–12 pass. `npm run typecheck` and `npm test` pass.

---

## Phase 4: User Story 2 - Views follow the order of the work (Priority: P1)

**Goal**: The nav reads 01 Wardrobe & costs · 02 Outfits · 03 Rotation · 04 Print, with Wardrobe as the default.

**Independent Test**: [quickstart.md](quickstart.md) scenario 1. Open `/` and Wardrobe is active. `#rotation` still opens Rotation.

- [X] T022 [US2] Reorder `VIEWS` in `src/App.tsx` to `wardrobe, outfits, rotation, print`, using `VIEW_ORDER` from `src/lib/route.ts` with the labels "Wardrobe & costs", "Outfits", "Rotation" and "Print". Make sure the default resolves to `wardrobe` (handled by `parseHash`, T005). Keep `Tabs` numbered.
- [X] T023 [P] [US2] Check `.rt-tab` focus styling in `src/design-system/components.css`. Add or confirm `:focus-visible { outline: var(--rule-heavy) solid var(--oxblood); outline-offset: 2px }` (or the existing focus token). At ≤ 720px, make sure the horizontally scrollable tab strip scrolls the active tab into view on load (`scrollIntoView({inline:"nearest"})` in `Tabs` in `src/design-system/components.tsx` for the `aria-current` link) and that the page itself never scrolls sideways.
- [X] T024 [P] [US2] Add empty-wardrobe guidance. When `data.items.length === 0`, show a `Notice tone="neutral"` at the top of `src/components/OutfitsView.tsx` and `src/components/RotationView.tsx` with a link to `#wardrobe`: "No pieces yet. Start in Wardrobe & costs." (spec edge case).
- [X] T025 [P] [US2] Update the "Views" section of `README.md` to list views in the new order, and note that the Rotation day editor opens as a side panel.

**Checkpoint**: Quickstart scenario 1 passes. Old `#rotation`, `#outfits` and `#print` links still work.

---

## Phase 5: User Story 3 - Readable subtitle (Priority: P2)

**Goal**: The masthead dek is ≥ 7:1 in both themes and set at Bodoni's text optical size.

**Independent Test**: [quickstart.md](quickstart.md) scenario 14, plus `npm test` (contrast pairs).

- [X] T026 [P] [US3] In `test/tokens.test.ts`, add a test asserting `contrast(ink, paper) >= 7` and `contrast(ink, paper-raised) >= 7` in every theme, with a comment: "masthead dek, FR-014".
- [X] T027 [US3] Update `.rt-mast-dek` in `src/design-system/components.css` to `font: italic 450 20px/1.45 var(--font-display); font-variation-settings: "opsz" 14; color: var(--ink);`. Inside the existing `@media (max-width: 720px)`, set `.rt-mast-dek { font-size: 18px; }`.
- [X] T028 [P] [US3] Document the dek treatment and its reason in `design-system/components/Masthead.md`: "set in `ink` at text optical size (opsz 14), weight 450, because the display cut's hairlines and `ink-muted` read poorly at 17–20px". Update the type table and dek guidance in `design-system/README.md` to match (FR-016).

**Checkpoint**: `npm test` passes. The dek is visibly sturdier in both themes.

---

## Phase 6: User Story 4 - Accessible, consistent controls (Priority: P2)

**Goal**: Check and Segmented move onto Radix primitives. Every control has a visible focus state, an accessible name and the correct role.

**Independent Test**: [quickstart.md](quickstart.md) scenarios 13 and 16. Do a keyboard-only pass of every view.

- [X] T029 [US4] Re-implement `Check` in `src/design-system/components.tsx` on `@radix-ui/react-checkbox`:
  - Props: `label: ReactNode`, `checked: boolean`, `onCheckedChange: (checked: boolean) => void`, `disabled?`, `className?`, `id?`.
  - Use `useId`, and put a `<label htmlFor>` around the label text.
  - Show `Checkbox.Indicator` with an SVG tick.
  - Keep the `.rt-check` and `.rt-check-sm` class hooks.
  - Update `.rt-check` styles in `src/design-system/components.css` for `[data-state="checked"]`, `:focus-visible` and `[data-disabled]`.
- [X] T030 [US4] Update the `Check` call sites to `onCheckedChange`:
  - `src/components/LookEditor.tsx:34` (keep toggle)
  - `src/components/PrintView.tsx:37` (`setNames`)
  - `src/components/WardrobeView.tsx:71` (`set("stripeOn", v)`)
  - `src/components/WardrobeView.tsx:78` (`set("owned", v)`)
- [X] T031 [US4] Re-implement `Segmented` in `src/design-system/components.tsx` on `@radix-ui/react-toggle-group`:
  - `type="single"`, `aria-label={label}`, items as `ToggleGroup.Item value={v}`.
  - In `onValueChange`, ignore `""` (deselection), so one option always stays selected.
  - The API is unchanged, so the call sites in `src/components/LookEditor.tsx:53`, `src/components/WardrobeView.tsx:177` and `src/components/PrintView.tsx` need no edits.
  - Update `.rt-seg` styles in `src/design-system/components.css` from `[aria-pressed="true"]` to `[data-state="on"]`, and add `:focus-visible`.
- [X] T032 [P] [US4] Update `design-system/components/Check.md` and `design-system/components/Segmented.md` with the new props and keyboard behaviour (Space toggles; arrow keys move within the group).
- [X] T033 [US4] Do a focus-visible sweep in `src/design-system/components.css`. Make sure `.rt-btn`, `.rt-input`, `.rt-select-trigger`, `.rt-day`, `.rt-look-hit`, `.rt-garment`, `.rt-tab`, `.rt-seg button`, `.rt-check` and the sheet close button all share one `:focus-visible` outline using the oxblood focus token, with an offset, and have no `outline: none` without a replacement.
- [X] T034 [US4] Do an accessible-name sweep in `src/components/*.tsx`. Every icon-only button has `aria-label`, inputs have labels (the title input already has `aria-label`), and decorative SVG figures (`OutfitFigure` in `src/components/common.tsx`) are `aria-hidden` or carry a meaningful `role="img"` + `aria-label`.

**Checkpoint**: A keyboard-only pass of all four views and the panel succeeds, and every control is announced correctly.

---

## Phase 7: User Story 5 - Verified accessibility and best-practice quality (Priority: P3)

**Goal**: Accessibility = 100 and Best Practices ≥ 95 on every audited route, theme and form factor, with a before/after report.

**Independent Test**: `specs/001-page-flow-refinement/lighthouse/REPORT.md` shows the after-phase targets met.

- [X] T035 [US5] Run the after audit: `npm run build`, run `npm run preview` in the background, run `npm run audit -- --phase after`, then stop preview.
- [X] T036 [US5] Fix every failing accessibility audit and every best-practices audit that brings the score under 95, listed in `specs/001-page-flow-refinement/lighthouse/REPORT.md`. Edit the specific source files the audits name, which is likely contrast in `src/design-system/components.css` or `src/styles.css`, labels in `src/components/*.tsx`, and `<meta>`/`lang` in `index.html`. Then re-run T035. Repeat until the targets are met.
- [X] T037 [US5] For any finding that cannot or should not be fixed (for example a third-party font request flagged under best practices, or a false positive), record it under "Exceptions" in `specs/001-page-flow-refinement/lighthouse/REPORT.md` with the audit id, route and reason (FR-024).

**Checkpoint**: SC-001 met. REPORT.md complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T038 Check print output on `#print` (browser print preview). The sheet, overlay, confirm dialog, nav and save bar are hidden. Fix any gaps in the `@media print` rules in `src/design-system/components.css` or `src/styles.css`.
- [X] T039 Run a 360px-width sweep of all four views and of the open bottom sheet for horizontal overflow (FR-021). Fix any overflow in `src/styles.css`.
- [X] T040 Run `npm run typecheck`, `npm test` and `npm run build`. All must pass (SC-007).
- [X] T041 Walk through every scenario in `specs/001-page-flow-refinement/quickstart.md` against `npm run dev`, and check SC-004 (2-week × 5-day rotation, panel closed, fits 1280×800 without scrolling past a builder), and note any deviation in `specs/001-page-flow-refinement/quickstart.md` under a "Results" heading.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 → T002 → T003. The baseline must run before any UI change.
- **Foundational (Phase 2)**: Depends on T001. T004 comes before T009 (the styles use the new tokens). T005 and T006 can run in parallel with T004, T007 and T008. T007 and T008 come before T009 and T010.
- **US1 (Phase 3)**: Depends on Phase 2 (Sheet, ConfirmDialog, route.ts, tokens).
- **US2 (Phase 4)**: Depends on T005 only. It touches `src/App.tsx` like T012, so run it after T012, or merge T022 into T012 if one person does both.
- **US3 (Phase 5)**: Independent of the other stories. It can start right after Phase 1.
- **US4 (Phase 6)**: Depends on T001. It is independent of US1–US3, except that T033's sweep should include the sheet close button from T007.
- **US5 (Phase 7)**: Depends on all of US1–US4.
- **Polish (Phase 8)**: Last.

### User Story Dependencies

- US1 (P1): Phase 2
- US2 (P1): T005, and must be ordered after T012 in `src/App.tsx`
- US3 (P2): none
- US4 (P2): T001
- US5 (P3): US1–US4

### Within Each User Story

- US1: T011 → T012 → T013 → T014 → T015 → (T016, T017, T018, T019, T020, T021). T016 touches App and RotationView; T017–T021 touch RotationView or styles, so run them one after another.
- US4: T029 → T030. T031 is independent of T029/T030 (same file as T029, so do it after T029). T033 comes after T029 and T031.

### Parallel Opportunities

- T005 + T006 alongside T004/T007/T008
- T010 alongside T009
- The whole US3 phase (T026, T027, T028) alongside US1
- T023, T024 and T025 alongside each other
- T032 alongside T033

---

## Parallel Example: User Story 3 alongside User Story 1

```text
Developer A: T011 → T012 → T013 → T014 … (US1, RotationView/App)
Developer B: T026 [tokens.test.ts] + T028 [Masthead.md, README.md] in parallel, then T027 [components.css]
```

## Parallel Example: Foundational

```text
T005 src/lib/route.ts  ‖  T006 test/route.test.ts  ‖  T004 design-system/tokens.json
then T007 Sheet → T008 ConfirmDialog → T009 components.css  ‖  T010 docs
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Phase 1 (with the baseline audit)
2. Phase 2
3. Phase 3 (US1): the day-editing side panel
4. Phase 4 (US2): reorder (small, and P1 as well)
5. **Stop and validate**: quickstart scenarios 1–12

### Incremental Delivery

1. Setup + Foundational
2. US1 + US2 → validate (MVP)
3. US3 → dek → validate
4. US4 → primitives sweep → validate
5. US5 → after audit and fixes → report
6. Polish

---

## Notes

- Every color, spacing, radius and duration value must come from tokens (`design-system/README.md`). Add tokens before using new values.
- `npm run tokens` must run after any `tokens.json` edit, or `tokens.test.ts` fails.
- Do not commit unless the user asks (user rule).
