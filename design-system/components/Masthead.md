# Masthead

The magazine cover line for every screen: a sticky nav bar, the title in Playfair Display at `masthead` size, an italic `dek`, then a double rule.

**Consumer provides:** `title` (the app's name, "Rotation" — a string renders as the page's `h1`), `dek` (one sentence on what the current view is for; it changes with the view), `children` (normally a `Tabs`), optional `tools` (small controls at the end of the bar, such as the Auto / Light / Dark `Segmented`) and optional `meta` (a short status before the tools, such as a save error).

- The tabs and tools share one bar that sticks to the top of the page while the title scrolls away. It renders as a sibling of the `header`, so put the Masthead directly in the page's scrolling column, not inside a wrapper that would end the stickiness.

- Omit `title` (and `dek`) to render the bar alone. The app does this: each view opens with its own `SectionHead level={1}` carrying the title, dek and step numeral, so the screen has one large head, not two.
- One per screen, at the top. Never inside a card.
- Keep `title` short — one or two words reads like a masthead; four reads like a form.
- The dek is a sentence, not a list. End it with a period.
- The dek is set in `ink` (not `ink-muted`), italic, 20px (18px on phones). Muted grey italic read poorly at that size; the test suite holds `ink` at 7:1 or better on `paper` and `paper-raised`. Hierarchy comes from size and italic, not a lighter colour.
- Don't recolour the title. It is always `ink`; oxblood belongs to actions.
