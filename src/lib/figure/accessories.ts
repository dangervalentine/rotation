import { mix } from "../colour.ts";
import type { Item, Look } from "../types.ts";
import { armAt, armBand, BODY } from "./body.ts";
import { detail, fabric, hardwareHex, mirror, outline, path, type Paint } from "./paint.ts";

/** Accessories worn on the head: only the cartoon has one to wear them on. */
export const HEAD_WORN = new Set(["glasses", "sunglasses", "hat"]);

/** Crops for accessory tiles, around where each is worn. */
export const ACC_VIEWBOX: Record<string, string> = {
  glasses: "34 -26 52 44",
  sunglasses: "34 -26 52 44",
  hat: "30 -32 60 50",
  watch: "82 78 28 20",
  tie: "46 24 28 56",
  scarf: "38 20 44 56",
};

/**
 * The accessories a look draws, by where they're painted. One of each style;
 * sunglasses win over glasses. The generic accessory and anything not an accessory are skipped.
 */
export function lookAccessories(items: Item[], look: Look) {
  const seen = new Map<string, Item>();
  for (const id of look.acc ?? []) {
    const it = items.find((i) => i.id === id);
    if (it && it.cat === "other" && ACC_VIEWBOX[it.style] && !seen.has(it.style)) seen.set(it.style, it);
  }
  if (seen.has("sunglasses")) seen.delete("glasses");
  return seen;
}

export function tieSvg(p: Paint, it: Item) {
  const f = fabric(p, it, 4);
  return (
    f.defs +
    path("M57.6 30.6 L62.4 30.6 L61.6 35.8 L58.4 35.8 Z", f.fill, outline(p)) +
    path("M58.4 35.8 L61.6 35.8 L64.4 70 L60 75.5 L55.6 70 Z", f.fill, outline(p)) +
    path("M58.4 35.8 L61.6 35.8 L61.2 38 L58.8 38 Z", f.shade, `opacity="0.7"`)
  );
}

export function scarfSvg(p: Paint, it: Item) {
  const f = fabric(p, it, 4);
  return (
    f.defs +
    path("M64 33 L71 33 L70 72 L63 72 Z", f.fill, outline(p)) +
    `<path d="M64 70 L64 75 M66.3 70 L66.3 75 M68.6 70 L68.6 75" ${detail(p, f.base)}/>` +
    path("M44.5 26.5 Q60 35.5 75.5 26.5 L76.5 32 Q60 42.5 43.5 32 Z", f.fill, outline(p)) +
    `<path d="M45 29.4 Q60 38.6 75 29.4" stroke="${f.shade}" stroke-width="1.2" fill="none"/>`
  );
}

/** A watch on the left wrist (the viewer's right). */
export function watchSvg(p: Paint, it: Item) {
  const a = armAt(BODY.wrist - 1);
  const strap = mirror(armBand(BODY.wrist - 3.5, BODY.wrist + 0.5, 0.4));
  const x = (120 - a.cx).toFixed(1);
  return (
    path(strap, it.color, outline(p)) +
    `<circle cx="${x}" cy="${BODY.wrist - 1.5}" r="2.6" fill="${hardwareHex(it)}" ${outline(p, p.ow * 0.7)}/>` +
    `<circle cx="${x}" cy="${BODY.wrist - 1.5}" r="1.6" fill="#f4f3ef"/>`
  );
}

/** Glasses and sunglasses: frames in the item's colour, at eye level. */
export function eyewearSvg(p: Paint, it: Item) {
  const frame = it.color;
  const sun = it.style === "sunglasses";
  const lens = sun ? `fill="#1d1d1f" fill-opacity="0.85"` : `fill="#ffffff" fill-opacity="0.18"`;
  const st = `stroke="${frame}" stroke-width="${sun ? 1.6 : 1.3}" vector-effect="non-scaling-stroke" stroke-linejoin="round"`;
  const shape = (cx: number) =>
    sun ? `<path d="M${cx - 5.4} 1.6 L${cx + 5.4} 1.6 L${cx + 4.6} 7.4 Q${cx} 10 ${cx - 4.6} 7.4 Z" ${lens} ${st}/>` : `<circle cx="${cx}" cy="5" r="4.6" ${lens} ${st}/>`;
  return (
    shape(53) +
    shape(67) +
    `<path d="M57.6 4 Q60 2.6 62.4 4 M48.4 3.6 L40.6 1.8 M71.6 3.6 L79.4 1.8" fill="none" ${st}/>`
  );
}

/** A cap: crown over the hair, button on top, brim in shade. */
export function hatSvg(p: Paint, it: Item) {
  const f = fabric(p, it, 4);
  return (
    path("M39.4 0.4 Q39 -24.6 60 -24.6 Q81 -24.6 80.6 0.4 Z", f.fill, outline(p)) +
    `<path d="M60 -24.4 L60 -1 M49 -21.4 Q46 -10 46.6 0 M71 -21.4 Q74 -10 73.4 0" ${detail(p, f.base)}/>` +
    `<circle cx="60" cy="-24.8" r="1.6" fill="${f.base}" ${outline(p, p.ow * 0.6)}/>` +
    path("M37 0.6 Q60 -5 83 0.6 Q85 4.6 81.4 5 Q60 0.6 38.6 5 Q35 4.6 37 0.6 Z", mix(f.shade, p.ink, 0.15), outline(p))
  );
}
