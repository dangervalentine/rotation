# SectionHead

The head of every section inside a view: a kicker, a display-face title, and an aside for that section's controls, closed by a heavy rule.

Pass `number` (1–4) on the **first** section head of a view to put the step's number beside it as a big cropped numeral on a block of the step colour, like the design-system cover. Inside a container with `rt-step-N`, the kicker and the heavy rule take that step's colour (`step-N-ink`).

**Consumer provides:** `title`, optional `kicker` (context: "5 days × 2 weeks", "Editing Week 1, Mon"), `id` (for `aria-labelledby` on the section), `aside` (fields, buttons or a short `.lede` line, aligned to the bottom), `level` (`2` default at 40px, `3` at 28px for minor sections like "Your data").

- One per section. Sections in a view sit `space-8` apart.
- Put the section's primary action in the aside, not floating elsewhere.
- Titles are short noun phrases in sentence case: "The lookbook", "Outfit builder".
