export type Category = "layer" | "shirt" | "undershirt" | "belt" | "pants" | "basics" | "shoes" | "other";
/** The categories an outfit is built from, one item each. Accessories ("other") go on a look as a list; socks & underwear (basics) are tracked for cost only. */
export type Slot = "layer" | "shirt" | "undershirt" | "belt" | "pants" | "shoes";

export type Sleeve = "long" | "short" | "rolled";
export type Pattern = "solid" | "stripe" | "pinstripe" | "breton" | "gingham" | "check" | "dot";
export type Hardware = "brass" | "silver" | "gunmetal" | "black";
export type Length = "full" | "cropped" | "knee" | "short";
export type Buckle = "frame" | "plate" | "d-ring";

export interface Item {
  id: string;
  cat: Category;
  name: string;
  style: string;
  color: string;
  /** The second colour for any pattern. Present without `pattern`, it is read as `pattern: "stripe"`. */
  stripe?: string;
  /** Optional details. Missing means the style's default (see styles.ts); defaults are never stored. */
  sleeve?: Sleeve;
  pattern?: Pattern;
  hardware?: Hardware;
  length?: Length;
  buckle?: Buckle;
  price: number;
  qty: number;
  owned: boolean;
  link?: string;
  image?: string;
  brand?: string;
  notes?: string;
  /** Set while the item is a sketch made in the outfit builder. Missing on every other item, and removed on promotion. Always owned: false while set. */
  sketch?: true;
}

/** One outfit: an item id (or null) per slot, plus any accessories. */
export type Look = Record<Slot, string | null> & {
  /** Accessory item ids, unique, in the order added. Omitted when empty. */
  acc?: string[];
};

export interface Outfit {
  id: string;
  name: string;
  look: Look;
}

export interface Rotation {
  days: string[];
  weeks: number;
  /** days.length * weeks entries, week-major. */
  looks: Look[];
}

export type HairStyle = "short" | "long" | "bun" | "curly" | "none";
/** How much of the person the printed figure shows: a full cartoon, a cartoon with a blank face, or just the outfit on the plain mannequin. */
export type FigureShow = "face" | "faceless" | "outfit";

export interface Figure {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  /** Missing means "face". */
  show?: FigureShow;
}

export interface WardrobeData {
  version: 1;
  savedAt: number;
  title: string;
  subtitle: string;
  items: Item[];
  outfits: Outfit[];
  rotation: Rotation;
  figure: Figure;
}
