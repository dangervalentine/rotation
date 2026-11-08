# Implementation Plan: Outfit Builder Polish & Sketch-a-Piece

**Branch**: `002-outfit-builder-polish` (the spec folder name; work is currently on `main`, and no branch has been created) | **Date**: 2026-11-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-outfit-builder-polish/spec.md`

## Summary

Rebuild `LookEditor`, the outfit builder shared by the Outfits workspace and the Rotation day panel, around four changes:

1. **Sketch a piece.** Every slot picker ends with "Create a piece…". Choosing it swaps the builder's slot column for an inline **creator panel**, while the figure stays in view. The panel has style tiles drawn with the app's own figure renderer, a curated 12-colour menswear palette, a custom colour, an optional stripe and an optional name. The figure previews the sketch live. Confirming adds an `Item` with `owned: false, sketch: true` to the wardrobe through a new `onCreateItem` callback and selects it in the slot. Cancelling restores the look.
   - **Sketch is its own status** (clarified): each item is Sketch, To buy or Owned.
   - `wardrobeTotals` and `generateRotation` skip sketches.
   - The Wardrobe tab lists sketches in a separate **Sketches** group in both table and cards layouts. Each sketch has one-action **Promote** controls ("Move to To buy", "I own this"), which clear `sketch`.
2. **Easy to use.** A pure undo/redo history (`src/lib/history.ts`, 50 steps, reset when the builder is pointed at a different outfit or day). The Radix Select gets highlight-to-preview, a status tag per option, owned-before-sketch ordering and an action entry. Empty slots get an inline "Create a piece" row. Shuffle is guaranteed to change something when it can.
3. **Premium feel.** The figure is the hero. Slots become a styled "piece list" (kicker, swatch, name, status, Keep). Changes cross-fade the figure and pulse the changed row, using new motion tokens that are switched off under `prefers-reduced-motion`. The "Try every" strip scrolls on its own and marks the current piece.
4. **Colour from a photo (P3).** The photo is decoded on the device into a canvas. A bucketed histogram over the centre of the image suggests the main colour, and tapping the image samples the 5×5 area around that point. The photo is reduced to a JPEG data URL of at most 480 px on its long edge and kept as `item.image`.

Nothing new is installed. The work reuses `@radix-ui/react-select` and `@radix-ui/react-toggle-group` and the existing design tokens.

## Technical Context

**Language/Version**: TypeScript 7 (`tsc -b`), React 19.3, ESM

**Primary Dependencies**: Vite 8, existing Radix primitives (`react-select`, `react-toggle-group`, `react-dialog`, `react-checkbox`, `react-alert-dialog`). **No new dependencies.**

**Storage**: Unchanged backends (`data/wardrobe.json` through the dev API, or `localStorage`). One optional field is added to `Item` (`sketch?: true`), with no version bump. While it is set, the item is excluded from cost totals and from the rotation generator. Photo sketches store a small JPEG data URL in the existing `image` field. Undo history is in memory only.

**Testing**: Vitest 5 (node environment). New: `test/history.test.ts`, `test/sketch.test.ts` (naming, nearest palette colour, sketch item factory, `itemStatus`, `promote`), `test/colour.test.ts` (dominant colour and point sampling on synthetic pixel buffers), and cases in `test/model.test.ts`: shuffle changes something; `wardrobeTotals` ignores sketches; `generateRotation` never places a sketch, including through belt matching. Token contrast tests are extended for any new text pairs. Manual and audit checks are in [quickstart.md](quickstart.md). Lighthouse runs through the existing `npm run audit`.

**Target Platform**: Evergreen desktop and mobile browsers. Static hosting (GitHub Pages) and the local dev server.

**Project Type**: Single-page web app (one Vite project)

**Performance Goals**: A figure update, including a hover or arrow-key preview, renders in under 100 ms on a mid-range phone (SC-006). `figureSvg` is a pure string builder, already well under 1 ms. Photo decode, downscale and histogram take under 300 ms for a 12 MP image, because the image is downscaled before any pixels are read.

**Constraints**: Tokens only (README rule). Garment colours are never tinted. One oxblood primary action per screen. No sideways page scroll at 360 px. Touch targets ≥ 44 px. Reduced motion is honoured. Print output is unchanged. Each stored photo is ≤ 150 KB. A 20-photo wardrobe stays under 3 MB, inside the ~5 MB `localStorage` quota.

**Scale/Scope**: One component rewritten (`LookEditor`), two call sites updated (`OutfitsView`, `RotationView`). Three new lib modules (`history`, `sketch`, `colour`), one new UI module (`SketchCreator`), `Select` extended, The Wardrobe tab gets a Sketches group and Promote actions. Two model functions change (`wardrobeTotals`, `generateRotation`). Also tokens and design-system docs.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the **unfilled template**, so there are no ratified gates. As in feature 001, the plan holds itself to the project's documented rules in `design-system/README.md`:

| Rule | Status |
|---|---|
| Tokens only: no hard-coded colours, spacing or radii | ✅ New values (`motion-quick-duration`, `motion-quick-ease`, `tile-size`) are added to `tokens.json` with usage notes. The garment palette is **data** (`src/lib/palette.ts`), not UI tokens, because it describes clothes, as `item.color` does (see research R4). |
| The garments are the pictures (never tint garment colour) | ✅ Palette swatches and photo-sampled colours render through the existing `Swatch` and figure as is |
| Rules, not boxes; no shadows except the save bar | ✅ The creator is a panel inside the builder, separated by a heavy rule, with no card or shadow. Style tiles use hairline borders. |
| One accent (oxblood) per screen | ✅ While the creator is open, its "Add to look" is the only primary button. The workspace's "Save as new outfit" (Outfits) and the panel's "Apply" (Rotation) are demoted to secondary until the creator closes. |
| Text pairs ≥ 4.5:1, both themes | ✅ No new colour pairs are planned. Any that come up are added to `tokens.test.ts`. |
| `npm test` and `npm run typecheck` stay green; Lighthouse accessibility stays at 100 | ✅ Required by SC-005 |

**Post-design re-check** (after clarification): No violations. The Sketches group reuses the existing category-group table and card patterns. Promote buttons are secondary and ghost, so there is still one oxblood action per screen. The demoted primary while the creator is open is recorded in `design-system/components/SketchCreator.md`.

## Project Structure

### Documentation (this feature)

```text
specs/002-outfit-builder-polish/
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── ui-contract.md   # component props, callbacks, keyboard and ARIA behaviour
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── types.ts                    # Item.sketch?: true
│   ├── model.ts                    # shuffleLook: guarantee a change; sortForPicker; wardrobeTotals + generateRotation skip sketches
│   ├── history.ts                  # NEW: pure undo/redo stack (push/undo/redo/reset, cap 50)
│   ├── palette.ts                  # NEW: 12 named menswear colours + nearestColourName()
│   ├── sketch.ts                   # NEW: makeSketch(), sketchName(), uniqueName(), itemStatus(), promote(), per-slot defaults
│   └── colour.ts                   # NEW: dominantColour(pixels), sampleAt(pixels, x, y), rgbToHex; pure, no DOM
├── components/
│   ├── LookEditor.tsx              # rewritten: piece list, history, preview, creator mode, empty slots, motion
│   ├── SketchCreator.tsx           # NEW: inline creator panel (style tiles, palette, custom, stripe, name, photo)
│   ├── photo.ts                    # NEW: DOM glue: File → downscaled canvas → pixels + JPEG data URL
│   ├── common.tsx                  # itemOption adds status tag; OutfitFigure accepts a `changed` hint for the pulse
│   ├── OutfitsView.tsx             # pass onCreateItem + historyKey; demote primary while creating
│   ├── RotationView.tsx            # pass onCreateItem + historyKey (day index); demote Apply while creating
│   └── WardrobeView.tsx            # Sketches group (table + cards), outside totals; Promote actions; Owned checkbox hidden for sketches
├── design-system/
│   ├── components.tsx              # Select: onHighlight, option `tag`, action options; Tag tone "sketch"
│   ├── components.css              # piece list, tiles, palette grid, creator panel, motion, reduced-motion
│   └── tokens.css                  # regenerated
└── styles.css                      # builder layout (figure hero, sticky figure on phones)

design-system/
├── tokens.json                     # motion-quick-*, tile-size
└── components/
    ├── Select.md                   # updated: preview, tags, action entry
    ├── Tag.md                      # updated: sketch tone
    └── SketchCreator.md            # NEW

test/
├── history.test.ts                 # NEW
├── sketch.test.ts                  # NEW
├── colour.test.ts                  # NEW
└── model.test.ts                   # + shuffle always changes when possible; picker ordering
```

**Structure Decision**: This stays a single Vite project. Pure logic (history, naming, palette, colour maths) goes in `src/lib/` so the node-environment Vitest suite can test it without a DOM. DOM-only photo handling sits in a small `components/photo.ts` wrapper around the pure `colour.ts`. `SketchCreator` lives in `components/` rather than `design-system/` because it knows about `Item`, `STYLES` and the figure renderer. Its generic parts (tiles, palette swatches) are styled by design-system CSS classes and documented in `SketchCreator.md`.

## Complexity Tracking

No constitution violations to justify.
