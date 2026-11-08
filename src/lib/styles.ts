import type { Buckle, Category, Hardware, Item, Length, Pattern, Sleeve, Slot } from "./types.ts";

/**
 * What a style can be customised with, and its defaults. A key that's present means the option applies;
 * its value is the default. `art` is where the renderer draws it (null: never drawn).
 */
export interface StyleSpec {
  sleeve?: Sleeve;
  /** Pattern applies. A pattern name is what a second colour means when no pattern is chosen (flannel: check). */
  pattern?: true | Pattern;
  hardware?: Hardware;
  length?: Length;
  buckle?: Buckle;
  art: Slot | "acc" | null;
}

export type DetailKey = "sleeve" | "pattern" | "hardware" | "length" | "buckle";
export const DETAIL_KEYS: DetailKey[] = ["sleeve", "pattern", "hardware", "length", "buckle"];

export const SLEEVES: Sleeve[] = ["long", "short", "rolled"];
export const PATTERNS: Pattern[] = ["solid", "stripe", "pinstripe", "breton", "gingham", "check", "dot"];
export const HARDWARE: Hardware[] = ["brass", "silver", "gunmetal", "black"];
export const LENGTHS: Length[] = ["full", "cropped", "knee", "short"];
export const BUCKLES: Buckle[] = ["frame", "plate", "d-ring"];
const VALUES: Record<DetailKey, readonly string[]> = { sleeve: SLEEVES, pattern: PATTERNS, hardware: HARDWARE, length: LENGTHS, buckle: BUCKLES };

/** Finishes as drawn: garment data, like item colours, so not theme tokens. */
export const HARDWARE_HEX: Record<Hardware, string> = { brass: "#b59a5b", silver: "#c3c6cb", gunmetal: "#5b5f66", black: "#1d1d1f" };

// Insertion order is menu order. The first style of each category is the default for a new item.
export const STYLE_SPEC: Record<Category, Record<string, StyleSpec>> = {
  layer: {
    blazer: { art: "layer", sleeve: "long", pattern: true, hardware: "brass" },
    sweater: { art: "layer", sleeve: "long", pattern: true },
    cardigan: { art: "layer", sleeve: "long", pattern: true, hardware: "brass" },
    jacket: { art: "layer", sleeve: "long", pattern: true, hardware: "silver" },
    crewneck: { art: "layer", sleeve: "long", pattern: true },
    "quarter-zip": { art: "layer", sleeve: "long", pattern: true, hardware: "silver" },
    hoodie: { art: "layer", sleeve: "long", pattern: true },
    "chore coat": { art: "layer", sleeve: "long", pattern: true, hardware: "brass" },
    bomber: { art: "layer", sleeve: "long", pattern: true, hardware: "silver" },
    overcoat: { art: "layer", sleeve: "long", pattern: true, hardware: "black" },
  },
  shirt: {
    oxford: { art: "shirt", sleeve: "long", pattern: true },
    polo: { art: "shirt", sleeve: "short", pattern: true },
    tee: { art: "shirt", sleeve: "short", pattern: true },
    "dress shirt": { art: "shirt", sleeve: "long", pattern: true },
    flannel: { art: "shirt", sleeve: "long", pattern: "check" },
    henley: { art: "shirt", sleeve: "long", pattern: true },
    "camp collar": { art: "shirt", sleeve: "short", pattern: true },
  },
  undershirt: {
    crew: { art: "undershirt", sleeve: "short" },
    "v-neck": { art: "undershirt", sleeve: "short" },
  },
  belt: {
    belt: { art: "belt", hardware: "brass", buckle: "frame" },
    braided: { art: "belt", hardware: "brass", buckle: "frame" },
  },
  pants: {
    pants: { art: "pants", pattern: true, length: "full" },
    shorts: { art: "pants", pattern: true, length: "short" },
    skirt: { art: "pants", pattern: true, length: "knee" },
    chinos: { art: "pants", pattern: true, length: "full" },
    jeans: { art: "pants", hardware: "brass", length: "full" },
    trousers: { art: "pants", pattern: true, length: "full" },
    joggers: { art: "pants", length: "full" },
  },
  basics: {
    socks: { art: null },
    underwear: { art: null },
    boxers: { art: null },
    briefs: { art: null },
    "boxer-briefs": { art: null },
    trunks: { art: null },
  },
  shoes: {
    boots: { art: "shoes" },
    sneakers: { art: "shoes" },
    loafers: { art: "shoes" },
    derby: { art: "shoes" },
    "chelsea boot": { art: "shoes" },
    "lace-up boot": { art: "shoes" },
    sandal: { art: "shoes" },
  },
  other: {
    glasses: { art: "acc" },
    sunglasses: { art: "acc" },
    watch: { art: "acc", hardware: "silver" },
    hat: { art: "acc" },
    tie: { art: "acc", pattern: true },
    scarf: { art: "acc", pattern: true },
    other: { art: null },
  },
};

