# Feature Specification: Page Flow & Design Refinement

**Feature Branch**: `001-page-flow-refinement`

**Created**: 2026-11-08

**Status**: Draft

**Input**: User description: "refine the design and structure of the pages. what is the proper order of the pages? likely wardrobe and costs as that is where you put data into, then outfits, then rotation, then print, as that would be the order you would use when working through the pages. rotation should not always show the outfit builder, only when the user selects a day in the rotation in a way where the user can see other days' outfits, but not just by adding a new row of content to the page, it should be elegant. I don't know if modals are still in fashion or if there is a better style. utilize well-supported and embraced component packages to improve styling and accessibility. the font used in the subtitle is hard to read at its current weight and/or background/font combination. run a lighthouse report to make sure things are accessible and user friendly"

## Overview

The app has four views: Rotation, Outfits, Wardrobe & costs, and Print. Today they are ordered Rotation-first, and the Rotation view always shows a full outfit builder beneath the calendar. This feature:

1. Reorders the views to follow the order a person actually works through them: enter clothes, combine them into outfits, schedule outfits into a rotation, then print.
2. Replaces the always-on builder on the Rotation view with an on-demand **side panel** that opens when a day is selected, while the rest of the rotation stays visible next to it.
3. Moves the app's interactive controls onto a widely adopted, accessibility-focused component foundation, keeping the existing Rotation design language.
4. Makes the masthead subtitle (dek) easy to read.
5. Confirms the result with an automated accessibility and best-practices audit of every view.

**On the "modal or something better?" question**: a centered modal would cover the rotation, and the user wants to keep the other days in view. The pattern that fits is a **side sheet** (also called a drawer or inspector panel). It slides in from the edge, the calendar stays visible and readable beside it, and it closes with Escape or a close button. On narrow screens, where there is no room beside the calendar, the same panel opens as a **bottom sheet**. Current calendar and editing apps such as Google Calendar, Linear and Notion use this pattern for editing one item in a collection. This spec adopts it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit a rotation day without losing sight of the week (Priority: P1)

A person viewing their rotation selects a day to change its outfit. A panel slides in from the side holding that day's outfit builder. The calendar stays on screen with the selected day highlighted, so the person can compare against neighbouring days and see repeat flags update as they make changes. When they are done, they apply the change and close the panel, and the calendar is back to its full, uncluttered layout.

**Why this priority**: This is the largest structural change and the one the user described in most detail. Today the builder takes up the lower half of the Rotation view even when nobody is editing, which pushes the calendar's purpose aside.

**Independent Test**: Open the Rotation view and confirm no builder is visible. Select a day and confirm a side panel opens with that day's outfit while the other days stay visible and readable. Change a piece, apply, close, and confirm the calendar shows the change.

**Acceptance Scenarios**:

1. **Given** the Rotation view with no day selected, **When** it loads, **Then** only the rotation settings and calendar are shown, with no outfit builder on the page.
2. **Given** the Rotation view, **When** the person selects a day by pointer, touch or keyboard (Enter/Space), **Then** a side panel opens showing that day's name and its outfit builder, and the selected day is visibly marked in the calendar.
3. **Given** the panel is open on a wide screen, **When** the person looks at the calendar, **Then** the days outside the panel are still visible and readable, not dimmed to illegibility or covered.
4. **Given** the panel is open, **When** the person changes a piece, **Then** the selected day's preview in the calendar and any repeat flags update live to reflect the unapplied change, and that day is marked as edited.
5. **Given** the panel is open with unapplied changes, **When** the person chooses "Apply", **Then** the change is written to that day and the edited marker clears.
6. **Given** the panel is open, **When** the person presses Escape, uses the close button, or uses the browser back action, **Then** the panel closes and keyboard focus returns to the day that opened it. On narrow screens, tapping the dimmed area above the bottom sheet also closes it. On wide screens, clicking the calendar does not close the panel; clicking a day switches to it (scenario 8).
7. **Given** the panel is open with unapplied changes, **When** the person tries to close it or move to another day, **Then** they are asked, inside the app and not through a browser dialog, to apply or discard the changes first. Nothing is lost silently.
8. **Given** the panel is open with no unapplied changes, **When** the person selects a different day in the calendar or uses "Previous day"/"Next day" in the panel, **Then** the panel switches to that day without closing.
9. **Given** the panel is open, **When** the person uses the panel's existing actions ("Wear a saved outfit", "Copy previous day", "Save as outfit", "Discard changes"), **Then** each behaves as it does today.
10. **Given** a narrow (phone-width) screen, **When** a day is selected, **Then** the panel opens as a bottom sheet that can be closed the same ways, and the page never scrolls sideways.

