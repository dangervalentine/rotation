# SectionHead

The head of every section inside a view: a kicker, a display-face title, and an aside for that section's controls, closed by a heavy rule.

Pass `number` (1–4) on the **first** section head of a view to put the step's number beside it as a big cropped numeral on a block of the step colour, like the design-system cover. Inside a container with `rt-step-N`, the kicker and the heavy rule take that step's colour (`step-N-ink`).

**Consumer provides:** `title`, optional `kicker` (context: "5 days × 2 weeks", "Editing Week 1, Mon"), `id` (for `aria-labelledby` on the section), `aside` (fields, buttons or a short `.lede` line, aligned to the bottom), `level` (`2` default at 40px, `3` at 28px for minor sections like "Your data"), optional `dek`.

**Page head (`level={1}`).** A view's opening head: an `h1` at masthead size (88px, 56px on phones) beside the step numeral, with an italic `dek` under it, in a `header`. The app passes its name ("Rotation") as the title and drops the kicker; the tab and numeral say which view it is. Keep the aside to one or two controls. A view with a row of fields (Rotation, Print) puts them in a controls row under the head instead.

- One per section. Sections in a view sit `space-8` apart.
- Put the section's primary action in the aside, not floating elsewhere.
- Titles are short noun phrases in sentence case: "The lookbook", "Outfit builder".
