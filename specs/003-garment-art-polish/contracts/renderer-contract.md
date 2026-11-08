# Contract: Garment Renderer & Style Registry

**Feature**: [../spec.md](../spec.md) · **Data model**: [../data-model.md](../data-model.md)

## Module layout

`src/lib/figure.ts` stays the public entry point and re-exports from `src/lib/figure/`:

| Module | Contents |
|---|---|
| `body.ts` | `BODY` anchors, `at()`, arms, legs, hands |
| `head.ts` | hair back, head and face (moved unchanged in stage 1) |
| `paint.ts` | `Paint` context: ink, stroke widths, `outline()` and `detail()` attribute builders, `shade()`, pattern defs |
| `tops.ts` | shirts and undershirts |
| `layers.ts` | top layers |
| `bottoms.ts` | pants, shorts, skirts, belt loops |
| `belts.ts` | belts |
| `shoes.ts` | shoes |
| `accessories.ts` | accessories |
| `icons.ts` | `basicsIconSvg` |

## Public API

```ts
export const VIEWBOX: { plain: "0 0 120 200"; cartoon: "0 -30 120 230" };   // unchanged
export interface FigureOptions { cartoon?: boolean; figure?: Figure }         // unchanged

export type Part = Slot | "acc" | "body" | "head";
export interface Layer { part: Part; svg: string }

/** Painting-order layers for a look. Pure; deterministic apart from pattern ids. */
export function figureLayers(items: Item[], look: Look, opts?: FigureOptions): Layer[];

/** Unchanged signature: inner SVG markup for the whole figure. */
export function figureSvg(items: Item[], look: Look, opts?: FigureOptions): string;

/**
 * One garment alone, exactly as on the figure (FR-001).
 * part defaults to the item's art part (STYLE_SPEC[cat][style].art).
 * Head-worn accessories also include a muted cartoon head for context (R10).
 */
export function pieceSvg(item: Item, part?: Slot | "acc", figure?: Figure): { svg: string; viewBox: string };

/** Small flat icon for socks and underwear, viewBox "0 0 24 24" (FR-036). */
export function basicsIconSvg(item: Item): string;
```

### Guarantees

1. **Stage 1 (identity)**: for every input the golden matrix covers, `figureSvg` output equals the pre-refactor output after normalising pattern ids (FR-003).
2. `figureSvg(items, look, o) === figureLayers(items, look, o).map(l => l.svg).join("")`.
3. `pieceSvg(it).svg` contains only markup from layers whose `part` is the item's part. There is no bare-figure body unless the item's art needs context (head-worn accessories).
4. **From stage 2**:
   - Every garment outline carries `vector-effect="non-scaling-stroke"`. Outlines are 1.25 px on the plain figure and 2 px on the cartoon. Detail lines don't carry it.
   - Plain looks where the bottoms end above the ankle include a `body` layer with legs (FR-006).
5. No underwear or `basics` item is ever drawn by `figureLayers`, even if its id is put in a slot or in `acc` (FR-037).
6. Unknown `style` or detail values never throw. They draw the category's first style with default details (FR-039).

## Style registry (`src/lib/styles.ts`)

```ts
export function styleSpec(cat: Category, style: string): StyleSpec;          // falls back to the category's first style
export function detailsOf(item: Item): Required<Pick<Item, never>> & EffectiveDetails;
export function detailOptions(cat: Category, style: string): DetailKey[];      // which controls the forms show
export function cleanDetails<T extends Partial<Item>>(it: T): T;              // drops inapplicable or default fields (form save)
export const STYLES: Record<Category, string[]>;                               // derived; same shape as today
```

### Style table

Bold = existing style, in its current position. "—" = the option doesn't apply. P = pattern option applies.