---

### User Story 2 - Views follow the order of the work (Priority: P1)

A person new to the app sees the views in the order they will use them: **Wardrobe & costs → Outfits → Rotation → Print**. The navigation shows this as an ordered sequence, so it is clear which step comes first.

**Why this priority**: It costs little and changes how the whole app reads. Wardrobe is where data goes in, so it belongs first.

**Independent Test**: Load the app with no view in the address and confirm the navigation lists Wardrobe & costs, Outfits, Rotation, Print in that order, with Wardrobe & costs open.

**Acceptance Scenarios**:

1. **Given** the app is opened with no view specified, **When** it loads, **Then** the navigation reads Wardrobe & costs, Outfits, Rotation, Print, left to right, and Wardrobe & costs is the active view.
2. **Given** a bookmarked link to a specific view (for example the Rotation view), **When** it is opened, **Then** that view opens directly. Existing links keep working.
3. **Given** the navigation, **When** a keyboard user moves through it, **Then** they can reach and activate every view, the active view is announced as current, and focus is clearly visible.
4. **Given** a phone-width screen, **When** the navigation is shown, **Then** every view stays reachable and the active one is visible without horizontal page scrolling.

---

### User Story 3 - Readable subtitle (Priority: P2)

A person reading the masthead can read the subtitle (dek) under the wardrobe's name easily, in both light and dark themes, on desktop and on phones.

**Why this priority**: The user reported it as hard to read. It is a small change, but it is the first sentence anyone reads.

**Independent Test**: View the masthead in light and dark themes at desktop and phone widths. Measure the subtitle's contrast against its background and confirm it reads comfortably at a normal viewing distance.

**Acceptance Scenarios**:

1. **Given** either theme, **When** the subtitle is displayed, **Then** its text-to-background contrast is at least 7:1 (WCAG AAA for body text), so a modest size does not hurt legibility.
2. **Given** the subtitle, **When** it is displayed, **Then** its weight, size and style are chosen for legibility. Thin hairline strokes at small sizes, which the high-contrast display face has in its light italic, are not used for this text. It still looks like part of the editorial design.
3. **Given** a phone-width screen, **When** the subtitle is displayed, **Then** it is at least as legible as on desktop and wraps cleanly.

---

### User Story 4 - Accessible, consistent controls across all views (Priority: P2)

Every interactive control (tabs, buttons, selects, text and number fields, checkboxes, segmented choices, the new side panel and any confirmation prompts) behaves the way people expect from mature software. It works fully by keyboard, announces itself correctly to screen readers, shows a visible focus indicator, and keeps the current Rotation look.

**Why this priority**: The user asked for well-supported, widely adopted component packages to improve styling and accessibility. The side panel in Story 1 especially needs correct focus handling and announcements, which are easy to get wrong when built by hand.

**Independent Test**: Use each view with only a keyboard, and again with a screen reader. Every control can be reached, operated and identified, and every view still matches the Rotation design system.

**Acceptance Scenarios**:

1. **Given** any view, **When** the person moves through it with Tab/Shift+Tab, **Then** focus order follows the visual order and every focused control shows a clearly visible focus indicator.
2. **Given** a select, segmented control or checkbox, **When** it is operated by keyboard, **Then** it responds to the standard keys for that control type (for example arrow keys in a list of options, Space to toggle).
3. **Given** the side panel is open, **When** it opens, **Then** focus moves into the panel and screen readers announce it with its title (for example "Edit Monday, Week 01"). On narrow screens (bottom sheet, which covers the calendar) focus stays within the sheet until it closes. On wide screens the calendar stays usable beside the panel, so focus can move between the calendar and the panel, and F6 or a "Back to calendar" control jumps between them.
4. **Given** any control, **When** a screen reader reads it, **Then** it has an accessible name and the correct role and state (selected, checked, expanded, disabled).
5. **Given** the restyled controls, **When** compared with the design system's documented rules (ink on newsprint, hairline rules, a single oxblood accent for actions, light and dark themes), **Then** they follow those rules.
6. **Given** a person who has asked their system for reduced motion, **When** the side panel opens or closes, **Then** it appears without sliding animation.

---

### User Story 5 - Verified accessibility and best-practice quality (Priority: P3)

