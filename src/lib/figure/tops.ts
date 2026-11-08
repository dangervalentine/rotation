import { detailsOf } from "../styles.ts";
import type { Item } from "../types.ts";
import { armAt, armBand, sleeveEnd, sleevePath, sleeveShade } from "./body.ts";
import { detail, detailInk, detailStroke, fabric, mirror, outline, pair, path, type Fabric, type Paint } from "./paint.ts";

type Neck = "crew" | "v" | "notch" | "polo" | "band";
const NECK: Record<Neck, string> = {
  crew: "Q60 36 50 28.5",
  v: "L60 42 L50 28.5",
  notch: "L60 40 L50 28.5",
  polo: "Q60 32 50 28.5",
  band: "Q60 31 50 28.5",
};
const torsoD = (neck: Neck) =>
  `M50 28.5 L39 31 Q35 32.5 35.2 38 L35.8 60 L37.5 111 L82.5 111 L84.2 60 L84.8 38 Q85 32.5 81 31 L70 28.5 ${NECK[neck]} Z`;

type Band = "none" | "hem" | "cuff" | "rib" | "french";

/** Both sleeves, shaded on the underside, with whatever finishes the end. */
export function sleeves(p: Paint, f: Fabric, end: number, band: Band, flare = 0, rolled = false) {
  let s = "";
  for (const side of [0, 1]) {
    const m = (d: string) => (side ? mirror(d) : d);
    s += path(m(sleevePath(end, flare)), f.fill, outline(p));
    s += path(m(sleeveShade(end, flare)), f.shade, `opacity="0.55"`);
    if (rolled) {
      s += path(m(armBand(end - 6, end, flare + 0.8)), f.fill, outline(p)) + `<path d="${m(armBand(end - 3, end - 3, flare + 0.8))}" ${detail(p, f.base)}/>`;
    } else if (band === "cuff" || band === "french") {
      s += path(m(armBand(end - (band === "french" ? 6 : 5), end, flare + 0.3)), f.fill, outline(p));
    } else if (band === "rib") {
      s += path(m(armBand(end - 4, end, flare - 0.2)), f.fill, outline(p));
      s += ribTicks(p, f.base, m, end - 4, end, flare);
    } else if (band === "hem") {
      s += `<path d="${m(armBand(end - 1.8, end - 1.8, flare))}" ${detail(p, f.base)}/>`;
    }
  }
  return s;
}

/** Short vertical rib lines across a band of the arm. */
function ribTicks(p: Paint, base: string, m: (d: string) => string, top: number, bottom: number, flare: number) {
  const d = armBand(top, bottom, flare).match(/[\d.]+/g)!.map(Number);
  // d: outer-top x,y, outer-bottom x,y, inner-bottom x,y, inner-top x,y
  const [otx, , obx, , ibx, , itx] = d;
  let s = "";
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    s += `M${(otx + (itx - otx) * t).toFixed(1)} ${top + 0.6} L${(obx + (ibx - obx) * t).toFixed(1)} ${bottom - 0.6} `;
  }
  return `<path d="${m(s.trim())}" ${detail(p, base, p.dw * 0.8)}/>`;
}