| Category | Style | Sleeve | Pattern | Hardware | Length | Buckle | Signature detail (FR-010 / FR-026) |
|---|---|---|---|---|---|---|---|
| layer | **blazer** | long | P | brass | — | — | notch lapels, chest and flap pockets, 2 buttons |
| layer | **sweater** | long | P | — | — | — | ribbed crew, cuffs and hem |
| layer | **cardigan** | long | P | brass | — | — | V neck, button column, ribbed hem and cuffs |
| layer | **jacket** | long | P | silver | — | — | zip, stand collar, chest pockets |
| layer | crewneck | long | P | — | — | — | sweatshirt: raglan seams, wide rib |
| layer | quarter-zip | long | P | silver | — | — | short zip with stand collar |
| layer | hoodie | long | P | — | — | — | hood behind the neck, drawcords, pouch pocket |
| layer | chore coat | long | P | brass | — | — | point collar, three patch pockets |
| layer | bomber | long | P | silver | — | — | ribbed collar, cuffs and hem, zip |
| layer | overcoat | long | P | black | — | — | long hem to mid-thigh, notch lapels |
| shirt | **oxford** | long | P | — | — | — | button-down point collar, placket, cuffs |
| shirt | **polo** | short | P | — | — | — | ribbed collar, 2–3 button stand, banded sleeve |
| shirt | **tee** | short | P | — | — | — | ribbed crew neck |
| shirt | dress shirt | long | P | — | — | — | spread collar, hidden placket, French cuffs |
| shirt | flannel | long | P (defaults to check when a second colour is set) | — | — | — | two flap chest pockets |
| shirt | henley | long | P | — | — | — | collarless with a 3-button placket |
| shirt | camp collar | short | P | — | — | — | open flat collar, straight hem |
| undershirt | **crew** | short | — | — | — | — | crew rib, as today |
| undershirt | **v-neck** | short | — | — | — | — | V rib, as today |
| belt | **belt** | — | — | brass | — | frame | leather strap, buckle with prong |
| belt | braided | — | — | brass | — | frame | woven texture strap |
| pants | **pants** | — | P | — | full | — | waistband, fly line (generic) |
| pants | **shorts** | — | P | — | short | — | hem cuff |
| pants | **skirt** | — | P | — | knee | — | A-line, as today but tapered |
| pants | chinos | — | P | — | full | — | slanted side pockets |
| pants | jeans | — | — | brass | full | — | contrast stitching, rivets, coin pocket |
| pants | trousers | — | P | — | full | — | front crease, cuffed hem when cropped |
| pants | joggers | — | — | — | full | — | elastic cuffed ankle, drawcord |
| shoes | **boots** | — | — | — | — | — | taller shaft, heel |
| shoes | **sneakers** | — | — | — | — | — | white midsole, laces |
| shoes | **loafers** | — | — | — | — | — | low vamp, penny strap |
| shoes | derby | — | — | — | — | — | laces on a closed vamp, low heel, welt |
| shoes | chelsea boot | — | — | — | — | — | elastic side panel, pull tab |
| shoes | lace-up boot | — | — | — | — | — | eyelets and speed hooks, lugged sole |
| shoes | sandal | — | — | — | — | — | two straps, visible feet |
| basics | **socks** | — | — | — | — | — | icon only |
| basics | **underwear** | — | — | — | — | — | icon only (generic) |
| basics | boxers / briefs / boxer-briefs / trunks | — | — | — | — | — | icon only |
| other | glasses | — | — | — | — | — | round frames in the item colour (cartoon only) |
| other | sunglasses | — | — | — | — | — | dark lenses, frames in the item colour (cartoon only) |
| other | watch | — | — | silver | — | — | face and strap at the left wrist |
| other | hat | — | — | — | — | — | cap with brim (cartoon only) |
| other | tie | — | P | — | — | — | knot and blade over the placket |
| other | scarf | — | P | — | — | — | wrap at the neck, one tail |
| other | **other** | — | — | — | — | — | not drawn |

`SKETCH_DEFAULTS` in `sketch.ts` is unchanged for slots. It gains `acc: { style: "glasses", color: black }`.

### `guessKind` updates (`productParse.ts`)

Add, ahead of the existing generic rules:
- `jeans?` → jeans
- `chinos?` → chinos
- `trousers?|slacks` → trousers
- `joggers?|sweatpants` → joggers
- `hoodie|hooded` → hoodie
- `sweatshirt|crew ?neck` → crewneck
- `quarter[- ]zip|1/4 zip` → quarter-zip
- `bomber` → bomber
- `overcoat|topcoat|peacoat` → overcoat
- `chore` → chore coat
- `henley` → henley
- `flannel` (shirt) → flannel
- `camp collar|cuban` → camp collar
- `dress shirt` → dress shirt
- `chelsea` → chelsea boot
- `derby|oxford shoe|brogue` → derby
- `sandal|slide` → sandal
- `glasses|frames|eyewear` → glasses
- `sunglasses` → sunglasses
- `watch` → watch
- `\bhat|cap|beanie` → hat
- `\btie\b` → tie
- `scarf` → scarf
- `boxers` → boxers
- `boxer[- ]briefs` → boxer-briefs
- `briefs` → briefs
- `trunks` → trunks

Wallets stay `other`.