The person maintaining the app can see that every view passes an automated accessibility and quality audit, and that any problems found have been fixed.

**Why this priority**: This checks Stories 1–4 rather than delivering value of its own, but the user asked for it explicitly.

**Independent Test**: Run the audit against each of the four views (and the Rotation view with the panel open) in both themes and record the scores and remaining issues.

**Acceptance Scenarios**:

1. **Given** each view, **When** the audit runs, **Then** the Accessibility score is 100 and the Best Practices score is at least 95.
2. **Given** the audit results, **When** any accessibility issue is reported, **Then** it is fixed, or recorded with a reason why it cannot apply (for example a false positive).
3. **Given** the audit is complete, **When** someone reviews the work, **Then** a short report of scores per view, before and after, is available alongside the feature documents.

---

### Edge Cases

- **Empty wardrobe**: On first run with no items, the Wardrobe & costs view is first and active, and the Outfits and Rotation views point the person back to Wardrobe & costs instead of showing empty builders.
- **No saved outfits**: The panel leaves out "Wear a saved outfit" (as today) and shows no empty select.
- **Rotation reshaped while the panel is open**: If the days or weeks change so the selected day no longer exists, the panel closes, without losing applied data.
- **"Generate rotation" with the panel open and unapplied changes**: The person is asked to apply or discard first, as today.
- **Global save bar**: The app-wide "Save changes / Discard changes" bar stays reachable while the side panel is open and does not overlap the panel's own Apply/Discard actions.
- **Long day names or many days per week**: The calendar stays readable beside the open panel on wide screens. Where it would get too narrow, the panel overlays the calendar instead of squeezing it, and the selected day stays in view.
- **Browser back button with the panel open**: The panel closes and the person stays on the Rotation view, instead of jumping to a different view.
- **Print**: The side panel, navigation and save bar never appear in printed output.
- **Dark theme**: The panel, its backdrop (if any) and the subtitle meet the same contrast targets as the light theme.

## Requirements *(mandatory)*

### Functional Requirements

**View order and navigation**

- **FR-001**: The navigation MUST list the views in this order: Wardrobe & costs, Outfits, Rotation, Print.
- **FR-002**: When no view is specified in the address, the app MUST open on Wardrobe & costs.
- **FR-003**: Existing direct links to each view MUST keep opening that view.
- **FR-004**: The navigation MUST show the views as an ordered sequence (for example with step numbers) while keeping the current editorial style.

**Rotation view and day editing panel**

- **FR-005**: The Rotation view MUST NOT show the outfit builder until a day is selected.
- **FR-006**: Selecting a day MUST open a side panel containing that day's outfit builder and all of its current actions (wear a saved outfit, change pieces, apply, discard, copy previous day, save as outfit, previous/next day).
- **FR-007**: On wide screens, the panel MUST leave the rest of the rotation visible and readable while open.
- **FR-008**: On narrow screens, the panel MUST open as a bottom sheet with the same contents and behaviour.
- **FR-009**: The selected day's calendar preview and repeat flags MUST update live as the person edits in the panel, before applying.
- **FR-010**: The panel MUST close with Escape, an explicit close button, and the browser back action. On narrow screens it MUST also close by tapping the dimmed backdrop. When it closes, focus MUST return to the day that opened it.
- **FR-011**: Closing the panel or switching days with unapplied changes MUST ask the person, inside the app, to apply or discard first. Unapplied changes MUST NOT be lost silently.
- **FR-012**: On opening, the panel MUST move focus into itself and MUST be announced to screen readers by a title naming the day being edited. On narrow screens (modal bottom sheet) focus MUST stay within the sheet while it is open. On wide screens (non-modal side panel) the calendar MUST stay operable, and a keyboard user MUST be able to jump between calendar and panel in one keystroke.
- **FR-013**: The panel's open/close animation MUST be skipped when the person has asked their system for reduced motion.

**Subtitle legibility**

- **FR-014**: The masthead subtitle MUST have a text-to-background contrast ratio of at least 7:1 in both themes.
- **FR-015**: The subtitle MUST use a weight, size and style chosen for legibility at its displayed size on desktop and phone widths, and MUST stay consistent with the design system.
- **FR-016**: The design system documentation MUST be updated to record the subtitle's new treatment and the reason for it.

**Component foundation and accessibility**

