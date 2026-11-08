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
        path("M32 180 L56 180 L57.6 188 L22.6 188 Q20.4 187.6 21.4 185 Q24 181.4 32 180 Z", fill, o) +
        `<path d="M22.6 186 Q24.2 183 28.4 182.2" ${detail(p, base)}/>` +
        `<path d="M33 181.8 L40.4 181.3 M32.2 183.8 L39.8 183.3 M31.4 185.8 L39.2 185.3" fill="none" stroke="#f4f3ef" stroke-width="${n2(p.dw * 1.6)}" stroke-linecap="round"/>` +
        path("M21 187.4 L58 187.4 L58 192.4 L22 192.4 Q20 192 21 187.4 Z", "#f4f3ef", o) +
        `<path d="M22.4 190.2 L57.4 190.2" ${detail(p, "#f4f3ef")}/>`
      );
    case "loafers":
      return (
        path("M31 183 Q44 181 56.5 183 L57.8 190 L23.5 190 Q20.6 190 21.4 187.4 Q23 184.4 31 183 Z", fill, o) +
        `<path d="M25.8 187.2 Q29.6 184 39.6 183.6" ${detail(p, base)}/>` +
        `<path d="M28 186.4 Q38 184.4 49.4 185.6" stroke="${shadeC}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
        path("M36.6 185 Q38.6 184.4 40.6 185 Q38.6 186 36.6 185 Z", sole) +
        path("M21.2 189.6 L58 189.6 L58 192.4 L22.4 192.4 Q20.6 192.2 21.2 189.6 Z", sole, o)
      );
    case "derby":
      // Laced over a closed vamp, a welt and a low heel.
      return (
        path("M31 182 Q44 180.4 56.5 182.4 L57.8 190 L23.5 190 Q20.6 190 21.4 187.4 Q23 184 31 182 Z", fill, o) +
        path("M33.6 182.6 L44 181.6 L43 186.6 L33.2 187 Z", fill, detailStroke(p, base)) +
        `<path d="M35 183.6 L42.4 183 M34.6 185.6 L42 185" fill="none" stroke="${detailInk(base, p.ink)}" stroke-width="${n2(p.dw * 1.3)}" stroke-linecap="round"/>` +
        `<path d="M22.6 188.6 L57 188.6" ${detail(p, base)}/>` +
        path("M21.2 189.6 L58 189.6 L58 192.4 L22.4 192.4 Q20.6 192.2 21.2 189.6 Z", sole, o) +
        path("M50.6 189.6 L58 189.6 L58 192.4 L50.6 192.4 Z", mix(sole, p.ink, 0.3), o)
      );
    case "chelsea boot":
      // Elastic side gore and a pull tab, on a slim sole.
      return (
        path("M52.6 166 L56 166 L56 171 L52.6 171 Z", fill, o) +
        path("M37 170 L56 170 L57 187 L57.5 190 L22 190 Q20.6 189.6 21.4 187 Q24 183 33 182 L37 180 Z", fill, o) +
        path("M44 170.4 L53 170.4 L48.6 181 Z", shadeC, detailStroke(p, base)) +
        `<path d="M46.4 171.4 L48.4 179 M48.6 170.8 L48.6 180 M50.8 171.4 L48.8 179" ${detail(p, shadeC, p.dw * 0.7)}/>` +
        path("M21 189.4 L58 189.4 L58 192 L22 192 Q20.4 191.8 21 189.4 Z", sole, o)
      );
    case "lace-up boot":
      // Eyelets and laces up the front, a lugged sole.
      return (
        path("M36 169 L56 169 L57 187 L57.5 190 L22 190 Q20.6 189.6 21.4 187 Q24 183 32 181.6 L36 180 Z", fill, o) +
        `<path d="M37.6 171 L42.4 173 L37.6 175 L42.4 177 L37.6 179 L42.4 181" fill="none" stroke="${detailInk(base, p.ink)}" stroke-width="${n2(p.dw * 1.2)}" stroke-linecap="round" stroke-linejoin="round"/>` +
        [171, 175, 179].map((y) => path(`M36.8 ${y} L37.6 ${y - 0.8} L38.4 ${y} L37.6 ${y + 0.8} Z`, hwDark(base, p))).join("") +
        `<path d="M22.6 188.4 L56.8 188.4" ${detail(p, base)}/>` +
        path("M21 189.4 L58 189.4 L58 192 L56 193.4 L53.6 192 L51.2 193.4 L48.8 192 L46.4 193.4 L44 192 L41.6 193.4 L39.2 192 L36.8 193.4 L34.4 192 L32 193.4 L29.6 192 L27.2 193.4 L24.8 192 L22.4 193 Q20.4 192 21 189.4 Z", sole, o)
      );
    case "sandal": {
      // Feet showing through two straps, on a thick footbed.
      return (
        path("M30 181.6 Q44 180 56 181.6 L57 189 L24 189 Q21 189 22 186.6 Q24 183.4 30 181.6 Z", skinOf(p), o) +
        `<path d="M26.4 185.2 Q38 182.6 50.4 184.4 M33.4 187.6 L54.6 186.4" fill="none" stroke="${fill}" stroke-width="2.6" stroke-linecap="round"/>` +
        path("M21 188.8 L58 188.8 L58 192.4 L22 192.4 Q20 192 21 188.8 Z", shadeC, o)
      );
    }
    default:
      // Boots: a tall shaft, welt and stacked heel.
      return (
        path("M37 170 L56 170 L57 187 L57.5 190 L22 190 Q20.6 189.6 21.4 187 Q24 183 33 182 L37 180 Z", fill, o) +
        `<path d="M37.2 172.4 L55.8 172.4 M22.6 188.4 L56.8 188.4" ${detail(p, base)}/>` +
        path("M21 189.4 L58 189.4 L58 192.6 L22 192.6 Q20.4 192.2 21 189.4 Z", sole, o) +
        path("M49.5 189.4 L58 189.4 L58 192.6 L49.5 192.6 Z", mix(sole, p.ink, 0.3), o)
      );
  }
}
