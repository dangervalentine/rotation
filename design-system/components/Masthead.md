# Masthead

The bar at the top of every screen. It sticks to the top of the page. The `brand` sits on the left; the nav (normally `Tabs`) and the `tools` sit together on the right. Below it, a Masthead can also set a title in Playfair Display at `masthead` size, an italic `dek` and a double rule, but the app leaves those out: each step opens with its own [`StepHead`](StepHead.md).

**Consumer provides:** `brand` (a `Wordmark`), `children` (normally a `Tabs`), optional `tools` (small controls at the end of the bar: the app puts its [`Settings`](Settings.md) gear here), optional `meta` (a short status before the tools, such as a save error), and optionally `title` and `dek`.

- The bar renders as a sibling of the `header`, so put the Masthead directly in the page's scrolling column, not inside a wrapper that would end the stickiness.
- On phones the brand keeps its mark and drops its name, the tabs scroll sideways between it and the tools, and a status takes its own line under the bar.
- `meta` is a live region: keep it rendered even when it has nothing to say. An empty one takes no room.
- One per screen, at the top. Never inside a card.

## Wordmark

`<Wordmark name="Rotation" href="#wardrobe" />`: the app's mark (the favicon's oxblood square with the name's first letter in the display face) and its name, linking to the first step. The link's accessible name is the app's name. On phones only the mark shows.

## Title and dek

When a screen does use them:

- Keep `title` short: one or two words reads like a masthead; four reads like a form. A string renders as the page's `h1`.
- The dek is a sentence, not a list. End it with a period.
- The dek is set in `ink` (not `ink-muted`), italic, 20px (18px on phones). Hierarchy comes from size and italic, not a lighter colour.
- Don't recolour the title. It is always `ink`; oxblood belongs to actions.
