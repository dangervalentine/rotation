# Sheet

The editing panel for one item in a collection, such as a rotation day. It is built on Radix Dialog.

- **Wide screens (1024px and up):** a side panel fixed to the right edge, up to `sheet-width` wide but always leaving a `space-8` strip of scrim, on `paper-raised` with a hairline `rule-strong` left edge and a heavy rule under the head. It sits **over** the page, never beside it: the page keeps its width (the scrollbar gutter is stable), so nothing behind it moves when it opens or closes.
- **Narrow screens:** a bottom sheet up to 85% of the viewport height.
- **Both are modal**, over a `scrim` that also covers the sticky masthead. Focus stays inside, and clicking the scrim closes it (through `onOpenChange`, so the consumer can ask about unapplied changes first). Layers: masthead 20, scrim 39, sheet 40, confirm dialog 44/45, select menus 50.

**Consumer provides:** `open`, `onOpenChange(false)` (Escape, Close, or the scrim; the consumer may refuse, for example to ask about unapplied changes first), `title` (the item, e.g. "Week 1, Wed"; it is also the accessible name), optional `kicker` ("Editing"), `description`, `headActions` (small ghost buttons beside Close), `footer` (the sticky action row), `returnFocusRef` (the element that opened it, which gets focus back on close) and `children`.

- On open, focus goes to the title, so screen readers announce the item.
- The footer holds the screen's **only primary button** (Apply) while the sheet is open. Demote any other primary action on the page to secondary.
- Keep the URL in step (`#rotation/day/7`) so the browser's Back button closes the sheet.
- No shadow. The sheet separates from the page with a rule and paper tone, like everything else.
- Motion: a `motion-sheet-duration` slide. It is removed under `prefers-reduced-motion`.
- Hidden in print.
