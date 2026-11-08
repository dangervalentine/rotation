# Masthead

The magazine cover line for every screen: section kicker and issue meta over a hairline, the title in Bodoni at `masthead` size, an italic `dek`, then a double rule and the view nav.

**Consumer provides:** `title` (the wardrobe's name — a string, or an element such as the app's editable title `<input>`, which inherits the masthead type), optional `section` (kicker, default "The Wardrobe"), `meta` (a mono line: issue, cycle, piece count — uppercase, separated by ` · `), `dek` (the wardrobe's `subtitle`: one sentence), and `children` (normally a `Tabs`).

- One per screen, at the top. Never inside a card.
- Keep `title` short — one or two words reads like a masthead; four reads like a form.
- The dek is a sentence, not a list. End it with a period.
- Don't recolour the title. It is always `ink`; oxblood belongs to actions.