/** Five small buttons down a placket. */
const buttons = (p: Paint, f: Fabric, ys: number[], x = 60, r = 0.95) =>
  ys.map((y) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${detailInk(f.base, p.ink)}"/>`).join("");

/**
 * A shirt or undershirt. `asTee` draws an undershirt standing in for the shirt
 * (no shirt in the look): a short-sleeved tee in the undershirt's colour and neckline.
 */
export function topSvg(p: Paint, it: Item, asTee = false): string {
  const f = fabric(p, it, 6);
  const d = detailsOf(it);
  const style = it.style;
  let s = f.defs;

  if (it.cat === "undershirt" || asTee) {
    const v = style === "v-neck";
    s += sleeves(p, f, sleeveEnd(d.sleeve ?? "short"), "hem");
    s += path(torsoD(v ? "v" : "crew"), f.fill, outline(p));
    s += `<path d="${v ? "M48.5 29 L60 44 L71.5 29" : "M48.5 29 Q60 39.5 71.5 29"}" ${detail(p, f.base)}/>`;
    return s;
  }

  const end = sleeveEnd(d.sleeve);
  const rolled = d.sleeve === "rolled";
  const short = d.sleeve === "short";

  if (style === "polo") {
    s += sleeves(p, f, end, short ? "rib" : "cuff", 0, rolled);
    s += path(torsoD("polo"), f.fill, outline(p));
    // Short button stand and a flat ribbed collar.
    s += path("M58 31.5 L62 31.5 L62 50 L58 50 Z", f.fill, detailStroke(p, f.base));
    s += buttons(p, f, [37, 42.5, 48]);
    for (const w of pair("M60 31.5 L50.5 27.8 L45.5 30.2 L51 38 Z")) s += path(w, f.fill, outline(p));
    s += pair("M49.5 30.5 L53.5 36.3").map((w) => `<path d="${w}" ${detail(p, f.base)}/>`).join("");
    return s;
  }

  if (style === "tee") {
    s += sleeves(p, f, end, short ? "hem" : "cuff", 0, rolled);
    s += path(torsoD("crew"), f.fill, outline(p));
    s += path("M50 28.5 Q60 36 70 28.5 L71.5 29 Q60 39.5 48.5 29 Z", f.shade, `opacity="0.6"`);
    s += `<path d="M48.5 29 Q60 39.5 71.5 29" ${detail(p, f.base)}/>`;
    return s;
  }

  if (style === "henley") {
    // Collarless: a ribbed band neck and a short three-button placket.
    s += sleeves(p, f, end, short ? "hem" : "rib", 0, rolled);
    s += path(torsoD("band"), f.fill, outline(p));
    s += `<path d="M48.6 29.2 Q60 34.6 71.4 29.2" ${detail(p, f.base)}/>`;
    s += path("M58 31 L62 31 L62 52 L58 52 Z", f.fill, detailStroke(p, f.base));
    s += buttons(p, f, [36, 41.5, 47]);
    return s;
  }

  if (style === "camp collar") {
    // Open, flat collar lying wide; straight hem worn out.
    s += sleeves(p, f, end, short ? "hem" : "cuff", 0, rolled);
    s += path(torsoD("notch").replace(/L37\.5 111 L82\.5 111/, "L37.5 113 L82.5 113"), f.fill, outline(p));
    s += `<path d="M60 40 L60 113 M37.8 110.5 L82.2 110.5" ${detail(p, f.base)}/>`;
    s += buttons(p, f, [54, 68, 82, 96]);
    for (const w of pair("M50 28.2 L42.6 31.4 L47 37.6 L44.6 40.6 L60 41 Z")) s += path(w, f.fill, outline(p));
    return s;
  }

  const dress = style === "dress shirt";
  s += sleeves(p, f, end, short ? "hem" : dress ? "french" : "cuff", 0, rolled);
  s += path(torsoD("notch"), f.fill, outline(p));
  if (dress) {
    // Hidden placket: a single fold line, no buttons on show; cufflinks at the French cuffs.
    s += `<path d="M61 40 L61 111" ${detail(p, f.base)}/>`;
    if (!short && !rolled) s += [sleeveCuffLink(end), 120 - sleeveCuffLink(end)].map((x) => `<circle cx="${x.toFixed(1)}" cy="${end - 3}" r="0.9" fill="${detailInk(f.base, p.ink)}"/>`).join("");
    s += collarSvg(p, f, "spread");
    return s;
  }
  // Oxford and flannel: open point collar, full button placket, cuffs.
  s += `<path d="M58.6 40 L58.6 111 M61.4 40 L61.4 111" ${detail(p, f.base)}/>`;
  s += buttons(p, f, [50, 62, 74, 86, 98]);
  if (style === "flannel") {
    // Two flapped chest pockets.
    for (const pk of pair("M42 50 L53 50 L53 61 L42 61 Z")) s += path(pk, f.fill, detailStroke(p, f.base));
    for (const fl of pair("M41.6 49 L53.4 49 L53.4 53.6 L47.5 55.4 L41.6 53.6 Z")) s += path(fl, f.fill, outline(p, p.ow * 0.7));
  }
  s += collarSvg(p, f);
  return s;
}

/** Where a French cuff's link sits on the left sleeve, across from the seam. */
const sleeveCuffLink = (end: number) => armAt(end - 3).cx + armAt(end - 3).hw * 0.6;

/** A collared shirt's collar alone: drawn again over a crew-neck sweater, where the points sit on top. */
export function collarSvg(p: Paint, f: Fabric, kind: "point" | "spread" = "point"): string {
  let s = path("M50 28 Q60 31 70 28 L70 29.6 Q60 33 50 29.6 Z", f.shade);
  if (kind === "spread") {
    // Wide-set points angled out, no buttons.
    for (const w of pair("M50.2 27.6 L44.6 30.2 L47.4 38.8 L59.6 37.4 Z")) s += path(w, f.fill, outline(p));
    return s;
  }
  for (const w of pair("M50.2 27.6 L45.6 29.8 L51.8 42.6 L59.6 38.6 Z")) s += path(w, f.fill, outline(p));
  // Button-down points.
  s += [51.8, 68.2].map((x) => `<circle cx="${x}" cy="40.4" r="0.6" fill="${detailInk(f.base, p.ink)}"/>`).join("");
  return s;
}

export const isCollared = (it: Item | null | undefined) => !!it && it.cat === "shirt" && ["oxford", "flannel", "dress shirt"].includes(it.style);
