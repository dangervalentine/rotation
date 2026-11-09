# Implementation Plan: Animated Shared Page Header

**Branch**: `004-animated-page-header` (spec folder name; work is on `main`, no branch created) | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-animated-page-header/spec.md`

## Summary

Replace each view's own `PageHead` with a single design-system `StepHead` that `App` renders once, above the active view.

- **The head changes in place.** The head stays mounted, so its parts change in place:
  - The numeral, the title (now the step's name) and the subtitle roll through a small `RollText` component: up for a later step, down for an earlier one (R3).
  - The step colour blends with a CSS transition on the existing `--step` variables.
- **The content slides.** The content below the head slides out and in with the same direction, using the View Transitions API (`document.startViewTransition` with `flushSync`) (R4).
- **Page actions stay with their page.** Each view's actions portal into the head's aside slot through `StepAside`, so they keep their state and slide with the content (R2).
- **One function decides direction.** A pure `stepChange(prev, next)` in `route.ts` decides whether a move animates and which way (R5).
- **What doesn't animate:** moves the open-day guard holds back, moves within a step, reduced motion and first load (R5, R7).
- **Timing.** One new token pair, `motion-step-*`, times everything at 320 ms (R8).

There are no new dependencies.

## Technical Context

**Language/Version**: TypeScript 7 (`tsc -b`), React 19.3, ESM

**Primary Dependencies**:
- Vite 8 and the existing Radix primitives.
- The browser's View Transitions API (same-document), used directly.
- `react-dom`'s `flushSync` and `createPortal`.
- **No new dependencies.**

**Storage**: None changed. There are no data or route changes, and the hash routes and history entries are as they are today.

**Testing**: Vitest 5 (node environment).
- **Extended `test/route.test.ts`**: `stepChange` covers every ordered pair, the same view, and multi-step jumps.
- **New `test/stepHeads.test.ts`**: `STEP_HEADS` titles match the tab labels, numbers follow `VIEW_ORDER`, and there's a subtitle for every view.
- **Extended `test/tokens.test.ts`**, if it lists motion tokens: `motion-step-*`.
- **Visual and interaction checks** are manual, per [quickstart.md](quickstart.md). Lighthouse runs through `npm run audit`.

**Target Platform**: Evergreen desktop and mobile browsers, plus print. Static hosting (GitHub Pages) and the local dev server. View transitions need Chrome/Edge 111+, Safari 18+ or Firefox 144+. Other browsers swap the content instantly, while the head still rolls.

**Project Type**: Single-page web app (one Vite project)

**Performance Goals**: A step change settles in ≤ 400 ms (FR-008), and the motion uses only transform and opacity apart from the colour blend. There is no long task on navigation beyond today's view render. The Lighthouse performance score holds (SC-003).

**Constraints**:
- The design-system rules: tokens only, AA contrast in both themes, one `h1`, no sideways scroll at 360 px, and `prefers-reduced-motion` respected.
- Settled pages are unchanged apart from the title.
- Print is unchanged.
- The existing open-day guard and history behaviour are untouched.

**Scale/Scope**:
- 3 new design-system components (`StepHead`, `StepAside`, `RollText`), about 120 lines.
- 1 pure function (`stepChange`).
- `App.tsx`: one `applyRoute` path, the `StepHead` and `.step-page` wrapper.
- 4 views lose `PageHead`, and 3 of them gain a `StepAside`.
- About 80 lines of CSS, 2 tokens and 2 design-system docs.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the **unfilled template**, so there are no ratified gates. As in features 001–003, the plan holds itself to the project's documented rules in `design-system/README.md`:

| Rule | Status |
|---|---|
| Tokens only: no hard-coded UI colours, spacing or durations | ✅ The new `motion-step-*` tokens time everything. The colours are the existing `--step-N`. |
| Motion: "colour and background swaps at 150ms ease; no slides, bounces or parallax"; respect reduced motion | ⚠️ **A deliberate, scoped exception.** The user asked for directional motion between steps (clarification Q2). It is limited to step changes, has no bounce or overshoot, and is removed under reduced motion (R7). The README is updated to record the exception (R10). See Complexity Tracking. |
| One accent (oxblood) per screen; steps never colour buttons | ✅ No change. Only existing step-coloured parts blend. |
| Text pairs ≥ 4.5:1 in both themes | ✅ No new colour pairs. During the blend, both ends are AA, and the in-between frames last under 320 ms. |
| One `h1` per screen; Lighthouse accessibility 100 | ✅ The single `h1` is in `StepHead`, and the leaving layers are `aria-hidden` (R9). |
| No sideways scroll at 360 px | ✅ The slide is 24 px inside view-transition groups, which don't affect layout. Checked by quickstart check 13. |
| `npm test` and `npm run typecheck` green | ✅ Required before completion. |

**Post-design re-check**: Still passing. The only deviation is the motion exception, which the user asked for, is written into the design-system docs, and is turned off under reduced motion.

## Project Structure

### Documentation (this feature)

```text
specs/004-animated-page-header/
├── plan.md                 # this file
├── research.md             # Phase 0 (R1–R10)
├── data-model.md           # Phase 1
├── quickstart.md           # Phase 1
├── contracts/
│   └── ui-contract.md      # StepHead, StepAside, RollText, tokens, App, views, CSS, guarantees
├── checklists/
│   └── requirements.md
└── tasks.md                # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── App.tsx                       # StepHead + .step-page; applyRoute() with stepChange, startViewTransition, reduced motion, scroll to top
├── lib/
│   └── route.ts                  # + StepDir, stepChange()
├── components/
│   ├── common.tsx                # PageHead + DEKS → STEP_HEADS (number, title, dek)
│   ├── WardrobeView.tsx          # PageHead → StepAside (list); removed (item detail)
│   ├── OutfitsView.tsx           # PageHead → StepAside (when editing)
│   ├── RotationView.tsx          # PageHead removed
│   └── PrintView.tsx             # PageHead → StepAside (Print button)
├── design-system/
│   ├── components.tsx            # + StepHead, StepAside, RollText (+ aside-slot context)
│   ├── components.css            # roll keyframes, colour transitions, view-transition rules
│   └── tokens.css                # regenerated: --motion-step-duration, --motion-step-ease
design-system/
├── tokens.json                   # + motion-step-duration, motion-step-ease
├── README.md                     # motion rule: step-change exception; StepHead in the component table
└── components/
    ├── StepHead.md               # NEW
    └── SectionHead.md            # page-head usage now points to StepHead
