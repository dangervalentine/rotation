# Sheet

The editing panel for one item in a collection, such as a rotation day. It is built on Radix Dialog.

- **Wide screens (1024px and up):** docked to the right edge, `sheet-width` wide, on `paper-raised` with a hairline `rule-strong` left edge and a heavy rule under the head. The page gives up the panel's width (`html[data-sheet="side"]`), so nothing sits under it. The panel is **non-modal**: the collection beside it stays readable and clickable, so picking another item switches what the panel edits.
- **Narrow screens:** a modal bottom sheet up to 85% of the viewport height, over a `scrim` backdrop. Focus stays inside, and tapping the backdrop closes it.

**Consumer provides:** `open`, `onOpenChange(false)` (Escape, Close, or the backdrop; the consumer may refuse, for example to ask about unapplied changes first), `title` (the item, e.g. "Week 1, Wed"; it is also the accessible name), optional `kicker` ("Editing"), `description`, `headActions` (small ghost buttons beside Close), `footer` (the sticky action row), `returnFocusRef` (the element that opened it, which gets focus back on close) and `children`.

- On open, focus goes to the title, so screen readers announce the item.
- The footer holds the screen's **only primary button** (Apply) while the sheet is open. Demote any other primary action on the page to secondary.
- Keep the URL in step (`#rotation/day/7`) so the browser's Back button closes the sheet.
- In docked mode, F6 (or a "Calendar" ghost button in `headActions`) moves focus between the panel and the collection.
- No shadow. The sheet separates from the page with a rule and paper tone, like everything else.
- Motion: a `motion-sheet-duration` slide. It is removed under `prefers-reduced-motion`.
- Hidden in print.
