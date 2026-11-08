# Button

Square, outlined, set in the `label` style; it inverts to ink on hover like a printed proof.

**Consumer provides:** `children` (the label), `variant` (`"primary" | "secondary" | "ghost" | "danger"`, default secondary), `size` (`"md" | "sm"`), and any `<button>` attribute.

- **Primary** (oxblood) once per view, for the thing the view exists to do: *Generate rotation*, *Save look*, *Save*.
- **Secondary** for everything else that changes data. **Ghost** (underlined text) for low-stakes or exploratory actions: *Try every*, *Discard*, *Export JSON*.
- **Danger** only for removing an item or look; confirm first.
- Labels: verb first, sentence case, no full stop, no icons-only buttons. "Add from link", not "ADD" or "New +".
