# RotationDay

One day in the rotation grid: day name in the display face, week in mono, a row of swatches, the pieces in small type, and any conflict as a flag tag. Pressing it opens the day's editing `Sheet`.

**Consumer provides:** `day` ("Mon"), optional `week` (number), `pieces` (as LookCard), `figure` (the outfit illustration, shown in a narrow left column), `selected`, `expanded` (set when the day opens a panel: true while that panel shows it; the button then reports `aria-haspopup="dialog"` and `aria-expanded` instead of `aria-pressed`), `onClick`, `edited` (true while the builder holds unapplied changes for this day) and `flags` (conflicts, e.g. "Same pants as Tue").

- Lay days out in a grid, one row per week, with a `Kicker` ("Week 01") at the row start.
- Selected is `paper-sunk` with an oxblood top edge — the grid stays calm, only one day is lit.
- It forwards a `ref` to the button, so a closing panel can return focus to the day that opened it.
- Name the earlier day in a flag ("Same pants as Tue"), not "yesterday".
