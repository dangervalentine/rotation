# Feature Specification: Animated Shared Page Header

**Feature Branch**: `004-animated-page-header`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "switch the header on each page so it is a shared component which animates between pages. the text in the title, the subtitle, and the index number and background color should animate on navigation. the content below also animates between pages."

## Overview

The app has four steps, each with its own page: Wardrobe (1), Outfits (2), Rotation (3) and Print (4). Every page opens with the same kind of page head: a numeral block with the step number (01–04) on the step's colour (navy, camel, oxblood, ink), the title, and a one-line subtitle (the "dek") that says what the step is for. Some pages add their own actions beside it, such as "Add an item" or "Print".

Today each page draws its own copy of this head. Moving from one page to another throws away the old head and draws a new one, so the change happens all at once with nothing to show that the person stayed in the same place and moved one step along.

This feature makes the page head one lasting element that stays on screen while the person moves between pages. When the page changes, its parts change in place with motion: the title and subtitle text, the step number and the step colour behind it. The page content underneath also moves in and out, so the switch reads as one continuous move from one step to the next.

## Clarifications

### Session 2026-11-09

- Q: What should the title show? → A: Each step's own name (Wardrobe, Outfits, Rotation, Print) replaces "Rotation" as the title, so it animates on every step change.
- Q: What style of motion? → A: Follows the step order. Later steps move forward (text rolls up, content slides toward the start), earlier steps move backward.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The page head changes in place between steps (Priority: P1)

A person on Wardrobe clicks "Outfits" in the nav. The page head does not disappear and redraw. It stays where it is while the numeral rolls up from 01 to 02, its block shifts from navy to camel, and the title ("Wardrobe" → "Outfits") and subtitle roll up from the old text to the new. Going back to Wardrobe rolls everything the other way. When it settles, the head looks exactly as Outfits' head looks today.

**Why this priority**: This is the heart of the request. A head that stays put and changes in place tells the person they are moving through one ordered process, not jumping to an unrelated screen.

**Independent Test**: Move between every pair of the four pages using the nav. On every move, watch that the head stays in place with no blank frame or jump, that the number, colour and text each animate from the old value to the new one, and that the settled head matches that page's head as it looks before this change.

**Acceptance Scenarios**:

1. **Given** any page is open, **When** the person moves to a different page, **Then** the page head stays on screen the whole time and doesn't vanish, flash or redraw from nothing.
2. **Given** a move from step A to step B, **When** the change plays, **Then** the numeral changes from A's number to B's with visible motion rather than swapping instantly.
3. **Given** a move from step A to step B, **When** the change plays, **Then** the numeral block's background blends smoothly from A's step colour to B's, as does any other part of the head drawn in the step colour.
4. **Given** a move from step A to step B, **When** the change plays, **Then** the title (A's step name to B's) and the subtitle change with visible motion, rolling up when B comes after A and down when it comes before.
5. **Given** the change has finished, **When** the person looks at the head, **Then** it is the same as that page's head before this feature: same number, colour, subtitle, size and position. The title is the step's name.
6. **Given** a page that adds its own actions beside the head (e.g. "Add an item" on Wardrobe, "Print" on Print), **When** the person moves to or from it, **Then** those actions arrive and leave along with the page content, and the head's position doesn't jump when they do.

---

### User Story 2 - The page content moves with the head (Priority: P1)

When the person changes page, the content under the head (the wardrobe table, the outfit builder, the rotation calendar, the print preview) leaves and the new page's content arrives with motion that matches the head, so the whole switch feels like one move.

**Why this priority**: The request names the content as well. If the head animates while the content swaps abruptly, the switch still feels broken.

**Independent Test**: Move between each pair of pages and confirm the old content leaves and the new content arrives with motion timed to the head's change, with no frame where both pages' content overlap in a way that is hard to read and no frame with an empty page.

**Acceptance Scenarios**:

