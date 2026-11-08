# Swatch

A disc of the garment's own colour — the item's `color`, with its `stripe` as fine vertical bands when it has one.

**Consumer provides:** `color` (the item's hex; `null` for an empty slot, which draws a dashed ring), optional `stripe`, `size` (`"sm"` 14px default, `"lg"` 24px), and `label` when the swatch is the only cue (else it is hidden from screen readers and the name beside it does the work).

- Garment colours are data, not tokens: never theme them, never replace them with `oxblood` or `camel`.
- The only round thing in the system (`radius-full`).
- A 1px inner keyline keeps white shirts visible on `paper`.
