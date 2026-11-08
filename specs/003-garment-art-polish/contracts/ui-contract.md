# Contract: UI Changes

**Feature**: [../spec.md](../spec.md) · **Renderer**: [renderer-contract.md](renderer-contract.md)

## DetailFields (new; `src/components/DetailFields.tsx`)

Shared by the Wardrobe item editor and `SketchCreator`.

```ts
function DetailFields(props: {
  cat: Category; style: string;
  value: Pick<Item, "sleeve" | "pattern" | "hardware" | "length" | "buckle" | "stripe">;
  onChange: (patch: Partial<Item>) => void;
  /** Sketch creator: tiles with live art. Wardrobe form: compact Segmented / Select controls. */
  variant: "tiles" | "compact";
  color: string;              // for live tile art
  idPrefix: string;
}): JSX.Element | null;
```

- It renders only the options in `detailOptions(cat, style)`. If there are none, it renders nothing (FR-013).
- **Sleeve**, **length** and **buckle**: `Segmented` (compact) or `Tiles` (tiles) showing the piece with that option.
- **Pattern**: tiles with a small swatch of the pattern in the draft's colours, plus a **second colour** colour field, shown when the pattern isn't solid. This replaces the old "Stripe · On" control in both forms. An old item with only `stripe` shows "Stripe" selected.
- **Hardware**: four round swatches (brass `#b59a5b`, silver `#c3c6cb`, gunmetal `#5b5f66`, black `#1d1d1f`) with text labels.
- Changing style keeps every detail value in the draft. Inapplicable values are only hidden, and are removed by `cleanDetails` on save (FR-019).
- Each group is a labelled radio group (Radix ToggleGroup through the existing `Tiles` and `Segmented`) with arrow-key navigation. Touch targets are ≥ 44 px.

## SketchCreator (changed)

- `slot: Slot` becomes **`part: Slot | "acc"`**. For `"acc"`, the style list is the drawable accessory styles, without the generic `other`.
- Style tiles get a `--paper-sunk` ground and padding (FR-011), and a scrolling row when there are more than 8 styles.
- A **Details** section (`DetailFields variant="tiles"`) appears between Style and Colour when the style has details.
- `onDraftChange` and `onConfirm` carry the detail fields. `makeSketch` accepts `cat: "other"` for drawable accessory styles and runs `cleanDetails`.

## LookEditor (changed)

- New **Accessories** row after the slot list (`<li class="piece-row is-acc">`):
  - Kicker "Accessories". Each accessory on the look is a chip: swatch, short name, sketch tag if it is a sketch, and a remove button `aria-label="Remove <name>"`.
  - An "Add accessory…" `Select` with value always empty. It lists wardrobe accessories (`cat === "other"`) not yet on the look, in picker order, then the action "Create a piece…" (`openCreator("acc")`). Hovering or highlighting an option previews it on the figure, as the slot pickers do.
  - Adding or removing commits through `commit()`, so undo and redo cover it (FR-030).
  - With no accessories in the wardrobe, the row shows "Add glasses, a watch or a tie" and a "Create a piece" button.
- "Keep" doesn't apply to accessories, because shuffle never touches them.
- "Try every" stays slots only.
- The figure `aria-label` lists accessory names after the clothes.

## WardrobeView (changed)

- The category label "Other" becomes **"Accessories"** (`CATEGORIES`), and the Style select lists its styles.
- The item form adds `<DetailFields variant="compact">` under Style and Colour, and removes the old stripe field (the pattern second colour replaces it).
- **Basics** rows: the swatch cell shows `basicsIconSvg(item)` at 24 px instead of the plain swatch, with a `title` and `aria-label` of the style.
- Saving runs `cleanDetails`.
- Deleting an accessory, or changing its category, removes it from every look's `acc` (outfits and rotation days).

## GarmentCard (changed; `design-system`)

- New optional `art?: ReactNode`, drawn centred over the colour plate, below any photo. WardrobeView passes the basics icon for `basics` items, and the `pieceSvg` art for drawable accessories.
- `Kicker` label for `other` becomes "Accessories" (`SLOT_LABEL`).
- Documentation updated in `design-system/components/GarmentCard.md`.

## OutfitFigure, lookPieces (changed; `common.tsx`)

- `OutfitFigure` aria-label includes accessories.
- `lookPieces` appends one `Piece` per accessory with `slot: "acc"`, so LookCard and RotationDay list them (FR-034). The `Piece.slot` type widens to `Slot | "acc"`, labelled "Accessory".

## PrintView

No layout change. Cartoons gain accessories automatically through `figureSvg`.

## RotationView

`generateRotation(items, days, weeks, undefined, undefined, rot.looks)` keeps each day's accessories (FR-033).

## Accessibility and design-system rules

- Detail tiles, accessory chips and the add select meet the existing rules: tokens only, hairline borders, one oxblood primary per screen, text contrast ≥ 4.5:1 in both themes, and no sideways scroll at 360 px.
- Hardware swatches are always paired with text, so colour is never the only cue.
