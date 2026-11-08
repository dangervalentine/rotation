# Tabs

Section navigation set like a magazine's contents line: numbered, tracked uppercase, the active section underlined in `oxblood`.

**Consumer provides:** `items` (`{id, label, href?}[]`), `value` (the active id), optional `onChange(id)`. When items have an `href` the tabs render as links in a `<nav>` with `aria-current="page"` (the app uses hash links); otherwise as a `tablist` of buttons. `numbered={false}` drops the 01–04 prefixes; `label` names the group for screen readers.

- Use for the app's top-level views only (Rotation, Outfits, Wardrobe & costs, Print). Inside a view, use headings, not more tabs.
- Labels are nouns in title case; the component uppercases them.
- No pill or filled background on the active tab — the underline is the state.
- Give each tab its `step` (1–4) in the app's view nav: the number sits on a chip of the step colour and the active underline takes it.
- Hover darkens the label and shows the underline: in `rule-strong`, or the step colour for a step tab, whose chip also lifts 2px (no lift under reduced motion). The active tab keeps its own underline.
