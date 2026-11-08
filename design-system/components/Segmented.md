# Segmented

A row of joined square buttons for picking one of two to six options; the chosen one is inverted (ink fill, paper text).

**Consumer provides:** `options` (`[value, label][]`), `value`, `onChange(value)`, `label` (for screen readers).

- Use for view switches (Table / Cards) and the "Try every" slot picker. For top-level navigation use `Tabs`.
- Labels are one word; the component uppercases them.
