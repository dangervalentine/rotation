import { mix } from "../colour.ts";
import type { Item } from "../types.ts";
import { detail, detailInk, detailStroke, fabric, mirror, n2, outline, path, skinOf, type Paint } from "./paint.ts";

/** Eyelets: a little darker than the leather. */
const hwDark = (base: string, p: Paint) => mix(base, p.ink, 0.6);

/** Shoes are drawn for the left foot, toe pointing out, then mirrored. */
export function shoesSvg(p: Paint, it: Item): string {
  const f = fabric(p, it, 4);
  const sole = mix(f.shade, p.ink, 0.25);
  const left = shoe(p, it, f.fill, f.base, f.shade, sole);
  return left + mirrorAll(left);
}

/** Mirror every `d="…"` in a fragment across the centre line. */
function mirrorAll(svg: string) {
  return svg.replace(/d="([^"]*)"/g, (_, d: string) => `d="${mirror(d)}"`);
}

function shoe(p: Paint, it: Item, fill: string, base: string, shadeC: string, sole: string): string {
  const o = outline(p);
  switch (it.style) {
    case "sneakers":
      return (
        path("M37 179 Q47 177.6 56.5 178.4 L57.6 188 L30 188 Q27.6 187.4 28.4 184.6 Q30 180.6 37 179 Z", fill, o) +
        `<path d="M29.4 185.6 Q31 182.4 34.6 181.2" ${detail(p, base)}/>` +
        `<path d="M38.6 180.6 L45.4 180.2 M37.8 182.8 L44.8 182.4 M37 185 L44.2 184.6" fill="none" stroke="#f4f3ef" stroke-width="${n2(p.dw * 1.6)}" stroke-linecap="round"/>` +
        path("M28.4 187.2 L58 187.2 L58 192.4 L29.4 192.4 Q27.4 192 28.4 187.2 Z", "#f4f3ef", o) +
        `<path d="M29.6 190.2 L57.4 190.2" ${detail(p, "#f4f3ef")}/>`
      );
    case "loafers":
      return (
        path("M36 179 Q47 177 56.5 178 L57.8 189.6 L30.5 189.6 Q27.6 189.6 28.4 186.4 Q30 181.4 36 179 Z", fill, o) +
        `<path d="M31.6 186 Q33.6 181.6 41 180.6" ${detail(p, base)}/>` +
        `<path d="M33.6 184.4 Q42 181.6 51 182.6" stroke="${shadeC}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
        path("M40.6 182.4 Q42.6 181.8 44.6 182.4 Q42.6 183.4 40.6 182.4 Z", sole) +
        path("M28.2 189.4 L58 189.4 L58 192.4 L29.4 192.4 Q27.6 192.2 28.2 189.4 Z", sole, o)
      );
    case "derby":
      // Laced over a closed vamp, a welt and a low heel.
      return (
        path("M36 178 Q47 176.4 56.5 177.4 L57.8 189.6 L30.5 189.6 Q27.6 189.6 28.4 186.4 Q30 180.6 36 178 Z", fill, o) +
        path("M38.6 178 L47 177.2 L46.2 184 L38 184.4 Z", fill, detailStroke(p, base)) +
        `<path d="M40 179.6 L45.6 179.2 M39.6 182 L45.2 181.6" fill="none" stroke="${detailInk(base, p.ink)}" stroke-width="${n2(p.dw * 1.3)}" stroke-linecap="round"/>` +
        `<path d="M29.6 188.4 L57 188.4" ${detail(p, base)}/>` +
        path("M28.2 189.4 L58 189.4 L58 192.4 L29.4 192.4 Q27.6 192.2 28.2 189.4 Z", sole, o) +
        path("M51 189.4 L58 189.4 L58 192.4 L51 192.4 Z", mix(sole, p.ink, 0.3), o)
      );
    case "chelsea boot":
      // Elastic side gore and a pull tab, on a slim sole.
      return (
        path("M52.6 163.6 L56 163.6 L56 168.6 L52.6 168.6 Z", fill, o) +
        path("M39 168 L56 168 L57 187 L57.5 190 L29 190 Q27.6 189.6 28.4 186.4 Q30 181 36 179 L39 177 Z", fill, o) +
        path("M44.6 168.4 L53 168.4 L48.8 179 Z", shadeC, detailStroke(p, base)) +
        `<path d="M46.6 169.4 L48.4 177 M48.8 168.8 L48.8 178 M51 169.4 L49.2 177" ${detail(p, shadeC, p.dw * 0.7)}/>` +
        path("M28 189.4 L58 189.4 L58 192 L29 192 Q27.4 191.8 28 189.4 Z", sole, o)
      );
    case "lace-up boot":
      // Eyelets and laces up the front, a lugged sole.
      return (
        path("M38.6 166 L56 166 L57 187 L57.5 190 L29 190 Q27.6 189.6 28.4 186.4 Q30 181 35 179 L38.6 177.6 Z", fill, o) +
        `<path d="M40.2 168 L44.6 170 L40.2 172 L44.6 174 L40.2 176 L44.6 178" fill="none" stroke="${detailInk(base, p.ink)}" stroke-width="${n2(p.dw * 1.2)}" stroke-linecap="round" stroke-linejoin="round"/>` +
        [168, 172, 176].map((y) => path(`M38.6 ${y} L39.4 ${y - 0.8} L40.2 ${y} L39.4 ${y + 0.8} Z`, hwDark(base, p))).join("") +
        `<path d="M29.6 188.4 L56.8 188.4" ${detail(p, base)}/>` +
        path("M28 189.4 L58 189.4 L58 192 L56 193.4 L53.6 192 L51.2 193.4 L48.8 192 L46.4 193.4 L44 192 L41.6 193.4 L39.2 192 L36.8 193.4 L34.4 192 L32 193.4 L29.6 192.6 Q27.6 192 28 189.4 Z", sole, o)
      );
    case "sandal": {
      // Feet showing through two straps, on a thick footbed.
      return (
        path("M35 179 Q46 177.4 56 178.4 L57 189 L31 189 Q28 189 28.8 186 Q30.4 181 35 179 Z", skinOf(p), o) +
        `<path d="M31.6 184 Q42 180.6 52 181.6 M37 187 L55 185.6" fill="none" stroke="${fill}" stroke-width="2.6" stroke-linecap="round"/>` +
        path("M28 188.8 L58 188.8 L58 192.4 L29 192.4 Q27 192 28 188.8 Z", shadeC, o)
      );
    }
    default:
      // Boots: a tall shaft, welt and stacked heel.
      return (
        path("M39 168 L56 168 L57 187 L57.5 190 L29 190 Q27.6 189.6 28.4 186.4 Q30 181 36 179 L39 177 Z", fill, o) +
        `<path d="M39.2 170.4 L55.8 170.4 M29.6 188.4 L56.8 188.4" ${detail(p, base)}/>` +
        path("M28 189.4 L58 189.4 L58 192.6 L29 192.6 Q27.4 192.2 28 189.4 Z", sole, o) +
        path("M50 189.4 L58 189.4 L58 192.6 L50 192.6 Z", mix(sole, p.ink, 0.3), o)
      );
  }
}
