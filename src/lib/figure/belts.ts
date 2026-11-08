import { mix } from "../colour.ts";
import { detailsOf } from "../styles.ts";
import type { Item } from "../types.ts";
import { detail, fabric, hardwareHex, outline, path, type Paint } from "./paint.ts";

const STRAP = "M35.5 108.6 L84.5 108.6 L84.5 113.4 L35.5 113.4 Z";

export function beltSvg(p: Paint, it: Item): string {
  const f = fabric(p, it, 4);
  const hw = hardwareHex(it);
  const hwEdge = mix(hw, p.ink, 0.45);
  let s = path(STRAP, f.fill, outline(p));
  if (it.style === "braided") {
    let d = "";
    for (let x = 37; x < 84; x += 2.4) d += `M${x.toFixed(1)} 108.8 L${(x + 1.6).toFixed(1)} 113.2 M${(x + 1.6).toFixed(1)} 108.8 L${x.toFixed(1)} 113.2 `;
    s += `<path d="${d.trim()}" ${detail(p, f.base, p.dw * 0.7)}/>`;
  } else {
    s += `<path d="M37 109.8 L54 109.8 M66 109.8 L83 109.8 M37 112.2 L54 112.2 M66 112.2 L83 112.2" ${detail(p, f.base, p.dw * 0.6)} stroke-dasharray="1 0.8"/>`;
  }
  const buckle = detailsOf(it).buckle;
  if (buckle === "plate") {
    s += `<rect x="54.5" y="107.4" width="11" height="7.2" rx="1" fill="${hw}" ${outline(p, p.ow * 0.8)}/>`;
    s += `<path d="M56 109 L64 109" stroke="#ffffff" stroke-opacity="0.45" stroke-width="0.6" fill="none"/>`;
  } else if (buckle === "d-ring") {
    for (const x of [55.5, 58.5]) s += `<path d="M${x} 107.4 L${x} 114.6 Q${x + 5} 114.6 ${x + 5} 111 Q${x + 5} 107.4 ${x} 107.4 Z" fill="none" stroke="${hw}" stroke-width="1.1"/>`;
  } else {
    // Frame with a prong through the strap.
    s += `<path d="M55.4 107.4 L64.6 107.4 L64.6 114.6 L55.4 114.6 Z M57 109 L57 113 L63 113 L63 109 Z" fill="${hw}" fill-rule="evenodd" stroke="${hwEdge}" stroke-width="0.4"/>`;
    s += `<path d="M57 111 L61.4 111" stroke="${hw}" stroke-width="0.9" stroke-linecap="round"/>`;
  }
  return s;
}
