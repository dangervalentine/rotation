# UI Contract: Outfit Builder Polish & Sketch-a-Piece

Interfaces between the builder, its two hosts and the design system. Prop names are binding. Internal markup is not.

## `LookEditor` (src/components/LookEditor.tsx)

```ts
interface LookEditorProps {
  items: Item[];
  look: Look;                          // committed look, controlled by the host
  onChange: (l: Look) => void;         // every committed change (pick, shuffle, variation, undo/redo, sketch insert)
  onCreateItem: (it: Omit<Item, "id">) => string;   // NEW: host adds the item to data, returns its id
  historyKey: string;                  // NEW: history resets when this changes (outfit id / day index / "new")
  onCreatingChange?: (creating: boolean) => void;   // NEW: host demotes its primary button while true
  compact?: boolean;                   // NEW: narrower layout inside the Rotation Sheet
}
```

**Behaviour guarantees**

- `onCreateItem` is called once per confirmed sketch, **before** `onChange` selects the returned id.
- Cancelling the creator calls neither callback.
- Undo and redo call `onChange` with the restored look and never call `onCreateItem` or remove items.
- Previews never call `onChange`.

**Hosts**

| Host | `onCreateItem` | `historyKey` |
|---|---|---|
| `OutfitsView` | `setData({...data, items:[...items, {id: uniqueId(name, items), ...it}]})` | `editing ?? "new"` |
| `RotationView` | same, through its `setData` | `String(dayIndex)` |

While `creating` is true, the host renders its primary action as `variant="secondary"`.

## `Select` (src/design-system/components.tsx), extended

```ts
interface SelectOption {
  value: string;
  label: string;
  swatch?: { color: string; stripe?: string } | null;
  tag?: { label: string; tone: "owned" | "tobuy" | "sketch" };   // NEW: shown in the menu row, not in the trigger
  action?: true;                                                   // NEW: rendered after a separator; never becomes the value
}
props += {
  onHighlight?: (value: string | null) => void;   // NEW: focus on an item → value; menu closes → null
  onAction?: (value: string) => void;             // NEW: an action option was chosen
}
```

- The tag sits outside `RSelect.ItemText`, so the trigger shows only the swatch and name.
- Action options never call `onHighlight` with their value. They report `null`.

## `Tag`: new tone `sketch`

An ink-outlined tag with a dashed rule and the text "Sketch". It meets the same contrast pair as `neutral`.

## `SketchCreator` (src/components/SketchCreator.tsx)

```ts
interface SketchCreatorProps {
  slot: Slot;
  items: Item[];                                   // for unique naming
  onDraftChange: (draft: Omit<Item, "id">) => void;   // live preview, fired on every change and on mount
  onConfirm: (draft: Omit<Item, "id">) => void;
  onCancel: () => void;
}
```

**Structure, in reading order**

1. Kicker "New piece · {slot label}"
2. Heading (focus target on open)
3. Style tiles (ToggleGroup, `aria-label="Style"`)
4. Colour palette (ToggleGroup of 12 named swatches + "Custom colour" input; `aria-label="Colour"`; each swatch has `aria-label` = colour name and a tooltip)
5. "Stripe" check + colour
6. "Name (optional)" field, with the placeholder showing the generated name
7. "From a photo" button (P3) → image with crosshair cursor; a click or tap samples the colour there; Enter on the focused image applies the suggested main colour
8. Actions: **Add to look** (primary), Cancel

**Keyboard**

- Escape cancels, unless a nested Select menu is open.
- Enter inside the name field confirms.
- On close, focus returns to the slot's Select trigger.

## Builder controls (inside LookEditor)

| Control | Role / ARIA | Keys |
|---|---|---|
| Slot row | Select trigger labelled by the slot kicker; status tag inside the label | Space/Enter opens; typeahead |
| Keep | Checkbox `"Keep {slot}"` | Space |
| Shuffle | Button "Shuffle unkept pieces" | n/a |
| Undo / Redo | Buttons, `aria-disabled` when empty, `aria-keyshortcuts="Control+Z"` / `"Control+Shift+Z"` | Ctrl/⌘+Z, Ctrl/⌘+Shift+Z, Ctrl+Y (within the builder, not in text fields) |
| Status line | `role="status"` | Announces "Shuffled", "Undone", "Added Olive jacket", "Nothing left to shuffle" |
| Try every strip | `role="group"` named "Try every {slot}"; items are buttons with `aria-pressed` | Its own sideways scroll; `scroll-snap` on items |
| Empty slot | Text "No {slot} in your wardrobe yet" + button "Create a piece" | n/a |

## Model functions (src/lib/model.ts, src/lib/sketch.ts)

```ts
itemStatus(it: Item): "sketch" | "tobuy" | "owned";
promote(it: Item, to: "tobuy" | "owned"): Item;          // drops `sketch`, sets `owned`
wardrobeTotals(items)                                    // ignores items with sketch: true
generateRotation(items, days, weeks, rng?, layerChance?) // never places a sketch (filters first)
```

## Wardrobe tab (WardrobeView)

| Surface | Sketch behaviour |
|---|---|
| Stats (whole, owned, left to buy) | Exclude sketches. The "pieces" note excludes them too. |
| Table | Final group "Sketches · n" after Other. Rows show the swatch, name, style and a Sketch tag. Price, qty and subtotal are shown muted. Days worn as usual. No Owned checkbox. Actions: `Move to To buy` (ghost), `I own this` (secondary), `Edit` (ghost). No total row. |
| Cards | Final group "Sketches · n". GarmentCard shows Tag `sketch`. The card opens the item form. |
| Item form | Status Segmented `Sketch / To buy / Owned` (label "Status") replaces the "I own this" check. "Sketch" is offered only while the item is already a sketch. |

## Tokens added (design-system/tokens.json)

| Token | Value | Usage |
|---|---|---|
| `motion-quick-duration` | 160ms | Figure cross-fade and changed-row pulse. Removed under reduced motion. |
| `motion-quick-ease` | cubic-bezier(.2,.7,.2,1) | Same |
| `tile-size` | 88px (72px ≤ 640px) | Style tiles and palette cells. Never below 44px. |
