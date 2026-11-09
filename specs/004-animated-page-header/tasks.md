---
description: "Task list for Animated Shared Page Header"
---

# Tasks: Animated Shared Page Header

**Input**: Design documents from `specs/004-animated-page-header/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ui-contract.md](contracts/ui-contract.md), [quickstart.md](quickstart.md)

**Tests**: Included. The plan names the tests:
- `stepChange` cases in `test/route.test.ts`;
- a new `test/stepHeads.test.ts`;
- `test/tokens.test.ts`, which already checks that `tokens.css` matches `tokens.json`.

Vitest runs in node, so motion and DOM behaviour are checked by hand with [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story (US1–US4 from spec.md). The shared, motionless head that every story builds on is Phase 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 from spec.md
- Paths are repository-relative (single Vite project: `src/`, `test/`, `design-system/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: A green baseline and the shared timing token. No new dependencies.

- [X] T001 Run `npm test` and `npm run typecheck` to record a green baseline. Note any failures that already exist in the Notes section of specs/004-animated-page-header/tasks.md.
- [X] T002 Add two tokens to the `motion.tokens` array in design-system/tokens.json:
  - `{ "name": "motion-step-duration", "value": "320ms", "usage": "Every part of a step change: numeral, title and subtitle rolls, step-colour blend, content and aside slide. Removed under prefers-reduced-motion." }`
  - `{ "name": "motion-step-ease", "value": "cubic-bezier(.2, .7, .2, 1)", "usage": "Easing for the step change." }`

  Then run `npm run tokens` to regenerate src/design-system/tokens.css, and confirm `npm test` (test/tokens.test.ts) passes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: One shared head rendered by `App`, with **no motion yet**. Each settled page looks the same as on `main` except that the title is the step's name. Every user story depends on this phase.

- [X] T003 [P] In src/lib/route.ts:
  - Add `export type StepDir = "forward" | "back";`.
  - Add `export function stepChange(prev: ViewId, next: ViewId): StepDir | null`. It returns `null` when `prev === next`, `"forward"` when `VIEW_ORDER.indexOf(next) > VIEW_ORDER.indexOf(prev)`, and `"back"` otherwise (data-model.md "Step change").
  - Add a one-line doc comment: "Which way a move between views animates; moves within a view (item detail, a day) are null."
- [X] T004 [P] Extend test/route.test.ts with a `describe("stepChange")`:
  - same view → `null` for all four views;
  - every one of the 12 ordered pairs → `"forward"` when the later step is the target, `"back"` otherwise;
  - `stepChange("wardrobe", "print")` is `"forward"` and `stepChange("print", "wardrobe")` is `"back"` (a multi-step jump is one move).
- [X] T005 In src/components/common.tsx:
  - Replace `DEKS` and `PageHead` with `export const STEP_HEADS: Record<ViewId, { number: 1 | 2 | 3 | 4; title: string; dek: string }>`, with the values from the data-model.md table: wardrobe 1 "Wardrobe" + the existing wardrobe dek, outfits 2 "Outfits", rotation 3 "Rotation", print 4 "Print", each with its existing dek text verbatim.
  - Compute `number` as `VIEW_ORDER.indexOf(view) + 1`, built from `VIEW_ORDER`.
  - Keep the comment "The dek says what each step is for."
  - Remove the now-unused `SectionHead` import if nothing else uses it.
- [X] T006 [P] Create test/stepHeads.test.ts, importing `STEP_HEADS` from ../src/components/common.tsx and `VIEW_ORDER` from ../src/lib/route.ts. It asserts that:
  - the keys equal `VIEW_ORDER`;
  - `STEP_HEADS[v].number === VIEW_ORDER.indexOf(v) + 1`;
  - the titles are `["Wardrobe", "Outfits", "Rotation", "Print"]` in order;
  - every `dek` is a non-empty string.

  If common.tsx can't be imported in node (it imports figure code, which should be fine), move `STEP_HEADS` to src/lib/route.ts instead and import it from there in both places.
