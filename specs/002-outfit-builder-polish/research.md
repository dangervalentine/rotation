# Research: Outfit Builder Polish & Sketch-a-Piece

Phase 0 decisions. The Technical Context had no open `NEEDS CLARIFICATION` items; these entries settle the design choices the spec left to planning.

## R1. Where the creator opens: inline panel vs. popover vs. nested dialog

- **Decision**: An **inline panel** that takes the place of the builder's slot column while it is open. The figure stays where it is and previews the sketch. On phones the panel sits under a sticky figure.
- **Rationale**: The builder already lives inside a Radix Dialog in the Rotation view (the `Sheet`). A dialog or popover inside it would mean a nested focus trap, a second scrim on phones and z-index fights with the Select portal. An inline panel works the same in both hosts (FR-001, SC-002), keeps the figure visible for the live preview (FR-004), and needs no new primitive. Focus moves to the panel's heading when it opens and back to the slot trigger when it closes (FR-005), and Escape cancels.
- **Alternatives considered**: A Radix Popover anchored to the slot (too small for tiles and palette at phone width, and needs a new dependency). A second `Sheet` (stacked sheets on mobile are disorienting, and it covers the figure).

## R2. "Create a piece…" inside a Radix Select

- **Decision**: Extend `SelectOption` with `action?: true`. Action options render after a separator, never become the Select's value, and call `onAction(value)` instead of `onChange`. The Select stays controlled, so choosing an action leaves the current value unchanged, and the builder then opens the creator.
- **Rationale**: Radix Select needs every item to have a value. A sentinel value intercepted in `onValueChange` is the established pattern. Keyboard, typeahead and screen-reader behaviour all come for free (FR-013, FR-016).
- **Alternatives considered**: A separate "+" button beside each slot (doubles the tab stops, and the user said the dropdown is the place). A combobox library (new dependency for no gain).

## R3. Previewing the highlighted option

- **Decision**: Each `RSelect.Item` gets `onFocus` → `onHighlight(value)`. Radix moves real focus to the highlighted item for both pointer hover and arrow keys. `onOpenChange(false)` → `onHighlight(null)`. `LookEditor` keeps a `preview: Partial<Look> | null` overlay that it merges over the committed look only for rendering the figure. Action and "None" options preview nothing.
- **Rationale**: This meets FR-012 with no timers, and the committed look and the history are never touched by a preview.
- **Alternatives considered**: `onPointerMove` (misses keyboard), `data-highlighted` MutationObserver (fragile).

## R4. The curated palette: tokens or data?

- **Decision**: **Data**, in `src/lib/palette.ts`: `navy #22304a`, `charcoal #3b3d42`, `grey #8a8d91`, `stone #c9c1b1`, `cream #ece3cf`, `white #f4f3ef`, `light blue #a9c1dc`, `olive #5f6340`, `camel #b08a5a`, `brown #5a3e2b`, `oxblood #5e1f24`, `black #1d1d1f`. The hex values are final but can be tuned during implementation.
- **Rationale**: The design system's first principle is that garment colours are data and never come from theme tokens. Palette entries become `item.color`, so they must not change with light or dark mode. Tokens are for the interface.
- **Alternatives considered**: Adding them to `tokens.json` (they would end up in the themed CSS layer and break the principle).

## R5. Naming a sketch

- **Decision**: `sketchName(color, style)` = `Capitalised(nearestColourName(color)) + " " + style` (for example "Olive jacket"). `uniqueName(base, items)` adds " 2", " 3"… on a case-insensitive name clash. Item ids keep using the existing `uniqueId`.
- **Rationale**: Readable defaults let people confirm with no typing (FR-002, FR-007, SC-001). Nearest-colour matching uses squared distance in RGB space, which is good enough over 12 well-separated colours.
- **Alternatives considered**: "Untitled piece" (unhelpful in pickers). CIEDE2000 (overkill for 12 colours).

## R6. Defaults per slot

- **Decision**: layer → `blazer` / navy; shirt → `oxford` / light blue; belt → `belt` / brown; pants → `pants` / charcoal; shoes → `loafers` / brown. Stripe is off by default.
- **Rationale**: These are the most common menswear basics. With them, a confirm with no changes gives a plausible garment.

## R7. Style tiles with silhouettes

- **Decision**: Each tile renders `figureSvg` for a one-item look holding a temporary item in the chosen colour, cropped with a per-slot `viewBox` (layer and shirt: torso; pants: legs; shoes: feet; belt: waist). Tiles are a Radix ToggleGroup (`type="single"`), so the group gets arrow-key roving and `aria-pressed`.
- **Rationale**: The silhouettes match what the figure will show, cost no new art, and update with the chosen colour (FR-020).
- **Alternatives considered**: Hand-drawn icon set (new art to maintain, and it can drift from the figure).

## R8. Undo and redo

