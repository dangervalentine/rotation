# Rotation — design system

The visual language of Wardrobe Rotation. This folder is the source of truth; the app consumes it from `src/design-system/`.

## In this repo

| Path | What |
|---|---|
| `design-system/tokens.json` | **All tokens** — colours (two themes), type, spacing, radius, shadow, rules. Edit here. |
| `design-system/components/*.md` | Usage guidelines, one file per component. |
| `scripts/build-tokens.mjs` | Compiles `tokens.json` → `src/design-system/tokens.css`. Run `npm run tokens`. |
| `src/design-system/tokens.css` | Generated CSS custom properties (`--paper`, `--space-4`, …) and `.type-*` classes. Never edit by hand. |
| `src/design-system/components.css` | Component styles. Uses tokens only. |
| `src/design-system/components.tsx` | React components. |
| `src/design-system/index.ts` | Entry point: imports both stylesheets and re-exports the components. |

```tsx
import { Button, Masthead, Tabs } from "./design-system/index.ts";
```

Rules for changing it:

- **New value?** Add a token to `tokens.json` with a `usage` note, run `npm run tokens`, then use `var(--name)`. App CSS (`src/styles.css`) and components never hard-code colours, spacing or radii.
- `npm test` fails if `tokens.css` is stale, if two tokens share a name, or if any text pair promised below drops under 4.5:1 in either theme.
- **Themes:** Newsprint (light) is the default. Evening (dark) follows the OS setting on screen; set `data-theme="light"` or `"dark"` on `<html>` to force one. Print always uses Newsprint.
- **Fonts** load from Google Fonts in `index.html`. Keep that link in step with `type.families` in `tokens.json`.
- A browsable copy of this system (cover, token tables, live component previews) lives as a claude.ai Design System artifact. The repo wins if they disagree.

## Components

| Component | Use |
|---|---|
| [`Masthead`](components/Masthead.md) | App title, issue meta, dek, nav. Once per screen. |
| [`Tabs`](components/Tabs.md) | Top-level view navigation. |
| [`SectionHead`](components/SectionHead.md) | Kicker + Bodoni title over a heavy rule, with an aside for controls. |
| [`Button`](components/Button.md) | Primary (one per view), secondary, ghost, danger. |
| [`Kicker`](components/Kicker.md) | Small tracked uppercase label above a title. |
| [`Tag`](components/Tag.md) | Owned, to buy, rotation flags, kept. |
| [`Swatch`](components/Swatch.md) | A garment's own colour, as a disc. |
| [`Stat`](components/Stat.md) | Headline figure with label. |
| [`GarmentCard`](components/GarmentCard.md) | One item as a catalogue plate. |
| [`LookCard`](components/LookCard.md) | A saved outfit, lookbook style. |
| [`RotationDay`](components/RotationDay.md) | One day cell in the rotation grid. |
| [`Field`, `TextArea`](components/Field.md) | Underlined inputs with a kicker label. |
| [`Select`](components/Select.md) | Dropdown styled as a Field, with optional swatches. |
| [`Check`](components/Check.md) | Square checkbox with a label. |
| [`Segmented`](components/Segmented.md) | Pick one of a few (Table / Cards, Try every…). |
| [`Notice`](components/Notice.md) | One-line status or warning under an action. |
| [`SaveBar`](components/SaveBar.md) | Sticky unsaved-changes bar. |

---

Rotation is a wardrobe planner set like a menswear magazine: ink on newsprint, a Didone masthead, tracked uppercase kickers, hairline rules, and one oxblood accent. The clothes provide the colour; the interface stays in black, paper and type.

## Principles

1. **The garments are the pictures.** Item colours (`color`, `stripe` in the data) are the only saturated colour on screen. Never tint, theme or replace them with tokens.
2. **Rules, not boxes.** Separate with hairlines (`rule`) and heavy rules (`rule-strong`), and with paper tone (`paper`, `paper-raised`, `paper-sunk`). No drop shadows except `shadow-float` on the save bar.
3. **Square corners.** `radius-none` everywhere. `radius-xs` for tags only; `radius-full` for swatches only.
4. **One accent.** `oxblood` marks the primary action, the active tab, the selected look and focus. If two things on a screen are oxblood, one of them is wrong.
5. **Type does the hierarchy.** Kicker → Bodoni title → italic dek → body. Not colour, not weight alone.

## Voice

Write like a good style editor: confident, specific, brief. Second person, present tense, no exclamation marks, no emoji.

