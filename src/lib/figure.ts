import { findItem } from "./model.ts";
import type { Figure, Item, Look } from "./types.ts";

let patternSeq = 0;

export interface FigureOptions {
  /** Add a head, face, hair and hands, with chunky rounded outlines. */
  cartoon?: boolean;
  figure?: Figure;
}

/** viewBox for each mode: the cartoon adds a head above the plain mannequin. */
export const VIEWBOX = { plain: "0 0 120 200", cartoon: "0 -30 120 230" };

/**
 * SVG markup (inner content only) for an outfit on a simple figure.
 * Coordinates are a 120x200 mannequin: shoulders at y=30, waist at 108,
 * hem at 180, shoe soles at 192.
 */
export function figureSvg(items: Item[], look: Look, opts: FigureOptions = {}): string {
  const get = (id: string | null) => findItem(items, id);
  const layer = get(look.layer), shirt = get(look.shirt), belt = get(look.belt), pants = get(look.pants), shoes = get(look.shoes);
  const cartoon = !!opts.cartoon;
  const ink = cartoon ? "#3a3340" : "#55585e";
  const sw = cartoon ? 1.6 : 0.6;
  const line = (w = sw) => `stroke="${ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const id = "p" + patternSeq++;
  let s = "";

  // Shirt fill, striped if needed
  let shirtFill = "#e6e6e6";
  if (shirt) {
    shirtFill = shirt.color;
    if (shirt.stripe) {
      s += `<defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${shirt.color}"/><rect width="2" height="6" fill="${shirt.stripe}"/></pattern></defs>`;
      shirtFill = `url(#${id})`;
    }
  }

  if (cartoon) s += head(opts.figure, ink, sw, "back");

  const tee = shirt?.style === "tee";
  s += tee
    ? `<path d="M38 30 L82 30 L100 42 L98 60 L88 62 L86 108 L34 108 L32 62 L22 60 L20 42 Z" fill="${shirtFill}" ${line()}/>`
    : `<path d="M38 30 L82 30 L100 42 L96 86 L86 84 L86 108 L34 108 L34 84 L24 86 L20 42 Z" fill="${shirtFill}" ${line()}/>`;

  if (shirt?.style === "polo") {
    s += `<path d="M52 30 L60 40 L68 30 Z" fill="${shirt.color}" ${line(sw + 0.2)}/><line x1="60" y1="40" x2="60" y2="52" ${line()}/>`;
  } else if (tee) {
    s += `<path d="M50 30 Q60 38 70 30" fill="none" ${line(sw + 0.2)}/>`;
  } else {
    s += `<path d="M52 30 L60 42 L68 30" fill="none" ${line(sw + 0.2)}/>`;
  }

  if (layer?.style === "sweater") {
    s += `<path d="M38 34 Q60 46 82 34 L100 44 L96 88 L86 86 L86 108 L34 108 L34 86 L24 88 L20 44 Z" fill="${layer.color}" ${line()}/><path d="M50 32 L60 42 L70 32" fill="none" ${line(sw + 0.2)}/><path d="M34 104 L86 104" ${line(sw * 0.8)}/>`;
  } else if (layer?.style === "cardigan") {
    s += `<path d="M38 30 L58 64 L57 110 L32 110 L32 86 L22 90 L18 42 Z" fill="${layer.color}" ${line()}/><path d="M82 30 L62 64 L63 110 L88 110 L88 86 L98 90 L102 42 Z" fill="${layer.color}" ${line()}/><circle cx="56" cy="76" r="1.4" fill="${ink}"/><circle cx="56" cy="90" r="1.4" fill="${ink}"/>`;
  } else if (layer?.style === "blazer") {
    s += `<path d="M38 28 L56 70 L54 112 L32 112 L32 86 L22 90 L18 42 Z" fill="${layer.color}" ${line()}/><path d="M82 28 L64 70 L66 112 L88 112 L88 86 L98 90 L102 42 Z" fill="${layer.color}" ${line()}/><path d="M38 28 L46 52 L42 56" fill="none" ${line()}/><path d="M82 28 L74 52 L78 56" fill="none" ${line()}/><circle cx="58" cy="90" r="1.6" fill="#c9c9c9"/>`;
  } else if (layer?.style === "jacket") {
    s += `<path d="M38 28 L58 34 L58 112 L32 112 L32 86 L22 90 L18 42 Z" fill="${layer.color}" ${line()}/><path d="M82 28 L62 34 L62 112 L88 112 L88 86 L98 90 L102 42 Z" fill="${layer.color}" ${line()}/><path d="M40 28 L50 22 L58 34" fill="${layer.color}" ${line()}/><path d="M80 28 L70 22 L62 34" fill="${layer.color}" ${line()}/><rect x="38" y="66" width="12" height="3" rx="1" fill="none" ${line(sw * 0.8)}/><rect x="70" y="66" width="12" height="3" rx="1" fill="none" ${line(sw * 0.8)}/>`;
  }

  // Waistband / belt
  s += `<rect x="34" y="108" width="52" height="6" fill="${belt ? belt.color : pants ? pants.color : "#999"}" ${cartoon ? line() : ""}/>`;
  if (belt) s += `<rect x="56" y="108" width="7" height="6" fill="none" stroke="#b9a66a" stroke-width="${cartoon ? 1.4 : 1}"/>`;

  const pantsFill = pants ? pants.color : "#bbb";
  if (pants?.style === "shorts") {
    s += `<path d="M34 114 L86 114 L90 146 L64 146 L60 128 L56 146 L30 146 Z" fill="${pantsFill}" ${line()}/>`;
    if (cartoon) s += legs(opts.figure, ink, sw, 146);
  } else if (pants?.style === "skirt") {
    s += `<path d="M34 114 L86 114 L96 156 L24 156 Z" fill="${pantsFill}" ${line()}/>`;
    if (cartoon) s += legs(opts.figure, ink, sw, 156);
  } else {
    s += `<path d="M34 114 L86 114 L88 180 L64 180 L60 126 L56 180 L32 180 Z" fill="${pantsFill}" ${line()}/>`;
  }

  if (shoes) {
    const c = shoes.color;
    if (shoes.style === "sneakers") {
      s += `<path d="M28 180 L56 180 L58 192 L24 192 Z" fill="${c}" ${line(sw + 0.2)}/><path d="M64 180 L92 180 L96 192 L62 192 Z" fill="${c}" ${line(sw + 0.2)}/><line x1="24" y1="189" x2="58" y2="189" ${line()}/><line x1="62" y1="189" x2="96" y2="189" ${line()}/>`;
    } else if (shoes.style === "loafers") {
      s += `<path d="M30 182 L56 182 L58 192 L22 192 Z" fill="${c}" ${line()}/><path d="M64 182 L90 182 L98 192 L62 192 Z" fill="${c}" ${line()}/>`;
    } else {
      s += `<path d="M30 174 L56 174 L58 192 L22 192 L24 184 Z" fill="${c}" ${line()}/><path d="M64 174 L90 174 L96 184 L98 192 L62 192 Z" fill="${c}" ${line()}/>`;
    }
  }

  if (cartoon) {
    s += hands(opts.figure, ink, sw, tee);
    s += head(opts.figure, ink, sw, "front");
  }
  return s;
}

