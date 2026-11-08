# ConfirmDialog

A short, modal question with two or three answers. It is built on Radix AlertDialog (`role="alertdialog"`). It is centered on `paper-raised`, with an oxblood top rule, over a `scrim`.

**Consumer provides:** `open`, `onOpenChange`, `title` (the situation: "Unapplied changes to Week 1, Wed"), `description` (one sentence on what to do), `actions` (`{ label, variant, onSelect }[]`), and optionally `onCloseAutoFocus` to choose where focus goes afterwards.

- Order the actions as do it, don't, and back out: **Apply** (primary), **Discard**, **Keep editing** (ghost). The last action is the cancel: Escape picks it, and it has focus when the dialog opens, so a stray Enter never throws work away.
- Ask only when an action would drop unapplied changes. Never ask "Are you sure?" about something that can be undone.
- Never use the browser's `confirm()`.
