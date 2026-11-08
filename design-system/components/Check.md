# Check

A square checkbox with an oxblood fill square when on, and a label.

Built on Radix Checkbox (`role="checkbox"`, Space toggles).

**Consumer provides:** `label`, `checked`, `onCheckedChange(checked: boolean)`, and optionally `disabled`, `title`, `id`. Add `className="rt-check-sm"` for the small uppercase variant used as a Field `extra` ("Keep", "On"). In table cells with no visible label, use the bare `Checkbox` with an `aria-label` ("Owned: Navy blazer").

- Labels say the state when checked: "I own this", "Show item names", "Keep".
