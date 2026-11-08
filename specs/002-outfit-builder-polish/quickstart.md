# Quickstart: validating Outfit Builder Polish & Sketch-a-Piece

## Prerequisites

```sh
npm install
npm test && npm run typecheck     # must be green before and after
npm run dev                       # http://localhost:5173
```

Load the sample wardrobe (Wardrobe tab → "Load sample wardrobe") unless a step says to start empty.

## Automated

| Command | Proves |
|---|---|
| `npm test` | sketches excluded from `wardrobeTotals` and `generateRotation` (including belt matching); `itemStatus` and `promote`; history push/undo/redo/cap/reset; sketch naming and uniqueness; nearest palette colour; dominant colour and point sampling on synthetic pixels; shuffle changes something whenever possible; picker order (owned → to buy → sketch); token contrast and staleness |
| `npm run typecheck` | New props wired through both hosts |
| `npm run build && npm run audit` | Lighthouse accessibility = 100 on Outfits and Rotation (with panel open), light and dark, desktop and mobile (SC-005) |

## Manual scenarios

1. **Sketch with defaults (US1, SC-001)**: Outfits → open "Top layer" → "Create a piece…" → "Add to look". Expect: the figure showed a navy blazer before you confirmed, the slot now reads "Navy blazer" with a Sketch tag, focus is back on the Top layer picker, and it took 3 actions.
2. **Sketch with choices**: Pants → Create → tile "shorts" → swatch "olive" → stripe on → Add. Expect the figure to update on each choice and the name to be "Olive shorts" (or "Olive shorts 2" if one exists).
3. **Cancel restores**: Open the creator on Shirt, change colour, press Escape. Expect the figure back to its previous shirt and no new item on the Wardrobe tab.
4. **Inside Rotation (US1-8)**: Rotation → select a day → in the panel, Shoes → Create → Add. Expect the day to be marked edited. "Discard changes" restores the day, and the sketch is still listed in the Wardrobe tab's Sketches group.
5. **Status everywhere (FR-008, FR-027)**: The new sketch shows as Sketch in the slot menu (after owned and to-buy items), in Try every, in a saved lookbook card, and in the Wardrobe table and cards, under the **Sketches** group. Give it a price of $500 and confirm the three Stats and category totals don't change.
5a. **Promote (FR-029)**: On the Sketches row choose "I own this". The item moves to its category with Owned ticked, and the Stats now include its price. Repeat with "Move to To buy" on another sketch, and "Left to buy" goes up.
5b. **Generator skips sketches (FR-028)**: Create a sketch in every slot and a sketch belt, then Rotation → Generate rotation. No day uses a sketch. A sketch placed on a day by hand survives until that day is regenerated.
6. **Preview on highlight (FR-012)**: Open Shirt and arrow down through the options. The figure follows. Press Escape and the figure returns to the committed shirt.
7. **Undo (US2-1, SC-003)**: Shuffle three times, then press Ctrl+Z three times. Expect the original look back. Ctrl+Shift+Z redoes. Undo after a sketch insert clears the slot, and the item stays in the wardrobe.
8. **Shuffle with keeps (FR-015)**: Keep every slot but one, then shuffle repeatedly. The free slot changes every time while it has more than one option. Keep all slots → "Nothing left to shuffle".
9. **Empty wardrobe**: Wardrobe → "Start empty" → Outfits. Every slot shows "No … in your wardrobe yet" with Create a piece. Build a full five-slot look from sketches alone.
10. **Photo (US4)**: Create → "From a photo" → pick a JPEG of a garment. Expect the main colour suggested, and a tap on the garment to set its colour. After Add, the Wardrobe card shows the photo. In DevTools Network, no request is sent with the image. Pick a `.txt` file → plain message, creator unchanged.
11. **Storage (SC-008)**: Add 20 photo sketches, save, and check that `data/wardrobe.json` (or the `localStorage` entry) is under 3 MB.
12. **Keyboard only (FR-016)**: Tab through slots, Keep, Shuffle, Undo, Redo, Try every and the creator (tiles and palette with arrow keys). Focus is always visible, and screen-reader names match the contract.
13. **Phone width (FR-017)**: DevTools at 360×740. No sideways page scroll. The figure stays in view while you change slots. The creator's tiles and swatches are ≥ 44 px. Inside the Rotation bottom sheet, the creator fits.
14. **Reduced motion (FR-019)**: Turn on "prefers-reduced-motion: reduce" in emulation. Changes appear instantly with no cross-fade or pulse.
15. **Themes (US3-5)**: Repeat 1 and 6 in Light and Dark. Garment colours look identical in both themes, and only the interface chrome changes.
16. **One accent**: While the creator is open, "Add to look" is the only oxblood button on screen.
