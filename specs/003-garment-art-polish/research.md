# Research: Garment Art & Customization Polish

**Feature**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Date**: 2026-11-08

Every open question from the Technical Context is resolved below. The baseline is the gallery render of all 19 current styles made while scoping the feature (oxford/polo/tee, blazer/cardigan and sneakers/loafers can't be told apart; shoes float on the plain figure; white pieces vanish on white tiles).

---

## R1 · How to show one piece alone (FR-001)

**Decision**: Split the renderer into `figureLayers(items, look, opts): Layer[]`, where each layer is `{ part, svg }` and `part` is a slot, `"acc"`, `"body"` or `"head"`. Layers come out in painting order. `figureSvg` becomes `layers.map(l => l.svg).join("")`. `pieceSvg(item, part)` renders a look containing only that item and keeps only the layers for that part. Any `<defs>` a garment needs (patterns) are emitted inside the garment's own layer.

**Rationale**: Today's `pieceSvg` builds the figure twice and removes every self-closing tag the bare figure also contains (`/<defs>.*?<\/defs>|<[^>]+\/>/g`). That only works while every element is self-closing and no two pieces share identical markup. Grouped details (`<g>`), nested pattern content and shared shade colours would all break it. Tagging layers by part makes isolation exact, and tile art comes from the same code as the figure.

**Alternatives considered**:
- *Keep the string diff and tighten the regex*: still breaks on identical markup, for example two belt loops drawn the same with and without a belt.
- *Build a DOM or virtual tree*: heavier, and all of today's consumers want a string for `dangerouslySetInnerHTML`. Not worth the cost.

## R2 · Stage 1 must produce identical output (FR-003)

**Decision**: Before refactoring, add `test/figure.golden.test.ts`. It renders a fixed matrix (each of the 19 styles alone as a piece, five full looks, plain and cartoon, every hair style) and snapshots the strings with pattern ids normalised (`/\bp\d+\b/ → pN`). The stage-1 commit must pass these snapshots unchanged. Stage 2 deliberately updates them, and the visual review gallery (R11) is the check for stage 2 onward.

**Rationale**: "No visible change" is only testable if the output is compared byte for byte. Pattern ids come from a module-level counter, so they must be normalised to keep snapshots stable.

**Alternatives considered**: Pixel snapshots with a headless browser. They are slower, flakier on Windows fonts and AA, and unnecessary when the output is a deterministic string.

## R3 · Body geometry (FR-002, FR-004 to FR-006)

**Decision**: A `BODY` constant of named anchors in the existing 120×200 coordinate space: neck, shoulder (L and R), elbow, wrist, chest, waist, hip, crotch, knee, ankle and sole. Arms are drawn as separate limbs from shoulder to elbow to wrist, angled slightly out as today. Garments place ends with `at(anchor, offset)`, so a sleeve ends at `wrist`, `elbow+6` (rolled) or `elbow-8` (short), and a hem ends at `ankle`, `ankle-14` (cropped), `knee` or `knee-12` (short). Shoulders slope 4 units, the torso narrows 3 units per side from chest to waist, and pants taper to the ankle with an inseam at the crotch.

**Rationale**: Lengths become data rather than one polygon per combination (3 sleeves × 25 tops would be 75 hand-drawn shapes). The viewBoxes (`0 0 120 200`, `0 -30 120 230`) stay the same, so cards, print layout and `PIECE_VIEWBOX` crops change very little.

**Alternatives considered**: A new, larger coordinate system. It would invalidate every crop and print measurement for no visual gain.

## R4 · Line weight on tiles and figures (FR-007)

**Decision**: Outlines use `vector-effect="non-scaling-stroke"` at a fixed screen width: **1.25 px** on the plain figure and **2 px** on the cartoon. Internal detail lines (placket, stitching, ribbing, laces) keep scaling strokes at about 45% of the outline weight, so they shrink with the drawing and don't clutter small tiles.

**Rationale**: Today strokes are in user units. A 110 px tile of a 96-unit crop and a 200 px card of the full figure draw the same 0.6 stroke at different pixel widths (≈0.7 px and ≈1 px), which is why tiles look anaemic. A non-scaling stroke looks the same everywhere and is supported by every evergreen browser and by print (strokes are in CSS px, so the printed cartoon keeps chunky lines).

**Alternatives considered**: Computing the stroke width per render size. That would need the render size threaded through every consumer, and it fails whenever CSS changes a size.

## R5 · Shade and outline colours (FR-008, FR-009)

**Decision**: Add `shade(hex)` to `src/lib/colour.ts`. It mixes the garment colour 22% toward the figure's ink. For near-black garments (luminance < 0.12) it mixes 18% toward white instead, so depth still reads. Outlines stay the figure's ink (`#3a3340` cartoon, and a darker `#4a4c52` instead of `#55585e` for plain). Combined with R4's heavier stroke, this keeps every edge visible. Style tiles get a warm `--paper-sunk` background instead of white.

**Rationale**: The vanishing white undershirt was a weight and background problem, not an ink colour problem. With the ink already dark, a heavier stroke plus a non-white tile ground fixes it. One shade per colour keeps the editorial flat look of the design system ("garments are the only saturated colour"), with no gradients.

**Alternatives considered**: An outline derived from each garment's own colour. It weakens edges on mid-tone garments and makes the figure look inconsistent. Rejected; the spec's "outline stays visible" outcome is met without it.

## R6 · Where details live on an item (FR-012, FR-018, FR-019)

**Decision**: Use flat optional fields on `Item`: `sleeve`, `pattern`, `hardware`, `length` and `buckle`. The existing **`stripe` field stays and becomes the second colour** for any pattern. An item with `stripe` set and no `pattern` is read as `pattern: "stripe"`, so old data needs **no migration** and nothing is lost. Defaults come from a style registry (R7). `migrate` drops detail fields the item's style doesn't use and values outside the known set, except that unknown values are **kept** on save (FR-039) and only ignored when drawing. A missing field means the style's default and is never written out.

**Rationale**: `Item` is already flat (`stripe`, `image`, `brand`). Both forms (the Wardrobe editor and the sketch creator) bind fields directly, and swatches already read `stripe`. A nested `details` object would mean a migration and a second copy of the stripe colour.

**Alternatives considered**:
- *A `details` object*: a cleaner grouping, but it needs a data migration and a version bump.
- *Renaming `stripe` to `accent`*: it breaks old exports and the Swatch API for no user-visible benefit. The data model documents `stripe` as "second colour".

## R7 · Style registry (FR-013, FR-021 to FR-026)

**Decision**: Replace `STYLES: Record<Category, string[]>` with a `STYLE_SPEC` table that sets, per category and style, which details apply and their defaults, for example `oxford: { sleeve: "long", pattern: true }` and `belt: { hardware: "brass", buckle: "frame" }`. `STYLES` is derived from it, so every existing consumer (`guessKind`, the Wardrobe form, `makeSketch`) keeps working. New styles are appended **after** the existing ones, so the first style of each category, which is the Wardrobe form's default, doesn't change.

**Rationale**: One source of truth for what to offer (FR-013), what to draw by default (FR-018) and what to drop on save (FR-019).

**Alternatives considered**: Keeping per-style rules inside the renderer. The forms would then have to guess which options apply.

## R8 · Patterns (FR-015, edge cases)

**Decision**: One `<pattern>` per patterned garment with `patternUnits="userSpaceOnUse"`, so a shirt's pattern lines up between the open front of a layer and the rest of the shirt. Pattern scale is set per part: tops 6 units, pants 8, accessories 4.
- **stripe**: vertical, 2/6.
- **pinstripe**: vertical 0.6/5. Drawn at least 0.8 wide so it still reads at 64 px thumbnails.
- **breton**: the stripe pattern with `patternTransform="rotate(90)"`.
- **gingham**: two crossing stripes of the second colour at 50% opacity. The overlap darkens on its own.
- **check/plaid**: two crossing bands of the second colour plus a thin shade line.
- **dot**: circles of r 1.1 on a 5-unit grid.
- If the second colour equals the base colour, the garment is drawn solid.

**Rationale**: User-space patterns are the only way to keep one garment's pattern continuous across its separate shapes. The minimum sizes avoid moiré at thumbnail scale (edge case).

**Alternatives considered**: `objectBoundingBox` units. These scale per shape, so the pattern visibly breaks at sleeve seams and lapels.

## R9 · Accessories on a look (FR-028 to FR-034)

**Decision**: Keep the category id `"other"` but label it **"Accessories"**, and give it the styles `glasses, sunglasses, watch, hat, tie, scarf, other`, with `other` last so it is never the form's default for a new item. Extend `Look` with an optional **`acc?: string[]`** (accessory item ids, unique, in the order added). `normalizeLook` keeps `acc` only when it is a non-empty array of strings. Existing looks have no `acc` and stay byte-identical.

Behaviour of the existing helpers:
- `clone` and `same` already cover `acc`.
- `shuffleLook` and `variations` copy the look, so accessories carry through (FR-033).
- `generateRotation` gains an optional `keep?: Look[]` argument and copies each day's `acc` from it. RotationView passes the current looks.
- `daysWorn` also counts `acc`.

Drawing order:
1. Head-worn accessories are drawn after the head (cartoon only).
2. A tie is drawn after the shirt and before the layer.
3. A scarf and a watch are drawn after the layer and hands.
4. If a look has both glasses and sunglasses, only the sunglasses are drawn.
5. Only one accessory of each style is drawn.

**Rationale**: Renaming the category id would mean a migration and break old files, `guessKind` and tests. Only the label is user-facing. An optional array leaves every existing slot-keyed loop untouched.

**Alternatives considered**:
- *A new `accessory` slot*: one id per slot can't hold several accessories (spec: "several at once").
- *A separate `Outfit.accessories`*: rotation days hold `Look`s, not `Outfit`s, so accessories would be lost on rotation days.

## R10 · Accessories and underwear in the UI

**Decision**:
- **Builder**: below the slot list, an **Accessories** row shows each accessory as a chip (swatch, name, remove button). An "Add accessory…" Select lists wardrobe accessories not yet on the look, then a "Create a piece…" action. `SketchCreator` and `makeSketch` accept the `"other"` category for drawable accessory styles; the generic `other` style can't be sketched.
- **Underwear**: `basics` styles become `socks, underwear, boxers, briefs, boxer-briefs, trunks`, keeping `underwear` as the generic style. A new `basicsIconSvg(item)` draws a small flat icon in the item's colour. It replaces the plain swatch in the Wardrobe table, and the GarmentCard plate shows it on top of the colour field through a new optional `art` prop.
- **Accessory tiles** use `pieceSvg(item, "acc")` with crop viewBoxes per style: a head crop for glasses, sunglasses and hat, a wrist crop for a watch, a collar crop for a tie and scarf.

**Rationale**: The builder's Radix Select is single-value. Chips plus an "add" select is the most accessible pattern for a multi-value list without adding a dependency. Head crops need a head, so accessory tiles render a cartoon head (skin and hair from the person's figure) as context, drawn muted.

