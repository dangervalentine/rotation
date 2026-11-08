# GarmentCard

One wardrobe item as a catalogue plate: a 4:5 field of the garment's colour (or its photo), an owned / to-buy tag, then category kicker, name in the display face, brand in italic, and a mono credit line with price and days worn.

**Consumer provides:** `category` (`layer | shirt | undershirt | belt | pants | basics | shoes | other`; `basics` is socks & underwear), `name`, optional `style`, `brand`, `color` (hex) and `stripe`, `image` (URL; covers the plate), `price` (pre-formatted, e.g. `money(it.price)`), `qty`, `owned` (boolean), `worn` (days in the current rotation), and `onSelect` to make the whole card a button (the app opens the item editor).

- Name the garment the way a shop credit would: colour + cut + type ("Charcoal flannel trousers"); put the brand in `brand`, not the name.
- Use a grid of cards for browsing; use the Wardrobe table for editing costs.
- Photos: cut-outs or flat-lays on a plain ground. No lifestyle shots in the plate.
