# Segmented

A row of joined square buttons (one outer rule, no dividers between them) for picking one of two to six options; the chosen one is inverted (ink fill, paper text). The ink fill slides from the old option to the new one (`motion-step`), and stays put when animation is off.

**Consumer provides:** `options` (`[value, label][]`), `value`, `onChange(value)`, `label` (for screen readers).

Built on Radix ToggleGroup (single): a radio group. Tab enters at the chosen option, the arrow keys move, Space or Enter picks. One option is always chosen; clicking the chosen one again does nothing.

- Use for view switches (Table / Cards) and the "Try every" slot picker. For top-level navigation use `Tabs`.
- Labels are one word; the component uppercases them.
