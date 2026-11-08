# Quickstart: Validating Garment Art & Customization Polish

**Feature**: [spec.md](spec.md) · **Contracts**: [renderer](contracts/renderer-contract.md), [UI](contracts/ui-contract.md)

## Prerequisites

- Node 22.6 or later (type stripping, used by the gallery script), and `npm install` done.
- Edge or Chrome installed. `npm run audit` uses `CHROME_PATH`, or Edge by default.

## Automated checks

```sh
npm run typecheck
npm test            # includes test/figure.golden.test.ts, test/styles.test.ts, test/figure.test.ts
npm run build
npm run audit       # Lighthouse: accessibility must stay at 100
```

**Stage 1 gate**: on the stage-1 commit, `npm test` passes **without** updating `test/__snapshots__/figure.golden.test.ts.snap`. Stage 2 is where the snapshot is first updated, and that is deliberate.

## Gallery review (SC-001 to SC-003)

```sh
npm run gallery     # writes garment-gallery.html at the repo root (git-ignored)
```

Open the file and check:

1. **Distinct styles**: in every category row, cover the labels. Each tile can be named from its signature detail (contract style table). No two tiles in a row look the same.
2. **Edges**: the white-garment row is fully outlined on the white, paper and dark grounds.
3. **No floating shoes**: every plain-figure look with shorts, a skirt, or cropped, knee or short lengths shows legs down to the shoes.
4. **Line weight**: tile outlines and full-figure outlines look the same weight.
5. **Patterns**: each pattern reads as itself at 64 px. Breton runs horizontally. A patterned shirt under an open blazer lines up through the opening.
6. **Sleeves**: long, short and rolled read clearly on every shirt and layer. A short-sleeved layer over a long-sleeved shirt shows the shirt sleeve.
7. **Accessories**: glasses, sunglasses and hat sit correctly on every hair style. Glasses and sunglasses together draw only the sunglasses.

## Manual app checks (`npm run dev`)

| # | Steps | Expected |
|---|---|---|
| 1 | Load the sample wardrobe without changing anything. Visit Wardrobe, Outfits, Rotation and Print. | All items, outfits and days are present. The figures are only more polished. The striped oxfords still show stripes. (SC-004) |
| 2 | Outfits → a Shirt slot → Create a piece → oxford → Sleeve: Short → Pattern: Gingham, second colour white → Add to look. | Tiles and figure update live. The sketch shows short sleeves and gingham. Done in 2 choices beyond style and colour. (SC-005) |
| 3 | Sketch a belt with Hardware: Silver, Buckle: Plate. | The buckle is a silver plate. The pants show belt loops. |
| 4 | Sketch chinos, Length: Cropped. Check the plain and cartoon figures. | The hem is above the ankle, with legs showing on both figures. |
| 5 | Outfits → Accessories → Create a piece → glasses → Add to look. Then add a watch. | Glasses appear on the cartoon (Print), not on the plain figure. The watch appears on both. 2 actions for the glasses. (SC-007) |
| 6 | Undo twice, then redo. | The accessories come off and go back on. |
| 7 | Rotation → put a tie on Monday → Generate rotation. | Monday still has the tie. No other day gained accessories. |
| 8 | Wardrobe → add a socks-and-underwear item → Style: Boxer-briefs. | The table and card show the boxer-briefs icon in the item's colour. It isn't offered in any outfit slot. |
| 9 | Edit an oxford with gingham → change style to Belt → change back to Oxford before saving. | The gingham is hidden for the belt and restored for the oxford. Saving as a belt stores no pattern. |
| 10 | Export the wardrobe → Import the file. | The wardrobe is identical, including details and accessories. (SC-009) |
| 11 | Import `reference/workweek-wardrobe-original.html`'s data (original format). | It loads with no errors. |
| 12 | At 360 px width, open the sketch creator and the accessories row. | No sideways scroll. Targets are ≥ 44 px. |

## Performance spot check (SC-008)

In the Print view with 2 weeks × 5 days, switching hair style should redraw without any visible lag. In DevTools Performance, scripting for the redraw should be well under 50 ms.