**Alternatives considered**: Checkbox lists of every accessory. They don't scale with the wardrobe and duplicate the Wardrobe tab.

## R11 · Visual verification (SC-001 to SC-003)

**Decision**: Add `scripts/garment-gallery.mts`. It imports the renderer straight from `src/` (Node 22 type stripping, the same `.ts` import style as the app) and writes `garment-gallery.html` with every style × relevant detail as tiles, plus a matrix of full looks, plain and cartoon, on white, `--paper` and dark backgrounds. Run it with `npm run gallery`. Unit tests assert the structure, for example "plain look with shorts includes leg layers", "every style's piece SVG differs from every sibling" and "every outline has non-scaling-stroke". People review the gallery for distinctiveness and polish.

**Rationale**: Distinctiveness is a judgment of the drawing, but its preconditions (no identical siblings, legs present, strokes set) can be tested automatically.

**Alternatives considered**: A dev-only gallery route in the app. It adds app surface and needs the dev server. A static file is quicker to share and to diff.

## R12 · Performance (SC-008)

**Decision**: No caching needed. `figureSvg` stays a pure string builder. The added geometry (separate arms, details, patterns) is roughly 3× today's markup, still well under 1 ms per figure. The busiest screen, the 2-week × 5-day print view (10 cartoons) plus "Try every" strips of about 10 figures, stays under 20 ms of string work. The pattern id counter stays module-level and unique per call.

**Rationale**: Measured cost today is in the microseconds. A 3× increase stays far below a frame.
