# Field

A labelled input with no box: a tracked kicker label over an underline in `rule-strong`, the value in Bodoni like an entry in a form printed in the magazine.

**Consumer provides:** `label` (required), any `<input>` attribute (`value`, `onChange`, `placeholder`, `type`…), optional `hint`, `error` (replaces the hint, turns the underline oxblood), and `extra` (a small control beside the label, like a "Keep" `Check`). `type="number"` sets the value in mono; `type="color"` renders a swatch disc. `TextArea` takes the same props for multi-line notes. For a dropdown use `Select`.

- The underline is the control's edge (`rule-strong`, 15:1) — don't swap it for the decorative `rule`.
- Placeholders are examples ("Charcoal flannel trousers"), never the label.
- Errors say what happened and what you got instead.
