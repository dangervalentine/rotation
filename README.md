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
On the Wardrobe tab, **Export / Import JSON** moves data between modes and devices. Files in the original single-file format import too.
`npm run preview` serves the built site, so you can try the published (browser) mode locally.

## Views

- **Rotation**: any days per week (comma-separated names) and 1–8 weeks. It flags same pants, shirt or leather shoes on back-to-back days. **Generate rotation** fills every day, spreading wear evenly and avoiding those repeats.
- **Outfits**: a mix-and-match workspace. Shuffle the pieces you didn't mark "keep", or use "Try every" to see one slot swapped through every item. Save looks to a library, then wear them on any rotation day.
- **Wardrobe and costs**: items, costs, owned vs. to buy, and how many days each item is worn. **Add from link** fills in an item from a product URL.
- **Print**: the rotation as cartoon figures, one landscape page per week. You can set skin tone, hair color and hair style.

## Add from link

- Local mode: the dev server fetches the page and reads JSON-LD `Product` data, then OpenGraph/meta tags, then `<title>`. It also guesses category, style and color from the words (`src/lib/productParse.ts`).
- Published mode: browsers can't read other sites (CORS), so it guesses from the URL text alone. Pages that block bots (e.g. some return 403) fall back to the same guess.
- Next step for published mode: a tiny serverless proxy that calls `parseProductHtml`.

## Data shape

See `src/lib/types.ts`. `items[]`, `outfits[]` (named looks), `rotation { days, weeks, looks[] }`, `figure` (print character).
A look is `{ layer, shirt, belt, pants, shoes }`, each an item id or null.

## Scripts

`npm test` (Vitest: model rules, generator, URL parsing) · `npm run typecheck` · `npm run build`
