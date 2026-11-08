# Select

A dropdown (Radix Select) that looks like a `Field`: kicker label, underlined trigger, a square menu on `paper-raised` with `shadow-float`.

**Consumer provides:** `id`, `label`, `value`, `onChange(value)`, `options` (`{value, label, swatch?}[]`; `swatch` is `{color, stripe?, pattern?}` to show the garment's disc, or `null` for the empty-slot ring), optional `extra` (beside the label) and `hint`.

- Use for slot pickers and short fixed lists. Garment options always carry their swatch.
- Put "None" first for optional slots (layer, belt).
- The selected item is marked with an oxblood dot, not a tick.
- **Status tags**: an option's `tag` (`{label, tone}`: `owned`, `tobuy` or `sketch`) shows at the right of its menu row, never in the trigger.
- **Actions**: options with `action: true` ("Create a piece…") come after a hairline separator in oxblood. Choosing one calls `onAction(value)` and leaves the value unchanged.
- **Preview**: `onHighlight(value)` fires as the pointer or arrow keys move through the options, and `onHighlight(null)` fires when the menu closes or an action is highlighted. Use it to preview a choice (the outfit builder's figure) without committing it.
- **Adding to a list**: pass `value=""` and a `placeholder` ("Add an accessory…") for a picker that adds items rather than holding one, as in the outfit builder's Accessories row.
- Typeahead jumps to an option by its label.
