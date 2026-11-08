---
description: "Task list for Outfit Builder Polish & Sketch-a-Piece"
---

# Tasks: Outfit Builder Polish & Sketch-a-Piece

**Input**: Design documents from `specs/002-outfit-builder-polish/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ui-contract.md](contracts/ui-contract.md), [quickstart.md](quickstart.md)

**Tests**: Included. The plan's Technical Context names the unit-test files (`test/history.test.ts`, `test/sketch.test.ts`, `test/colour.test.ts`, plus additions to `test/model.test.ts`). The node-environment Vitest suite covers pure `src/lib/` logic only. UI behaviour is checked through [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story so each one can be built and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 from spec.md
- Paths are repository-relative (single Vite project: `src/`, `test/`, `design-system/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tokens and baseline. No new dependencies (plan: "No new dependencies").

- [X] T001 Run `npm test` and `npm run typecheck` to record a green baseline before changes (fix nothing yet; note any pre-existing failures in specs/002-outfit-builder-polish/tasks.md Notes)
- [X] T002 Add tokens to design-system/tokens.json, each with a `usage` note: `motion-quick-duration` = `160ms` and `motion-quick-ease` = `cubic-bezier(.2,.7,.2,1)` ("Figure cross-fade and changed-row pulse. Removed under reduced motion."), and `tile-size` = `88px` ("Style tiles and palette cells. Never below 44px."). Then run `npm run tokens` to regenerate src/design-system/tokens.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The sketch status model and shared pure modules that every story uses.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Add `sketch?: true` to `Item` in src/lib/types.ts with a doc comment: "Set while the item is a sketch. Missing on every other item, and removed on promotion. Always owned: false while set."
- [X] T004 Update `migrate` in src/lib/model.ts so each item "keeps `sketch` only when it is exactly `true` and `owned` is false. Otherwise it drops `sketch`" (data-model.md Validation)
- [X] T005 [P] Create src/lib/palette.ts exporting `PALETTE: { name: string; hex: string }[]` with the 12 entries in this order: navy #22304a, charcoal #3b3d42, grey #8a8d91, stone #c9c1b1, cream #ece3cf, white #f4f3ef, light blue #a9c1dc, olive #5f6340, camel #b08a5a, brown #5a3e2b, oxblood #5e1f24, black #1d1d1f. Also export `nearestColourName(hex)` (squared RGB distance) per research R4/R5
- [X] T006 Create src/lib/sketch.ts:
  - `SKETCH_DEFAULTS` (layer → blazer/navy; shirt → oxford/light blue; belt → belt/brown; pants → pants/charcoal; shoes → loafers/brown; stripe off), per research R6
  - `sketchName(color, style)` → Capitalised colour name + " " + style
  - `uniqueName(base, items)`, which appends " 2", " 3"… on a case-insensitive clash
  - `makeSketch(draft, items)`, which returns `Omit<Item,"id">` with `price: 0`, `qty: 1`, `owned: false`, `sketch: true`. It throws on `cat === "other"` or a style not in `STYLES[cat]`, trims the name and falls back to `sketchName` when it is empty
  - `itemStatus(it)` → `"sketch" | "tobuy" | "owned"`
  - `promote(it, to)`, which drops `sketch` and sets `owned` to `to === "owned"`
- [X] T007 [P] Write test/sketch.test.ts covering:
  - `nearestColourName` exact and near matches
  - `sketchName`
  - `uniqueName` clash numbering and case-insensitivity
  - `makeSketch` defaults, its rejections and the blank-name fallback
  - `itemStatus` for all three states
  - `promote` to tobuy and owned
  - `migrate` dropping `sketch` when `owned` is true or the value isn't `true`
- [X] T008 Make `wardrobeTotals` skip items with `sketch: true` in src/lib/model.ts (FR-027)
- [X] T009 Make `generateRotation` filter `items` to non-sketches before building any pool, and pass the filtered list to `matchingBelt`, in src/lib/model.ts (FR-028, research R12)
- [X] T010 [P] Add cases to test/model.test.ts:
  - `wardrobeTotals` ignores a $500 sketch
  - `generateRotation` with a seeded rng never places a sketch on any slot, including a sketch belt matched to shoes, across 4 weeks × 5 days
- [X] T011 [P] Add the Tag tone `"sketch"` in src/design-system/components.tsx (union type) and src/design-system/components.css: ink outline, dashed rule, text "Sketch", using the same contrast pair as `neutral`. Document it in design-system/components/Tag.md
- [X] T012 Run `npm test` and `npm run typecheck`. Both must pass before starting story work

