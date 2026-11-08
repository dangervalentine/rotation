# Feature Specification: Outfit Builder Polish & Sketch-a-Piece

**Feature Branch**: `002-outfit-builder-polish`

**Created**: 2026-11-08

**Status**: Draft

**Input**: User description: "give a concentrated pass on the wardrobe creation tool, making it as nice to use and as easy as possible. allow people to import their own clothes from their wardrobe but also allow creating something from scratch. focus on a premium look and feel"

**Clarified intent** (from the user, during specification): the "wardrobe creation tool" is the **outfit builder**, the mix-and-match workspace where a person assembles a look slot by slot. Its per-slot dropdowns already pull in the person's own wardrobe items, and that part stays as it is. What's missing is a way to **create a piece they haven't added to their wardrobe**, from scratch and without leaving the builder, so they can mix and match with it. For pieces made from a photo, the app samples the colour from the photo on the device. It does not try to recognise the garment.

## Clarifications

### Session 2026-11-08

- Q: Where should sketched pieces live, and which features should be able to use them? → A: In their own **Sketches** group on the Wardrobe tab. They are left out of cost totals and "Left to buy". The builder can use them (pickers, Shuffle, Try every), but Generate rotation never picks them. The person promotes a sketch to "To buy" or "Owned" when it becomes real.

## Overview

The outfit builder appears in two places: the **Outfits** view (Mix and match workspace) and the **Rotation** day panel. Today it shows a figure, one dropdown per slot (Top layer, Shirt, Belt, Pants, Shoes) with a "Keep" check, a shuffle button and a "Try every" strip of one-slot variations. When a slot has nothing suitable, the only way forward is to leave the builder for the Wardrobe tab, fill in the full item form, and come back.

This feature makes three changes:

1. **Sketch a piece**: each slot offers "Create a piece…", which opens a short, visual creator inside the builder. The person picks a style and a colour, sees the figure wearing it straight away, and drops it into the look in a few taps. The piece is kept in the wardrobe's own **Sketches** group, apart from the clothes the person owns or plans to buy.
2. **Make the builder easy**: fewer steps for common actions, clear feedback, undo for changes the person didn't mean to make, and sensible empty states.
3. **Premium look and feel**: the builder should feel like a crafted, editorial tool in keeping with the Rotation design system (ink on newsprint, display serif, hairline rules, garments as the only saturated colour), with considered motion, spacing and detail.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sketch a piece I don't own, right in the builder (Priority: P1)

A person is building a look and wonders how an olive overshirt would work with their grey trousers, but they don't own one and haven't added it. In the Top layer slot they choose "Create a piece…". A compact creator opens in place. They tap a style (jacket), tap a colour from a curated menswear palette (olive), optionally type a name, and the figure on the builder already shows the olive jacket. They confirm, the piece fills the slot, and they keep mixing.

**Why this priority**: This is the capability the user asked for. Without it, the builder only works with clothes already entered, and trying out an idea means a detour through the wardrobe form.

**Independent Test**: In the Outfits builder, from an empty or populated look, create a piece in any slot without leaving the view. Confirm the piece appears on the figure, fills the slot, and shows on the Wardrobe tab in the Sketches group, not in the cost totals.

**Acceptance Scenarios**:

1. **Given** the builder is open, **When** the person opens any slot's picker, **Then** the last entry is "Create a piece…" (after the person's own items and, for optional slots, "None").
2. **Given** the person chooses "Create a piece…" for a slot, **When** the creator opens, **Then** the category is already set to that slot, a sensible default style and colour are pre-selected, and the person can confirm straight away with no typing.
3. **Given** the creator is open, **When** the person changes the style, colour or stripe, **Then** the builder's figure updates live to show the piece in the look before it is confirmed.
4. **Given** the creator is open, **When** the person confirms, **Then** the piece is added to the wardrobe's Sketches group, the slot selects it, and focus returns to that slot's picker.
5. **Given** the creator is open, **When** the person cancels (button, Escape, or closing the panel), **Then** nothing is added and the look returns to what it was before the creator opened.
6. **Given** the person leaves the name blank, **When** they confirm, **Then** the piece gets a readable name from its colour and style (for example "Olive jacket"), unique among the wardrobe's names.
7. **Given** a sketched piece exists, **When** the person looks at it in the slot picker, the "Try every" strip, the lookbook or the Wardrobe tab, **Then** it is marked as a sketch, so ideas can't be mistaken for clothes they have or plan to buy.
8. **Given** the builder inside the Rotation day panel, **When** the person creates a piece there, **Then** it works the same way and the day's unapplied changes include the new piece.

---

### User Story 2 - A builder that is effortless to use (Priority: P1)