test/
├── route.test.ts                 # + stepChange
└── stepHeads.test.ts             # NEW
```

**Structure Decision**: This stays a single Vite project.
- The animated head is a design-system component, like `Masthead` and `SectionHead`, so it is documented and reusable.
- The decision of when and which way to animate is a pure function in `route.ts`, beside `parseHash`, so it can be tested in node.
- The browser-only work (view transitions, `matchMedia`, scroll) sits in one `App` function.

## Delivery order

| Step | Spec | Gate |
|---|---|---|
| 1 Shared head, no motion: `STEP_HEADS`, `StepHead`, `StepAside`; views migrated | FR-001, FR-005, FR-009, FR-016–FR-019 | Settled pages match `main` apart from the title; tests and typecheck green; quickstart checks 4, 11, 12 |
| 2 Head motion: `RollText`, colour blend, tokens | FR-002–FR-004, FR-012, FR-013 | Quickstart checks 1, 8, 9 |
| 3 Content motion: `stepChange`, `applyRoute`, view transitions, scroll | FR-006–FR-008, FR-010, FR-011, FR-014, FR-015 | `stepChange` tests; quickstart checks 2, 3, 5, 6, 7, 10, 13 |
| 4 Docs and audit | FR-019, SC-003, SC-007 | README and StepHead.md updated; `npm run audit` |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Directional slide/roll motion, against the README's "no slides" rule | The user explicitly chose motion that follows the step order (clarification Q2) | A crossfade-only change (Q2 option B) was offered and declined. The exception is limited to step changes and turned off under reduced motion. |
| A portal (`StepAside`) for page actions | The actions depend on each view's local state, but must sit in the shared head | Lifting that state into `App` couples `App` to every view's internals. Moving the actions under the head changes the settled layout (FR-016). |
