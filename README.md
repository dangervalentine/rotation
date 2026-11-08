# Wardrobe Rotation

Track your clothes, mix and match them into outfits, plan a rotation, and print it as a cartoon.

Started from the single-file "Workweek Wardrobe" page (kept in `reference/` for comparison).

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
```

## Two ways it saves

| | How you run it | Where data lives |
|---|---|---|
| **Local** | `npm run dev` | `data/wardrobe.json`, through a small dev-server API (`server/devApi.ts`) |
| **Published** | `npm run build`, then host `dist/` anywhere static | This browser's `localStorage`, seeded from the bundled `data/wardrobe.json` |

Both modes have the same save bar. Unsaved edits are kept as a draft in the browser until you save or discard them.
If the saved wardrobe changes underneath a draft (you edit `data/wardrobe.json` by hand, a script updates it, or another tab saves), the app notices: on load, when you come back to the tab, as soon as the file changes in local mode, and again right before saving. With no unsaved edits it just loads the newer version; with unsaved edits it asks whether to keep them or load the newer version, so nothing is overwritten silently.

The masthead has an **Auto / Light / Dark** theme switch. Auto follows the OS; the choice is remembered in this browser. Print is always light.
On the Wardrobe tab, **Export / Import JSON** moves data between modes and devices. Files in the original single-file format import too.
`npm run preview` serves the built site, so you can try the published (browser) mode locally.

## Design system

The app is styled by **Rotation**, an editorial menswear design system: ink on newsprint, Playfair Display headlines, tracked uppercase labels, hairline rules, an oxblood accent for actions and a colour for each step (navy, camel, oxblood, ink), with light and dark themes. Tokens live in `design-system/tokens.json`; components and styles in `src/design-system/`. See [`design-system/README.md`](design-system/README.md) for the rules, and run `npm run tokens` after editing tokens.

## Views

The views run in the order you use them, and the app opens on the first one.

1. **Wardrobe and costs**: items, costs, owned vs. to buy, and how many days each item is worn. **Add from link** fills in an item from a product URL.
2. **Outfits**: a mix-and-match workspace. Shuffle the pieces you didn't mark "keep", or use "Try every" to see one slot swapped through every item. Save looks to a library, then wear them on any rotation day.
3. **Rotation**: any days per week (comma-separated names) and 1–8 weeks. It flags same pants, shirt or leather shoes on back-to-back days. **Generate rotation** fills every day, spreading wear evenly and avoiding those repeats. Select a day to edit it in a side panel (a bottom sheet on phones) while the rest of the rotation stays in view. Each open day has its own address (`#rotation/day/3`), and Back closes the panel.
4. **Print**: the rotation as cartoon figures on an editorial sheet, one landscape page per week. You can set skin tone, hair color and hair style.

## Add from link

- Local mode: the dev server fetches the page and reads JSON-LD `Product` data, then OpenGraph/meta tags, then `<title>`. It also guesses category, style and color from the words (`src/lib/productParse.ts`).
- Published mode: browsers can't read other sites (CORS), so it guesses from the URL text alone. Pages that block bots (e.g. some return 403) fall back to the same guess.
- Next step for published mode: a tiny serverless proxy that calls `parseProductHtml`.

## Data shape

See `src/lib/types.ts`. `items[]`, `outfits[]` (named looks), `rotation { days, weeks, looks[] }`, `figure` (print character).
A look is `{ layer, shirt, belt, pants, shoes }`, each an item id or null.

## Scripts

`npm test` (Vitest: model rules, generator, URL parsing, routes, design tokens) · `npm run tokens` · `npm run typecheck` · `npm run build` · `npm run audit` (Lighthouse on the preview build; see `scripts/lighthouse.mjs`)
