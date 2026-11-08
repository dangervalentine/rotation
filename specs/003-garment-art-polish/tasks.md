---
description: "Task list for Garment Art & Customization Polish"
---

# Tasks: Garment Art & Customization Polish

**Input**: Design documents from `specs/003-garment-art-polish/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/renderer-contract.md](contracts/renderer-contract.md), [contracts/ui-contract.md](contracts/ui-contract.md), [quickstart.md](quickstart.md)

**Tests**: Included. The plan's Technical Context names the test files: `test/figure.golden.test.ts`, `test/figure.test.ts`, `test/styles.test.ts`, and extensions to `test/model.test.ts`, `test/sketch.test.ts` and `test/productParse.test.ts`. The node-environment Vitest suite covers pure `src/lib/` logic. Drawing quality and UI are checked with `npm run gallery` and [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story (US1–US5 from spec.md). The plan's stage 1, the renderer foundation, is Phase 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US5 from spec.md
- Paths are repository-relative (single Vite project: `src/`, `test/`, `scripts/`, `design-system/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline, golden snapshot and gallery tooling. No new dependencies.

- [X] T001 Run `npm test` and `npm run typecheck` to record a green baseline. Note any pre-existing failures in the Notes section of specs/003-garment-art-polish/tasks.md.
- [X] T002 Create test/figure.golden.test.ts **before touching the renderer** (research R2):
  - Render each of the 19 current styles with `pieceSvg` in a fixed colour (and the striped oxford with stripe `#7d9bc6`).
  - Render five full looks (blazer+oxford+crew+belt+pants+loafers; tee+shorts+sneakers; cardigan+polo+skirt+boots; jacket+oxford+belt+pants+boots; sweater+oxford+pants+sneakers), each plain and cartoon.
  - Render the cartoon figure with every hair style (`short`, `long`, `bun`, `curly`, `none`).
  - Normalise pattern ids with `s.replace(/\bp\d+\b/g, "pN")` and `toMatchSnapshot()`.
  - Run `npm test` once to write test/__snapshots__/figure.golden.test.ts.snap.
- [X] T003 [P] Create scripts/garment-gallery.mts (research R11). It imports from `../src/lib/figure.ts`, `../src/lib/model.ts` and `../src/lib/palette.ts`, and writes `garment-gallery.html` at the repo root containing:
  - (a) one row per category with every style tile (`pieceSvg`) at 110 px, labelled, on a `#f4efe6` ground;
  - (b) a white-garment row (every top in `#f4f3ef`) repeated on white, `#f4efe6` and `#1d1d1f` grounds;
  - (c) a look matrix (plain and cartoon) covering every bottom style;
  - (d) placeholder sections "Details", "Accessories" and "Basics", filled in by later tasks.
  - Add `"gallery": "node --experimental-strip-types scripts/garment-gallery.mts"` to package.json scripts and `garment-gallery.html` to .gitignore.

---

## Phase 2: Foundational (Blocking Prerequisites, plan stage 1)

**Purpose**: Layered renderer, body anchors, style registry and detail types. **No visible change**: T002's snapshot must pass unchanged at the end of this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 [P] Add the detail union types and optional fields to src/lib/types.ts:
  - `Sleeve = "long" | "short" | "rolled"`
  - `Pattern = "solid" | "stripe" | "pinstripe" | "breton" | "gingham" | "check" | "dot"`
  - `Hardware = "brass" | "silver" | "gunmetal" | "black"`
  - `Length = "full" | "cropped" | "knee" | "short"`
  - `Buckle = "frame" | "plate" | "d-ring"`
  - `Item` gets optional `sleeve?`, `pattern?`, `hardware?`, `length?` and `buckle?`. Document `stripe?` as "the second colour for any pattern; present without `pattern` → read as `pattern: \"stripe\"`".
  - `Look` becomes `Record<Slot, string | null> & { acc?: string[] }`, with the doc comment "Accessory item ids, unique, in the order added. Omitted when empty."