A person sits down to put together a week of looks. Picking pieces, shuffling and trying variations should feel quick and forgiving: they can see what each choice will look like before committing, reverse any change they didn't intend, and always know what is kept, what is a sketch and what is owned.

**Why this priority**: The user asked for the tool to be "as nice to use and as easy as possible". The builder is the centre of the app, and every rotation day goes through it.

**Independent Test**: Build a complete look from an empty one using only the builder, shuffle it, undo the shuffle, and try every shirt. Confirm each step needs no more than one action and that nothing the person sets up gets lost by accident.

**Acceptance Scenarios**:

1. **Given** a look in the builder, **When** the person shuffles, picks a variation from "Try every", or changes a slot, **Then** they can undo that change with one action (and redo it), back to at least the last 20 changes in the session.
2. **Given** the slot pickers, **When** the person opens one, **Then** each option shows the item's swatch, its name and whether it is owned or a sketch, and pieces already in the look are marked as current.
3. **Given** the person hovers over or moves keyboard focus through a slot's options, **When** an option is highlighted, **Then** the figure previews that piece without committing it, and goes back to the committed look when the picker closes without a choice.
4. **Given** a slot is set to "Keep", **When** the person shuffles, **Then** kept slots are clearly marked on the figure-side controls and are never changed, and the shuffle never picks the same full look it started from if another combination exists.
5. **Given** a slot has no items in the wardrobe, **When** the builder shows that slot, **Then** it says so in that slot and offers "Create a piece…" right there, instead of a dead end telling them to visit another tab.
6. **Given** the builder is used by keyboard alone, **When** the person moves through the slots, Keep toggles, shuffle, undo and "Try every", **Then** every control is reachable, its state is announced, and focus is always visible.
7. **Given** a phone-width screen, **When** the person uses the builder and the creator, **Then** every control fits with no sideways page scroll, touch targets are comfortably sized, and the figure stays in view while slots change.

---

### User Story 3 - It looks and feels premium (Priority: P2)

Opening the builder feels like working on a page of a menswear magazine rather than filling in a form. The figure is the hero. Slots read like a styled list of pieces, the creator's palette looks curated, and changes animate gently so the person sees what changed.

**Why this priority**: The user named a premium look and feel as the focus. It rests on Stories 1 and 2: polish without the creator or the usability fixes would miss the point.

**Independent Test**: A reviewer compares the builder before and after in both light and dark themes and on phone and desktop widths, and confirms it meets the visual requirements below (hierarchy, motion, palette, consistency with the design system) without breaking any design-system rule.

**Acceptance Scenarios**:

1. **Given** the builder, **When** it loads, **Then** the figure is the most prominent element, the slots sit beside it on wide screens (below it on phones) as a styled list of pieces with swatches, and the actions are grouped and visually secondary to the look.
2. **Given** a piece changes (by pick, shuffle, variation or undo), **When** the figure updates, **Then** the changed slot shows a short, gentle transition, and people who have asked their system for reduced motion get an instant change instead.
3. **Given** the creator's colour palette, **When** it is shown, **Then** it offers a curated set of menswear colours (for example navy, charcoal, camel, olive, oxblood, cream, white, light blue, brown, black, grey, stone), each with its name on hover or focus, plus a "Custom colour" option for any other colour.
4. **Given** the creator's style options, **When** they are shown, **Then** each style for the slot appears as a selectable tile with a small silhouette of that garment, not as a plain list.
5. **Given** light and dark themes, **When** the builder and creator are viewed in either, **Then** all text and controls meet the design system's contrast promises, and garment colours are shown as they are, never tinted by the theme.
6. **Given** the "Try every" strip, **When** it shows variations, **Then** each variation is a small figure with the piece's name, the current one is clearly marked, and the strip scrolls smoothly sideways on its own without moving the page.

---

### User Story 4 - Take a sketch's colour from a photo (Priority: P3)

A person saw a jacket in a shop window or online and has a photo or screenshot of it. In the creator they choose "From a photo", pick the image, and tap the garment in the photo to take its colour. The sketch uses that colour, and the photo is kept with the piece as its picture.

**Why this priority**: It makes getting a colour right easier and more satisfying, but the curated palette and custom colour already cover the need. It's an enhancement on top of Story 1.

**Independent Test**: In the creator, choose a photo from the device, tap a spot on the garment, and confirm the sketch's colour matches that spot and the photo appears as the piece's picture on the Wardrobe tab.

**Acceptance Scenarios**:

1. **Given** the creator is open, **When** the person chooses "From a photo" and picks an image, **Then** the image is shown in the creator and the app suggests the image's main colour as the sketch's colour.
2. **Given** the photo is shown, **When** the person taps or clicks a point on it, **Then** the sketch's colour changes to the colour around that point, and the figure updates live.
3. **Given** a photo is used, **When** the piece is confirmed, **Then** a reduced-size copy of the photo is kept as the piece's picture, and the photo never leaves the device for colour sampling.
4. **Given** the picked file isn't an image or can't be read, **When** the person picks it, **Then** a plain message says so, and the creator stays open with its previous colour.

