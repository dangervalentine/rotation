import { detailsOf } from "../styles.ts";
import type { Item } from "../types.ts";
import { BODY, hemEnd } from "./body.ts";
import { detail, detailInk, detailStroke, fabric, hardwareHex, mirror, n2, outline, pair, path, poly, type Fabric, type Paint } from "./paint.ts";

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
/** The left leg's outer and inner edge at height y (inner edge starts at the crotch). */
const outerX = (y: number) => (y <= 140 ? lerp(36, 35, (y - 112) / 28) : lerp(35, 36.5, (y - 140) / 40));
const innerX = (y: number) => lerp(60, 57, (y - BODY.crotch) / (BODY.ankle - BODY.crotch));

export const WAISTBAND = "M35.5 108 L84.5 108 L84.5 114 L35.5 114 Z";

/** The leg shape of a pair of trousers or shorts ending at `hem`. */
export function legsD(hem: number, flare = 0, innerFlare = flare * 0.6) {
  const left: [number, number][] = [[innerX(hem) - innerFlare, hem], [outerX(hem) - flare, hem]];
  if (hem > 140) left.push([35, 140]);
  const right = left.slice().reverse().map(([x, y]) => [120 - x, y] as [number, number]);
  return poly([[36, 112], [84, 112], ...right, [60, BODY.crotch], ...left]);
}

export function bottomSvg(p: Paint, it: Item): string {
  const f = fabric(p, it, 8);
  const hem = hemEnd(detailsOf(it).length);
  let s = f.defs;

  if (it.style === "skirt") {
    const spread = (hem - 112) * 0.28;
    s += path(`M36 112 L84 112 L${(84 + spread).toFixed(1)} ${hem} Q60 ${hem + 3} ${(36 - spread).toFixed(1)} ${hem} Z`, f.fill, outline(p));
    for (const fold of pair(`M48 116 L${(46 - spread * 0.4).toFixed(1)} ${hem - 2}`)) s += `<path d="${fold}" stroke="${f.shade}" stroke-width="${n2(p.dw * 2)}" fill="none" stroke-linecap="round"/>`;
  } else {
    const flare = it.style === "shorts" ? 2 : 0;
    // Joggers taper to a cuffed ankle.
    const leg = it.style === "joggers" ? legsD(hem, -2.2, 2) : legsD(hem, flare);
    s += path(leg, f.fill, outline(p));
    // Shaded inseam, down the inside of each leg.
    const inseam = poly([[60, BODY.crotch], [innerX(hem) - flare * 0.6, hem], [innerX(hem) - flare * 0.6 - 2.2, hem], [58.4, BODY.crotch + 3]]);
    s += [inseam, mirror(inseam)].map((d) => path(d, f.shade, `opacity="0.6"`)).join("");
    if (it.style === "shorts") s += pair(`M${(outerX(hem) - flare + 0.4).toFixed(1)} ${hem - 3} L${(innerX(hem) - flare * 0.6 - 0.4).toFixed(1)} ${hem - 3}`).map((d) => `<path d="${d}" ${detail(p, f.base)}/>`).join("");
  }
  s += styleDetails(p, it, f, hem);
  // Waistband and fly.
  s += path(WAISTBAND, f.fill, outline(p));
  if (it.style !== "skirt") s += `<path d="M60 114 L60 123.5 Q59.6 126.6 56.4 126" ${detail(p, f.base)}/>`;
  if (it.style === "jeans") s += jeansWaist(p, it);
  if (it.style === "joggers") s += `<path d="M58 111 L57 121 M62 111 L63 121" stroke="${detailInk(f.base, p.ink)}" stroke-width="${n2(p.dw * 1.4)}" fill="none" stroke-linecap="round"/>`;
  return s;
}

/** Belt loops, drawn over the belt in the pants' colour. */
export function beltLoops(p: Paint, it: Item): string {
  const f = fabric(p, it, 8);
  return [39.5, 51, 69, 80.5].map((x) => path(`M${x - 1} 107.4 L${x + 1} 107.4 L${x + 1} 114.6 L${x - 1} 114.6 Z`, it.color, detailStroke(p, f.base))).join("");
}

const STITCH = "#c9a24a";

/** The marks that tell one kind of trousers from another, below the waistband. */
function styleDetails(p: Paint, it: Item, f: Fabric, hem: number): string {
  switch (it.style) {
    case "chinos":
      return pair("M37.4 115.4 L43 125").map((d) => `<path d="${d}" ${detail(p, f.base)}/>`).join("");
    case "trousers": {
      // Pressed crease down each leg; a turn-up when cropped.
      let s = pair(`M47.6 116 L46.8 ${hem - 1.5}`).map((d) => `<path d="${d}" stroke="${f.shade}" stroke-width="${n2(p.dw * 1.4)}" fill="none" stroke-linecap="round"/>`).join("");
      if (hem < BODY.ankle) s += pair(`M${(outerX(hem) + 0.3).toFixed(1)} ${hem - 3.4} L${(innerX(hem) - 0.3).toFixed(1)} ${hem - 3.4}`).map((d) => `<path d="${d}" ${detail(p, f.base)}/>`).join("");
      return s;
    }
    case "jeans": {
      // Contrast stitching on the front pockets, fly and outer seams.
      const st = `fill="none" stroke="${STITCH}" stroke-width="${n2(p.dw)}" stroke-dasharray="1.2 0.9"`;
      let s = pair("M37.2 115.6 Q44.4 118.6 46.4 114.4").map((d) => `<path d="${d}" ${st}/>`).join("");
      s += `<path d="M62.4 114.4 L62.4 124 Q62 127.4 58 127.2" ${st}/>`;
      s += pair(`M36.4 118 L36 ${hem - 2}`).map((d) => `<path d="${d}" ${st}/>`).join("");
      s += `<path d="M70.6 115.2 L76.2 115.2 L76.2 119.6 L70.6 119.6 Z" ${st}/>`;
      s += pair(`M${(outerX(hem) + 0.4).toFixed(1)} ${hem - 1.6} L${(innerX(hem) - 0.4).toFixed(1)} ${hem - 1.6}`).map((d) => `<path d="${d}" ${st}/>`).join("");
      return s;
    }
    case "joggers": {
      // Elastic ankle cuff.
      const cuff = poly([[outerX(hem) + 2.2, hem - 5], [outerX(hem) + 2.2, hem], [innerX(hem) - 2, hem], [innerX(hem) - 2, hem - 5]]);
      return pair(cuff).map((d) => path(d, f.fill, outline(p))).join("") + pair(`M${(outerX(hem) + 3.4).toFixed(1)} ${hem - 2.5} L${(innerX(hem) - 3.2).toFixed(1)} ${hem - 2.5}`).map((d) => `<path d="${d}" ${detail(p, f.base)} stroke-dasharray="0.6 0.9"/>`).join("");
    }
    default:
      return "";
  }
}

/** Rivets at the jeans' pocket corners, in the hardware colour. */
function jeansWaist(p: Paint, it: Item) {
  return [46.2, 73.8, 71].map((x, i) => `<circle cx="${x}" cy="${i === 2 ? 115.4 : 114.8}" r="0.8" fill="${hardwareHex(it)}" ${outline(p, p.ow * 0.4)}/>`).join("");
}