- [X] T007 In src/App.tsx, delete the local `LABELS` constant. Build the tab items from `STEP_HEADS[id].title` and `STEP_HEADS[id].number`, so the tab labels and head titles share one source (ui-contract "App").
- [X] T008 In src/design-system/components.tsx, add `StepHead` and `StepAside` (ui-contract "Design system"), **without RollText yet**:
  - A context `StepAsideSlot = createContext<HTMLElement | null>(null)`.
  - `StepHead({ number, title, dek, dir, className, children })` keeps the aside slot node in state through a callback ref (`const [slot, setSlot] = useState<HTMLElement | null>(null)`) and provides it through `StepAsideSlot.Provider value={slot}` around `children`. It renders:
    - `header.rt-shead.rt-shead-page` + `className`;
    - `div.rt-shead-lead` containing `div.rt-shead-num[aria-hidden=true] > span{pad2(number)}` and `div.rt-shead-titles` with `h1.rt-shead-title.rt-shead-title-lg{title}` and `p.rt-shead-dek{dek}`;
    - an always-present `div.rt-shead-aside` with `ref={setSlot}`.
  - The provider must wrap the page content, so `StepHead` takes `children` (the page content) and renders them **after** the `header`, inside the provider (contracts/ui-contract.md).
  - `StepAside({ children })` reads the context and returns `slot ? createPortal(children, slot) : null`.
  - Accept `dir` now so later phases don't change the signature. It isn't used yet.
  - Export all three through src/design-system/index.ts (it already re-exports `components.tsx`, so nothing to add there).
- [X] T009 In src/design-system/components.css, add `.rt-shead-aside:empty { display: none; }` so an empty slot takes no flex gap. Check that `.view>.rt-shead{margin-bottom:0}` in src/styles.css still applies, or add the same rule for `main>.rt-shead`, so the head's spacing above the content matches today.
- [X] T010 In src/App.tsx, render inside `<main>`:

  ```tsx
  <StepHead {...STEP_HEADS[view]} dir={dir} className={view === "print" ? "no-print" : undefined}>
    <div className="step-page">{the four existing view conditionals}</div>
  </StepHead>
  ```

  `dir` is new state: `const [dir, setDir] = useState<StepDir>("forward")`. T020 (US1) starts setting it. Add `.step-page{display:grid}` to src/styles.css only if the views' spacing needs it, and compare against `main` at 1280 px and 360 px.
- [X] T011 [P] In src/components/WardrobeView.tsx:
  - List view: replace `<PageHead view="wardrobe" aside={…} />` with `<StepAside>{the same Segmented + "Add an item" Button}</StepAside>`.
  - Item detail view: delete `<PageHead view="wardrobe" />`.
  - Update the imports: drop `PageHead`, add `StepAside` from ../design-system/index.ts.
- [X] T012 [P] In src/components/OutfitsView.tsx, replace the `PageHead` with `{base ? <StepAside><span className="lede">Editing <b>{base.name}</b>. Change the pieces, then save.</span></StepAside> : null}`, and update the imports.
- [X] T013 [P] In src/components/RotationView.tsx, delete `<PageHead view="rotation" />` and the `PageHead` import.
- [X] T014 [P] In src/components/PrintView.tsx, replace the `PageHead` inside `section.no-print` with `<StepAside><Button variant="primary" onClick={() => window.print()}>Print</Button></StepAside>`, and update the imports.
- [X] T015 Run `npm run typecheck` and `npm test`, then `npm run dev`. On all four steps (and on the item detail page), check that:
  - the head, the asides and the spacing match `main` apart from the title;
  - there's exactly one `h1` (`document.querySelectorAll("h1").length === 1`);
  - Print preview from Wardrobe shows the head, and from Print it doesn't (quickstart checks 4, 11, 12).

**Checkpoint**: The shared head is in place, with no motion. Every story below builds on it.

---

## Phase 3: User Story 1 - The page head changes in place between steps (Priority: P1) 🎯 MVP

**Goal**: The numeral, title and subtitle roll in the direction of the step order, and the step colour blends (FR-002–FR-005, FR-007 for the head).

