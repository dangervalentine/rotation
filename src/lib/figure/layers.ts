import { detailsOf } from "../styles.ts";
import type { Item } from "../types.ts";
import { sleeveEnd } from "./body.ts";
import { detail, detailInk, detailStroke, fabric, hardwareHex, n2, outline, pair, path, type Fabric, type Paint } from "./paint.ts";
import { sleeves } from "./tops.ts";

/** The body of a top layer: a little wider than a shirt, with its own neckline and hem. */
export function layerBodyD(neck: string, hem: number, w = 0, hemCentre = "") {
  return `M48 28 L${38 - w} 30 Q${33.7 - w} 31.5 ${34 - w} 37 L${34.5 - w} 60 L${36 - w} ${hem}${hemCentre ? " " + hemCentre : ""} L${84 + w} ${hem} L${85.5 + w} 60 L${86 + w} 37 Q${86.3 + w} 31.5 ${82 + w} 30 L72 28 ${neck} Z`;
}

/** Vertical rib ticks across a horizontal band, for knit hems. */
export function ribHem(p: Paint, f: Fabric, top: number, bottom: number, x0 = 36, x1 = 84) {
  let d = `M${x0} ${top} L${x1} ${top} `;
  for (let x = x0 + 3; x < x1 - 1; x += 3) d += `M${x} ${top + 0.8} L${x} ${bottom - 0.8} `;
  return `<path d="${d.trim()}" ${detail(p, f.base, p.dw * 0.8)}/>`;
}

const buttonsAt = (p: Paint, it: Item, ys: number[], r = 1.3, x = 60) =>
  ys.map((y) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hardwareHex(it)}" ${outline(p, p.ow * 0.6)}/>`).join("");

