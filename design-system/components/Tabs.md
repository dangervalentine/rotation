# Tabs

Section navigation set like a magazine's contents line: numbered, tracked uppercase, the active section underlined in `oxblood`.

**Consumer provides:** `items` (`{id, label, href?}[]`), `value` (the active id), optional `onChange(id)`. When items have an `href` the tabs render as links in a `<nav>` with `aria-current="page"` (the app uses hash links); otherwise as a `tablist` of buttons. `numbered={false}` drops the 01–04 prefixes; `label` names the group for screen readers.

- Use for the app's top-level views only (Rotation, Outfits, Wardrobe & costs, Print). Inside a view, use headings, not more tabs.
- Labels are nouns in title case; the component uppercases them.
- No pill or filled background on the active tab — the underline is the state.