- [X] T005 [P] Add `luminance(hex)`, `mix(a, b, t)` and `shade(hex, ink)` to src/lib/colour.ts. `shade` mixes 22% toward `ink`, or 18% toward `#ffffff` when luminance < 0.12 (research R5). Move the private `luminance` in src/lib/model.ts to import from colour.ts.
- [X] T006 Create src/lib/styles.ts with `StyleSpec`, `STYLE_SPEC: Record<Category, Record<string, StyleSpec>>` and the derived `STYLES`, per [renderer-contract.md § Style table](contracts/renderer-contract.md#style-table).
  - In this task, include **only the existing styles**, keeping their current order, with their sleeve, pattern, hardware, length and buckle defaults and `art` part. Socks and underwear get `art: null`, and `other` gets `art: null`.
  - Export `styleSpec(cat, style)` (falls back to the category's first style), `detailOptions(cat, style)` (keys present in the spec) and `detailsOf(item)` (defaults overlaid with valid item fields; `pattern` inferred as `"stripe"` when `stripe` is set and `pattern` is absent; `"solid"` when a non-solid pattern has no `stripe`).
  - Export `cleanDetails(it)`, which drops detail fields the style doesn't use, values equal to the style default, and `pattern: "solid"`.
- [X] T007 Make src/lib/model.ts re-export `STYLES` from src/lib/styles.ts, replacing its local `STYLES` constant. Keep `CATEGORIES` and the other exports unchanged.
- [X] T008 [P] Create test/styles.test.ts covering:
  - `STYLES` equals the old lists for every category;
  - `styleSpec` fallback for an unknown style;
  - `detailsOf` defaults: oxford long, polo and tee short, pants full, shorts short, skirt knee, belt brass and frame;
  - stripe→pattern inference;
  - `cleanDetails` drops a `sleeve` on a belt and drops default-equal values.
- [X] T009 Create src/lib/figure/body.ts exporting `BODY` anchors (neck 30, shoulderL {x:38,y:30}, shoulderR {x:82,y:30}, elbow 66, wrist 88, chest 50, waist 108, crotch 128, knee 150, ankle 180, sole 192, per data-model.md) and `at(anchor, offset)`. Move today's `legs()` and `hands()` from src/lib/figure.ts here **unchanged** (output must not change).
- [X] T010 [P] Create src/lib/figure/head.ts and move `head()` and `skinOf()` from src/lib/figure.ts there unchanged.
- [X] T011 Create src/lib/figure/paint.ts with a `Paint` context `{ cartoon, ink, sw, line(w?) }` and a pattern-id helper using a module-level counter. Its output must match today's exactly: ink `#3a3340`/`#55585e`, sw 1.6/0.6, the same attribute order as the existing `line()`.
- [X] T012 Split the garment drawing in src/lib/figure.ts into src/lib/figure/tops.ts (shirt, undershirt, collar logic), src/lib/figure/layers.ts, src/lib/figure/belts.ts, src/lib/figure/bottoms.ts and src/lib/figure/shoes.ts, each returning markup identical to today's.
- [X] T013 Implement `figureLayers(items, look, opts): Layer[]` in src/lib/figure.ts. `Layer` is `{ part: Slot | "acc" | "body" | "head", svg }` in the painting order from data-model.md. Pattern `<defs>` go inside the layer that uses them. Then implement `figureSvg` as `figureLayers(...).map(l => l.svg).join("")` and keep `VIEWBOX` and `PIECE_VIEWBOX`.
- [X] T014 Reimplement `pieceSvg(item, part?)` in src/lib/figure.ts as "render a look with only this item and keep the layers whose `part` matches". `part` defaults to `styleSpec(item.cat, item.style).art`. Delete the regex string diff. Keep the `{ svg, viewBox }` return shape and the existing `SketchCreator` call working.
- [X] T015 Run `npm test`. test/figure.golden.test.ts must pass **without** updating snapshots, together with the existing test/model.test.ts figure and undershirt cases. Fix any differences in T009–T014 rather than updating the snapshot.

**Checkpoint**: Renderer is layered and anchored; output is byte-identical (FR-001–FR-003).

---

## Phase 3: User Story 1 - Garments that read clearly at a glance (Priority: P1) 🎯 MVP

**Goal**: Polish the 19 existing styles: separate arms, sloped and tapered body, legs on the plain figure, consistent heavier outlines, one shade per colour, a signature detail per style, and warm tile grounds.

**Independent Test**: Run `npm run gallery` and go through the [quickstart.md](quickstart.md) gallery checks 1–4. Every existing style can be named without its label, white garments are outlined on every ground, and no plain look has floating shoes. Quickstart manual check 1 passes.

### Tests for User Story 1

- [X] T016 [P] [US1] Create test/figure.test.ts covering:
  - `figureSvg === figureLayers().map(l=>l.svg).join("")`;
  - `pieceSvg(it).svg` contains no markup from other parts (render a full look and check that the piece's layers are a subset);
  - every plain look with shorts or a skirt includes a `body` layer with leg paths;
  - every outline path in a piece carries `vector-effect="non-scaling-stroke"`;
  - for each category, every pair of sibling styles gives a different `pieceSvg` in the same colour;
  - an item with an unknown style draws the category's first style without throwing (FR-039).

### Implementation for User Story 1

- [X] T017 [US1] Update src/lib/figure/paint.ts:
  - outlines use `vector-effect="non-scaling-stroke"` at `stroke-width` 1.25 (plain) or 2 (cartoon), with plain ink `#4a4c52`;
  - add `detail(w)` for internal lines: scaling, about 45% of the outline width;
  - expose `shadeOf(color)` using `shade()` from src/lib/colour.ts (research R4, R5).
- [X] T018 [US1] In src/lib/figure/body.ts:
  - draw arms as separate limbs from shoulder (sloped 4 units) to elbow to wrist, angled out as today;
  - add a torso helper with a 3-unit taper per side from chest to waist;
  - draw neutral mannequin legs (`#d9d4cc`, outlined) on the plain figure and skin legs on the cartoon, from any hem y to `ankle`;
  - export `sleeveEnd(sleeve)` → wrist, `elbow-8` (short) or `elbow+6` (rolled), and `hemEnd(length)` → ankle, `ankle-14`, knee or `knee-12` (FR-004–FR-006).
- [X] T019 [US1] Rewrite src/lib/figure/tops.ts on the new body. The torso and sleeves are separate shapes, and sleeve ends come from `detailsOf(item).sleeve`. Signature details (FR-010):
  - **oxford**: button-down point collar, button placket of 5 dots, cuffs;
  - **polo**: ribbed collar, 3-button stand, banded sleeve;
  - **tee**: ribbed crew;
  - **undershirts**: crew and V rib.
  - The shade colour fills the under-collar.
  - When the shirt slot is empty, the undershirt is still drawn as a short-sleeved tee.
- [X] T020 [P] [US1] Rewrite src/lib/figure/layers.ts:
  - **blazer**: notch lapels, chest pocket, two flap pockets, 2 buttons, shaded interior in the open front;
  - **cardigan**: V neck, button column, ribbed hem and cuffs;
  - **sweater**: ribbed neck, cuffs and hem;
  - **jacket**: zip line, stand collar, two chest pockets;
  - shared: layer sleeves end at `sleeveEnd`; a layer with a sleeve shorter than the shirt's shows the shirt sleeve below it.
- [X] T021 [P] [US1] Rewrite src/lib/figure/bottoms.ts:
  - tapered legs with a clear inseam at `crotch` and a waistband;
  - hem at `hemEnd(detailsOf(item).length)`;
  - shorts with a hem cuff; skirt A-line to the knee;
  - shaded inseam;
  - request legs from body.ts whenever the hem is above the ankle (plain and cartoon).
- [X] T022 [P] [US1] Rewrite src/lib/figure/shoes.ts:
  - **sneakers**: white (`#f4f3ef`) midsole band and 3 lace marks;
  - **loafers**: low vamp with a penny strap;
  - **boots**: shaft rising to `ankle-8`, plus a heel block;
  - shaded soles on all.
- [X] T023 [P] [US1] Rewrite src/lib/figure/belts.ts so the buckle is a frame with a prong, coloured by `detailsOf(item).hardware`. Map hardware to colours as brass `#b59a5b`, silver `#c3c6cb`, gunmetal `#5b5f66` and black `#1d1d1f`, and export the map from paint.ts for reuse.
- [X] T024 [US1] Update `PIECE_VIEWBOX` in src/lib/figure.ts so each crop has about 6 units of padding around the new shapes (shoes and belt included).
- [X] T025 [US1] In src/design-system/components.css, give style tiles (`.rt-tile` art area, used by `Tiles` in the sketch creator) a `var(--paper-sunk)` background and padding of `var(--space-2)` or the nearest existing spacing token (FR-011). Use tokens only.
- [X] T026 [US1] Run `npm test -- -u` to update test/__snapshots__/figure.golden.test.ts.snap **deliberately** (stage 2). Then run `npm run gallery` and check quickstart gallery checks 1–4, adjusting the drawings until they pass.

**Checkpoint**: Existing styles are distinct, edges visible, no floating shoes (US1 / SC-001–SC-003 for current styles).

---

## Phase 4: User Story 2 - Describe pieces as they really are (Priority: P1)

**Goal**: Sleeve, pattern (with a second colour), hardware and length options that sit next to style. They are offered per style, drawn live, saved without defaults, and backward-compatible with `stripe`.

**Independent Test**: Quickstart manual checks 2–4 and 9–11, and gallery checks 5–6.

### Tests for User Story 2

- [X] T027 [P] [US2] Extend test/styles.test.ts with `detailOptions` per style, as in the contract table (oxford → sleeve and pattern; belt → hardware and buckle; jeans → hardware and length once added).
- [X] T028 [P] [US2] Extend test/model.test.ts:
  - `migrate` keeps `sleeve`, `pattern`, `hardware`, `length` and `buckle` values (including unknown ones, FR-039);
  - the sample wardrobe migrates with every item, outfit and slot unchanged (SC-004);
  - export→import (`migrate(JSON.parse(JSON.stringify(data)))`) round-trips a wardrobe using every detail (SC-009).
- [X] T029 [P] [US2] Extend test/figure.test.ts:
  - each pattern produces a `<pattern>` inside the garment's own layer;
  - breton uses `patternTransform="rotate(90)"`;
  - a pattern whose second colour equals the base colour renders solid (no `<pattern>`);
  - a long, short and rolled oxford give three different sleeve paths;
  - full, cropped, knee and short pants give different hem y values, and the shorter three include legs.
- [X] T030 [P] [US2] Extend test/sketch.test.ts: `makeSketch` passes detail fields through `cleanDetails`, and a sketch with `sleeve: "long"` on an oxford stores no `sleeve`.

### Implementation for User Story 2

- [X] T031 [US2] Implement patterns in src/lib/figure/paint.ts (research R8). `patternDef(id, base, second, kind, scale)` covers:
  - stripe 2/6, vertical;
  - pinstripe 0.8/5;
  - breton = stripe + `patternTransform="rotate(90)"`;
  - gingham = two crossing stripes at opacity 0.5;
  - check = two crossing bands plus a thin shade line;
  - dot r 1.1 on a 5-unit grid.
  Use `patternUnits="userSpaceOnUse"`, scale 6 for tops, 8 for pants and 4 for accessories. If `second === base` or the pattern is solid, return the base colour with no defs.
- [X] T032 [US2] Use `patternDef` with `detailsOf(item)` in src/lib/figure/tops.ts, src/lib/figure/layers.ts and src/lib/figure/bottoms.ts for every style with `pattern: true`. Remove the old inline stripe `<defs>`.
- [X] T033 [US2] Apply `detailsOf(item).hardware` to blazer and cardigan buttons and the jacket zip pull in src/lib/figure/layers.ts.
- [X] T034 [P] [US2] Update `swatchBackground(color, stripe, band, pattern?)` in src/design-system/components.tsx to show breton (0deg), gingham and check (two crossed gradients) and dot (radial-gradient) swatches. Add an optional `pattern` prop to `Swatch`. Update `Swatch` in src/components/common.tsx and `lookPieces` to pass `detailsOf(it).pattern`.
- [X] T035 [US2] Create src/components/DetailFields.tsx per [ui-contract.md § DetailFields](contracts/ui-contract.md#detailfields-new-srccomponentsdetailfieldstsx):
  - props `{ cat, style, value, onChange, variant: "tiles" | "compact", color, idPrefix }`;
  - render only `detailOptions(cat, style)`;
  - sleeve, length and buckle use `Segmented` (compact) or `Tiles` with `pieceSvg` art (tiles);
  - pattern uses tiles of pattern swatches plus a "Second colour" `Field type="color"` shown when the pattern isn't solid;
  - hardware uses four labelled swatches;
  - render `null` when there are no options.
- [X] T036 [US2] Wire `DetailFields variant="tiles"` into src/components/SketchCreator.tsx:
  - add a "Details" section between Style and Colour;
  - replace the stripe On/Off field with the pattern second colour (`stripe`);
  - keep detail values in the draft across style changes;
  - pass details into `makeSketch` and `onDraftChange` so the builder figure previews them live (FR-020);
  - pass the draft's pattern and second colour into `StyleArt` tiles.
- [X] T037 [US2] Update `makeSketch` and `SketchDraft` in src/lib/sketch.ts to accept `sleeve`, `pattern`, `hardware`, `length` and `buckle`, and run `cleanDetails` on the result.
- [X] T038 [US2] Wire `DetailFields variant="compact"` into the item form in src/components/WardrobeView.tsx:
  - place it below Style;
  - replace the "Stripe · On" field with the pattern second colour (an old item with `stripe` shows "Stripe" selected);
  - run `cleanDetails` when saving, so details the saved style doesn't use are dropped (FR-019);
  - keep the values in the draft across style and category changes until saving.
- [X] T039 [US2] Fill the gallery "Details" section in scripts/garment-gallery.mts: every sleeve on oxford, tee and blazer; every pattern on oxford and chinos at 110 px and 64 px; every hardware colour on belt and blazer; every length on pants and skirt, plain and cartoon; and a patterned oxford under an open blazer. Run it and check quickstart gallery checks 5–6.

**Checkpoint**: Details work end to end in both forms and on every figure (US2).

---

## Phase 5: User Story 3 - More styles to choose from (Priority: P2)

**Goal**: 22 new drawn styles, plus belt buckle shapes and belt loops, each with a signature detail.

**Independent Test**: Gallery check 1 for the new rows, the sibling-distinctness test in test/figure.test.ts (T016) passing for every category, and the sketch creator listing every new style.

- [X] T040 [US3] Append the new styles to `STYLE_SPEC` in src/lib/styles.ts **after** the existing ones, with the defaults from the contract's style table:
  - **layer**: crewneck, quarter-zip, hoodie, chore coat, bomber, overcoat;
  - **shirt**: dress shirt, flannel, henley, camp collar;
  - **belt**: braided;
  - **pants**: chinos, jeans, trousers, joggers;
  - **shoes**: derby, chelsea boot, lace-up boot, sandal.
- [X] T041 [P] [US3] Draw the new shirts in src/lib/figure/tops.ts:
  - **dress shirt**: spread collar, hidden placket line, French cuffs;
  - **flannel**: two flap chest pockets;
  - **henley**: collarless, 3-button placket;
  - **camp collar**: open flat collar, straight hem.
- [X] T042 [P] [US3] Draw the new layers in src/lib/figure/layers.ts:
  - **crewneck**: raglan seams, wide rib;
  - **quarter-zip**: stand collar with a short zip in hardware colour;
  - **hoodie**: hood behind the neck in the `head` back position (draw it in the `layer` layer before the torso), drawcords and pouch pocket;
  - **chore coat**: point collar, three patch pockets;
  - **bomber**: ribbed collar, cuffs and hem, zip;
  - **overcoat**: hem to `crotch+14`, notch lapels. It overlaps the pants, so it is drawn in the `layer` layer and `figureLayers` paints the layer after the pants for overcoats only.
- [X] T043 [P] [US3] Draw the new bottoms in src/lib/figure/bottoms.ts:
  - **chinos**: slanted side pockets;
  - **jeans**: contrast stitching (`#c9a24a` dashed detail lines), rivets in hardware colour, coin pocket;
  - **trousers**: front crease line, cuffed hem when cropped;
  - **joggers**: elastic cuffed ankle and drawcord;
  - add belt loops (5 small rects over the waistband) whenever the look has a belt (FR-025).
- [X] T044 [P] [US3] Draw the new shoes in src/lib/figure/shoes.ts:
  - **derby**: laces on a closed vamp, low heel, welt line;
  - **chelsea boot**: elastic side panel in shade, pull tab;
  - **lace-up boot**: eyelets and speed hooks, lugged sole;
  - **sandal**: two straps with skin or mannequin feet visible.
- [X] T045 [P] [US3] Draw the buckle shapes and the braided strap in src/lib/figure/belts.ts:
  - **frame**: as in T023;
  - **plate**: a solid rectangle in hardware colour;
  - **d-ring**: two D rings for a webbing strap;
  - **braided**: diagonal hatch detail lines in shade.
- [X] T046 [US3] Add the new kind words to `KIND_WORDS` in src/lib/productParse.ts, in the order given in [renderer-contract.md § guessKind updates](contracts/renderer-contract.md#guesskind-updates-productparsets), ahead of the generic rules. Extend test/productParse.test.ts with one case per new style ("Levi's 501 jeans" → jeans, "Chelsea boot" → chelsea boot, "Merino henley" → henley, "Hooded sweatshirt" → hoodie, and so on).
- [X] T047 [US3] Extend scripts/garment-gallery.mts rows with the new styles. Run `npm run gallery` and `npm test` (sibling distinctness covers the new styles), and adjust the drawings until every new tile can be named without its label.

**Checkpoint**: The style catalogue reaches 40 or more distinct drawn styles (SC-006, together with US4).

---

## Phase 6: User Story 4 - Glasses and other accessories (Priority: P2)

**Goal**: The "Other" category becomes "Accessories" with drawable styles. A look holds several accessories, edited in the builder, and Generate and Shuffle keep them.

**Independent Test**: Quickstart manual checks 5–7 and 12, and gallery check 7.

### Tests for User Story 4

- [X] T048 [P] [US4] Extend test/model.test.ts:
  - `normalizeLook` keeps `acc` as unique strings and omits it when empty or invalid;
  - looks without `acc` stay byte-identical;
  - `shuffleLook` and `variations` keep `acc`;
  - `generateRotation(items, days, weeks, rng, 0.4, keep)` copies `keep[i].acc` and adds no accessories otherwise;
  - `daysWorn` counts accessory use.
- [X] T049 [P] [US4] Extend test/figure.test.ts:
  - glasses, sunglasses and hat appear only with `cartoon: true`;
  - a watch, tie and scarf appear on both figures;
  - glasses together with sunglasses draws only the sunglasses;
  - two ties draw one;
  - generic `other` and any `basics` id in `acc` or a slot are never drawn (FR-037).
- [X] T050 [P] [US4] Extend test/sketch.test.ts: `makeSketch({ cat: "other", style: "glasses" })` succeeds, and `style: "other"` still throws.

### Implementation for User Story 4

- [X] T051 [US4] In src/lib/styles.ts, give `other` the styles glasses, sunglasses, watch, hat, tie, scarf and `other` (last), with `art: "acc"` (except `other`, which is `art: null`), and the defaults from the contract. In src/lib/model.ts:
  - rename the `CATEGORIES` label to `"Accessories"`;
  - `normalizeLook` keeps `acc` per data-model.md;
  - `daysWorn` counts `acc`;
  - `generateRotation` takes an optional 6th parameter `keep?: Look[]` and copies `keep[i]?.acc`.
- [X] T052 [US4] Create src/lib/figure/accessories.ts, drawn with the item colour and `detailsOf(item).hardware` for frames and watch case:
  - **glasses**: two round frames and a bridge at eye level (y≈5);
  - **sunglasses**: the same with filled dark lenses (`#1d1d1f` at 85% opacity);
  - **hat**: a cap crown over the hair plus a brim (it must cover the top of every hair style, and long hair stays visible behind);
  - **watch**: face and strap at the left wrist;
  - **tie**: knot at the neck and blade down the placket, drawn after the shirt and before the layer;
  - **scarf**: a wrap at the neck with one tail.
  Export functions grouped by paint position.
- [X] T053 [US4] Insert accessory layers into `figureLayers` in src/lib/figure.ts at the painting-order positions in data-model.md (tie after shirt; watch and scarf after hands; head-worn after head, cartoon only). Draw one of each style; when both glasses and sunglasses are present, skip glasses. Add `PIECE_VIEWBOX`-style crops per accessory style (head crop `"30 -26 60 50"`, wrist, collar). `pieceSvg` for head-worn styles prepends a muted head (`opacity="0.35"`) from `head.ts` using the passed `figure`.
- [X] T054 [US4] Add `acc: { style: "glasses", color: paletteHex("black") }` to `SKETCH_DEFAULTS` in src/lib/sketch.ts, and let `makeSketch` accept `cat: "other"` for styles whose `art` is `"acc"`.
- [X] T055 [US4] Generalise src/components/SketchCreator.tsx from `slot: Slot` to `part: Slot | "acc"`:
  - for `"acc"`, use category `"other"`, list the drawable accessory styles, label "Accessory" and the article "an accessory";
  - `StyleArt` passes `part` and the person's figure to `pieceSvg`.
- [X] T056 [US4] Add the Accessories row to src/components/LookEditor.tsx per [ui-contract.md § LookEditor](contracts/ui-contract.md#lookeditor-changed):
  - **chips**: swatch, short name, Sketch tag, and a remove button with `aria-label="Remove <name>"`;
  - **add**: an "Add accessory…" `Select` listing `sortForPicker` accessories not on the look, plus the "Create a piece…" action that opens the creator with `part: "acc"`. Highlighting an option previews it on the figure.
  - Adding and removing go through `commit()` so undo and redo cover them.
  - The empty state reads "Add glasses, a watch or a tie" with a "Create a piece" button.
  - Confirming an accessory sketch appends its id to `acc`.
  - Style the row in src/design-system/components.css using tokens only, ≥ 44 px targets and no sideways scroll at 360 px.
- [X] T057 [US4] Update src/components/common.tsx: the `OutfitFigure` aria-label appends accessory names, and `lookPieces` appends one piece per accessory with `slot: "acc"`. In src/design-system/components.tsx, widen `Piece.slot` to `Slot | "acc"`, label it "Accessory", and change `SLOT_LABEL.other` to "Accessories".
- [X] T058 [US4] Update src/components/WardrobeView.tsx so that deleting an item, or changing its category away from `"other"`, removes its id from every `look.acc` in outfits and rotation looks (using the same clear helper as slots). Update src/components/RotationView.tsx to call `generateRotation(items, rot.days, rot.weeks, undefined, undefined, rot.looks)`.
- [X] T059 [US4] Add an optional `art?: ReactNode` prop to `GarmentCard` in src/design-system/components.tsx, rendered centred over the plate below any photo. In src/components/WardrobeView.tsx, pass accessory art from `pieceSvg` for drawable accessories.
- [X] T060 [US4] Fill the gallery "Accessories" section in scripts/garment-gallery.mts with each accessory on every hair style, glasses+sunglasses together, and tie+scarf over each layer. Check quickstart gallery check 7.

**Checkpoint**: Accessories can be added, saved, generated around and printed (US4 / SC-007).

---

## Phase 7: User Story 5 - Track underwear by style (Priority: P3)

**Goal**: Underwear styles with small icons in the wardrobe list. Never drawn on a figure, and never in a look.

**Independent Test**: Quickstart manual check 8.

- [X] T061 [P] [US5] In src/lib/styles.ts, set `basics` styles to socks, underwear, boxers, briefs, boxer-briefs and trunks (socks first, `underwear` kept as the generic style), all with `art: null`.
- [X] T062 [P] [US5] Create src/lib/figure/icons.ts with `basicsIconSvg(item)`: a 24×24 flat icon in the item colour with an ink outline for socks, generic underwear, boxers (loose legs), briefs (high cut), boxer-briefs (fitted mid legs) and trunks (short fitted legs). Re-export it from src/lib/figure.ts. Extend test/figure.test.ts: each style gives a distinct icon, and an unknown style gives the generic underwear icon.
- [X] T063 [US5] In src/components/WardrobeView.tsx, show `basicsIconSvg` for `basics` items in the table swatch cell (an `<svg viewBox="0 0 24 24" role="img" aria-label={style}>`, 24 px) and as `GarmentCard` `art`. Add the matching CSS in src/design-system/components.css using tokens only.
- [X] T064 [US5] Update the `KIND_WORDS` underwear rules in src/lib/productParse.ts to map to the specific styles (boxer-briefs before briefs and boxers), and update the `splitOther` underwear regex in src/lib/model.ts to pick the specific style when the name says so. Extend test/productParse.test.ts and the test/model.test.ts migrate case.
- [X] T065 [US5] Fill the gallery "Basics" section in scripts/garment-gallery.mts with every icon.

**Checkpoint**: All five stories complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T066 [P] Update design-system/components/GarmentCard.md (the `art` prop and the "Accessories" category label), design-system/components/SketchCreator.md (Details section, accessory part, tile ground) and design-system/components/LookCard.md (accessory pieces).
- [X] T067 [P] Update the `guessKind`/KIND_WORDS wallet case so wallets stay `other`. Confirm test/productParse.test.ts still passes for `wallets/bifold-wallet` → `other`.
- [X] T068 Run `npm run typecheck`, `npm test`, `npm run build` and `npm run audit`. Typecheck, tests and build must pass, and Lighthouse accessibility must stay at 100. Record the results in the Notes below.
- [X] T069 Run the full [quickstart.md](quickstart.md): every gallery check, manual checks 1–12, and the performance spot check (SC-008). Fix any failures.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none. T002 must run before any renderer change.
- **Foundational (Phase 2)**: depends on T002. It blocks every story, and T015 is its gate.
- **US1 (Phase 3)**: depends on Phase 2.
- **US2 (Phase 4)**: depends on Phase 2 and on US1's new body (T018) and tops, layers and bottoms (T019–T021), because sleeve and length need separate arms and hem anchors.
- **US3 (Phase 5)**: depends on US1 (drawing conventions) and US2's `patternDef` and hardware (T031, T033).
- **US4 (Phase 6)**: depends on Phase 2 and US1's paint (T017). It is otherwise independent of US2 and US3; it only needs `detailsOf`, which comes from Phase 2.
- **US5 (Phase 7)**: depends only on Phase 2.
- **Polish (Phase 8)**: after the desired stories.

### Within Each Story

- Tests come first and should fail, then the registry or model, then the renderer, then the UI, then the gallery review.
- The garment files (tops, layers, bottoms, shoes, belts) are separate, so tasks marked [P] that touch different ones can run together.

### Parallel Opportunities

- Phase 2: T004, T005, T008 and T010 in parallel; T009 and T011 before T012.
- US1: T020, T021, T022 and T023 in parallel after T017–T019.
- US3: T041–T045 all in parallel after T040.
- US4 and US5 can run in parallel with US3 once US1 is done.

## Parallel Example: User Story 3

```text
Task: "T041 [US3] Draw new shirts in src/lib/figure/tops.ts"
Task: "T042 [US3] Draw new layers in src/lib/figure/layers.ts"
Task: "T043 [US3] Draw new bottoms + belt loops in src/lib/figure/bottoms.ts"
Task: "T044 [US3] Draw new shoes in src/lib/figure/shoes.ts"
Task: "T045 [US3] Buckle shapes + braided in src/lib/figure/belts.ts"
```

## Implementation Strategy

### MVP First (US1)

1. Phase 1 and Phase 2. **Stop at T015**: the golden snapshot passes unchanged.
2. Phase 3 (US1). Review the gallery. This alone fixes every problem observed during scoping.

### Incremental Delivery

1. Foundation, then US1 (polish), then US2 (details), then US3 (styles), then US4 (accessories), then US5 (underwear).
2. Each phase ends green (`npm test` and `npm run typecheck`) with a gallery review.

## Notes

- [P] = different files, no dependencies on incomplete tasks.
- Commit only when the user asks (user rule).
- The golden snapshot is updated in exactly one place (T026). Any other snapshot change is a bug.
- **T001 baseline**: 8 test files, 118 tests green; typecheck clean.
- **Stage-1 gate (T015)**: all full-figure golden snapshots stayed byte-identical. Two *piece* snapshots (oxford, striped oxford) changed. The old string-diff `pieceSvg` dropped the oxford's collar line because the bare mannequin drew the same line, and exact layer isolation keeps it. This is the bug FR-001 targets, so those two were accepted.
- **Module split (T009–T012)**: the split into `src/lib/figure/*` happened with the stage-2 redraw (T017–T023) rather than as a separate byte-identical move. The identity gate was proven on the layered single-file renderer first.
- **T025**: style-tile art sits on a new `garment-ground` token (light in both themes), not `--paper-sunk`, which is near-black in dark mode and would hide dark cloth.
- **Pulled forward**: the accessory registry, `makeSketch` for accessories and the accessory renderer (T051–T055) were built during US2, because the reworked SketchCreator takes `part: Slot | "acc"`. The underwear styles (T061) were added during US3 so `guessKind` could map "boxer briefs".
- **Glasses frames** use the item's own colour (the colour picker) rather than a separate hardware option. The contract and data model were updated to match.
- **Second colour default**: when a pattern is first chosen, the second colour contrasts with the garment (navy on light cloth, off-white on dark). Otherwise every pattern swatch on a white shirt looks plain.
- **T068 results**: typecheck clean; 11 test files and 188 tests pass; build OK. Lighthouse accessibility is 100 on all 20 runs (specs/003-garment-art-polish/lighthouse/REPORT.md). Wardrobe best-practices is 96, the same as in 002 (an existing DevTools issue). Rotation desktop performance is 86–87, the same as in 002.
- **T069 results**: gallery checks 1–7 reviewed by screenshot. In the app (preview build, browser storage): manual check 1 (sample wardrobe loads), 2 (short-sleeve gingham sketch), 5 (glasses sketch onto a look; chip + status), 8 (basics icons in the table) and 12 (no sideways scroll at 360 px) were driven in a headless browser with no console errors. Checks 3, 4, 6, 7 and 9–11 are covered by unit tests and code paths, not clicked through. Performance: 0.1 ms per cartoon figure, about 1 ms for a 10-day print (SC-008).
- **Open judgement call**: the outfit builder's figure is the plain mannequin, so head-worn accessories (glasses, sunglasses, hats) show as chips there and appear on the cartoon in Print. This is per FR-031. SC-007's "shows on the cartoon straight away" therefore holds in Print, not in the builder.