**Checkpoint**: Sketch status exists in the model, costs and the generator ignore sketches, and stories can begin.

---

## Phase 3: User Story 1 - Sketch a piece I don't own, right in the builder (Priority: P1) 🎯 MVP

**Goal**: Every slot picker offers "Create a piece…", which opens an inline creator with a live figure preview. Confirming adds a Sketch-status item to the wardrobe's Sketches group and selects it.

**Independent Test**: In the Outfits builder, create a piece in any slot without leaving the view. It appears on the figure and fills the slot. On the Wardrobe tab it is listed in the Sketches group and left out of the Stats. Promote it with "I own this" and it moves to its category and into the totals (quickstart 1–5b).

### Implementation for User Story 1

- [X] T013 [US1] Extend `Select` in src/design-system/components.tsx with `SelectOption.action?: true` and an `onAction?: (value) => void` prop.
  - Action options render after an `RSelect.Separator` (style `.rt-select-sep` in src/design-system/components.css).
  - In `onValueChange`, a value that belongs to an action option calls `onAction` and never `onChange`. The controlled value stays unchanged (research R2).
  - Update design-system/components/Select.md
- [X] T014 [US1] Create src/components/SketchCreator.tsx per contracts/ui-contract.md:
  - Props `{ slot, items, onDraftChange, onConfirm, onCancel }`.
  - Kicker "New piece · {slot label}" and a heading that is the focus target on mount.
  - Style choice as a `ToggleGroup type="single"` with `aria-label="Style"` over `STYLES[slot]`. Text labels are enough for now; US3 adds silhouettes.
  - Colour as a `ToggleGroup` with `aria-label="Colour"` over `PALETTE`. Each item has `aria-label` = colour name and a `title`, and renders the existing `Swatch`.
  - A "Custom colour" `Field type="color"`, a "Stripe" `Check` and a stripe colour (default `#7d9bc6`).
  - A "Name (optional)" `Field` whose placeholder is the live `sketchName`.
  - Actions: **Add to look** (`variant="primary"`) and Cancel.
  - `onDraftChange` fires on mount and on every change. Escape cancels (unless a nested menu is open), and Enter in the name field confirms. Defaults come from `SKETCH_DEFAULTS`, and confirm calls `onConfirm(makeSketch(draft, items))`.
- [X] T015 [US1] Add creator styles to src/design-system/components.css:
  - `.rt-creator` panel separated by `--rule-strong`, with no box shadow
  - `.rt-tiles` and `.rt-tile` (min `var(--tile-size)` square, hairline border, `aria-pressed`/`data-state=on` state in ink)
  - `.rt-palette` grid of swatch cells (≥ 44px)
  - Everything uses tokens only
- [X] T016 [US1] Rework src/components/LookEditor.tsx to the contract props `{ items, look, onChange, onCreateItem, historyKey, onCreatingChange?, compact? }`:
  - Each slot's options end with the action option `{ value: "__create", label: "Create a piece…", action: true }`, after the items and "None".
  - `onAction` opens `SketchCreator` in place of the `.fields` column and calls `onCreatingChange(true)`.
  - While it is open, the figure renders `[...items, {id:"__draft", ...draft}]` with `look[slot] = "__draft"`.
  - Confirm calls `const id = onCreateItem(item)` and then `onChange({...look, [slot]: id})` (in that order), closes the creator and returns focus to the slot's Select trigger.
  - Cancel calls neither callback and restores the figure.
  - `onCreatingChange(false)` fires on close.
- [X] T017 [US1] Update src/components/common.tsx:
  - `itemOption(it)` adds `tag: { label, tone }` from `itemStatus` (Owned/owned, To buy/tobuy, Sketch/sketch)
  - `lookPieces` passes the status through so lookbook pieces can mark sketches. Add an optional `status` to `Piece` in src/design-system/components.tsx and render a small Sketch `Tag` in `LookCard` piece rows when it is `"sketch"`