- **FR-017**: Interactive controls (selects, checkboxes, segmented choices, the side panel, and confirmation prompts) MUST be built on a widely adopted, actively maintained, accessibility-focused component foundation. It may be the same family already used for the app's select control. These controls MUST NOT be hand-rolled where that foundation provides an equivalent. View navigation is a set of page links, so it uses native link semantics (`aria-current`) instead of a tab widget.
- **FR-018**: Restyled controls MUST keep the visual language of the Rotation design system (tokens, typography, rules, single accent colour, light and dark themes).
- **FR-019**: Every interactive control MUST be fully operable by keyboard with a clearly visible focus indicator, and MUST expose an accessible name, role and state.
- **FR-020**: All text and meaningful non-text elements MUST meet WCAG 2.1 AA contrast at minimum, in both themes.
- **FR-021**: No view MUST scroll horizontally at phone width (360 px wide viewport).
- **FR-022**: Existing behaviour on every view (data entry, outfit library, rotation generation and repeat flags, printing, save/discard, import/export) MUST continue to work as before, apart from the changes listed here.

**Audit**

- **FR-023**: An automated accessibility and best-practices audit (Lighthouse) MUST be run on all four views, and on the Rotation view with the panel open, in light and dark themes, before and after the changes.
- **FR-024**: All accessibility issues the audit reports MUST be fixed, or documented with a reason why they cannot apply.
- **FR-025**: A brief audit report (scores per view, before and after, plus any documented exceptions) MUST be saved with the feature documents.

### Key Entities

- **View**: One of the four workspaces (Wardrobe & costs, Outfits, Rotation, Print). It has a position in the work order and a stable address for direct links.
- **Rotation day**: One slot in the rotation (a day name within a numbered week) holding one look. It can be selected for editing and may have repeat flags.
- **Day editing panel**: A temporary editing surface attached to one rotation day. It holds a working copy of that day's look until the person applies or discards it.
- **Audit report**: Per-view scores and findings from the accessibility and quality audit, before and after the changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every view scores 100 for Accessibility and at least 95 for Best Practices in the automated audit, in both light and dark themes, including the Rotation view with the panel open.
- **SC-002**: With the panel open on a 1280 px wide screen, at least the days of the selected day's week stay fully visible and readable outside the panel.
- **SC-003**: A person can open a day, change one piece, apply, and close the panel in 4 interactions or fewer (excluding choosing the piece itself), using either pointer or keyboard only.
- **SC-004**: With no day selected, the Rotation view's height shrinks to the settings and calendar alone, so a two-week, five-day rotation fits on one 1280×800 screen without scrolling past a builder.
- **SC-005**: The masthead subtitle measures at least 7:1 contrast in both themes, and in a side-by-side check against the current version, reviewers judge the new version easier to read.
- **SC-006**: 100% of interactive controls can be reached and operated with the keyboard alone, and each is announced with a correct name and role by a screen reader.
- **SC-007**: Every existing automated test still passes, and no current capability is lost.
- **SC-008**: First-time users who follow the navigation from left to right complete the flow (add an item → create an outfit → place it on a rotation day → reach Print) without backtracking to an earlier view.

## Assumptions

- **Side sheet instead of a centered modal**: A side sheet (bottom sheet on phones) best meets "see other days' outfits while editing" and "not just a new row of content". It is a current, widely used pattern. A centered modal was rejected because it covers the calendar.
- **Default view**: With no address, the app opens on Wardrobe & costs, the first step. Returning users who bookmark a view still land on that view.
- **Explicit apply stays**: Edits in the panel stay a working copy until the person applies them, matching today's behaviour, instead of saving automatically on every change. The app-wide save bar still controls persistence to storage.
- **Component foundation**: The app already uses one widely adopted, accessibility-focused component library for its select control. Extending that same family is the expected path, so the app does not take on a second, competing system. Visual styling keeps coming from the existing Rotation design system rather than the library's defaults.
- **Subtitle content is unchanged**: Only the subtitle's presentation changes, not its text or where it can be edited.
- **Audit tool**: "Lighthouse report" means Google Lighthouse's Accessibility and Best Practices categories. Performance and SEO scores are recorded but are not acceptance targets, because the app is a local/static tool.
- **Outfits view structure**: The Outfits view keeps its current workspace-plus-library layout, apart from adopting the shared controls and the ordered navigation. Its structure is not redesigned in this feature.
- **Print view**: Print output is unchanged. Only the controls on the Print view's screen version adopt the shared components.
- **Browsers**: Current versions of evergreen desktop and mobile browsers.
