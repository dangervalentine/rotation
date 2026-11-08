# RotationDay

One day in the rotation grid: day name in Bodoni, week in mono, a row of swatches, the pieces in small type, and any conflict as a flag tag. Pressing it opens the look editor for that day.

**Consumer provides:** `day` ("Mon"), optional `week` (number), `pieces` (as LookCard), `figure` (the outfit illustration, shown in a narrow left column), `selected`, `onClick`, `edited` (true while the builder holds unapplied changes for this day) and `flags` (conflicts, e.g. "Same pants as Tue").

- Lay days out in a grid, one row per week, with a `Kicker` ("Week 01") at the row start.
- Selected is `paper-sunk` with an oxblood top edge — the grid stays calm, only one day is lit.
- Name the earlier day in a flag ("Same pants as Tue"), not "yesterday".