1. **Given** any page, **When** the person moves to another page, **Then** the old content leaves and the new content arrives with motion, rather than swapping in one frame.
2. **Given** the change is playing, **When** it runs, **Then** the content's motion starts and ends together with the head's, so the two read as one move.
3. **Given** the new page is taller or shorter than the old one, **When** the change plays, **Then** the page doesn't jump around partway through, and the person ends at the top of the new page as they do today.
4. **Given** the change has finished, **When** the person uses the new page, **Then** it works exactly as it does before this feature: the same controls, focus order and keyboard access.

---

### User Story 3 - Moving around quickly, and moving back (Priority: P2)

A person clicks through several tabs fast, or presses the browser's Back and Forward buttons. Each change animates the same way as a click in the nav, a new change interrupts one that is still playing, and the app always ends on the page the person last asked for.

**Why this priority**: People don't always wait for a change to finish. Motion that queues up, stutters or lands on the wrong page is worse than no motion.

**Independent Test**: Click Wardrobe → Outfits → Rotation → Print as fast as possible, then press Back three times quickly. Confirm the app ends on the page last requested, the head shows that page's number, colour and text, and nothing is left halfway through a change.

**Acceptance Scenarios**:

1. **Given** a change is still playing, **When** the person asks for another page, **Then** the change heads for the newest page from where it is now, with no queue of old changes playing out first.
2. **Given** the person presses Back or Forward, **When** the page changes, **Then** it animates the same way as moving with the nav.
3. **Given** any run of quick changes, **When** they settle, **Then** the head and content match the page in the address bar exactly.

---

### User Story 4 - Respecting reduced motion and first load (Priority: P2)

A person who has asked their device to reduce motion changes pages and sees the new head and content straight away, or with at most a short fade, without anything sliding, rolling or moving across the screen. Anyone opening the app, reloading it or following a link straight to a page sees that page at once, with no change playing.

**Why this priority**: Motion should never make the app harder to use. The app already turns off motion for people who ask for less, and this feature must follow that.

**Independent Test**: Turn on the operating system's reduce-motion setting and move between all four pages. Then, with it off, reload on each page and open a direct link to each page.

**Acceptance Scenarios**:

1. **Given** reduce motion is turned on, **When** the person changes page, **Then** nothing slides, rolls or moves across the screen, and the new head and content appear at once or with a short fade.
2. **Given** the app is opening for the first time, being reloaded, or opened from a link to a page, **When** the page appears, **Then** no page change plays.
3. **Given** the person prints from the Print page, **When** the page is printed, **Then** the printout is the same as before this feature, with no part of any change showing.

---

### Edge Cases

