# Settings

A gear button at the end of the masthead bar that opens a small panel of preferences under it. The app's panel holds **Theme** (Auto / Light / Dark) and **Animation** (Auto / Off).

**Consumer provides:** `children`, a stack of `Setting` rows, and optionally `label` (default "Settings": the button's accessible name and tooltip, and the panel's title).

`Setting` takes `label` (shown as a kicker over the control), `children` (the control, usually a `Segmented`) and an optional `note` (one or two short sentences in `ink-muted`).

- The panel opens under the gear with its right edge lined up with the gear's. Clicking outside or pressing Escape closes it and returns focus to the gear. It is a native popover, so it sits above everything, sheets included. It fades in while dropping a few pixels from the gear, and fades back out on close (`motion-quick`); with reduced motion or Animation off it simply appears and disappears.
- Settings change at once. There is no Save button; each choice is remembered per browser.
- Rules, not boxes: a hairline border and a heavy rule under the title, no shadow.
- Keep it short. A preference belongs here when it changes how the whole app looks or moves, not when it belongs to one step.

## Animation

- **Auto** follows the device's reduce-motion setting.
- **Off** sets `data-motion="reduce"` on `<html>` and stores `wardrobe-rotation:motion = "off"`. The script in `index.html` restores it before the first paint, so nothing animates on load either.
- With either source asking for less motion, the stylesheet removes all transitions and animations, and `motionReduced()` returns true so code skips view transitions and smooth scrolling.