**Independent Test**: Quickstart checks 1 and 2, for the head only. Click Wardrobe → Outfits → Wardrobe. The numeral rolls up inside its block from 01 to 02 and back down. The block blends navy → camel → navy. The title and subtitle roll the same way. The head never disappears.

- [X] T016 [US1] In src/design-system/components.tsx, add `RollText({ value, dir, className })` (data-model "RollText layers", research R3):
  - State: `layers: { key: number; value: string; role: "in" | "out" }[]`, starting as `[{ key: 0, value, role: "in" }]`, plus a `first` ref that is true until the value first changes.
  - On a value change (`useLayoutEffect` keyed on `value`): mark every layer `out`, keep only the most recent `out` layer, and append `{ key: next, value, role: "in" }`.
  - Render `<span className={cx("rt-roll", className)} data-dir={dir}>`. Each layer is `<span key className={cx("rt-roll-l", !first && "rt-roll-" + role)} aria-hidden={role === "out" || undefined} onAnimationEnd={role === "in" ? dropOut : undefined}>`, where `dropOut` removes all `out` layers.
- [X] T017 [US1] In `StepHead` (src/design-system/components.tsx), use `RollText`:
  - Wrap the numeral span's text: `<RollText value={pad2(number)} dir={dir} />` inside `.rt-shead-num`. The existing span positioning moves to `.rt-shead-num .rt-roll`.
  - Wrap the `h1` text: `<h1 …><RollText value={title} dir={dir} /></h1>`, so the h1 stays the single heading and the leaving layer is `aria-hidden` inside it.
  - Wrap the dek: `<p className="rt-shead-dek"><RollText value={dek} dir={dir} /></p>`.
- [X] T018 [US1] In src/design-system/components.css, add the roll styles under the Section head block:
  - `.rt-roll{display:inline-grid}`, and `.rt-roll-l{grid-area:1/1}` so the layers stack in one cell.
  - Keyframes `rt-roll-in-up` (from `translateY(var(--roll-d,.35em))` + `opacity:0`), `rt-roll-out-up` (to `translateY(calc(-1 * var(--roll-d,.35em)))` + `opacity:0`), and their `-down` mirrors.
  - `.rt-roll[data-dir=forward] .rt-roll-in{animation:rt-roll-in-up var(--motion-step-duration) var(--motion-step-ease) both}`, and the same pattern for `out`, and for `back` with the `-down` keyframes.
  - `.rt-roll-out{pointer-events:none}`.
  - Inside `.rt-shead-num`, set `--roll-d:112px` (the block height; use the phone block height inside the existing 720 px media query) and drop the opacity fade for the numeral (the block clips the roll) through `.rt-shead-num .rt-roll-l{opacity:1}` in the keyframes, or separate `rt-roll-num-*` keyframes.
  - Keep the numeral's `font`, `left:-2px` and `top:-30px` look exactly as today.
- [X] T019 [US1] In src/design-system/components.css, add the step-colour blend:
  - `.rt-shead-num{transition:background-color var(--motion-step-duration) var(--motion-step-ease), color var(--motion-step-duration) var(--motion-step-ease)}`
  - `.rt-shead{transition:border-bottom-color var(--motion-step-duration) var(--motion-step-ease)}`
  - Add `border-bottom-color` with the same timing to the existing active-tab transition on `.rt-tab` (line ~322). Keep its existing `color` transition, and keep everything inside the existing reduced-motion block's `transition:none`.
- [X] T020 [US1] In src/App.tsx, set `dir` whenever the step changes, even before Phase 4 adds view transitions. Wherever `setRoute(next)` is called (`onNav`, `navigate`), compute `const d = stepChange(routeRef.current.view, next.view)` first and call `setDir(d)` when `d` isn't null. In Phase 4, T022 replaces this with `applyRoute`.
- [X] T021 [US1] Manual: run quickstart checks 1 and 2 (head only). Then check in DevTools that after each change settles, `.rt-roll` holds exactly one `.rt-roll-l` and only one `h1` exists.

**Checkpoint**: US1 is done. The head rolls and blends in the direction of the step order.

---

## Phase 4: User Story 2 - The page content moves with the head (Priority: P1)