- [X] T018 [US1] Render `SelectOption.tag` in `Select` menu rows outside `RSelect.ItemText`, so the trigger shows only the swatch and name, in src/design-system/components.tsx and src/design-system/components.css (`.rt-select-tag`)
- [X] T019 [US1] Wire the host in src/components/OutfitsView.tsx:
  - `onCreateItem = (it) => { const id = uniqueId(it.name, items); setData({...data, items:[...items, {id, ...it}]}); return id; }`
  - `historyKey={editing ?? "new"}`
  - Track `creating` from `onCreatingChange` and render "Save as new outfit" and "Save changes to …" as `variant="secondary"` while it is true (one accent)
- [X] T020 [US1] Wire the host in src/components/RotationView.tsx: the same `onCreateItem` through its `setData`, `historyKey={String(dayIndex)}`, and the panel's Apply button demoted to `variant="secondary"` while creating. Check that discarding the day's changes restores the look and leaves the sketch in `data.items`
- [X] T021 [US1] Add the Sketches group to src/components/WardrobeView.tsx (contracts → Wardrobe tab):
  - Category groups (table and cards) list only non-sketch items.
  - A final group "Sketches · n" comes after "Socks, undershirts and other", in both layouts.
  - Table rows show the swatch, name, style and Sketch `Tag`, with muted price, qty and subtotal and days worn as usual. There is no Owned checkbox and no total row. Actions are `Move to To buy` (ghost), `I own this` (secondary) and `Edit` (ghost), and the first two call `promote`.
  - Cards render `GarmentCard` with the Sketch tag. Extend `GarmentCardProps` with `status?: "owned"|"tobuy"|"sketch"` in src/design-system/components.tsx, keeping `owned` for compatibility.
  - The Stats "pieces" note and "items on the list" count leave sketches out.
- [X] T022 [US1] In `ItemForm` (src/components/WardrobeView.tsx), replace the "I own this" check with a `Segmented label="Status"`: options `Sketch / To buy / Owned` while editing a sketch, `To buy / Owned` otherwise. Saving maps the choice through `promote`, or keeps `sketch: true`
- [X] T023 [US1] Validate quickstart scenarios 1, 2, 3, 4, 5, 5a and 5b in the dev server (`npm run dev`) and fix any gaps

**Checkpoint**: The MVP is done. Sketches can be created in both hosts and live in their own status and group.

---

## Phase 4: User Story 2 - A builder that is effortless to use (Priority: P1)

**Goal**: Undo and redo, preview on highlight, owned-first ordering, inline empty slots, a shuffle that always changes something, full keyboard use and phone fit.

**Independent Test**: Build a full look from empty, shuffle, undo the shuffle, and try every shirt. Each step is one action and nothing is lost by accident (quickstart 6–9, 12, 13).

### Tests for User Story 2

- [X] T024 [P] [US2] Write test/history.test.ts covering:
  - `push` is a no-op when equal to `present`
  - `push` clears `future`
  - `undo` and `redo` round-trip
  - `undo` and `redo` are no-ops when empty
  - the cap is 50 (the 51st push drops the oldest)
  - `reset` empties `past` and `future`
- [X] T025 [P] [US2] Add test/model.test.ts cases:
  - `shuffleLook` with a seeded rng returns a different look whenever a free slot has more than one option, and the same look when all free slots are fixed
  - `sortForPicker` orders owned → to buy → sketch and keeps wardrobe order inside each group

### Implementation for User Story 2

- [X] T026 [P] [US2] Create src/lib/history.ts: a generic pure `History<T> = { past: T[]; present: T; future: T[] }` with `init`, `push` (equality through `same`), `undo`, `redo`, `reset`, `canUndo` and `canRedo`, and a cap of 50 (research R8)
- [X] T027 [P] [US2] Update `shuffleLook` in src/lib/model.ts to retry up to 8 times while the result equals the input and some free slot has more than one option (research R9). Add `sortForPicker(items)` and a helper `canShuffle(items, look, locked)`
- [X] T028 [US2] Add `onHighlight?: (value: string | null) => void` to `Select` in src/design-system/components.tsx (research R3):
  - each `RSelect.Item` `onFocus` calls `onHighlight(o.action ? null : o.value)`
  - `RSelect.Root onOpenChange(false)` calls `onHighlight(null)`
  - document it in design-system/components/Select.md
- [X] T029 [US2] Add history to src/components/LookEditor.tsx:
  - Keep `History<Look>` state. Every committed change (pick, shuffle, variation, sketch insert) pushes and calls `onChange`. Reset on a `historyKey` change, or when the `look` prop differs from `present` without coming from the builder.
  - Undo and Redo buttons have `aria-disabled` when unavailable and `aria-keyshortcuts="Control+Z"` / `"Control+Shift+Z"`.
  - A builder-scoped keydown handles Ctrl/⌘+Z, Ctrl/⌘+Shift+Z and Ctrl+Y, ignored when the event target is an input, textarea or contenteditable.
  - Undo never calls `onCreateItem` or removes items.
