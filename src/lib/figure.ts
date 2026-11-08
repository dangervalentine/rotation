import { ACC_VIEWBOX, eyewearSvg, HEAD_WORN, hatSvg, lookAccessories, scarfSvg, tieSvg, watchSvg } from "./figure/accessories.ts";
import { beltSvg } from "./figure/belts.ts";
import { arms, hands, legs, torso } from "./figure/body.ts";
import { beltLoops, bottomSvg } from "./figure/bottoms.ts";
import { head } from "./figure/head.ts";
import { layerSvg } from "./figure/layers.ts";
import { fabric, makePaint } from "./figure/paint.ts";
import { shoesSvg } from "./figure/shoes.ts";
import { collarSvg, isCollared, topSvg } from "./figure/tops.ts";
import { EMPTY_LOOK, findItem } from "./model.ts";
import { styleSpec } from "./styles.ts";
import type { Figure, Item, Look, Slot } from "./types.ts";

export { BODY } from "./figure/body.ts";
export { basicsIconSvg } from "./figure/icons.ts";

export interface FigureOptions {
  /** Add a head, face, hair and hands, with chunky rounded outlines. */
  cartoon?: boolean;
  figure?: Figure;
}

/** What a layer of the drawing belongs to: a garment slot, accessories, or the figure itself. */
export type Part = Slot | "acc" | "body" | "head";
export interface Layer {
  part: Part;
  svg: string;
}

/** viewBox for each mode: the cartoon adds a head above the plain mannequin. */
export const VIEWBOX = { plain: "0 0 120 200", cartoon: "0 -30 120 230" };

/** Crops of the plain figure that frame one slot, with a little room around the piece, for style tiles. */
export const PIECE_VIEWBOX: Record<Slot, string> = {
  layer: "10 12 100 112",
  shirt: "10 20 100 100",
  undershirt: "10 20 100 100",
  belt: "30 101 60 20",
  pants: "16 104 88 82",
  shoes: "14 164 92 34",
};

/** Styles that reach past their slot's usual crop. */
const STYLE_VIEWBOX: Record<string, string> = { overcoat: "4 12 112 136" };

/**
 * A single garment exactly as drawn on the figure, with nothing else, cropped to where it's worn.
 * Head-worn accessories sit on a faint head (the person's `figure`, if given) so they read.
 */
export function pieceSvg(item: Item, part?: Slot | "acc", figure?: Figure): { svg: string; viewBox: string } {
  const where = part ?? (styleSpec(item.cat, item.style).art || (item.cat as Slot));
  if (where === "acc") {
    const onHead = HEAD_WORN.has(item.style);
    const layers = figureLayers([item], { ...EMPTY_LOOK, acc: [item.id] }, { cartoon: onHead, figure });
    const own = layers.filter((l) => l.part === "acc").map((l) => l.svg).join("");
    const head = onHead ? `<g opacity="0.35">${layers.filter((l) => l.part === "head").map((l) => l.svg).join("")}</g>` : "";
    return { svg: head + own, viewBox: ACC_VIEWBOX[item.style] ?? VIEWBOX.plain };
  }
  const svg = figureLayers([item], { ...EMPTY_LOOK, [where]: item.id })
    .filter((l) => l.part === where)
    .map((l) => l.svg)
    .join("");
  return { svg, viewBox: STYLE_VIEWBOX[item.style] ?? PIECE_VIEWBOX[where] ?? VIEWBOX.plain };
}

/**
 * SVG markup (inner content only) for an outfit on a simple figure.
 * Coordinates are a 120x200 figure: neck at y=28, waist at 110,
 * knee at 150, ankle at 180, shoe soles at 192 (see BODY).
 */
export function figureSvg(items: Item[], look: Look, opts: FigureOptions = {}): string {
  return figureLayers(items, look, opts).map((l) => l.svg).join("");
}

/** The figure as layers in painting order, each tagged with what it belongs to. */
export function figureLayers(items: Item[], look: Look, opts: FigureOptions = {}): Layer[] {
  // Only garments in their own category are drawn: an id in the wrong slot (or an undrawn style) is skipped.
  const get = (slot: Slot) => {
    const it = findItem(items, look[slot]);
    return it && it.cat === slot ? it : null;
  };
  const layer = get("layer"), shirt = get("shirt"), undershirt = get("undershirt"), belt = get("belt"), pants = get("pants"), shoes = get("shoes");
  const p = makePaint(!!opts.cartoon, opts.figure);
  const acc = lookAccessories(items, look);
  const out: Layer[] = [];
  const add = (part: Part, svg: string) => { if (svg) out.push({ part, svg }); };

  if (p.cartoon) add("head", head(p, "back"));
  add("body", arms(p) + legs(p) + torso(p));
  if (shoes) add("shoes", shoesSvg(p, shoes));
  // With no shirt, the undershirt is what shows: drawn as a tee in its own colour.
  if (undershirt) add("undershirt", topSvg(p, undershirt, !shirt));
  if (shirt) add("shirt", topSvg(p, shirt));
  if (acc.has("tie")) add("acc", tieSvg(p, acc.get("tie")!));
  if (pants) add("pants", bottomSvg(p, pants));
  if (belt) add("belt", beltSvg(p, belt));
  if (belt && pants && pants.style !== "skirt") add("pants", beltLoops(p, pants));
  if (layer) {
    add("layer", layerSvg(p, layer));
    // A crew-neck knit sits under the shirt collar, so the points show on top.
    if ((layer.style === "sweater" || layer.style === "crewneck") && isCollared(shirt)) {
      const f = fabric(p, shirt!, 6);
      add("shirt", f.defs + collarSvg(p, f, shirt!.style === "dress shirt" ? "spread" : "point"));
    }
  }
  if (p.cartoon) add("body", hands(p));
  if (acc.has("watch")) add("acc", watchSvg(p, acc.get("watch")!));
  if (acc.has("scarf")) add("acc", scarfSvg(p, acc.get("scarf")!));
  if (p.cartoon) {
    add("head", head(p, "front"));
    for (const style of ["glasses", "sunglasses", "hat"]) {
      const it = acc.get(style);
      if (it) add("acc", style === "hat" ? hatSvg(p, it) : eyewearSvg(p, it));
    }
  }
  return out;
}
