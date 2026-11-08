# Data Model: Outfit Builder Polish & Sketch-a-Piece

## Item (existing, one optional field added)

| Field | Type | Notes |
|---|---|---|
| `id` | string | From `uniqueId(name, items)` |
| `cat` | `Category` | For a sketch, always one of the five outfit slots (never `other`) |
| `name` | string | For a sketch, the typed name or `sketchName(color, style)`, made unique by `uniqueName` |
| `style` | string | One of `STYLES[cat]` |
| `color` | hex string | A palette value, a custom value or a photo-sampled value |
| `stripe?` | hex string | Only when stripe is on |
| `price` | number | `0` for a new sketch |
| `qty` | number | `1` for a new sketch |
| `owned` | boolean | Always `false` while `sketch` is set |
| `image?` | string | URL, or for photo sketches a `data:image/jpeg;base64,…` URL ≤ 150 KB |
| **`sketch?`** | `true` | **NEW.** Set while the item is a sketch. Missing on every other item, and removed on promotion. |
| `link?`, `brand?`, `notes?` | string | Unchanged; not set by the creator |

**Validation**

- `makeSketch` rejects `cat === "other"` and any style that isn't in `STYLES[cat]`.
- Names are trimmed. An empty name falls back to `sketchName`.
- Uniqueness is checked against all item names, ignoring case.
- `migrate` keeps `sketch` only when it is exactly `true` and `owned` is false. Otherwise it drops `sketch`.

**Status (derived by `itemStatus`)**

| `sketch` | `owned` | Status | In cost totals | Generate rotation may pick | Builder may pick | Wardrobe group |
|---|---|---|---|---|---|---|
| true | false | Sketch | no | no | yes | Sketches |
| missing | false | To buy | yes | yes | yes | its category |
| missing | true | Owned | yes | yes | yes | its category |

**Lifecycle of a sketch**

```text
creator confirm ──► Item{owned:false, sketch:true} in wardrobe (unsaved change)
      │                       │
      │                       ├─ edited on Wardrobe tab ─► still a sketch (price, brand… may be set)
      │                       ├─ Promote → To buy ──────► sketch removed, owned:false; joins costs + generator
      │                       ├─ Promote → Owned ───────► sketch removed, owned:true;  joins costs + generator
      │                       └─ Deleted ───────────────► removed from wardrobe, outfits, rotation (existing rule)
      └─ app Discard ──────► gone with all other unsaved changes (existing save flow)
```

Undoing the insert, or discarding a Rotation day's changes, only affects the **look**. The item stays.

## Look (existing, unchanged)

`Record<Slot, string | null>`

## BuilderHistory (new, in memory only)

| Field | Type | Notes |
|---|---|---|
| `past` | `Look[]` | Oldest first, capped at 50 |
| `present` | `Look` | The committed look the builder shows |
| `future` | `Look[]` | Cleared on any new `push` |

**Transitions**

- `push(l)` (no-op when `l` equals `present`)
- `undo` / `redo` (no-op when empty)
- `reset(l)` (on a `historyKey` change)

The history is never saved, exported or shared between the two hosts.

## Preview overlay (new, in memory only)

`Partial<Look> | null`. It is merged over `present` when rendering the figure and never committed. The Select highlight sets it, and closing the menu or opening the creator clears it. While the creator is open, the overlay is `{ [slot]: DRAFT_ID }` and the figure renders `items ∪ {draft item}`.

## PaletteColour (new, constant)

`{ name: string; hex: string }`. There are 12 entries, in the order shown in the creator (research R4). `nearestColourName(hex)` returns the name of the closest entry by RGB distance.

## SketchDraft (new, creator-local)

| Field | Default | Notes |
|---|---|---|
| `cat` | the slot that opened the creator | Fixed while the creator is open |
| `style` | per-slot default (R6) | |
| `color` | per-slot default (R6) | |
| `stripeOn` / `stripe` | off / `#7d9bc6` | As in the existing `ItemForm` |
| `name` | `""` | Placeholder shows the generated name live |
| `image` | none | Set by the photo flow |