function skinOf(f?: Figure) {
  return f?.skin || "#f1c7a3";
}

function legs(f: Figure | undefined, ink: string, sw: number, top: number) {
  const skin = skinOf(f);
  return `<path d="M38 ${top} L54 ${top} L55 182 L37 182 Z" fill="${skin}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M66 ${top} L82 ${top} L83 182 L65 182 Z" fill="${skin}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

function hands(f: Figure | undefined, ink: string, sw: number, tee: boolean) {
  const skin = skinOf(f);
  // Tee sleeves stop high, so draw forearms down to the hands.
  const arms = tee
    ? `<path d="M23 60 L32 62 L29 88 L21 88 Z" fill="${skin}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M97 60 L88 62 L91 88 L99 88 Z" fill="${skin}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/>`
    : "";
  return `${arms}<circle cx="24" cy="93" r="6" fill="${skin}" stroke="${ink}" stroke-width="${sw}"/><circle cx="96" cy="93" r="6" fill="${skin}" stroke="${ink}" stroke-width="${sw}"/>`;
}

/** Hair has a back part (behind the body, for long hair) and a front part. */
function head(f: Figure | undefined, ink: string, sw: number, part: "back" | "front") {
  const skin = skinOf(f);
  const hair = f?.hair || "#4a3426";
  const style = f?.hairStyle || "short";
  const st = `stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
  if (part === "back") {
    if (style === "long") return `<path d="M38 2 Q36 34 42 46 L78 46 Q84 34 82 2 Z" fill="${hair}" ${st}/>`;
    return "";
  }
  let s = `<rect x="54" y="18" width="12" height="12" fill="${skin}" ${st}/>`;
  s += `<ellipse cx="60" cy="4" rx="20" ry="21" fill="${skin}" ${st}/>`;
  if (style === "short") s += `<path d="M40 2 Q40 -18 60 -18 Q80 -18 80 2 Q72 -6 62 -5 Q52 -9 40 2 Z" fill="${hair}" ${st}/>`;
  else if (style === "long") s += `<path d="M40 6 Q38 -18 60 -18 Q82 -18 80 6 Q76 -4 66 -6 Q58 2 46 -2 Q42 2 40 6 Z" fill="${hair}" ${st}/>`;
  else if (style === "bun") s += `<circle cx="60" cy="-20" r="7" fill="${hair}" ${st}/><path d="M40 2 Q40 -16 60 -16 Q80 -16 80 2 Q70 -8 60 -8 Q50 -8 40 2 Z" fill="${hair}" ${st}/>`;
  else if (style === "curly")
    s += `<path d="M40 4 Q34 -2 40 -8 Q38 -18 48 -18 Q52 -24 60 -20 Q68 -24 72 -18 Q82 -18 80 -8 Q86 -2 80 4 Q76 -4 70 -4 Q64 -8 60 -4 Q54 -8 50 -4 Q44 -4 40 4 Z" fill="${hair}" ${st}/>`;
  // Face
  s += `<circle cx="53" cy="5" r="2" fill="${ink}"/><circle cx="67" cy="5" r="2" fill="${ink}"/>`;
  s += `<circle cx="53.7" cy="4.3" r="0.6" fill="#fff"/><circle cx="67.7" cy="4.3" r="0.6" fill="#fff"/>`;
  s += `<ellipse cx="48" cy="11" rx="3.2" ry="2" fill="#f19aa6" opacity="0.6"/><ellipse cx="72" cy="11" rx="3.2" ry="2" fill="#f19aa6" opacity="0.6"/>`;
  s += `<path d="M55 12 Q60 17 65 12" fill="none" ${st}/>`;
  return s;
}
