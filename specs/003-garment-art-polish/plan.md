# Implementation Plan: Garment Art & Customization Polish

**Branch**: `003-garment-art-polish` (spec folder name; work is on `main`, no branch created) | **Date**: 2026-11-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-garment-art-polish/spec.md`

## Summary

Rebuild the garment renderer (`src/lib/figure.ts`) in six stages that each ship on their own:

1. **Foundation, no visible change.**
   - Split the renderer into modules under `src/lib/figure/`.
   - Make it produce painting-order **layers tagged by part**, so `pieceSvg` takes a slot's layers instead of string-diffing markup.
   - Add named **body anchors**.
   - A golden snapshot test proves the output is unchanged (R1–R3).
2. **Polish the 19 existing styles.**
   - Arms drawn separately from the torso, sloped shoulders, a slight taper, legs on the plain figure.
   - Non-scaling outlines (1.25 px plain, 2 px cartoon) and one derived shade per colour.
   - A signature detail per style, and warm tile grounds (R4, R5).
3. **Details.**
   - Flat optional `Item` fields: `sleeve`, `pattern`, `hardware`, `length`, `buckle`. The existing `stripe` becomes the pattern's second colour, so no migration is needed.
   - A `STYLE_SPEC` registry decides which options apply and their defaults.
   - A shared `DetailFields` component appears in the Wardrobe form and the sketch creator (R6–R8).
4. **New styles**: 22 drawn styles, from the registry table in the renderer contract.
5. **Accessories.**
   - The `"other"` category is relabelled "Accessories", with drawable styles.
   - `Look.acc?: string[]`.
   - An accessories row in the builder; cartoon-only head-worn pieces (R9, R10).
6. **Underwear styles**: icons only in the Wardrobe view, never drawn on the figure.

There are no new dependencies and no version bump. Verification combines unit tests, the stage-1 golden snapshot and a generated **garment gallery** HTML for visual review (R11).

## Technical Context

**Language/Version**: TypeScript 7 (`tsc -b`), React 19.3, ESM

**Primary Dependencies**: Vite 8, existing Radix primitives (via `Tiles`, `Segmented`, `Select`). **No new dependencies.**

**Storage**: Unchanged backends (`data/wardrobe.json` through the dev API, or `localStorage`). New optional fields only: `Item.sleeve | pattern | hardware | length | buckle` and `Look.acc`. `WardrobeData.version` stays 1. Defaults are never stored.

**Testing**: Vitest 5 (node environment).
- New: `test/figure.golden.test.ts` (stage-1 identity snapshot), `test/figure.test.ts` (layers, piece isolation, legs, non-scaling outlines, sibling distinctness, no underwear drawn, unknown-style fallback, accessory rules) and `test/styles.test.ts` (registry, `detailsOf`, `cleanDetails`, stripe→pattern inference).
- Extended: `test/model.test.ts` (`normalizeLook` acc, `generateRotation` keep, `daysWorn` acc, migrate round trip), `test/sketch.test.ts` (details, accessory sketches) and `test/productParse.test.ts` (new kind words).
- Visual: `npm run gallery` (`scripts/garment-gallery.mts`). Lighthouse runs through `npm run audit`.

**Target Platform**: Evergreen desktop and mobile browsers, plus print. Static hosting (GitHub Pages) and the local dev server.

**Project Type**: Single-page web app (one Vite project)

**Performance Goals**: A figure string builds in under 1 ms. The Print view (10 cartoons) and "Try every" strips redraw in under 20 ms of scripting (R12, SC-008).

**Constraints**:
- Design-system rules: tokens only for UI, garment colours never tinted, rules not boxes, one oxblood primary per screen, AA contrast in both themes, no sideways scroll at 360 px, ≥ 44 px targets.
- Existing viewBoxes are unchanged.
- Old data loads byte-identically into the model.

**Scale/Scope**:
- 1 renderer rewritten into about 10 modules, and 1 new registry module (`styles.ts`).
- 1 new component (`DetailFields`); `LookEditor`, `SketchCreator`, `WardrobeView`, `GarmentCard` and `common.tsx` updated; `productParse` kind words extended.
- 22 new drawn styles plus 4 underwear icons.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the **unfilled template**, so there are no ratified gates. As in features 001 and 002, the plan holds itself to the project's documented rules in `design-system/README.md`:

| Rule | Status |
|---|---|
| Tokens only: no hard-coded UI colours, spacing or radii | ✅ Tile grounds use `--paper-sunk`. Ink, shade and hardware hexes are **garment data** in the renderer, like `PALETTE` (002 R4), not UI tokens. |
| The garments are the pictures (never tint garment colour) | ✅ The base colour is drawn as is. The derived shade only marks depth, never replaces the base. |
| Rules, not boxes; no shadows except the save bar | ✅ Detail groups reuse `Tiles` and `Segmented`. Accessory chips use hairline borders. |
| One accent (oxblood) per screen | ✅ No new primary buttons. "Add to look" stays the only primary while the creator is open. |
| Text pairs ≥ 4.5:1 in both themes | ✅ No new text colour pairs. Hardware swatches always carry text labels. |
| `npm test` and `npm run typecheck` green; Lighthouse accessibility 100 | ✅ Required at the end of every stage. |

**Post-design re-check**: No violations. The only judgment call is the hardware and shade colours living in renderer code. They describe garments, not interface, the same as the 002 palette decision.

## Project Structure

### Documentation (this feature)

```text
specs/003-garment-art-polish/
├── plan.md                       # this file
├── research.md                   # Phase 0 (R1–R12)
├── data-model.md                 # Phase 1
├── quickstart.md                 # Phase 1
├── contracts/
│   ├── renderer-contract.md      # figure API, guarantees, full style table, guessKind words
│   └── ui-contract.md            # DetailFields, SketchCreator, LookEditor accessories, Wardrobe, GarmentCard
├── checklists/
│   └── requirements.md
└── tasks.md                      # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── figure.ts                 # public entry: re-exports figureLayers, figureSvg, pieceSvg, basicsIconSvg, VIEWBOX
│   ├── figure/
│   │   ├── body.ts               # NEW: BODY anchors, at(), arms, legs, hands
│   │   ├── head.ts               # NEW (moved): hair, head, face
│   │   ├── paint.ts              # NEW: Paint context, outline()/detail() attrs, pattern defs
│   │   ├── tops.ts               # NEW: shirts + undershirts
│   │   ├── layers.ts             # NEW: top layers
│   │   ├── bottoms.ts            # NEW: pants/shorts/skirt/chinos/jeans/trousers/joggers + belt loops
│   │   ├── belts.ts              # NEW
│   │   ├── shoes.ts              # NEW
│   │   ├── accessories.ts        # NEW: glasses, sunglasses, watch, hat, tie, scarf
│   │   └── icons.ts              # NEW: basicsIconSvg (socks + underwear styles)
│   ├── styles.ts                 # NEW: STYLE_SPEC, STYLES (derived), styleSpec, detailsOf, detailOptions, cleanDetails
│   ├── colour.ts                 # + shade(), mix(), luminance()
│   ├── types.ts                  # Item detail fields; Look.acc; detail union types
│   ├── model.ts                  # STYLES re-exported from styles.ts; CATEGORIES label "Accessories"; normalizeLook acc; daysWorn acc; generateRotation keep
│   ├── sketch.ts                 # makeSketch: details + accessory part; SKETCH_DEFAULTS.acc
│   └── productParse.ts           # new kind words (contract)
├── components/
│   ├── DetailFields.tsx          # NEW: shared detail controls (tiles | compact)
│   ├── SketchCreator.tsx         # part: Slot | "acc"; details section; tile ground
│   ├── LookEditor.tsx            # accessories row (chips + add select + create)
│   ├── WardrobeView.tsx          # DetailFields in form; basics icons; acc cleanup on delete/recategorise
│   ├── RotationView.tsx          # generateRotation keep
│   └── common.tsx                # aria-label + lookPieces include accessories
├── design-system/
│   ├── components.tsx            # GarmentCard art prop; SLOT_LABEL other → Accessories; Piece.slot widened
│   └── components.css            # tile ground/padding, detail groups, accessory chips, basics icon
scripts/
└── garment-gallery.mts           # NEW: npm run gallery → garment-gallery.html
design-system/components/
├── GarmentCard.md                # art prop, Accessories label
├── SketchCreator.md              # details section, accessory part
└── LookCard.md                   # accessory pieces
test/
├── figure.golden.test.ts         # NEW (+ __snapshots__)
├── figure.test.ts                # NEW
├── styles.test.ts                # NEW
├── model.test.ts / sketch.test.ts / productParse.test.ts   # extended
```

**Structure Decision**: This stays a single Vite project.
- The renderer grows from 165 lines to roughly 1,200, so it is split by garment family under `src/lib/figure/`. `figure.ts` stays the import path every consumer already uses.
- The style registry is its own module so the renderer, forms, sketch factory and `productParse` share one source of truth without circular imports (`model.ts` re-exports `STYLES`).
- All drawing stays pure string-building in `src/lib/`, so the node Vitest environment can test it.

## Stages and ship gates

| Stage | Spec stories / FRs | Gate |
|---|---|---|
| 1 Foundation | FR-001–FR-003 | Golden snapshot unchanged; all existing tests pass |
| 2 Polish | US1; FR-004–FR-011 | Snapshot updated deliberately; gallery checks 1–4; quickstart manual check 1 |
| 3 Details | US2; FR-012–FR-020, FR-038–FR-040 | styles tests; gallery checks 5–6; manual checks 2–4, 9–11 |
| 4 Styles | US3; FR-021–FR-027 | sibling-distinctness test; gallery check 1 for new rows |
| 5 Accessories | US4; FR-028–FR-034 | figure accessory tests; manual checks 5–7, 12 |
| 6 Underwear | US5; FR-035–FR-037 | icon tests; manual check 8 |

## Complexity Tracking

No constitution violations to justify.
