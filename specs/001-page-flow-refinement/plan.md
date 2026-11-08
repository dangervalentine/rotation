# Implementation Plan: Page Flow & Design Refinement

**Branch**: `001-page-flow-refinement` (the spec folder name; work is currently on `main`, and no branch has been created) | **Date**: 2026-11-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-page-flow-refinement/spec.md`

## Summary

Reorder the views to the order of the work (Wardrobe & costs → Outfits → Rotation → Print), with Wardrobe as the default. Take the always-visible outfit builder off the Rotation view and replace it with a `Sheet`:

- a **non-modal right-side panel** on wide screens, which leaves the calendar visible and clickable
- a **modal bottom sheet** on narrow screens

The URL holds the open state (`#rotation/day/<n>`), so Back closes the panel. Move the Check, Segmented, Sheet and confirm dialog onto **Radix UI Primitives**, extending the Radix Select the app already uses, and style them with the existing Rotation tokens. Make the masthead dek legible by switching it to `ink` with Bodoni's text optical size and a slightly heavier weight (light theme goes from 6.3:1 to more than 15:1). Check the result with a scripted Lighthouse run (accessibility and best practices, light and dark themes, desktop and mobile), before and after the changes.

## Technical Context

**Language/Version**: TypeScript 7 (`tsc -b`), React 19.3, ESM

**Primary Dependencies**: Vite 8, `@radix-ui/react-select` (existing); adding `@radix-ui/react-dialog` ^1.1, `@radix-ui/react-alert-dialog` ^1.1, `@radix-ui/react-checkbox` ^1.3, `@radix-ui/react-toggle-group` ^1.1. Dev-only: `lighthouse` ^13, `puppeteer-core` ^25

**Storage**: Unchanged. `data/wardrobe.json` through the dev API, or `localStorage`. The new state lives only in the URL hash and component state.

**Testing**: Vitest 5 (node environment). New: `test/route.test.ts`, plus dek contrast pairs in `test/tokens.test.ts`. Manual checks in [quickstart.md](quickstart.md). Automated audit in `scripts/lighthouse.mjs`.

**Target Platform**: Evergreen desktop and mobile browsers. Static hosting (GitHub Pages) and a local dev server.

**Project Type**: Single-page web app (one Vite project)

**Performance Goals**: The panel opens within one frame of the click and animates in ≤ 220 ms. There are no regressions to the existing Lighthouse performance score (recorded, not gated).

**Constraints**: All styling uses design tokens (README rule). No horizontal scroll at 360 px. Works with `prefers-reduced-motion`. Print output is unchanged.

**Scale/Scope**: 4 views. About 6 files changed in `src/`, 2 new components, 1 new lib module, 1 new script, plus design-system docs.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the **unfilled template** (no ratified principles), so there are no constitution gates to evaluate. Instead, the plan holds itself to the project's own documented rules in `design-system/README.md`:

| Rule | Status |
|---|---|
| Tokens only: no hard-coded colours, spacing or radii | ✅ New values (`sheet-width`, `scrim`, `motion-sheet`) are added as tokens with usage notes |
| Rules, not boxes; no shadows except the save bar | ✅ The Sheet uses a hairline rule and `paper-raised`, with no shadow. The backdrop `scrim` exists only on the bottom sheet. |
| One accent (oxblood) per screen | ✅ The panel's Apply button is the primary action. While the panel is open, "Generate rotation" in the view header is demoted to secondary, so only one oxblood action shows. |
| Text pairs ≥ 4.5:1 | ✅ Raised for the dek to ≥ 7:1 and enforced in `tokens.test.ts` |
| `npm test` stays green | ✅ Required by SC-007 |

**Post-design re-check**: No violations. The one-accent note above is a design decision, recorded in `Sheet.md`.

## Project Structure

### Documentation (this feature)

```text
specs/001-page-flow-refinement/
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── ui-contract.md   # routes + component API
├── checklists/
│   └── requirements.md
├── lighthouse/          # created by scripts/lighthouse.mjs (before/, after/, REPORT.md)
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── App.tsx                         # view order, default view, route parsing via lib/route
├── lib/
│   └── route.ts                    # NEW: parseHash / formatHash
├── components/
│   ├── RotationView.tsx            # builder moved into <Sheet>; confirm flow; URL sync; F6
│   ├── OutfitsView.tsx             # Check call sites → onCheckedChange
│   ├── LookEditor.tsx              # Check call sites → onCheckedChange
│   ├── WardrobeView.tsx            # Check / Segmented call sites as needed
│   └── PrintView.tsx               # Segmented call sites (API unchanged)
├── design-system/
│   ├── components.tsx              # Sheet, ConfirmDialog (new); Check, Segmented on Radix; RotationDay ref + aria
│   ├── components.css              # .rt-sheet*, .rt-confirm*, checkbox/toggle states, dek, has-sheet
│   └── tokens.css                  # regenerated (npm run tokens)
└── styles.css                      # rotation grid reflow when the sheet is open

design-system/
├── tokens.json                     # sheet-width, scrim, motion-sheet
├── README.md                       # component table + dek type note
└── components/
    ├── Sheet.md                    # NEW
    ├── ConfirmDialog.md            # NEW
    ├── Masthead.md, Check.md, Segmented.md, RotationDay.md   # updated

scripts/
└── lighthouse.mjs                  # NEW: audit runner → specs/001-page-flow-refinement/lighthouse/

test/
├── route.test.ts                   # NEW
└── tokens.test.ts                  # + ink ≥ 7:1 pairs
```

**Structure Decision**: Single Vite project, using the existing layout. The design-system components stay in `src/design-system/components.tsx`, which is the project's convention, and their docs go in `design-system/components/`.

## Implementation Approach (sequenced)

1. **Baseline audit**: Write `scripts/lighthouse.mjs` and run it with `--phase before` on the untouched build (FR-023, FR-025).
2. **Routing and order**: `lib/route.ts` with tests, then the `VIEWS` reorder and default view in `App.tsx` (US2).
3. **Dek**: Token pairs test, CSS change, docs (US3).
4. **Primitives**: Add the Radix packages. Build `Sheet` and `ConfirmDialog`, and port `Check` and `Segmented`, updating their call sites (US4).
5. **Rotation panel**: Move the builder into `Sheet`, wire the URL, confirm flow, focus return, F6, the grid reflow and reshape handling (US1).
6. **After audit**: Run `--phase after`, fix findings until Accessibility is 100 and Best Practices ≥ 95, and write `REPORT.md` (US5).
7. **Docs**: README views order, design-system docs.

## Complexity Tracking

No constitution violations to justify.