- [X] T030 [US2] Add a preview overlay to src/components/LookEditor.tsx: a `preview: Partial<Look> | null` set from each slot's `onHighlight`, merged over `present` only for `OutfitFigure`, and cleared when the menu closes or the creator opens. "None" previews `null` for optional slots
- [X] T031 [US2] Order slot options with `sortForPicker` and mark pieces currently in the look in src/components/LookEditor.tsx. Radix typeahead must still work on labels (FR-013)
- [X] T032 [US2] Empty-slot state in src/components/LookEditor.tsx: when a slot has no items, render the text "No {slot label lowercased} in your wardrobe yet" and a `Button` "Create a piece" that opens the creator for that slot, instead of a Select. Replace the old "No items in this category yet. Add some on the Wardrobe tab." line under Try every with the same inline prompt
- [X] T033 [US2] Add a status line in src/components/LookEditor.tsx (`role="status"`) announcing "Shuffled", "Undone", "Redone", "Added {name}" and "Nothing left to shuffle". Shuffle uses `canShuffle` to decide on the last message
- [X] T034 [US2] Keyboard and ARIA pass in src/components/LookEditor.tsx:
  - Keep checks get `aria-label` "Keep {slot}".
  - The Try every strip gets `role="group"` with `aria-label` "Try every {slot}", and its buttons keep `aria-pressed`.
  - Focus stays visible on every control (src/design-system/components.css `:focus-visible` on tiles, palette cells and var buttons).
- [X] T035 [US2] Phone fit in src/styles.css: at ≤ 640px, the builder figure sits at the top of the builder with `position: sticky` (top offset under the masthead/tabs, using tokens). Slots, tiles and palette wrap with no sideways page scroll at 360px. Touch targets are ≥ 44px. Check the same inside `.rt-sheet` (bottom sheet)
- [X] T036 [US2] Validate quickstart scenarios 6, 7, 8, 9, 12 and 13 and fix any gaps

**Checkpoint**: The builder is forgiving and fully keyboard- and phone-usable.

---

## Phase 5: User Story 3 - It looks and feels premium (Priority: P2)

**Goal**: The figure is the hero, slots read as a styled piece list, style tiles have silhouettes, and changes get gentle motion with a reduced-motion fallback, all within the design system.

**Independent Test**: A before/after review in light and dark themes at phone and desktop widths meets US3's acceptance scenarios with no design-system rule broken (quickstart 14–16).

### Implementation for User Story 3

- [X] T037 [US3] Restyle the builder layout in src/styles.css and src/components/LookEditor.tsx:
  - Wide screens: the figure column is the primary element (larger, `paper-raised` plate, hairline rule) with slots beside it as a `.rt-piece-list`. Each row has the slot kicker, the Select (swatch + name), the status tag and Keep, separated by hairlines.
  - Actions (Shuffle, Undo, Redo) are grouped in one secondary row.
  - Narrow screens stack the slots under the figure.
  - The `compact` prop gives the Sheet layout (replaces `.rt-sheet .builder-grid` rules).
- [X] T038 [P] [US3] Add slot silhouettes:
  - Export `pieceSvg(item, slot)` from src/lib/figure.ts. It renders `figureSvg` for a one-item look and returns `{ svg, viewBox }`, with a per-slot crop: layer and shirt → torso; belt → waist; pants → legs; shoes → feet (research R7).
  - Use it in the `SketchCreator` style tiles (src/components/SketchCreator.tsx), drawn in the draft's current colour, with the style name under each tile.
- [X] T039 [US3] Add motion in src/design-system/components.css and src/components/LookEditor.tsx:
  - Key the committed `OutfitFigure` on `fingerprint(look)` so it remounts. It plays a `var(--motion-quick-duration)` opacity and 2px rise animation.
  - The changed slot row gets a `.is-changed` one-off ink underline sweep, cleared on `animationend`.
  - Previews never animate.
  - All of it sits inside `@media (prefers-reduced-motion: no-preference)` (FR-019).
