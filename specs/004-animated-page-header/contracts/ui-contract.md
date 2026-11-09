# UI Contract: Animated Shared Page Header

**Feature**: 004-animated-page-header

## Design system (`src/design-system/components.tsx`)

### `StepHead`

```ts
StepHead(props: {
  number: 1 | 2 | 3 | 4;   // step numeral, shown as 01–04 in the step-colour block
  title: string;           // the h1: the step's name
  dek: string;             // italic subtitle
  dir: "forward" | "back"; // direction of the latest change; picks the roll keyframes
  className?: string;      // App passes "no-print" on the Print step
  children: ReactNode;     // the page content; rendered after the header, inside the aside-slot context
})
```

- Renders a `header.rt-shead.rt-shead-page`, with the same layout and sizes as today's `SectionHead level={1}`:
  - the numeral block (`aria-hidden`);
  - a single `h1.rt-shead-title.rt-shead-title-lg`;
  - `p.rt-shead-dek`;
  - an aside slot `div.rt-shead-aside`, which is always in the DOM, is empty unless a `StepAside` fills it, and has `view-transition-name: step-aside`.
- The numeral, title and subtitle each go through `RollText`. The leaving text is `aria-hidden`.
- Provides the aside slot's node through context for `StepAside`.
- The block background, the heavy rule and the text colours take `--step`, `--on-step` and `--step-ink` from the nearest `rt-step-N`, and transition over `--motion-step-duration`.

### `StepAside`

```ts
StepAside(props: { children: ReactNode })
```

- Portals `children` into the aside slot of the nearest `StepHead`. With no `StepHead` above it, it renders nothing.
- A view renders it once, wherever it likes in its tree. Its state and handlers stay in the view.

### `RollText`

```ts
RollText(props: { value: string; dir: "forward" | "back"; className?: string })
```

- Stacks the leaving and arriving layers in one grid cell (`.rt-roll`), so it takes the size of the larger one.
- Forward: the leaving layer moves up and out, and the arriving layer comes in from below. Back is the reverse.
- On first render it shows the value without animating.
- Under reduced motion it swaps at once and keeps no leaving layer.

### `SectionHead`

`level={1}` and `number` are no longer used by the app. Both stay supported for compatibility, but the docs point to `StepHead`.

## Tokens (`design-system/tokens.json` → `src/design-system/tokens.css`)

| Token | Value | Usage |
|---|---|---|
| `motion-step-duration` | `320ms` | Every part of a step change: the numeral, title and subtitle rolls, the colour blend, and the content and aside slide. Removed under `prefers-reduced-motion`. |
| `motion-step-ease` | `cubic-bezier(.2, .7, .2, 1)` | Easing for the step change. |

## App (`src/App.tsx`)

- Renders `<StepHead {...STEP_HEADS[view]} dir={…} className={view === "print" ? "no-print" : undefined}><div className="step-page">{active view}</div></StepHead>` inside `<main>`. `StepHead` places the content after its `header`, inside the context `StepAside` reads.
- Every route change goes through one `applyRoute(next)`, after the open-day guard:
  - If `stepChange(prev.view, next.view)` is `null`, it calls `setRoute(next)` exactly as today.
  - Otherwise it records `dir`. Under reduced motion, or with no `document.startViewTransition`, it scrolls to the top and sets the route at once.
  - Otherwise it sets `data-step-dir` on `<html>` and runs `startViewTransition(() => flushSync(() => { scrollTo(0, 0); setRoute(next); }))`. When the transition finishes, it removes `data-step-dir`, but only if no newer transition has set it since.
- `LABELS` (the tab labels) and `STEP_HEADS` titles come from the same source.

## Views

| View | Before | After |
|---|---|---|
| `WardrobeView` (list) | `<PageHead view="wardrobe" aside={…} />` | `<StepAside>{Segmented + Add an item}</StepAside>` |
| `WardrobeView` (item detail) | `<PageHead view="wardrobe" />` | nothing; the head is shared |
| `OutfitsView` | `<PageHead view="outfits" aside={base ? lede : null} />` | `{base ? <StepAside>{lede}</StepAside> : null}` |
| `RotationView` | `<PageHead view="rotation" />` | removed |
| `PrintView` | `<PageHead view="print" aside={Print button} />` inside `section.no-print` | `<StepAside>{Print button}</StepAside>`; head hidden in print through `no-print` on `StepHead` |

`PageHead` and `DEKS` are removed from `common.tsx` and replaced by `STEP_HEADS`.

## CSS (`src/design-system/components.css`)

- `.rt-roll`: a grid stack. `.rt-roll-in` and `.rt-roll-out` use the keyframes `rt-roll-in-up`, `rt-roll-out-up`, `rt-roll-in-down` and `rt-roll-out-down`. Inside `.rt-shead-num` the travel is the block's full height, and the block clips it. For the title and subtitle the travel is `.35em`, with a fade.
- A colour transition on `.rt-shead-num` (`background-color`, `color`), on `.rt-shead` (`border-bottom-color`) and on the active `.rt-tab[data-step]` underline.
- View-transition rules:
  - `::view-transition-old(root)` gets `display: none`, and `::view-transition-new(root)` gets `animation: none`.
  - `step-page` and `step-aside` slide `24px` along the inline axis and fade, using `:root[data-step-dir=forward|back]`.
  - The `step-page` and `step-aside` groups don't animate (`animation: none`). Only the old and new images move: the old one is faded by 60% of the change and the new one starts showing at 35%, using the `motion-step` tokens.
- `html { scrollbar-gutter: stable }` keeps every step the same width whether or not it scrolls, so the head never shifts sideways.
- On phones the page title is `min(56px, 11.5vw)`, so the longest name ("Wardrobe") fits beside the numeral at 360 px.

## Guarantees

1. There is exactly one `h1` in the document at every moment, and its accessible name is the current step's name.
2. A settled step page looks the same as before this feature, except that the title is the step's name instead of "Rotation".
3. A move the open-day guard holds back never starts a transition.
4. A move within a step (item detail, opening or closing a day) never rolls the head or slides the content.
5. A printout is the same as before this feature.
6. No new runtime dependencies.
