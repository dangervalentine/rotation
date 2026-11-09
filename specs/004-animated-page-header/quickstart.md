# Quickstart: Validating the Animated Shared Page Header

**Feature**: 004-animated-page-header

## Prerequisites

```sh
npm install
npm run tokens      # regenerate tokens.css after the motion-step tokens are added
npm run typecheck
npm test
npm run dev         # then open the printed local URL
```

Use a browser with same-document view transitions (Chrome or Edge 111+, Safari 18+, Firefox 144+) for checks 1–7. Check 10 covers browsers without them.

## Automated

| Check | Command | Expect |
|---|---|---|
| Types | `npm run typecheck` | no errors |
| Unit | `npm test` | all pass. `test/route.test.ts` covers `stepChange` (same → null, every forward and back pair, 1 → 4 is a single forward move). The `STEP_HEADS` test checks the titles match the tab labels and the numbers match `VIEW_ORDER`. |
| Tokens | `npm test` (`test/tokens.test.ts`) | `motion-step-*` are present in both `tokens.json` and `tokens.css` |
| Lighthouse | `npm run audit` | Accessibility stays at 100 and Performance doesn't drop from the 001 report (SC-003, SC-007) |

## Manual (references: [spec](../spec.md), [UI contract](contracts/ui-contract.md))

1. **Head changes in place (US1).** Click Wardrobe → Outfits. The head never disappears.
   - The numeral rolls up from 01 to 02 inside its block.
   - The block blends from navy to camel.
   - "Wardrobe" rolls up to "Outfits", and the subtitle rolls up with it.
   - Click Wardrobe again: everything rolls down.
2. **All 12 pairs (SC-001).** Visit every ordered pair of steps. Later steps roll up and slide the content toward the start, and earlier steps do the reverse. A jump of several steps (Wardrobe → Print) moves once and doesn't pass through Outfits or Rotation.
3. **Content moves with the head (US2).** The old content slides and fades out while the new content slides in, starting and finishing with the head. You end at the top of the new page, even after scrolling far down the Wardrobe table.
4. **Page actions (FR-009).**
   - "Add an item" and the Table/Cards switch arrive with Wardrobe and leave with it.
   - The Print button does the same with Print.
   - The head's numeral and title never shift sideways when they come and go.
5. **Fast moves and Back (US3, SC-004).** Click 1 → 2 → 3 → 4 as fast as possible, then press Back three times quickly. You end on the page in the address bar, with the matching head, nothing left half-rolled, and only one title visible.
6. **Within a step (FR-014).** Open an item from the Wardrobe table, then use ← Wardrobe. Open a rotation day and close it. The head doesn't roll and the content doesn't slide.
7. **Blocked move (FR-015).** Open a rotation day, change a piece without applying it, and click Outfits. The apply/discard prompt appears and nothing animates. Choose to stay: still nothing animates. Try again and discard: the step change plays.
8. **Reduced motion (US4, SC-005).** Turn on the OS reduce-motion setting (or emulate it in DevTools Rendering). Move between all four steps. Everything changes at once, nothing slides or rolls, and only one title is in the DOM afterwards.
9. **First load (FR-012).** Reload on each step and open `#print` directly. The page appears with no roll or slide.
10. **No view-transition support.** In DevTools, run `delete Document.prototype.startViewTransition` and change steps. The content swaps at once, while the head still rolls and blends.
11. **Print (FR-018, SC-006).** Print from the Print step and from Wardrobe. Compare with prints from `main` before this feature: they should match. The Print step shows no page head in print.
12. **Screen reader and headings (FR-017).** With the accessibility tree open (or a screen reader running), change steps. There is one `h1` named after the new step, and the leaving text is hidden from the tree.
13. **Themes and phone width.** Switch light and dark during a change. Then, at 360 px wide, change steps: there's no sideways scrollbar, and the head stays in its place.