- [X] T040 [US3] Polish the Try every strip in src/styles.css and src/components/LookEditor.tsx: `overflow-x: auto` with `overscroll-behavior-x: contain` and `scroll-snap-type: x proximity`, a clear current-variation mark (ink rule under the figure plus `aria-pressed`), and sketches included with their Sketch tag (FR-022)
- [X] T041 [P] [US3] Write design-system/components/SketchCreator.md covering:
  - anatomy (kicker, heading, tiles, palette, stripe, name, photo, actions)
  - the one-accent rule: hosts demote their primary while it is open
  - the palette being data, not tokens (research R4)
  - keyboard behaviour
  Add it to the components table in design-system/README.md
- [X] T042 [US3] Validate quickstart scenarios 14, 15 and 16 in light and dark themes at 360px and 1280px, and fix any token or contrast issues (add any new text pair to test/tokens.test.ts)

**Checkpoint**: The builder meets the premium bar inside the design system.

---

## Phase 6: User Story 4 - Take a sketch's colour from a photo (Priority: P3)

**Goal**: Pick a photo in the creator, get its main colour suggested, tap to sample a colour, and keep a reduced copy as the piece's picture, all on the device.

**Independent Test**: Pick a garment photo, tap the garment, confirm. The colour matches and the Wardrobe card shows the photo. No network request carries the image (quickstart 10–11).

### Tests for User Story 4

- [X] T043 [P] [US4] Write test/colour.test.ts with synthetic `Uint8ClampedArray` RGBA buffers:
  - `dominantColour` picks the majority colour in the central 60% box
  - it ignores a white or black studio background unless nothing else is left
  - it skips transparent pixels
  - `sampleAt` averages 5×5 and clamps at the edges
  - `rgbToHex` round-trips

### Implementation for User Story 4

- [X] T044 [P] [US4] Create src/lib/colour.ts (pure, no DOM), per research R11:
  - `dominantColour(pixels, w, h)`: central 60% box; skips alpha < 128 and pixels within 6% of pure white or black unless nothing else is left; 4-bit-per-channel buckets; returns the hex of the mean of the most-populated bucket
  - `sampleAt(pixels, w, h, x, y)`
  - `rgbToHex`
- [X] T045 [US4] Create src/components/photo.ts, a DOM wrapper per research R11:
  - `loadPhoto(file)` rejects non-`image/*` files with the message "That file isn't an image we can read."
  - It does `createImageBitmap`, then draws to a canvas with the long edge ≤ 480px, then `getImageData`.
  - It encodes `toDataURL("image/jpeg", 0.8)` and retries at 0.65 and 0.5 while the result is over 150 KB, failing with "That photo is too large to keep." if it is still over.
  - It returns `{ dataUrl, pixels, width, height }`.
  - No network calls.
- [X] T046 [US4] Add "From a photo" to src/components/SketchCreator.tsx:
  - A hidden `<input type="file" accept="image/*">` behind a secondary Button.
  - On load, set `draft.image` and `draft.color = dominantColour(...)`, and show the image with `cursor: crosshair`.
  - A click or tap maps display coordinates to canvas coordinates and sets `draft.color = sampleAt(...)`.
  - The focused image applies the suggested main colour on Enter.
  - Errors show a `Notice` and leave the draft unchanged (FR-026).
  - Make sure `makeSketch` passes `image` through.
- [X] T047 [US4] Check that photo sketches render their picture on the Wardrobe table thumb and `GarmentCard` (the existing `image` paths in src/components/WardrobeView.tsx), and that `referrerPolicy` doesn't affect data URLs
- [X] T048 [US4] Validate quickstart scenarios 10 and 11 (DevTools Network shows no image upload; 20 photo sketches keep the saved wardrobe under 3 MB)

**Checkpoint**: All four stories work on their own.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T049 [P] Update README.md: describe sketches (Create a piece… in the builder, the Sketches group, promoting) under Views → Outfits and Wardrobe, and mention `sketch` in the Data shape section
- [X] T050 Run `npm test`, `npm run typecheck` and `npm run build`. All must pass
- [X] T051 Run `npm run audit` (Lighthouse) on Outfits and on Rotation with the day panel and creator open, in light and dark themes and desktop and mobile. Accessibility must stay at 100 (SC-005). Fix any regression
- [X] T052 Run all of quickstart.md end to end once more and record results in specs/002-outfit-builder-polish/tasks.md Notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories.
- **US1 (Phase 3)** depends on Foundational only. It is the MVP.
- **US2 (Phase 4)** depends on Foundational. It touches `LookEditor.tsx` and `Select` like US1, so it is best done after US1 to avoid conflicting edits, though its lib work (T024–T027) can run in parallel with US1.
- **US3 (Phase 5)** depends on US1 (creator exists) and is best after US2 (final LookEditor structure).
- **US4 (Phase 6)** depends on US1 (`SketchCreator`). T043/T044 can start any time after Foundational.
- **Polish (Phase 7)** comes after all the desired stories.