**Goal**: The content and the page's actions slide out and in with the head's direction, start and finish together with the head, and you end at the top of the new page (FR-006–FR-009).

**Independent Test**: Quickstart checks 3 and 4. Scroll far down the Wardrobe table, then click Outfits. The old content slides and fades out toward the start, the new content slides in, "Add an item" leaves with it, and you end at the top. Every part finishes at the same time.

- [X] T022 [US2] In src/App.tsx, add `function applyRoute(next: Route)` and route every route change through it, so it replaces T020's interim code. It does the following:
  - `const d = stepChange(routeRef.current.view, next.view)`, then `routeRef.current = next`.
  - If `d === null`: `setRoute(next)` (as today) and return.
  - Otherwise, `setDir(d)` with the route update. When `!document.startViewTransition`, or reduced motion is on (T028), call `window.scrollTo(0, 0)` and `setRoute(next)` straight away.
  - Otherwise: `document.documentElement.dataset.stepDir = d`, then `const t = document.startViewTransition(() => flushSync(() => { setDir(d); setRoute(next); window.scrollTo(0, 0); }))`. Clearing the attribute is T026's job.
  - Call it from `onNav` (replacing `routeRef.current = next; setRoute(next);`, after the guard and `openedByPush` lines, which stay unchanged) and from `navigate` (after `history.pushState/replaceState`).
  - Import `flushSync` from react-dom.
- [X] T023 [US2] In src/design-system/components.css, give the aside slot `.rt-shead-aside{view-transition-name:step-aside}`. In src/styles.css, give `.step-page{view-transition-name:step-page}`.
- [X] T024 [US2] In src/design-system/components.css, add the view-transition rules (ui-contract "CSS"):
  - `::view-transition-old(root){display:none}` and `::view-transition-new(root){animation:none}`.
  - `::view-transition-group(step-page),::view-transition-group(step-aside){animation-duration:var(--motion-step-duration);animation-timing-function:var(--motion-step-ease)}`.
  - `::view-transition-old(step-page)` and `(step-aside)` animate with `rt-step-out`, and `::view-transition-new(…)` with `rt-step-in`, both over `var(--motion-step-duration) var(--motion-step-ease) both`.
  - Keyframes: `rt-step-out` goes to `translateX(calc(-24px * var(--step-sign,1)))` with `opacity:0`. `rt-step-in` comes from `translateX(calc(24px * var(--step-sign,1)))` with `opacity:0`.
  - `:root[data-step-dir=back]{--step-sign:-1}`. Check that the custom property reaches the pseudo-elements. If it doesn't, write explicit `:root[data-step-dir=back]::view-transition-old(step-page)` rules with mirrored keyframes.
  - Comment this as the one place the design system slides (research R10).
