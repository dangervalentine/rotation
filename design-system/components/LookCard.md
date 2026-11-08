# LookCard

A saved outfit laid out like a lookbook credit block: "No. 04" numeral, the look's name, a colour strip of its pieces, then one row per slot (Layer, Shirt, Belt, Pants, Shoes) with swatch and name, followed by one row per accessory ("Accessory").

**Consumer provides:** `number`, `name` (text, or an element such as an inline rename `<input>`, which inherits the title style), `pieces` (`{slot, id?, name, color, stripe?, pattern?}[]` in slot order, then accessories with `slot: "acc"` and their item `id`; `name: null` for an empty slot), optional `kicker` (default "Look"), `figure` (the app's outfit illustration, shown beside the pieces), `flags` (strings, shown as flag tags), `onSelect` + `selected` to make it a pressable choice, and `children` for actions (Edit, Duplicate, Delete) under a hairline.

- Always list all five slots, even empty ones ("None" in italic) — gaps are information.
- Number looks in library order; don't renumber when one is deleted mid-cycle.
- Selected state is `oxblood-soft` with an oxblood edge; never more than one selected.
