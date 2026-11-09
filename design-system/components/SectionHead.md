# SectionHead

The head of every section inside a view: a kicker, a display-face title, and an aside for that section's controls, closed by a heavy rule.

Inside a container with `rt-step-N`, the kicker and the heavy rule take that step's colour (`step-N-ink`).

**Consumer provides:** `title`, optional `kicker` (context: "5 days × 2 weeks", "Editing Week 1, Mon"), `id` (for `aria-labelledby` on the section), `aside` (fields, buttons or a short `.lede` line, aligned to the bottom), `level` (`2` default at 40px, `3` at 28px for minor sections like "Your data"), optional `dek`.

**Page head.** The view's page head is [`StepHead`](StepHead.md). `level={1}` and `number` remain for compatibility, but the app no longer uses them.

- One per section. Sections in a view sit `space-8` apart.
- Put the section's primary action in the aside, not floating elsewhere.
- Titles are short noun phrases in sentence case: "The lookbook", "Outfit builder".
