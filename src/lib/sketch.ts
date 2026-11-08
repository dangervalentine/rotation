import { isSlot, shortName, STYLES } from "./model.ts";
import { nearestColourName, paletteHex } from "./palette.ts";
import type { Item, Slot } from "./types.ts";

export type ItemStatus = "sketch" | "tobuy" | "owned";

export const STATUS_LABEL: Record<ItemStatus, string> = { sketch: "Sketch", tobuy: "To buy", owned: "Owned" };

/** The status people see. Each item has exactly one. */
export const itemStatus = (it: Item): ItemStatus => (it.sketch ? "sketch" : it.owned ? "owned" : "tobuy");

/** Make a sketch real: it joins costs and the rotation generator. */
export function promote(it: Item, to: "tobuy" | "owned"): Item {
  const { sketch: _, ...rest } = it;
  return { ...rest, owned: to === "owned" };
}

/** What a confirm with no changes gives, per slot: the commonest menswear basics. */
export const SKETCH_DEFAULTS: Record<Slot, { style: string; color: string }> = {
  layer: { style: "blazer", color: paletteHex("navy") },
  shirt: { style: "oxford", color: paletteHex("light blue") },
  undershirt: { style: "crew", color: paletteHex("white") },
  belt: { style: "belt", color: paletteHex("brown") },
  pants: { style: "pants", color: paletteHex("charcoal") },
  shoes: { style: "loafers", color: paletteHex("brown") },
};

export interface SketchDraft {
  cat: Slot;
  style: string;
  color: string;
  stripe?: string;
  name?: string;
  image?: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Olive jacket": the nearest palette colour's name and the style. */
export const sketchName = (color: string, style: string) => cap(nearestColourName(color)) + " " + style;

/** `base`, or `base 2`, `base 3`… so no two items share a name, full or as shown without the brand (ignoring case). */
export function uniqueName(base: string, items: { name: string; brand?: string }[]) {
  const taken = new Set(items.flatMap((i) => [i.name, shortName(i as Item)].map((n) => n.trim().toLowerCase())));
  let name = base;
  for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${base} ${n}`;
  return name;
}

export function makeSketch(d: SketchDraft, items: { name: string; brand?: string }[]): Omit<Item, "id"> {
  if (!isSlot(d.cat)) throw new Error("Sketches are for outfit slots only");
  if (!STYLES[d.cat].includes(d.style)) throw new Error(`"${d.style}" isn't a ${d.cat} style`);
  const out: Omit<Item, "id"> = {
    cat: d.cat,
    name: uniqueName(d.name?.trim() || sketchName(d.color, d.style), items),
    style: d.style,
    color: d.color,
    price: 0,
    qty: 1,
    owned: false,
    sketch: true,
  };
  if (d.stripe) out.stripe = d.stripe;
  if (d.image) out.image = d.image;
  return out;
}