export function layerSvg(p: Paint, it: Item): string {
  const f = fabric(p, it, 6);
  const d = detailsOf(it);
  const end = sleeveEnd(d.sleeve, true);
  const rolled = d.sleeve === "rolled";
  let s = f.defs;

  switch (it.style) {
    case "sweater": {
      s += sleeves(p, f, end, "rib", 1, rolled);
      s += path(layerBodyD("Q60 37 48 28", 116), f.fill, outline(p));
      s += `<path d="M45.5 29 Q60 41 74.5 29" ${detail(p, f.base)}/>`;
      s += ribHem(p, f, 111, 116);
      return s;
    }
    case "cardigan": {
      s += sleeves(p, f, end, "rib", 1, rolled);
      s += path(layerBodyD("L60 66 L48 28", 116), f.fill, outline(p));
      s += `<path d="M45 29.5 L57.8 70 L57.8 116 M75 29.5 L62.2 70 L62.2 116" ${detail(p, f.base)}/>`;
      s += ribHem(p, f, 111, 116);
      s += buttonsAt(p, it, [74, 84, 94, 104], 1.1);
      return s;
    }
    case "jacket": {
      s += sleeves(p, f, end, "cuff", 1.5, rolled);
      s += path(layerBodyD("Q60 31 48 28", 115, 0.5), f.fill, outline(p));
      // Stand collar, zip, flapped chest pockets, hem band.
      s += path("M47 24.5 Q60 28 73 24.5 L73.5 31 Q60 34.5 46.5 31 Z", f.fill, outline(p));
      s += `<path d="M60 33 L60 115" stroke="${hardwareHex(it)}" stroke-width="1.2" fill="none"/>`;
      s += `<rect x="58.6" y="35" width="2.8" height="4.5" rx="0.8" fill="${hardwareHex(it)}" ${outline(p, p.ow * 0.5)}/>`;
      for (const pk of pair("M40 52 L53 52 L53 64 L40 64 Z")) s += path(pk, f.fill, detailStroke(p, f.base));
      for (const fl of pair("M39.5 51 L53.5 51 L53.5 56 L39.5 56 Z")) s += path(fl, f.fill, outline(p, p.ow * 0.7));
      s += `<path d="M36 109.5 L84 109.5" ${detail(p, f.base)}/>`;
      return s;
    }
    case "crewneck": {
      // Sweatshirt: raglan seams from neck to underarm, a wide rib hem and cuffs, a small V insert.
      s += sleeves(p, f, end, "rib", 1.2, rolled);
      s += path(layerBodyD("Q60 37 48 28", 116, 0.6), f.fill, outline(p));
      s += `<path d="M46 29.6 Q60 41.4 74 29.6 M47 30.4 L35 50 M73 30.4 L85 50" ${detail(p, f.base)}/>`;
      s += path("M57.6 36 L62.4 36 L60 40.4 Z", f.shade);
      s += ribHem(p, f, 110, 116);
      return s;
    }
    case "quarter-zip": {
      // Knit with a stand collar and a short zip.
      s += sleeves(p, f, end, "rib", 1, rolled);
      s += path(layerBodyD("Q60 31 48 28", 116), f.fill, outline(p));
      s += path("M47.4 24 Q60 27.4 72.6 24 L73 31 Q60 34.4 47 31 Z", f.fill, outline(p));
      s += `<path d="M60 26.6 L60 52" stroke="${hardwareHex(it)}" stroke-width="1.1" fill="none"/>`;
      s += `<rect x="58.8" y="49" width="2.4" height="4.2" rx="0.8" fill="${hardwareHex(it)}" ${outline(p, p.ow * 0.5)}/>`;
      s += ribHem(p, f, 111, 116);
      return s;
    }
    case "hoodie": {
      // Hood folded behind the neck, drawcords, a pouch pocket, rib hem and cuffs.
      s += path("M43 31 Q38 22 46 16 Q60 12 74 16 Q82 22 77 31 Q60 26 43 31 Z", f.shade, outline(p));
      s += sleeves(p, f, end, "rib", 1.4, rolled);
      s += path(layerBodyD("Q60 35 48 28", 116, 0.6), f.fill, outline(p));
      s += `<path d="M56 32.6 L55.4 50 M64 32.6 L64.6 50" stroke="${detailInk(f.base, p.ink)}" stroke-width="${n2(p.dw * 1.4)}" fill="none" stroke-linecap="round"/>`;
      s += path("M45 86 L75 86 L79 106 L41 106 Z", f.fill, detailStroke(p, f.base));
      s += ribHem(p, f, 110.5, 116);
      return s;
    }
    case "chore coat": {
      // Buttoned work jacket: point collar, three patch pockets.
      s += sleeves(p, f, end, "none", 1.5, rolled);
      s += path(layerBodyD("L60 46 L48 28", 120, 0.5), f.fill, outline(p));
      for (const c of pair("M48 28 L42.6 30.6 L46.6 41.4 L59.6 46 Z")) s += path(c, f.fill, outline(p));
      s += `<path d="M60 46 L60 120" ${detail(p, f.base)}/>`;
      s += buttonsAt(p, it, [54, 70, 86, 102], 1.2);
      s += path("M66 54 L77 54 L77 66 L66 66 Z", f.fill, detailStroke(p, f.base));
      for (const pk of pair("M40 92 L53 92 L53 106 L40 106 Z")) s += path(pk, f.fill, detailStroke(p, f.base));
      return s;
    }
    case "bomber": {
      // Rib-knit collar, cuffs and gathered hem; a zip; sleeve pocket.
      s += sleeves(p, f, end, "rib", 2, rolled);
      s += path(layerBodyD("Q60 31 48 28", 112, 1.4), f.fill, outline(p));
      s += path("M46.6 25.4 Q60 29 73.4 25.4 L73.6 31 Q60 34.6 46.4 31 Z", f.shade, outline(p));
      s += path("M37 107 L83 107 L83 114.5 L37 114.5 Z", f.shade, outline(p));
      s += ribHem(p, f, 107.4, 114.2, 37, 83).replace(/M37 107\.4 L83 107\.4 /, "");
      s += `<path d="M60 33 L60 114.5" stroke="${hardwareHex(it)}" stroke-width="1.1" fill="none"/>`;
      s += path("M24 44 L31 44 L31 50 L24 50 Z", f.fill, detailStroke(p, f.base));
      return s;
    }
    case "overcoat": {
      // Long coat to mid-thigh: notch lapels, two buttons, flap pockets.
      s += sleeves(p, f, end, "none", 2, rolled);
      s += path(layerBodyD("L60 74 L48 28", 142, 1.4), f.fill, outline(p));
      for (const lp of pair("M48 28 L42.6 29.8 L38.8 39 L42.4 41 L39.4 46.6 L59.4 73.4 Z")) s += path(lp, f.fill, outline(p));
      s += `<path d="M60 74 L60 142" ${detail(p, f.base)}/>`;
      s += buttonsAt(p, it, [82, 98], 1.6);
      for (const pk of pair("M38.4 106 L51.6 106 L51.6 110.4 L38.4 110.4 Z")) s += path(pk, f.fill, detailStroke(p, f.base));
      return s;
    }
    default: {
      // Blazer: notch lapels, open front to the buttons, cutaway hem, chest and flap pockets.
      s += sleeves(p, f, end, "none", 1.5, rolled);
      s += path(layerBodyD("L60 76 L48 28", 121, 0.5, "Q47 123 56 120 L60 113 L64 120 Q73 123 84.5 121"), f.fill, outline(p));
      for (const lp of pair("M48 28 L43.5 29.6 L40.4 37.4 L43.8 39.4 L41 44.4 L59.4 75.4 Z")) s += path(lp, f.fill, outline(p));
      for (const lp of pair("M44.6 40.6 L57.6 71.4")) s += `<path d="${lp}" stroke="${f.shade}" stroke-width="${n2(p.dw * 1.6)}" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M60 76 L60 113" ${detail(p, f.base)}/>`;
      s += path("M70 52 L79.4 50.6 L79.6 52.4 L70.2 53.8 Z", f.shade);
      for (const pk of pair("M38.6 96.5 L51.4 96.5 L51.4 100.4 L38.6 100.4 Z")) s += path(pk, f.fill, detailStroke(p, f.base));
      s += buttonsAt(p, it, [82, 94], 1.5);
      return s;
    }
  }
}
