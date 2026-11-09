# Data Model: Animated Shared Page Header

**Feature**: 004-animated-page-header

Nothing stored changes. `WardrobeData`, the storage backends and the hash routes stay exactly as they are. What follows is UI state and static data only.

## Step (static)

Each step is identified by a `ViewId` from `src/lib/route.ts`. Its head content comes from one static table, `STEP_HEADS: Record<ViewId, StepHeadContent>`, kept with the other view data in `src/components/common.tsx`. It replaces `DEKS`.

| View | `number` | `title` | `dek` |
|---|---|---|---|
| `wardrobe` | 1 | Wardrobe | Everything you own or mean to buy. |
| `outfits` | 2 | Outfits | Put pieces together into looks, and keep the ones you like. |
| `rotation` | 3 | Rotation | Plan what to wear each day, for as many days and weeks as you like. |
| `print` | 4 | Print | Your plan on paper, to pin up by the closet. |

- `number` is `VIEW_ORDER.indexOf(view) + 1`, shown padded as `01`–`04`.
- `title` matches the tab label (`LABELS` in `App.tsx`). Both read from the same source, so they can't drift apart.
- The step colour comes from the `rt-step-{number}` class on `.wrap`, using the existing `--step-N` tokens. It isn't duplicated here.

## Step change (derived, transient)

`stepChange(prev: ViewId, next: ViewId): StepDir | null`, where `StepDir = "forward" | "back"`.

| prev → next | Result |
|---|---|
| same view (includes item detail ↔ list, day open/close) | `null`: no step animation |
| later in `VIEW_ORDER` (any distance) | `"forward"` |
| earlier in `VIEW_ORDER` (any distance) | `"back"` |

## Route application state (in `App`)

How a route change moves through these states:

```
idle ──(nav event)──▶ guard check
   guard blocks ───────────────────────▶ idle (history restored; no animation)  [existing]
   guard passes, stepChange = null ────▶ setRoute(next)                          [existing]
   guard passes, stepChange = dir:
        reduced motion or no API ──────▶ scrollTo(0,0); setRoute(next)
        otherwise ─────────────────────▶ <html data-step-dir=dir>
                                          startViewTransition(flushSync(scrollTo(0,0); setRoute(next)))
                                          on finished (if still the latest) ─▶ remove data-step-dir
```

**Invariant**: the rendered route always equals `parseHash(location.hash)` once a transition has settled (SC-004).

## RollText layers (component state)

| Field | Meaning |
|---|---|
| `layers: { key: number; value: ReactNode; role: "in" \| "out" }[]` | At most two layers in normal use: the arriving one (`in`) and the leaving one (`out`, `aria-hidden`). |
| `dir: StepDir` | The direction of the latest change. It sets which keyframes play. |

The rules for changing layers:
- **On a value change**: every current layer becomes `out` and the new value is added as `in`. Any `out` layers beyond the most recent one are dropped, so there are never more than two.
- **When the `in` layer's `animationend` fires**, or straight away under reduced motion: all `out` layers are dropped.
- **On first render**: only an `in` layer is rendered, with no animation class, so the first load doesn't animate.