---

### Edge Cases

- **Name collisions**: a sketch named the same as an existing item is given a distinct name (for example "Olive jacket 2") so pickers and lookbook entries stay unambiguous.
- **Undoing a creation**: undoing the step that put a sketch into a slot clears it from the slot, but the sketch stays in the wardrobe. Deleting it stays a deliberate action on the Wardrobe tab, so an undo never silently deletes wardrobe data.
- **Discarding the Rotation panel's changes**: if a person creates a sketch in the Rotation day panel and then discards that day's changes, the sketch stays in the wardrobe (as with undo) and the day goes back to its previous look.
- **Unsaved app data**: sketches count as unsaved changes to the wardrobe, like any other edit, and are kept or discarded with the app's existing save and discard flow.
- **Very large wardrobes**: with many items in one slot (50+), the picker stays quick to scan. Owned items are listed before sketches, and the person can type to jump to an item by name.
- **Empty wardrobe**: a person with no items at all can still build a full look from sketches alone.
- **"Other" category**: sketches can only be made for the five outfit slots. Socks, undershirts and other items are still added from the Wardrobe tab.
- **Turning a sketch into real clothing**: on the Wardrobe tab the person promotes a sketch to "To buy" or "Owned". It then leaves the Sketches group, joins the cost totals, and becomes available to Generate rotation. Promoting doesn't change its looks, outfits or rotation days.
- **Sketches already in a rotation**: a person can put a sketch on a rotation day by hand (through the day panel or a saved outfit), and it stays there. Generate rotation never picks a sketch for any day. When it regenerates days, it replaces sketches like any other piece.
- **Large photos**: very large images are reduced before being kept, so one photo doesn't noticeably bloat the saved wardrobe. Images too large to process show a plain message.
- **Reduced motion**: every transition added by this feature has an instant equivalent.

## Requirements *(mandatory)*

### Functional Requirements

**Sketch a piece (creator)**

- **FR-001**: Each slot picker in the outfit builder MUST offer a "Create a piece…" entry, in both the Outfits workspace and the Rotation day panel.
- **FR-002**: The creator MUST open within the builder, without leaving the current view or losing the look being built, and MUST pre-select the slot's category, a default style and a default colour so the person can confirm without other input.
- **FR-003**: The creator MUST let the person choose a style from the slot's styles, a colour from a curated palette of at least 12 named menswear colours or a custom colour, an optional stripe colour, and an optional name.
- **FR-004**: While the creator is open, the builder's figure MUST show the look wearing the sketch, updating as each choice changes.
- **FR-005**: Confirming MUST add the sketch to the wardrobe's Sketches group in that slot's category, select it in the slot, and return focus to that slot's picker.
- **FR-006**: Cancelling MUST add nothing and restore the look exactly as it was before the creator opened.
- **FR-007**: A sketch confirmed without a name MUST be named from its colour name and style (for example "Olive jacket"). Every sketch name MUST be unique among wardrobe item names.
- **FR-008**: Sketches MUST be recognisable as sketches, distinct from both "Owned" and "To buy", wherever items appear: slot pickers, "Try every", lookbook piece lists, the Wardrobe table and cards.
- **FR-009**: A sketch MUST be editable and deletable on the Wardrobe tab like any item, and usable in the builder's pickers, shuffles, variations and saved outfits, and on rotation days the person sets by hand.
- **FR-027**: The Wardrobe tab MUST list sketches in their own Sketches group, in both table and cards layouts, and MUST leave them out of every cost figure (whole wardrobe, already owned, left to buy, category totals).
- **FR-028**: Generate rotation MUST never place a sketch on any day.
- **FR-029**: The person MUST be able to promote a sketch to "To buy" or "Owned" in one action from the Wardrobe tab. A promoted item is no longer a sketch and from then on behaves like any other wardrobe item, including in costs and Generate rotation.

**Ease of use**

- **FR-010**: The builder MUST provide undo and redo for look changes (slot picks, shuffles, variations, sketch insertions), keeping at least the last 20 changes for the current session of that builder.
- **FR-011**: Slot picker options MUST show each item's swatch, name and owned or sketch status, and MUST list owned items before sketches.
- **FR-012**: Highlighting an option in a slot picker (by pointer or keyboard) MUST preview it on the figure without committing it. Closing the picker without choosing MUST restore the committed look.
- **FR-013**: Slot pickers MUST support typing to jump to an item by name.
- **FR-014**: A slot with no wardrobe items MUST say so within that slot and offer "Create a piece…" there.
- **FR-015**: Shuffle MUST never change kept slots, and MUST return a different look from the current one whenever another combination exists.
- **FR-016**: All builder and creator controls MUST be usable by keyboard alone, with visible focus and their state (kept, selected, owned or sketch, current variation) announced to assistive technology.
- **FR-017**: At phone width the builder and creator MUST fit without sideways page scrolling, with touch targets of at least 44 by 44 pixels.

