# Data Model: Page Flow & Design Refinement

The persisted data (`WardrobeData` in `src/lib/types.ts`, stored in `data/wardrobe.json` or `localStorage`) is **unchanged**. This feature only adds UI and route state, which is never saved to the wardrobe file.

## Route (URL hash)

| Field | Type | Rules |
|---|---|---|
| `view` | `"wardrobe" \| "outfits" \| "rotation" \| "print"` | An unknown or empty value resolves to `"wardrobe"`. |
| `day` | `number \| null` | Only meaningful when `view === "rotation"`. It is an integer `0 ≤ day < rotation.looks.length`. Out of range, or not a number, resolves to `null` (panel closed). |

Hash grammar: `#<view>` or `#rotation/day/<n>`. See [contracts/ui-contract.md](contracts/ui-contract.md).

## Day editing session (Rotation view state)

| Field | Type | Notes |
|---|---|---|
| `open` | derived: `route.day !== null` | The panel is visible. |
| `index` | `number` | The look index being edited (`route.day`). |
| `draft` | `Look` | Working copy, cloned from `rotation.looks[index]` on open or switch. |
| `dirty` | derived: `!same(draft, rotation.looks[index])` | Drives the "Edited, not applied" marker and the confirm prompt. |
| `pending` | `null \| { kind: "close" } \| { kind: "go", index } \| { kind: "generate" }` | The action held back while the confirm dialog is shown. |
| `returnFocusRef` | element ref | The day button that opened the panel. It receives focus on close. |

### State transitions

```text
closed ──select day i──────────────────────────────▶ open(i, clean)
open(i, clean) ──select day j / prev / next────────▶ open(j, clean)        [replaceState]
open(i, clean) ──Esc / close / Back / backdrop*────▶ closed                [focus → day i]
open(i, clean) ──edit piece────────────────────────▶ open(i, dirty)
open(i, dirty) ──Apply─────────────────────────────▶ open(i, clean)        [looks[i] = draft]
open(i, dirty) ──Discard───────────────────────────▶ open(i, clean)        [draft = looks[i]]
open(i, dirty) ──close / switch / Generate─────────▶ confirm(pending)
confirm ──Apply──────▶ apply, then perform pending
confirm ──Discard────▶ discard, then perform pending
confirm ──Cancel/Esc─▶ open(i, dirty)                                      [focus → panel]
open(i, *) ──rotation reshaped so i ≥ looks.length──▶ closed               [route → #rotation]
```

`*` The backdrop exists only on the narrow-screen bottom sheet.

**Back with a dirty draft**: The `popstate` event has already changed the URL when it arrives. The view pushes `#rotation/day/i` back and opens the confirm dialog with `pending = close`, so Back can never silently drop changes (FR-011).

## Audit report

Files under `specs/001-page-flow-refinement/lighthouse/`:

| Field | Notes |
|---|---|
| `phase` | `before` or `after` |
| `url` | One of the five audited routes |
| `theme` | `light` or `dark` |
| `formFactor` | `desktop` or `mobile` |
| `scores` | `accessibility`, `best-practices` (targets); `performance`, `seo` (recorded only) |
| `failures[]` | Audit id, title, and the affected nodes for each failing audit |
| `exceptions[]` | A failing audit that is accepted, with its reason (FR-024) |