- Name things the way a shop credits them: colour, cut, type — "Charcoal flannel trousers", "Pink striped oxford".
- Say the rule, not the alarm: "Same pants as Tue", not "Warning: conflict detected".
- Buttons are verbs in sentence case: "Generate rotation", "Save look", "Add from link", "Try every shirt".
- Deks are one sentence, italic, ending in a period: *"Pants repeat every five workdays, never two days running."*
- Empty states are an invitation, not a status: "No looks yet. Shuffle a few pieces and save the one you'd wear."
- Numbers in figures; money with a sign and separators ("$2,749"); no cents above $100.

## Colour

Two themes: **Newsprint** (light, default) and **Evening** (dark). Every text pair below holds 4.5:1 or better in both.

| Role | Token | On |
|---|---|---|
| Page | `paper` | — |
| Cards, save bar, menus | `paper-raised` | — |
| Wells, empty slots, selected day | `paper-sunk` | — |
| Text | `ink` | any paper |
| Secondary text, captions, specs | `ink-muted` | any paper |
| Primary action, active, focus | `oxblood` · label `on-oxblood` | any paper, `oxblood-soft` |
| Owned, saved | `loden` | paper, `loden-soft` |
| To buy, repeat flags | `tobacco` | paper, `camel-soft` |
| Editorial blocks only | `camel` (text: `on-camel`), `navy` (text: `on-navy`) | — |

- `rule` is decorative (about 1.5:1). Any edge that defines a control — input underline, button outline — uses `rule-strong`.
- Status always comes with a word: "Owned", "To buy", "Same pants as Mon". Loden and tobacco also differ in lightness, so they never rely on hue.
- Focus: `focus` (an alias of `oxblood`), 2px solid ring, 2px offset, on every interactive element.

## Typography

Three families, all on Google Fonts:

- **Bodoni Moda** (`display`) — masthead, headlines, titles, look numbers, stat figures, garment names, field values, deks in italic. Use its optical size axis: high contrast at display sizes.
- **Hanken Grotesk** (`sans`) — interface: kickers, buttons, tabs, body, captions.
- **IBM Plex Mono** (`mono`) — specs: prices, quantities, colour codes, week numbers, issue meta. Think photo credits.

| Style | Size / leading | Use |
|---|---|---|
| `masthead` | 88 / 0.9, Bodoni 500 | App title, once per screen |
| `headline` | 48 / 1.0 | View titles |
| `title` | 28 / 1.1 | Look names, panel titles |
| `dek` | 20 / 1.4 italic | Standfirst under a headline |
| `numeral` | 44 / 1.0 | Stats, "No. 04" |
| `kicker` | 11 / 16, 600, +0.16em, uppercase | Category, day, section labels |
| `body` | 15 / 24 | Running text, rows |
| `label` | 13 / 20, 500 | Buttons, tabs |
| `caption` | 12 / 18 | Hints, secondary lines |
| `spec` | 12 / 18 mono | Prices, codes, counts |

Never set body copy in Bodoni below 14px; its hairlines break up. Never set a kicker in sentence case.

## Layout and spacing

- Spacing steps `space-1` (4) through `space-8` (72). Cards pad `space-4`, or `space-5` on wide screens; panels sit `space-6` apart; sections break at `space-7`.
- A 12-column grid, max width 1180px, gutters `space-5` (`space-4` on phones).
- Text measure: deks and body at most 60ch.
- The masthead closes with a double rule (`rule-double`); every view below it opens with a kicker and a `headline`.
- Rotation grid: one row per week, a kicker ("Week 01") at the start of each, days as `RotationDay` cells.

## Imagery

- Garments appear as their colour fields (the `GarmentCard` plate, `Swatch`, the `LookCard` strip). Product photos, when present, are cut-outs or flat-lays on a plain ground, cropped 4:5.
- No lifestyle stock, no models, no gradients. Stripes are drawn as fine vertical bands from the item's `stripe`.
- The Print view keeps the cartoon figures; frame each week with the masthead and a hairline, not a box.

## Iconography

No icon set. Labels are words, set as kickers or buttons. The one glyph is the "!" on a flag tag, set in Bodoni. If an icon is ever unavoidable (close, menu), use a 1.5px stroke, square caps, in `ink`, at 16px — and keep a text label for screen readers.

There is no logo: the wordmark is the word "Rotation" (or the wardrobe's own title) set in `masthead`.

## Motion

Minimal and print-like: colour and background swaps at 150ms ease; no slides, bounces or parallax. Respect `prefers-reduced-motion` by removing transitions entirely.