export const STYLES = Object.fromEntries(Object.entries(STYLE_SPEC).map(([c, s]) => [c, Object.keys(s)])) as Record<Category, string[]>;

/** Styles that can be drawn, and so sketched (the generic accessory and socks & underwear can't). */
export const sketchStyles = (cat: Category) => STYLES[cat].filter((s) => STYLE_SPEC[cat][s].art !== null);

/** The style's spec, or the category's first style when the style is unknown (hand-edited files). */
export function styleSpec(cat: Category, style: string): StyleSpec {
  const specs = STYLE_SPEC[cat] ?? STYLE_SPEC.other;
  // An unknown accessory is a generic one, never drawn as glasses.
  return specs[style] ?? (specs === STYLE_SPEC.other ? specs.other : Object.values(specs)[0]);
}

/** Which detail controls a style offers, in display order. */
export const detailOptions = (cat: Category, style: string): DetailKey[] => {
  const spec = styleSpec(cat, style);
  return DETAIL_KEYS.filter((k) => spec[k] !== undefined);
};

export interface Details {
  sleeve?: Sleeve;
  pattern: Pattern;
  hardware?: Hardware;
  length?: Length;
  buckle?: Buckle;
}

const valid = (k: DetailKey, v: unknown) => typeof v === "string" && VALUES[k].includes(v);
/** The pattern a second colour means when none is chosen: stripe, unless the style says otherwise. */
const implied = (spec: StyleSpec): Pattern => (typeof spec.pattern === "string" ? spec.pattern : "stripe");

/** The details the renderer draws: the style's defaults, overlaid with the item's valid values. */
export function detailsOf(it: Pick<Item, "cat" | "style" | "stripe"> & Partial<Pick<Item, DetailKey>>): Details {
  const spec = styleSpec(it.cat, it.style);
  const out: Details = { pattern: "solid" };
  if (spec.sleeve) out.sleeve = valid("sleeve", it.sleeve) ? it.sleeve : spec.sleeve;
  if (spec.hardware) out.hardware = valid("hardware", it.hardware) ? it.hardware : spec.hardware;
  if (spec.length) out.length = valid("length", it.length) ? it.length : spec.length;
  if (spec.buckle) out.buckle = valid("buckle", it.buckle) ? it.buckle : spec.buckle;
  if (spec.pattern && it.stripe) out.pattern = valid("pattern", it.pattern) ? it.pattern! : implied(spec);
  return out;
}

/**
 * For saving from a form: drop details the style doesn't use, values equal to the style's default,
 * and a solid pattern (with its now-unused second colour).
 */
export function cleanDetails<T extends Partial<Item>>(it: T): T {
  const out = { ...it };
  const spec = styleSpec(out.cat ?? "other", out.style ?? "");
  for (const k of DETAIL_KEYS) {
    if (out[k] === undefined) continue;
    if (k === "pattern") {
      if (!spec.pattern || out.pattern === "solid" || out.pattern === implied(spec)) delete out.pattern;
    } else if (spec[k] === undefined || spec[k] === out[k]) delete out[k];
  }
  if (it.pattern === "solid" || !spec.pattern) delete out.stripe;
  return out;
}
