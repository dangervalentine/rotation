# Research: Animated Shared Page Header

**Feature**: 004-animated-page-header | **Date**: 2026-11-09

Each entry gives the decision, the rationale and the alternatives considered.

---

## R1. One head, owned by `App`

**Decision**: `App` renders the page head once, at the top of `<main>`, from the current `route.view`. Each view drops its `<PageHead>` call. The head is a new design-system component, `StepHead`. It always stays mounted, and its props change on navigation, so React keeps the same DOM nodes from step to step.

**Rationale**: FR-001 asks for one head that stays on screen. When React keeps the nodes, colour and text can change in place with ordinary CSS: there is nothing to unmount, so nothing to snapshot.

**Alternatives considered**:
- *Keep `PageHead` inside each view and match them with a shared view-transition name.* The head would still be destroyed and rebuilt each time. Both copies would be snapshots, so the numeral roll couldn't be clipped inside its block, and the colour would crossfade between two pictures instead of blending.
- *Put the head inside `Masthead`.* The masthead bar is `no-print` and shared by every screen. The page head must keep today's print behaviour (R9), and it must sit below the bar as it does today.

---

## R2. A page's own actions (the "aside") stay with the page

**Decision**: `StepHead` renders an empty aside slot. A view fills it with `<StepAside>…</StepAside>`, which **portals** its children into that slot. The slot node is held in React context through a callback ref, so the portal is ready in the same commit. Pages with nothing to add render no `StepAside`.

**Rationale**: The asides depend on each view's own state: Wardrobe's layout switch and "Add an item", Outfits' "Editing …" line, the Print button. A portal keeps that state and its handlers inside the view, while the actions appear beside the head as they do today. Because the slot belongs to the page's content (R4), the actions arrive and leave with it (FR-009).

**Alternatives considered**:
- *Lift each view's aside state into `App`.* This spreads view state into `App` (Wardrobe's `layout` and `editing`, Outfits' `base`) for a purely visual reason.
- *Render the actions in a row under the head inside each view.* This changes the settled layout, which breaks FR-016 and SC-006.

---

## R3. The head's numeral, title and subtitle roll in code; the colour blends in CSS

**Decision**: Use a small `RollText` component for the numeral, the title and the subtitle. When its `value` changes, it briefly renders two layers in the same grid cell:
- the **leaving** value, `aria-hidden`, which slides out and fades;
- the **arriving** value, which slides in.

The direction is a `dir="forward" | "back"` prop. Forward moves up (the old value leaves upward and the new one comes in from below), and back moves down. When the arriving layer's `animationend` fires, the leaving layer is dropped.

The numeral's block already has `overflow: hidden`, so its roll is clipped neatly inside the block. The title and subtitle aren't clipped, so their descenders stay visible: they travel a short distance (0.35 em) and cross-fade.

The step colour blends with a CSS transition on `background-color`, `color` and `border-color` wherever `--step`, `--on-step` or `--step-ink` is used: the numeral block, the head's heavy rule and the active tab's underline. `.wrap`'s `rt-step-N` class still drives the colour, so no new state is needed.

**Rationale**:
- Since the head stays mounted (R1), plain CSS gives a real colour blend and a properly clipped roll, which snapshot-based motion can't.
- A grid stack with both layers in one cell sizes to the larger of the two, so the head's height doesn't jump in the middle of the roll.
- Interruption (FR-010) comes for free. A new value makes the current arriving layer the leaving one, and the newest value always ends up on top.

**Alternatives considered**:
- *A view-transition name on each part of the head.* Snapshots are drawn in the top layer, so the block's `overflow: hidden` can't clip them. (Nested view-transition groups would fix this, but only recent Chromium supports them.) The colour would also cross-fade between two images instead of blending.
- *An animation library* (Motion, react-spring). It adds a dependency for two keyframes, which the project's no-new-dependencies habit rules out (features 001–003).

---

## R4. The page content moves with the View Transitions API

**Decision**: When a navigation changes the **step**, `App` applies the new route inside `document.startViewTransition(() => flushSync(() => setRoute(next)))`.

- The content area (`.step-page`, which wraps the view below the head) gets `view-transition-name: step-page`.
- The aside slot gets `view-transition-name: step-aside`.
- Both slide with the step direction. Forward: the old content slides toward the start (left, 24 px) and fades out, and the new content slides in from the end. Back is the reverse.
- Only the old and new images move. Their `::view-transition-group` gets `animation: none`, so a page left scrolled far down doesn't fly up the screen as the group moves from its old box to its new one. The old page is fully faded by 60% of the change, and the new one stays hidden until 35%, so the two never sit half-faded on top of each other. (Added during implementation: analysis finding U1 and a review of the mid-change frames.)
- The root's old snapshot is hidden and the root's new image is shown with no animation. The head lives in the root, which is live, so its CSS rolls and colour blend (R3) play normally underneath.
- The direction is set as `data-step-dir="forward|back"` on `<html>` before the transition starts, and cleared when it finishes. CSS reads it as `:root[data-step-dir=back]::view-transition-old(step-page)`, and so on.

**Rationale**:
- The old view is unmounted the moment the route changes. A view transition is the only way to animate its exit without keeping a stale copy of the whole view mounted.
- `flushSync` makes React commit inside the update callback, so the browser captures the finished new state.
- A data attribute on `<html>` works in every browser that supports view transitions, unlike transition `types`.
- Support: Chrome/Edge 111+, Safari 18+ and Firefox 144+. Where `startViewTransition` is missing, the route simply changes at once, so the content switches instantly. The head's own rolls and colour blend (R3) still play there.