- **Moving within a page.** Opening a wardrobe item's detail page, opening or closing a rotation day, or returning from an item to the Wardrobe list stays on the same step. The head stays put (same number, colour and text), and only the content changes. Whether that content change animates is decided in planning; it must not play the full step change.
- **A blocked move.** When leaving an open rotation day with unapplied changes, the app asks first. If the person stays, no change plays and the head doesn't move. If they continue, the change plays as normal.
- **Moving to the page already open.** Clicking the tab of the open page does nothing and plays no change.
- **Saving while moving.** A save, save error or "newer version" prompt during a change works as it does today. The change doesn't hide, delay or cancel it, and it doesn't interrupt the change.
- **Theme change.** Switching between light and dark mid-change ends with the right colours for the new theme and the new page.
- **Small screens.** On a phone-width screen, the change plays without sideways scrolling and without content spilling out of the page.
- **Focus and screen readers.** After a change, keyboard focus and what a screen reader announces follow what the app does today. The text that is leaving is never read out as part of the new page, and the page title is announced once, not twice.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page head (step numeral, title, subtitle) MUST be one element that stays on screen across all four step pages, instead of a separate copy drawn by each page.
- **FR-002**: When the step changes, the step numeral MUST change from the old number to the new one with visible motion.
- **FR-003**: When the step changes, the numeral block's background colour MUST blend from the old step's colour to the new one's, and every other part of the head drawn in the step colour MUST change with it.
- **FR-004**: When the step changes, the subtitle MUST change from the old text to the new with visible motion.
- **FR-005**: The title MUST change with visible motion whenever the old and new pages' titles differ. The title MUST be the step's own name: Wardrobe, Outfits, Rotation, Print. It replaces "Rotation" (the app's name) as the title, so it changes, and animates, on every step change.
- **FR-006**: When the step changes, the old page's content MUST leave and the new page's content MUST arrive with motion that starts and ends with the head's change.
- **FR-007**: The style and direction of motion MUST follow the step order. Going to a later step moves forward: the numeral, title and subtitle roll up (the old text leaves upward, the new comes in from below) and the content slides toward the start of the line. Going to an earlier step moves the opposite way. Jumping several steps (e.g. 1 → 4) moves one way, the same as one step, and doesn't step through the pages between.
- **FR-008**: A full page change MUST take no more than 400 ms from the click (or Back/Forward) to the settled new page.
- **FR-009**: A page's own actions (such as "Add an item" or "Print") MUST stay part of that page. They arrive and leave with the page content, and their coming and going MUST NOT shift the head.
- **FR-010**: A new page request during a change MUST take over from where the change is, and MUST always end on the newest requested page.
- **FR-011**: Back and Forward MUST animate the same as moving through the nav.
- **FR-012**: No change MUST play on first load, reload, or opening a direct link to a page.
- **FR-013**: When the device asks for reduced motion, page changes MUST NOT slide, roll or move anything. At most, they may use a fade no longer than 150 ms.
- **FR-014**: Changes within one step (an item's detail page, opening or closing a rotation day) MUST NOT play the step change on the head. The head's number, colour and text stay put.
- **FR-015**: A move the app holds back (such as leaving a day with unapplied changes) MUST NOT play any change until the person decides to continue.
- **FR-016**: Once settled, every page MUST look and behave as it does before this feature: same head size, position and wording (except the title, which is now the step's name per FR-005), same content, controls, focus order, keyboard access and screen-reader structure.
- **FR-017**: Each page MUST still have exactly one main heading at all times, and assistive technology MUST NOT read the old page's head or content as part of the new one.
- **FR-018**: Printed output MUST be unchanged.
- **FR-019**: The shared head and its motion MUST be described in the design system, alongside its other components, including how a page provides its own actions.

### Key Entities

- **Step**: One of the four ordered pages of the work: Wardrobe (1), Outfits (2), Rotation (3), Print (4). Each has a number, a step colour (light and dark versions), a title and a subtitle. The head shows the current step, and a page change is a move from one step to another.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Across all 12 ordered pairs of the four pages, every change keeps the head on screen in every frame and visibly animates the numeral, the step colour, the title and the subtitle, in the direction that matches the step order.
- **SC-002**: Every page change settles within 400 ms of the person's action.
- **SC-003**: The page stays smooth during a change, with no visible stutter on a mid-range laptop or phone. The app's existing performance audit scores don't drop.
- **SC-004**: After any run of 10 page changes made as fast as possible, including Back and Forward, the app shows the page in the address bar with the matching head 100% of the time.
- **SC-005**: With reduce motion on, nothing moves across the screen during any page change.
- **SC-006**: Screenshots of each settled page (and each printout) match the pages before this feature, apart from the title now being each step's name (FR-005).
- **SC-007**: The existing automated tests still pass, and the app's accessibility checks still find exactly one main heading on each page.

## Assumptions

- "Each page" means the four step pages reached from the nav: Wardrobe, Outfits, Rotation and Print. The item detail page and the rotation day panel belong to their step, so they share its head and don't count as step changes.
- The masthead bar above the page head (app nav and theme switch) is not part of this feature. Only its step colour, which already follows the open step, blends along with the head.
- The app's name, "Rotation", is chosen to be dropped from the page itself. The masthead bar doesn't show it today, so after this change it appears only in the browser tab title, which stays as it is. Step 3 is also called "Rotation", so on that page the title happens to match the app's name.
- The four step colours, the subtitles' wording and the numeral style stay as they are. This feature changes how they move, not what they are.
- The app already turns off all motion when the device asks for reduced motion. This feature builds on that rule rather than replacing it.
- Motion uses the timing the design system already defines for short changes and sheets, so it fits the rest of the app.
- No new libraries are needed for the motion. The browser's own capabilities are enough, and planning will confirm this.
- Address bar and history behaviour stay as they are today: the same hash links, and the same entries for each move.
