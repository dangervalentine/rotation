# UI Contract: Routes and Design-System Components

The app's external interfaces are its URLs and the public API of its design-system components (`src/design-system/index.ts`), which views consume.

## 1. Routes

| Hash | Shows | Notes |
|---|---|---|
| *(empty)*, unknown | Wardrobe & costs | Default view (FR-002) |
| `#wardrobe` | Wardrobe & costs | Step 01 |
| `#outfits` | Outfits | Step 02 |
| `#rotation` | Rotation, panel closed | Step 03 |
| `#rotation/day/<n>` | Rotation, panel open on look `n` | `n` is 0-based. If it is out of range, the app falls back to `#rotation` (with `replaceState`). |
| `#print` | Print | Step 04 |

History rules: Opening the panel adds an entry (`pushState`). Switching days while the panel is open replaces the entry. Closing the panel through the UI calls `history.back()` if the panel was opened in this session; otherwise it uses `replaceState('#rotation')`.

`src/lib/route.ts` (new, pure, unit-tested):

```ts
type ViewId = "wardrobe" | "outfits" | "rotation" | "print";
interface Route { view: ViewId; day: number | null }
parseHash(hash: string, lookCount: number): Route
formatHash(route: Route): string
```

## 2. New component: `Sheet`

The day editing surface. It is a Radix Dialog underneath, styled by the Rotation design system. Guidelines go in `design-system/components/Sheet.md`.

| Prop | Type | Behaviour |
|---|---|---|
| `open` | `boolean` | Controlled |
| `onOpenChange` | `(open: boolean) => void` | Fires `false` on Escape, the close button, or the backdrop (bottom sheet only). The consumer decides whether to confirm first. |
| `title` | `ReactNode` | The accessible name, rendered as the heading (for example "Monday · Week 01") |
| `kicker` | `ReactNode?` | Small label above the title (for example "Editing") |
| `description` | `ReactNode?` | Linked through `aria-describedby` |
| `footer` | `ReactNode?` | Sticky action row (Apply, Discard, …) |
| `children` | `ReactNode` | The body (the outfit builder) |
| `returnFocusRef` | `RefObject<HTMLElement>?` | Receives focus on close |

Responsive behaviour (`matchMedia('(min-width: 1024px)')`):

- **≥ 1024 px**: `modal={false}`, docked on the right, 420 px wide (a token), full viewport height below the sticky top, hairline left rule, `paper-raised`, no backdrop. Pointer and focus outside do **not** close it. F6 moves focus between the panel and the day grid.
- **< 1024 px**: `modal`, a bottom sheet up to 85 vh, top hairline rule, a backdrop using a new `scrim` token, focus trapped, scroll locked.
- **Both**: Escape closes, focus moves to the title on open, and the slide animation is removed under `prefers-reduced-motion`.

**As built:** While the docked sheet is open, `Sheet` sets `html[data-sheet="side"]`, which gives `body` a `padding-right` of `sheet-width` (set in a layout effect, with no transition, so a page loaded straight onto `#rotation/day/n` does not shift). The calendar (`.days`) uses container queries instead of viewport media queries, so it reflows to 3, 2 or 1 columns in whatever width is left. No day ever sits under the panel at any width ≥ 1024 px, so the planned overlay range (1024–1279 px) was not needed. The save bar stays left of the panel.

## 3. New component: `ConfirmDialog`

A Radix AlertDialog.

| Prop | Type |
|---|---|
| `open`, `onOpenChange` | controlled |
| `title` | `ReactNode`, for example "Unapplied changes to Monday" |
| `description` | `ReactNode` |
| `actions` | `{ label, variant, onSelect }[]`: in order **Apply**, **Discard**, **Keep editing** (cancel) |

## 4. Changed components (same props unless noted)

| Component | Change |
|---|---|
| `Check` | Built on `@radix-ui/react-checkbox`. Props: `label`, `checked`, `onCheckedChange(checked: boolean)`, `disabled`, `className`. **Breaking**: call sites move from `onChange(e)` to `onCheckedChange`. |
| `Segmented` | Built on `@radix-ui/react-toggle-group` (`type="single"`). The API is unchanged. It ignores deselection, because one option is always selected. Arrow keys move between options. |
| `Masthead` | The dek uses `ink`, `opsz` 14, weight 450, and 18 px on phones (R5). The API is unchanged. |
| `RotationDay` | Adds `aria-haspopup="dialog"` and `aria-expanded` (selected and panel open). Exposes a `ref` (forwardRef) for return focus. |
| `Tabs` | No API change. Visible focus ring audit only. |
| `Select` | No change. |

## 5. Tokens (`design-system/tokens.json`)

New tokens, each with a `usage` note: `sheet-width` (420px), `scrim` (light: `rgba(20,19,18,.32)`, dark: `rgba(0,0,0,.5)`), and `motion-sheet` (220ms, `cubic-bezier(.2,.8,.2,1)`) unless an equivalent motion token already exists. New contrast assertions in `tokens.test.ts`: `ink` on `paper` and on `paper-raised` ≥ 7:1 in both themes (the dek).