- **Decision**: A pure `History<T>` in `src/lib/history.ts`: `{ past: T[]; present: T; future: T[] }` with `push`, `undo`, `redo`, `reset`, and a cap of 50 (the spec asks for at least 20). `LookEditor` owns it and pushes on every committed change (pick, shuffle, variation, sketch insert). It resets when the `historyKey` prop changes (a different outfit is loaded in Outfits, or a different day in Rotation). The buttons are "Undo" and "Redo", with Ctrl/⌘+Z and Ctrl/⌘+Shift+Z (and Ctrl+Y) bound inside the builder only, and ignored while focus is in a text field.
- **Rationale**: A pure module is node-testable. Owning history in the builder keeps both hosts simple: they still get `onChange(look)`.
- **Edge**: Undoing a sketch insert restores the slot but **does not delete** the item. Wardrobe data is only removed deliberately (spec edge case).

## R9. Shuffle must change something

- **Decision**: `shuffleLook` retries up to 8 times while the result equals the input, and a free slot has more than one option. If all free slots are fixed (each has one or no options), it returns the input unchanged and the builder shows "Nothing left to shuffle" in its status line.
- **Rationale**: FR-015, with a deterministic test through the existing injectable `rng`.

## R10. Motion

- **Decision**: New tokens `motion-quick-duration: 160ms` and `motion-quick-ease: cubic-bezier(.2,.7,.2,1)`. The figure SVG is keyed on the look's fingerprint, so it remounts on change and plays a 160 ms opacity and 2 px rise animation. The changed slot row gets a one-off ink underline sweep. Both sit inside `@media (prefers-reduced-motion: no-preference)`, so reduced motion gets an instant change (FR-019). Previews (R3) do **not** animate, so scanning a list stays crisp.
- **Alternatives considered**: View Transitions API (good support by late 2026, but it snapshots the whole document and fights with the open Select portal). Animating SVG `fill` (paths are rebuilt through `innerHTML`, so there is nothing to tween).

## R11. Colour from a photo

- **Decision**:
  - `components/photo.ts`: `File` → `createImageBitmap` → canvas at ≤ 480 px long edge → `getImageData` → `toDataURL("image/jpeg", 0.8)`.
  - If the data URL is over 150 KB, retry at quality 0.65, then 0.5.
  - Pure `colour.ts`:
    - `dominantColour(pixels, w, h)` reads the central 60 % box, skips transparent pixels and pixels within 6 % of pure white or black (typical studio backgrounds) unless nothing else is left, and buckets at 4 bits per channel. It returns the mean colour of the most-populated bucket.
    - `sampleAt(pixels, w, h, x, y)` averages a 5×5 area, clamped at the edges.
  - Tap coordinates are mapped from displayed size to canvas size.
- **Rationale**: Runs entirely on the device (FR-024), meets the size cap (FR-025, SC-008: 20 × ~60–120 KB ≈ 1.2–2.4 MB), and needs no dependency. Non-images and decode errors are caught and shown as a `Notice` (FR-026).
- **Alternatives considered**: k-means (slower, no visible gain for one suggested colour). Storing the original file (megabytes each, which breaks the `localStorage` quota).

## R12. Sketch as its own status (revised after clarification)

- **Decision**:
  - Keep the optional `sketch?: true` on `Item`, but make it a **status**. `itemStatus(it)` returns `"sketch"` when `it.sketch`, `"owned"` when `it.owned`, and `"tobuy"` otherwise. A sketch always has `owned: false`, and `migrate` normalises `sketch && owned` to owned by dropping `sketch`.
  - `promote(it, "tobuy" | "owned")` deletes `sketch` and sets `owned`.
  - **Costs**: `wardrobeTotals` skips sketches, so the three Stats and the category totals leave them out (FR-027).
  - **Generator**: `generateRotation` filters `items` to non-sketches before it builds pools. `matchingBelt`, which it calls, receives the filtered list, so a sketch belt can't come in through shoe matching (FR-028).
  - Builder functions (`shuffleLook`, `variations`, `matchingBelt` when called from the builder) still see sketches (FR-009). Manually set rotation days keep their sketches, and `daysWorn` still counts them.
  - **Wardrobe tab**: a final **Sketches** group after "Socks, undershirts and other", in both layouts. It has no subtotal row and no Owned checkbox. Instead each row has `Move to To buy` (ghost) and `I own this` (secondary) buttons. Cards show the Sketch tag, and the item form shows the status as a three-way Segmented (Sketch / To buy / Owned), which replaces the "I own this" check.
  - JSON import and export carry the field.
- **Rationale**: This implements the clarification (Session 2026-11-08) with one optional field and no schema version bump. A single status function keeps every surface consistent (FR-008).
- **Alternatives considered**: A separate `sketches[]` array on `WardrobeData`. Every look resolver (`findItem`, the figure, pickers) would need to search two lists, and promotion would mean moving records between arrays and fixing references. A `status` enum replacing `owned` would break the existing data format and the original single-file import.

## R13. Picker ordering and scale

- **Decision**: `sortForPicker(items)` orders owned items first, then to-buy items, then sketches. Inside each group the wardrobe order is kept. Radix typeahead handles jump-to-name. The menu max height is capped by token, and the menu scrolls.
- **Rationale**: FR-011 and FR-013, and the 50+ items edge case.
