/**
 * Colour from photo pixels (RGBA, row-major, as in ImageData.data). Pure: no DOM, so it runs in tests.
 */

export const rgbToHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

/** Within 6% of pure white or pure black: a typical studio background. */
const nearWhiteOrBlack = (r: number, g: number, b: number) => {
  const t = 255 * 0.06;
  return (r > 255 - t && g > 255 - t && b > 255 - t) || (r < t && g < t && b < t);
};

/**
 * The photo's main colour: the mean of the most-populated 4-bit-per-channel bucket in the central 60% box.
 * Transparent pixels are skipped, and so are near-white/near-black ones unless nothing else is left.
 */
export function dominantColour(px: ArrayLike<number>, w: number, h: number): string {
  const x0 = Math.floor(w * 0.2), x1 = Math.max(x0 + 1, Math.ceil(w * 0.8));
  const y0 = Math.floor(h * 0.2), y1 = Math.max(y0 + 1, Math.ceil(h * 0.8));
  const tally = (skipExtremes: boolean) => {
    const buckets = new Map<number, [number, number, number, number]>();
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const i = (y * w + x) * 4;
        const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
        if (a < 128 || (skipExtremes && nearWhiteOrBlack(r, g, b))) continue;
        const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        const s = buckets.get(key) || [0, 0, 0, 0];
        s[0] += r; s[1] += g; s[2] += b; s[3]++;
        buckets.set(key, s);
      }
    return buckets;
  };
  let buckets = tally(true);
  if (!buckets.size) buckets = tally(false);
  let best: [number, number, number, number] | null = null;
  for (const s of buckets.values()) if (!best || s[3] > best[3]) best = s;
  if (!best) return "#808080";
  return rgbToHex(best[0] / best[3], best[1] / best[3], best[2] / best[3]);
}

/** Mean colour of the 5×5 area around (x, y), clamped at the edges. */
export function sampleAt(px: ArrayLike<number>, w: number, h: number, x: number, y: number): string {
  let r = 0, g = 0, b = 0, n = 0;
  const cx = Math.round(x), cy = Math.round(y);
  for (let yy = Math.max(0, cy - 2); yy <= Math.min(h - 1, cy + 2); yy++)
    for (let xx = Math.max(0, cx - 2); xx <= Math.min(w - 1, cx + 2); xx++) {
      const i = (yy * w + xx) * 4;
      r += px[i]; g += px[i + 1]; b += px[i + 2]; n++;
    }
  return n ? rgbToHex(r / n, g / n, b / n) : "#808080";
}

const parse = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

/** Perceived brightness, 0 (black) to 1 (white). Unparseable colours count as mid-grey. */
export function luminance(hex: string) {
  const c = parse(hex);
  if (!c) return 0.5;
  return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
}

/** `a` moved `t` (0–1) of the way toward `b`. Returns `a` unchanged if either isn't a 6-digit hex. */
export function mix(a: string, b: string, t: number) {
  const x = parse(a), y = parse(b);
  if (!x || !y) return a;
  return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
}

/** A garment's single depth shade: toward the ink, or toward white for near-black cloth so it still reads. */
export const shade = (hex: string, ink: string) => (luminance(hex) < 0.12 ? mix(hex, "#ffffff", 0.18) : mix(hex, ink, 0.22));