### Within Each Story

- Tests, then lib modules, then design-system components, then `LookEditor`/`SketchCreator`, then hosts, then quickstart validation.
- T016 depends on T013, T014 and T015. T019 and T020 depend on T016. T021 and T022 depend on T006.
- T029–T033 depend on T026–T028 and edit the same file (`LookEditor.tsx`), so do them in order.
- T046 depends on T044 and T045.

## Parallel Opportunities

- Phase 2: T005, T007, T010 and T011 touch different files and can run together once T003/T006 exist (T007 needs T006; T010 needs T008/T009).
- US2: T024, T025, T026 and T027 (tests and lib) in parallel.
- US3: T038 and T041 in parallel with T037.
- US4: T043 and T044 in parallel, and both can start right after Phase 2.

### Parallel Example: User Story 2

```text
Task: "T024 [US2] Write test/history.test.ts …"
Task: "T026 [US2] Create src/lib/history.ts …"
Task: "T025 [US2] Add shuffle/sortForPicker cases to test/model.test.ts …"
Task: "T027 [US2] Update shuffleLook + add sortForPicker in src/lib/model.ts …"
```

### Parallel Example: User Story 4

```text
Task: "T043 [US4] Write test/colour.test.ts …"
Task: "T044 [US4] Create src/lib/colour.ts …"
```

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 → Phase 2 (sketch status, costs and generator exclusions)
2. Phase 3 (US1): create a piece in place, see it in the Sketches group, promote it
3. **Stop and validate** with quickstart 1–5b

### Incremental Delivery

1. US1, the capability the user asked for
2. US2, which makes it effortless (undo, preview, empty slots, keyboard, phone)
3. US3, the premium polish (layout, silhouettes, motion)
4. US4, colour from a photo
5. Polish: README, full test/build/audit

## Notes

- [P] tasks touch different files with no dependency on incomplete tasks.
- Garment colours (palette, sampled, custom) are data. Never route them through theme tokens.
- Never delete wardrobe items on undo or discard. Only explicit Delete removes items.
- Don't commit unless the user asks.

## Implementation notes (2026-11-08)

- **Baseline (T001)**: 87 tests passed and typecheck was clean before any changes. Final: 115 tests in 8 files, typecheck clean, build green.
- **Analysis items**:
  - **U1**: when the host changes the look with an unchanged `historyKey` (for example "Wear a saved outfit" or "Copy previous day"), `LookEditor` pushes the change onto history, so it can be undone. Only a `historyKey` change resets history.
  - **I1**: tiles drop to 72px at ≤ 640px in CSS. Swatch cells stay at 44px.
  - **U2**: checked in the browser. A sketch shows the SaveBar as unsaved, and "Discard changes" removes it.
  - **C1**: preview latency was measured with a MutationObserver at 16–23 ms in the dev build, without CPU throttling, because CDP throttling isn't allowed in this browser. That works out to about 90 ms at 4×, inside the 100 ms target.
- **Browser checks (quickstart)**: 1–9, 10 and 12–15 were run on the dev server at 1280px and 360px, in light and dark themes.
  - Upload through the file chooser is blocked in this browser, so the photo flow was driven through `DataTransfer` on the same input.
  - A noisy 12 MP JPEG became a 79 KB stored copy in 122 ms.
- **Lighthouse (T051)**: `specs/002-outfit-builder-polish/lighthouse/REPORT.md`. Accessibility is 100 on all 20 runs. The Wardrobe tab's Best Practices score of 96 predates this feature: feature 001's after-run shows the same third-party cookie issue from product-image hosts.
- **Extras found during validation**:
  - Sketch names are also unique against the brand-stripped names the pickers show, so a sketch can't read the same as "Suitsupply navy blazer".
  - Style tiles draw only the garment, not the bare mannequin.
  - The heading names the piece grammatically ("Sketch a pair of shoes").
  - `scripts/lighthouse.mjs` takes `--feature`.
