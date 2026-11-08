# Masthead

The magazine cover line for every screen: section kicker and issue meta over a hairline, the view nav, the title in Playfair Display at `masthead` size, an italic `dek`, then a double rule.

**Consumer provides:** `title` (the app's name, "Rotation" — a string renders as the page's `h1`), optional `section` (kicker, default "The Wardrobe"), `meta` (a mono line: issue, cycle, piece count — uppercase, separated by ` · `), `dek` (one sentence on what the current view is for; it changes with the view), optional `tools` (small controls at the end of the top line, such as the Auto / Light / Dark `Segmented`), and `children` (normally a `Tabs`, rendered under the top line so the steps sit above the title).

- One per screen, at the top. Never inside a card.
- Keep `title` short — one or two words reads like a masthead; four reads like a form.
- The dek is a sentence, not a list. End it with a period.
- The dek is set in `ink` (not `ink-muted`), italic, 20px (18px on phones). Muted grey italic read poorly at that size; the test suite holds `ink` at 7:1 or better on `paper` and `paper-raised`. Hierarchy comes from size and italic, not a lighter colour.
- Don't recolour the title. It is always `ink`; oxblood belongs to actions.
