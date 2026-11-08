# SaveBar

The sticky bar at the bottom-right of every view: an UNSAVED marker in tobacco mono and an italic status line, then Discard and Save.

**Consumer provides:** `dirty` (false disables both buttons), `onSave`, `onDiscard`, optional `message` to override the status line ("Saving…"), `error` (turns the message oxblood, for "Couldn't save: …"), and `saveLabel` / `discardLabel`.

- One per app, `position: sticky` at the bottom of the page wrapper; hidden in print.
- It's the only component with `shadow-float`, because it sits over content.
- Keep the copy calm: "Unsaved — kept as a draft", not "You have unsaved changes!".