- [X] T025 [US2] Manual: run quickstart checks 2, 3, 4 and 13 (phone width: no sideways scrollbar during the slide, and the head doesn't move).

**Checkpoint**: US1 and US2 are done. The step change is the full move the spec describes.

---

## Phase 5: User Story 3 - Moving around quickly, and moving back (Priority: P2)

**Goal**: A new move takes over from one still playing, Back and Forward animate the same way, and the app always settles on the newest route (FR-010, FR-011, FR-014, FR-015).

**Independent Test**: Quickstart checks 5, 6 and 7. Click 1→2→3→4 fast, then press Back three times quickly: you end on the address-bar page with no half-rolled text. Moves within a step don't animate, and a blocked move never animates.

- [X] T026 [US3] In src/App.tsx `applyRoute`, keep a `stepTransition = useRef(0)` counter. Increment it before each `startViewTransition` and keep the id. Run `t.finished.finally(() => { if (stepTransition.current === id) delete document.documentElement.dataset.stepDir; })`, so a skipped older transition never clears a newer move's direction (research R6). Swallow the `updateCallbackDone` and `ready` rejections (`t.ready.catch(() => {})`) so skipped transitions don't log unhandled rejections.
- [X] T027 [US3] Check the guard paths in src/App.tsx `onNav`:
  - When `closeGuard` blocks, the function returns before `applyRoute`, so nothing animates.
  - `exitDay`'s `location.hash = hash` and `history.back()` arrive through `onNav` → `applyRoute`, so a confirmed move animates.
  - The `popstate` + `hashchange` double fire is still deduplicated by the early `same route` return, which must run **before** `applyRoute`, so one navigation never starts two transitions.

  Add a short comment where the dedupe happens if it isn't already clear.
- [X] T028 [US3] Manual: run quickstart checks 5, 6 and 7. Also hold the browser's Back on a long history and confirm the final head and content match `location.hash`.

**Checkpoint**: Fast moves and history are safe.

---

## Phase 6: User Story 4 - Respecting reduced motion and first load (Priority: P2)

**Goal**: No motion under reduced motion, no animation on first load or reload, unchanged print, and a sensible fallback without view transitions (FR-012, FR-013, FR-018).

**Independent Test**: Quickstart checks 8, 9, 10 and 11.

- [X] T029 [US4] In src/App.tsx, add `const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;` and use it in `applyRoute` to skip `startViewTransition` (from T022). The existing global `@media (prefers-reduced-motion: reduce)` rule doesn't match `::view-transition-*` pseudo-elements, so the transition must be skipped in code (research R7).
- [X] T030 [US4] In `RollText` (src/design-system/components.tsx), under reduced motion (read once per change with the same `matchMedia` query), skip creating an `out` layer: replace the layers with the single new `in` layer. The global rule cancels animations, so `animationend` would never fire and leaving layers would pile up.
- [X] T031 [US4] Confirm `RollText` renders its first value with no `rt-roll-in` class (T016's `first` ref), so first load, reload and deep links (`#print`) don't animate. Fix it if a class is added on mount.
- [X] T032 [US4] Manual: run quickstart checks 8, 9, 10 and 11. For check 11, print from Print and from Wardrobe and compare with prints from `git stash`/`main`. The only expected difference is the Wardrobe printout's title, which now reads "Wardrobe" instead of "Rotation".

**Checkpoint**: Every story is done.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T033 [P] Create design-system/components/StepHead.md, in the style of SectionHead.md:
  - what it is (the one page head the app renders above every step);
  - props (`number`, `title`, `dek`, `dir`, `className`, `children` as the page content);
  - `StepAside` for page actions ("Keep it to one or two controls");
  - the motion (direction follows the step order, `motion-step-*`, removed under reduced motion);
  - accessibility (one `h1`, leaving text `aria-hidden`).
- [X] T034 [P] In design-system/components/SectionHead.md, replace the "Page head (`level={1}`)" paragraph with one line: "The view's page head is `StepHead`; `level={1}` and `number` remain for compatibility but the app no longer uses them."
- [X] T035 [P] In design-system/README.md:
  - add a `StepHead` row (and a `StepAside` mention) to the component table next to `SectionHead`;
  - change the motion paragraph (line ~143) to add the one exception: "Step changes: a short directional roll and slide (`motion-step-*`, 320ms) that follows the step order. Removed under `prefers-reduced-motion`.";
  - add `motion-step-duration` and `motion-step-ease` to any token list there.
- [X] T036 In src/App.tsx and src/components/common.tsx, remove anything no longer used (`PageHead`, `DEKS`, `LABELS`, unused imports). Run `npm run typecheck` and `npm test`.
- [X] T037 Run `npm run build` and then `npm run audit`. Accessibility must stay at 100, and Performance must not drop below the figures in specs/001-page-flow-refinement/lighthouse/REPORT.md (SC-003, SC-007). Record the results in the Notes section below.
- [X] T038 Run all of quickstart.md (checks 1–13) once more, end to end, in Chrome and in one other engine (Safari or Firefox).

---

## Dependencies & Execution Order

- **Setup (T001–T002)** → **Foundational (T003–T015)** → the user stories.
- **US1 (T016–T021)** depends on Foundational.
- **US2 (T022–T025)** depends on Foundational. T022 replaces T020, so do US1 first or skip T020 if you do US2 first.
- **US3 (T026–T028)** depends on US2's `applyRoute` (T022).
- **US4**: T029 depends on T022, and T030–T031 depend on T016.
- **Polish (T033–T038)** comes after every story. T033–T035 can be done at any point after Phase 2.

### Within phases

- In Phase 2, T003/T004 (route), T005/T006 (common) and T008/T009 (design system) can be done in parallel. T010 needs T005 and T008. T011–T014 need T008 and can run in parallel with each other (different files).
- In US1, T016 → T017 → T018. T019 is CSS that doesn't depend on them.

## Parallel Example: Phase 2

```text
T003 + T004  route.ts stepChange and its tests
T005 + T006  STEP_HEADS and its test
T008         StepHead / StepAside
then T010, then T011 ‖ T012 ‖ T013 ‖ T014 (one file each)
```

## Implementation Strategy

1. **MVP = Phases 1–3**: a shared head that rolls and blends. It's shippable on its own: the content still swaps at once, as it does today.
2. **Then Phase 4** (US2) for the full move, and **Phase 5** (US3) to make it hold up under fast use.
3. **Phase 6** (US4) must ship with Phase 4. Don't release content slides without the reduced-motion skip.
4. **Phase 7**: docs and audit.

## Notes

- **T001 baseline**: 192 tests passed and typecheck was clean before any change. At the end: 198 tests pass (6 new) and typecheck is clean.
- **T020** was folded into T022: `applyRoute` was written directly, so no interim code existed.
- **T024**: the back direction uses explicit `:root[data-step-dir="back"]` rules with mirrored keyframes instead of a `--step-sign` variable.
  - Following analysis finding U1, the `step-page` and `step-aside` groups get `animation: none`, so a page left scrolled far down doesn't fly up the screen.
  - After reviewing the mid-change frames, the content fades are staggered: the old page is gone by 60% of the change and the new one starts showing at 35%.
- **Fixed during implementation:**
  - The numeral was cropped higher than before. `.rt-shead-num span` (an absolute offset) also matched the spans `RollText` adds, so the offset was applied three times. It is now `.rt-shead-num > span`, and the measured glyph position matches the original at 1280 px and 390 px.
  - Step 3 (Rotation) looked wider than the others: it is the only step short enough not to scroll, so it got the scrollbar's width back. Fixed with `html { scrollbar-gutter: stable }`. Every step now measures the same width at 360, 390 and 1280 px.
  - On phones, "Wardrobe" is wider than the old "Rotation" title, and the shared head couldn't shrink below it (Wardrobe's head was 371 px against 358 px for the other steps at 390 px). Fixed with `main > * { min-width: 0 }` and a phone title of `min(56px, 11.5vw)`.
- **Verified in headless Edge (Chromium), with probes in `.playwright-mcp/probe/`:**
  - forward and back rolls and slides, landing at the top;
  - one `h1` throughout, with the leaving text `aria-hidden`;
  - a fast run plus 3 × Back ends on the address-bar page with one layer in each roll;
  - item detail and day open/close don't animate;
  - a blocked move doesn't animate, either while the prompt is open or after "Keep editing", and "Discard" then plays the move;
  - reduced motion swaps at once;
  - a deep link doesn't animate;
  - in print, the head is hidden on the Print step and shown on Wardrobe;
  - without `startViewTransition`, the head still rolls and the content swaps at once;
  - no console errors.
- **T037 Lighthouse** (specs/004-animated-page-header/lighthouse/REPORT.md):
  - Performance: 100 on desktop and 97 on mobile everywhere, the same as or better than 001–003.
  - Accessibility: 100 everywhere except Wardrobe, which gets 98 for `heading-order` (the "Your data" `h3` follows the `h1` with no `h2`). axe flags the same violation on a build of `HEAD` from before this feature, so it is not caused by the shared head. Earlier Lighthouse runs didn't report it. It is left for a follow-up, because the fix changes that section's heading level.
  - Wardrobe best practices is 96, from third-party product image cookies, the same as 001–003.
- **T038** was checked in Chromium only. No Safari or Firefox is available on this machine, so check those engines by hand (quickstart checks 1–13).
