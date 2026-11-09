# StepHead

The one page head over every step. It shows the step's number as a big cropped numeral on a block of the step colour, the step's name as the page's `h1` (88px, scaling down to fit on phones), and an italic dek that says what the step is for. A heavy rule in the step colour closes it.

The app renders it once, above the page. It stays mounted from step to step, so moving to another step changes it in place instead of redrawing it.

**Consumer provides:** `number` (1–4), `title` (the step's name, the same word as its tab), `dek`, `dir` (`"forward"` or `"back"`, the direction of the latest step change), optional `className`, and `children` (the page below the head).

## Page actions: `StepAside`

A view puts its own actions beside the head with `<StepAside>…</StepAside>`. It can be rendered anywhere inside the view. Its children appear in the head's aside slot, but they stay part of the view: they use its state, and they come and go with its page. A view with no actions renders nothing, and the slot takes no room.

- Keep it to one or two controls, or a short `.lede` line ("Editing …").
- A step with a row of fields (Rotation, Print) puts them in a controls row under the head instead.

## Motion

On a step change, the numeral, title and dek **roll**: the old value leaves and the new one arrives, upward for a later step and downward for an earlier one. The numeral rolls a full glyph height and its block clips it. The title and dek move a short way and fade. The block, the rule and the active tab blend to the new step colour. The page below slides 24px the same way (the app runs a view transition). Everything uses `motion-step-duration` and `motion-step-ease`, so all the parts start and finish together.

- Moves within a step (an item's page, opening a day) don't animate.
- No motion on first load, reload or a link straight to a step.
- Under `prefers-reduced-motion`, or with Settings → Animation → Off, the step changes at once.

`RollText` (the roll on its own) is exported for this head. Don't use it to animate other text: see the motion rule in the README.

## Accessibility

- Exactly one `h1`. Its text is always the current step's name; the value rolling out is `aria-hidden`.
- The numeral block is `aria-hidden`: the tab and the title already say which step this is.
- In print, the Print step hides its head (`className="no-print"`). The other steps print theirs.