**Premium look and feel**

- **FR-018**: The builder layout MUST make the figure the primary element, with slots presented as a styled list of pieces beside the figure on wide screens and below it on narrow screens.
- **FR-019**: Changes to the look MUST animate briefly on the changed slot (well under half a second), and MUST change instantly for people who have turned on reduced motion.
- **FR-020**: The creator MUST present styles as selectable tiles with a garment silhouette, and colours as named swatches.
- **FR-021**: The builder and creator MUST follow the Rotation design system: existing tokens for type, spacing, rules and colour; garment colours shown untinted; contrast promises met in both light and dark themes; no new visual language that conflicts with the system's principles. New tokens or components MUST be added through the design system, with usage notes.
- **FR-022**: The "Try every" strip MUST scroll sideways on its own without scrolling the page, clearly mark the current variation, and include sketches.

**Colour from a photo**

- **FR-023**: The creator MUST let the person pick a photo from their device, suggest the photo's main colour, and let them tap or click a point on the photo to take the colour there.
- **FR-024**: Photo processing for colour MUST happen entirely on the person's device, with no image sent to any outside service.
- **FR-025**: When a photo is used, a reduced-size copy MUST be kept as the sketch's picture, small enough that each photo adds no more than about 150 KB to the saved wardrobe.
- **FR-026**: Files that aren't readable images MUST produce a plain, in-app message and leave the creator's state unchanged.

### Key Entities

- **Wardrobe item**: an existing entity (category, name, style, colour, optional stripe, price, quantity, owned, optional picture, brand, notes). A sketch is a wardrobe item marked as a sketch, created from the builder. No new entity is needed. Each item has exactly one status: Sketch, To buy or Owned. Sketches are left out of costs and Generate rotation, and promoting a sketch changes its status to To buy or Owned.
- **Look**: an existing entity, one item (or none for optional slots) per slot. Unchanged.
- **Builder history**: the session-only list of look states the builder keeps for undo and redo. It is not saved with the wardrobe.
- **Palette colour**: a named colour in the creator's curated menswear palette (name and colour value), defined once and shared by the creator everywhere it appears.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A person can create a new piece from a slot and see it in the look in under 15 seconds, using no more than 3 actions when the defaults are acceptable (open the slot picker, choose "Create a piece…", confirm), and no more than 5 actions when choosing a style and colour.
- **SC-002**: Creating a piece never requires leaving the builder's view. 100% of the creator flow happens in place in both the Outfits workspace and the Rotation day panel.
- **SC-003**: Any unintended change to a look (shuffle, variation, pick) can be reversed with one action in 100% of cases within the last 20 changes.
- **SC-004**: In a usability walk-through, at least 9 out of 10 first-time users build a complete five-slot look, including one sketched piece, without help.
- **SC-005**: The Outfits view keeps its accessibility audit score at 100 and introduces no new contrast, labelling or keyboard issues in either theme.
- **SC-006**: Look changes appear on the figure without perceptible delay (under 100 ms) on a mid-range phone, including while previewing options in a picker.
- **SC-007**: In a side-by-side review of before and after, reviewers rate the builder as more polished and "premium" on a 5-point scale, averaging 4 or higher, with no design-system rule broken.
- **SC-008**: A saved wardrobe with 20 photo sketches stays under 3 MB.

## Assumptions

- "Import their own clothes from their wardrobe" refers to the builder's existing slot dropdowns, which already list the person's own items. The user confirmed these stay as they are, so no new import sources (bulk links, photo-to-item recognition, order text) are part of this feature.
- Sketches live in the wardrobe data, so saving, export and import carry them, but they are a separate status from To buy and Owned (see Clarifications). New sketches have a price of zero and quantity one, which the person can edit.
- Sketches are limited to the five outfit slots. "Other" items (socks, undershirts) keep being added from the Wardrobe tab.
- Garment recognition from photos is out of scope by the user's choice. Photos are used only to sample colour and as the piece's picture, entirely on the device.
- Undo and redo history lasts for the current session of the builder and is not saved. Sketches themselves follow the app's existing save and discard flow.
- The existing full item form on the Wardrobe tab stays for detailed edits (price, brand, link, notes). The creator is deliberately short.
- The curated palette's exact colours and names are a design decision, made during planning within the design system's principles.
- The work builds on the existing design system, panel and dialog components, and the accessibility audit tooling from feature 001.
