# OverflowText

One line of text that ends in an ellipsis when it doesn't fit, and shows the whole text in a small tooltip. Used for piece names on a LookCard.

**Consumer provides:** `text` (required), optional `href` (renders a link instead of a span) and `className` (for the layout it sits in; it must be able to shrink, e.g. `min-width: 0` in a grid).

**Behaviour**

- The tooltip only appears when the text is actually cut off. Text that fits gets no tooltip.
- It opens on hover after a short pause (250ms), and right away on keyboard focus.
- It stays open while the pointer moves onto it, so it can be read or zoomed. Escape, blur, moving away, scrolling or resizing the window closes it.
- It is placed above the text, or below when there is no room above, and stays 8px inside the window. It is fixed to the window and rendered at the end of `<body>`, so a card's clipping can't cut it off.
- Ink on paper, so it flips with the theme. Its fade-in follows the reduced-motion setting.

**Accessibility:** the tooltip is visual only (`aria-hidden`). Clipping is visual, so the full text is already the element's accessible name, and screen readers would otherwise hear it twice. Don't add a `title` as well, or the browser's own tooltip shows up on top of this one.
