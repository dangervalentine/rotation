# SectionHead

The head of every section inside a view: a kicker, a Bodoni title, and an aside for that section's controls, closed by a heavy rule.

**Consumer provides:** `title`, optional `kicker` (context: "5 days × 2 weeks", "Editing Week 1, Mon"), `id` (for `aria-labelledby` on the section), `aside` (fields, buttons or a short `.lede` line, aligned to the bottom), `level` (`2` default at 40px, `3` at 28px for minor sections like "Your data").

- One per section. Sections in a view sit `space-8` apart.
- Put the section's primary action in the aside, not floating elsewhere.
- Titles are short noun phrases in sentence case: "The lookbook", "Outfit builder".
