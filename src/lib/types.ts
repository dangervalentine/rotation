export type Category = "layer" | "shirt" | "belt" | "pants" | "shoes" | "other";
export type Slot = "layer" | "shirt" | "belt" | "pants" | "shoes";

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
