# Data Model: Garment Art & Customization Polish

**Feature**: [spec.md](spec.md) · **Research**: [research.md](research.md)

All changes are **additive and optional**. `WardrobeData.version` stays `1`. A file written before this feature loads unchanged, and a file written after it loads in an older build, which ignores the new fields.

## Item (changed)

| Field | Type | Notes |
|---|---|---|
| `cat` | `Category` | Unchanged ids. `"other"` is now **labelled** "Accessories" (R9). |
| `style` | `string` | Must be a style of `cat` in `STYLE_SPEC`. Unknown values are kept and drawn with the category's default art (FR-039). |
| `color` | hex | Unchanged. |
| `stripe?` | hex | **Now the second colour for any pattern.** Present without `pattern` → read as `pattern: "stripe"` (FR-018). |
| `pattern?` | `"solid" \| "stripe" \| "pinstripe" \| "breton" \| "gingham" \| "check" \| "dot"` | **New.** Only on styles whose spec has `pattern: true`. A pattern other than solid needs `stripe`; without it, the item is drawn solid. |
| `sleeve?` | `"long" \| "short" \| "rolled"` | **New.** Only on styles with a `sleeve` default. |
| `hardware?` | `"brass" \| "silver" \| "gunmetal" \| "black"` | **New.** Belts, blazers, jackets and other layers with buttons or zips, jeans, and watches. Glasses frames use the item colour. |
| `length?` | `"full" \| "cropped" \| "knee" \| "short"` | **New.** Bottoms only. |
| `buckle?` | `"frame" \| "plate" \| "d-ring"` | **New.** Belts only. |
| *(others)* | | `id, name, price, qty, owned, link, image, brand, notes, sketch` are unchanged. |

**Validation and normalisation** (`migrate`, form save, `makeSketch`):
- A detail field whose value equals the style default is **omitted**, so it isn't stored.
- A detail field the style doesn't use is **dropped on form save** (FR-019). `migrate` **keeps** unknown or inapplicable values (FR-039), and the renderer ignores them.
- `pattern: "solid"` is omitted. If `pattern` is set without `stripe`, the item renders solid.

**Effective details**: `detailsOf(item)` returns the full set the renderer uses: the style defaults, overlaid with the item's valid fields, and `pattern` inferred from `stripe`.

## StyleSpec (new; `src/lib/styles.ts`)

```ts
type StyleSpec = {
  sleeve?: Sleeve;        // present = sleeve option applies; value = default
  pattern?: true;         // pattern + second colour apply
  hardware?: Hardware;    // present = applies; value = default
  length?: Length;
  buckle?: Buckle;
  /** Where it's drawn: a slot, "acc" (accessory), or null (never drawn: generic other, basics). */
  art: Slot | "acc" | null;
};
const STYLE_SPEC: Record<Category, Record<string, StyleSpec>>;  // insertion order = menu order
const STYLES: Record<Category, string[]>;                        // derived, kept for existing callers
```

The full table is in [contracts/renderer-contract.md](contracts/renderer-contract.md#style-table). Existing styles keep their positions, so each category's first style (the default for a new item) is unchanged.

## Look (changed)

| Field | Type | Notes |
|---|---|---|
| `layer, shirt, undershirt, belt, pants, shoes` | `string \| null` | Unchanged. |
| `acc?` | `string[]` | **New.** Accessory item ids, unique, in the order added. Omitted when empty. |

- `normalizeLook` keeps `acc` only if it is a non-empty array. It dedupes and keeps only string ids.
- Removing an item from the wardrobe removes its id from every `acc` (the same as slot clearing today in `WardrobeView`).
- Changing an accessory's category away from `"other"` removes it from every `acc`.
- `generateRotation(items, days, weeks, rng, layerChance, keep?)` copies `keep[i].acc` onto day `i`.

## Body anchors (new; `src/lib/figure/body.ts`)

Named points in the existing 120×200 space. They are constants, not stored data.

| Anchor | y (approx.) | Used for |
|---|---|---|
| `neck` | 30 | collars, ties, scarves |
| `shoulder` | 32 (x 38/82, sloped) | sleeve tops |
| `elbow` | 66 | short (−8) and rolled (+6) sleeve ends |
| `wrist` | 88 | long sleeve ends, watches |
| `chest` / `waist` | 50 / 108 | torso taper, belt line |
| `crotch` | 128 | inseam |
| `knee` | 150 | knee (0) and short (−12) hems |
| `ankle` | 180 | full (0) and cropped (−14) hems, boot shafts |
| `sole` | 192 | shoe soles |

## Layer (new, in memory only)

`{ part: Slot | "acc" | "body" | "head", svg: string }`, listed in painting order:
1. `head`: hair back (cartoon)
2. `body`: arms, and plain or skin legs where uncovered
3. `undershirt`
4. `shirt`
5. `acc`: tie
6. `layer`
7. `belt`, with belt loops in the `pants` layer
8. `pants`
9. `shoes`
10. `body`: hands
11. `acc`: watch, scarf
12. `head`: head and face
13. `acc`: glasses, sunglasses, hat

## Unchanged

`Outfit`, `Rotation` (beyond `Look.acc`), `Figure` and `WardrobeData` keep their shapes. Export and import go through `migrate`, which keeps the new fields, so a round trip is identical (FR-040, SC-009).