**Alternatives considered**:
- *React's `<ViewTransition>` component with `startTransition` and `addTransitionType`.* It's exported by React 19.3, but routes come in through `popstate`, and React finishes transitions started in `popstate` synchronously. That makes Back and Forward behaviour harder to guarantee (FR-011). Calling `startViewTransition` directly is a few lines and gives the same result with full control.
- *Keep the old view mounted and animate both views in React.* The old view would be stale but live, with its own effects, focus and autosave hooks, which is risky and a lot of code.

---

## R5. Direction and when a step change happens

**Decision**: A pure function in `src/lib/route.ts`:

`stepChange(prev: ViewId, next: ViewId): "forward" | "back" | null`

It returns `null` when the view is the same, `"forward"` when the next view comes later in `VIEW_ORDER`, and `"back"` when it comes earlier. A jump of several steps (1 → 4) is a single forward move (FR-007).

`App` calls it in its two route-setting paths, `onNav` (popstate and hashchange) and `navigate`. It calls it **after** the open-day guard has let the move through, so a blocked move never animates (FR-015). Moves within a step (an item's detail page, opening or closing a day) return `null`, so the route changes as it does today, with no transition (FR-014).

**Rationale**: Keeping the decision in one pure, node-testable function means "when do we animate, and which way" can be unit-tested, since Vitest runs in node with no DOM.

---

## R6. Interruptions and quick moves

**Decision**: If a step transition is still running when another step change arrives, call `startViewTransition` again. The browser skips the running one: the old one ends in its finished state and the new one starts from what is on screen. `RollText` re-targets on its own (R3). The `data-step-dir` attribute is only cleared by the `finished` promise of the transition that set it, so a newer move's direction is never wiped out.

**Rationale**: The browser's own skip rule keeps the DOM and the URL in step. The page always ends on the newest route (FR-010, SC-004).

---

## R7. Reduced motion and first load

**Decision**:
- When `matchMedia("(prefers-reduced-motion: reduce)")` matches, `App` doesn't start a view transition. The route changes at once.
- The existing global rule (`* { animation: none; transition: none }`) already stops the `RollText` keyframes and the colour transition. `RollText` doesn't wait for `animationend` under reduced motion. It drops the leaving layer straight away, so no hidden layers pile up.
- On first load, `RollText` renders only the initial value, and the colour transition has nothing to move from. A reload or deep link shows the page at once (FR-012).

**Rationale**: FR-013 allows an instant change. The global rule doesn't reach `::view-transition-*` pseudo-elements, so skipping the transition in code is the dependable way to stop it.

---

## R8. Timing and a new motion token

**Decision**: Add two tokens to `design-system/tokens.json` and regenerate `tokens.css` with `npm run tokens`:
- `motion-step-duration: 320ms`
- `motion-step-ease: cubic-bezier(.2, .7, .2, 1)`, the same curve as the quick ease

Every part of a step change (the numeral, title, subtitle, colour, content and aside) uses this one duration, so they start and finish together (US2, scenario 2). With the browser's capture and commit time added, the whole change settles in under 400 ms (FR-008).

**Rationale**: One shared token keeps the parts in sync and leaves a single number to tune.

---

## R9. Scroll, print, focus and screen readers

**Decision**:
- **Scroll.** Today a step change keeps the current scroll position, because no element has the id of a step. The spec asks that the person end at the top of the new page (US2, scenario 3). Inside the transition's update callback, `App` calls `window.scrollTo(0, 0)` along with the route change, so the new state is captured already at the top. The old page's image jumps to the new position as it fades (R4: the groups don't animate). That is brief and fading, and it's better than the image flying across the screen. Changes within a step keep today's scrolling (`WardrobeView` and `RotationView` already handle their own).
- **Print.** Today the Print view's head is inside its `no-print` settings section, and every other view's head prints. `StepHead` gets the `no-print` class when `view === "print"`, and only then, so printouts don't change (FR-018). View-transition names don't affect print.
- **One main heading.**
  - The title is the head's single `h1`, and its text is the arriving value. The leaving layer is `aria-hidden` and lives in the same `h1`, so assistive technology reads only the new title.
  - The numeral block stays `aria-hidden`.
  - The subtitle's leaving layer is `aria-hidden` too (FR-017).
- **Focus.** Navigation still happens through the tab links in the masthead bar. Focus stays on the clicked tab as it does today. The aside's controls move through a portal but keep their DOM order right after the head, ahead of the view's content.
- **Landmarks.** The head moves out of each view's labelled `<section>` to the top of `<main>`. The heading order (one `h1`, then each section's `h2`) doesn't change. This is a deliberate small change to the structure, and Lighthouse accessibility must still score 100.

---

## R10. The design system's motion rule

**Decision**: `design-system/README.md` currently says *"colour and background swaps at 150ms ease; no slides, bounces or parallax."* This feature adds one named exception: **step changes**, a short directional roll and slide using `motion-step-*`, which are removed under reduced motion. The README and a new `design-system/components/StepHead.md` record this. `SectionHead.md` stops describing the page-head (`level={1}`) usage that `StepHead` replaces.

**Rationale**: The user asked for directional motion between steps (clarification Q2). Writing the exception down keeps the rest of the app calm and stops slides spreading elsewhere.
