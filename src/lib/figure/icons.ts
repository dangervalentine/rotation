import type { Item } from "../types.ts";
import { detailInk, makePaint, outline, path } from "./paint.ts";

/** Waistband for every underwear icon. */
const BAND = "M4 4.5 L20 4.5 L20 7.5 L4 7.5 Z";

/** Legs and seat per underwear style, below the band (24×24, front view). */
const BODY: Record<string, string> = {
  underwear: "M4 7.5 L20 7.5 L20.4 15 L13.6 16.4 L12 12.4 L10.4 16.4 L3.6 15 Z",
  boxers: "M4 7.5 L20 7.5 L21.4 19.4 L13.8 19.4 L12 13.2 L10.2 19.4 L2.6 19.4 Z",
  briefs: "M4 7.5 L20 7.5 Q15.6 10.4 13.6 17.4 L10.4 17.4 Q8.4 10.4 4 7.5 Z",
  "boxer-briefs": "M4.4 7.5 L19.6 7.5 L19.8 18.4 L13.4 18.8 L12 13.4 L10.6 18.8 L4.2 18.4 Z",
  trunks: "M4.4 7.5 L19.6 7.5 L19.8 14 L13.4 14.6 L12 12 L10.6 14.6 L4.2 14 Z",
};

/**
 * A small flat icon for socks and underwear, in the item's colour (viewBox "0 0 24 24").
 * These are never drawn on the figure; the icons stand in for them in wardrobe lists.
 */
export function basicsIconSvg(it: Item): string {
  const p = makePaint(false);
  const o = outline(p, 1.2);
  const line = `fill="none" stroke="${detailInk(it.color, p.ink)}" stroke-width="0.9" stroke-linecap="round"`;
  if (it.style === "socks") {
    return path("M8 2.5 L14.4 2.5 L14.4 13.4 L19.4 16.4 Q21.6 18.6 19.6 21 L11.4 21 Q8 21 8 17.6 Z", it.color, o) + `<path d="M8.4 6 L14 6" ${line}/>`;
  }
  const body = BODY[it.style] ?? BODY.underwear;
  return path(body, it.color, o) + path(BAND, it.color, o) + `<path d="M5 6 L19 6" ${line} stroke-dasharray="1 0.8"/>`;
}
