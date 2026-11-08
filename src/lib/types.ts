export type Category = "layer" | "shirt" | "undershirt" | "belt" | "pants" | "basics" | "shoes" | "other";
/** The categories an outfit is built from. Socks & underwear (basics) and other accessories are tracked for cost only. */
export type Slot = "layer" | "shirt" | "undershirt" | "belt" | "pants" | "shoes";

export interface Item {
  id: string;
  cat: Category;
  name: string;
  style: string;
  color: string;
  stripe?: string;
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

/** One outfit: an item id (or null) per slot. */
export type Look = Record<Slot, string | null>;

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

export interface Figure {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
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
