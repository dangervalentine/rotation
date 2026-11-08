# Select

A dropdown (Radix Select) that looks like a `Field`: kicker label, underlined trigger, a square menu on `paper-raised` with `shadow-float`.

**Consumer provides:** `id`, `label`, `value`, `onChange(value)`, `options` (`{value, label, swatch?}[]`; `swatch` is `{color, stripe?}` to show the garment's disc, or `null` for the empty-slot ring), optional `extra` (beside the label) and `hint`.

- Use for slot pickers and short fixed lists. Garment options always carry their swatch.
- Put "None" first for optional slots (layer, belt).
- The selected item is marked with an oxblood dot, not a tick.
