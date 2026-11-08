/**
 * The piece creator's curated menswear colours. These are garment colours (data, like item.color),
 * not interface tokens: they never change with the theme.
 */
export interface PaletteColour {
  name: string;
  hex: string;
}

export const PALETTE: PaletteColour[] = [
  { name: "navy", hex: "#22304a" },
  { name: "charcoal", hex: "#3b3d42" },
  { name: "grey", hex: "#8a8d91" },
  { name: "stone", hex: "#c9c1b1" },
  { name: "cream", hex: "#ece3cf" },
  { name: "white", hex: "#f4f3ef" },
  { name: "light blue", hex: "#a9c1dc" },
  { name: "olive", hex: "#5f6340" },
  { name: "camel", hex: "#b08a5a" },
  { name: "brown", hex: "#5a3e2b" },
  { name: "oxblood", hex: "#5e1f24" },
  { name: "black", hex: "#1d1d1f" },
];

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/** Name of the palette colour closest to `hex` (squared RGB distance). */
export function nearestColourName(hex: string): string {
  const c = hexToRgb(hex);
  if (!c) return PALETTE[0].name;
  let best = PALETTE[0], bestD = Infinity;
  for (const p of PALETTE) {
    const [r, g, b] = hexToRgb(p.hex)!;
    const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
    if (d < bestD) { best = p; bestD = d; }
  }
  return best.name;
}

export const paletteHex = (name: string) => PALETTE.find((p) => p.name === name)!.hex;
