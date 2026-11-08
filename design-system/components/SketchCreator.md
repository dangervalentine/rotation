# SketchCreator (piece creator)

Sketch a piece the person doesn't own, in place inside the outfit builder (`src/components/SketchCreator.tsx`). It opens from a slot's "Create a piece…" option (or the empty-slot button) and takes the place of the builder's piece list, while the figure stays beside it (above it on phones) and previews the sketch live.

**Anatomy, in reading order**

1. Kicker "New piece · {slot}" (accent) and a display heading ("Sketch a pair of shoes"). The heading takes focus when the creator opens.
2. **Style**: `Tiles` with a garment silhouette per style, drawn by the figure renderer (`pieceSvg`) in the current colour.
3. **Colour**: `Tiles variant="swatch"` over the 12-colour menswear palette, plus a "Custom colour" input and an optional stripe.
4. **From a photo**: pick an image; its main colour is suggested, and clicking the photo takes the colour under the pointer. Photos stay on the device and are kept as a small JPEG (≤ 150 KB).
5. **Name (optional)**: the placeholder shows the generated name ("Olive jacket").
6. Actions: **Add to look** (primary) and Cancel.

**Rules**

- **One accent.** While the creator is open it holds the screen's only primary button. Hosts demote their own primary ("Save as new outfit", "Apply to Mon") to secondary through `LookEditor`'s `onCreatingChange`.
- **The palette is data, not tokens.** Palette colours become `item.color`, so they live in `src/lib/palette.ts` and never change with the theme (principle 1: the garments are the pictures).
- Defaults per slot make "Add to look" work with no other input (navy blazer, light blue oxford, white crew undershirt, brown belt, charcoal pants, brown loafers).
- Sketches have their own status (Tag tone `sketch`). They're left out of costs and Generate rotation until promoted on the Wardrobe tab.

**Keyboard**

- Arrow keys move within the style tiles and the palette.
- Enter in a field adds the piece.
- Escape cancels, even inside the Rotation day panel, which stays open (the creator is marked `data-escape-local`, which `Sheet` respects).
- On close, focus returns to the slot's picker.
