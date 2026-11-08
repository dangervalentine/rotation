import type { Category, Figure, Item, Look, Outfit, Rotation, Slot, WardrobeData } from "./types.ts";

export const CATEGORIES: [Category, string][] = [
  ["layer", "Top layers"],
  ["shirt", "Shirts"],
  ["belt", "Belts"],
  ["pants", "Pants"],
  ["shoes", "Shoes"],
  ["other", "Socks, undershirts and other"],
];

export const STYLES: Record<Category, string[]> = {
  layer: ["blazer", "sweater", "cardigan", "jacket"],
  shirt: ["oxford", "polo", "tee"],
  belt: ["belt"],
  pants: ["pants", "shorts", "skirt"],
  shoes: ["boots", "sneakers", "loafers"],
  other: ["other"],
};

export const SLOTS: [Slot, string][] = [
  ["layer", "Top layer"],
  ["shirt", "Shirt"],
  ["belt", "Belt"],
  ["pants", "Pants"],
  ["shoes", "Shoes"],
];

/** Slots an outfit may leave empty. */
export const OPTIONAL_SLOTS: Partial<Record<Slot, true>> = { layer: true, belt: true };

export const EMPTY_LOOK: Look = { layer: null, shirt: null, belt: null, pants: null, shoes: null };

export const DEFAULT_FIGURE: Figure = { skin: "#f1c7a3", hair: "#4a3426", hairStyle: "short" };

export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
export const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export const money = (n: number) =>
  "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const findItem = (items: Item[], id: string | null | undefined) =>
  (id && items.find((i) => i.id === id)) || null;

const KNOWN_BRANDS =
  /^(Uniqlo|J\.Crew|Red Wing|Levi's 501|Spier & Mackay|Suitsupply|Cole Haan|Banana Republic|Darn Tough) /;

/** Item name without its brand prefix, for compact labels. */
export function shortName(item: Item | null): string {
  if (!item) return "None";
  let n = item.name;
  if (item.brand && n.toLowerCase().startsWith(item.brand.toLowerCase() + " ")) n = n.slice(item.brand.length + 1);
  else n = n.replace(KNOWN_BRANDS, "");
  return n.charAt(0).toUpperCase() + n.slice(1);
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "item"
  );
}

export function uniqueId(base: string, taken: { id: string }[]) {
  const root = slugify(base);
  let id = root;
  for (let n = 2; taken.some((t) => t.id === id); n++) id = `${root}-${n}`;
  return id;
}

export function dayLabel(rot: Rotation, index: number) {
  const per = rot.days.length;
  const day = rot.days[index % per];
  return rot.weeks > 1 ? `Week ${Math.floor(index / per) + 1}, ${day}` : day;
}

export function normalizeLook(raw: Partial<Look> | null | undefined): Look {
  const look = clone(EMPTY_LOOK);
  for (const [slot] of SLOTS) look[slot] = raw?.[slot] ?? null;
  return look;
}

/** Resize the rotation's looks to days * weeks, keeping what fits and padding with empty looks. */
export function resizeRotation(rot: Rotation, days: string[], weeks: number): Rotation {
  const n = days.length * weeks;
  const looks = Array.from({ length: n }, (_, i) => normalizeLook(rot.looks[i]));
  return { days, weeks, looks };
}

/**
 * Accept the current format, or the original single-file format
 * ({ items, rotation: Look[] }), and return a complete WardrobeData.
 */
export function migrate(raw: any): WardrobeData {
  if (!raw || typeof raw !== "object") throw new Error("Not a wardrobe file");
  if (!Array.isArray(raw.items)) throw new Error("Wardrobe file has no items list");
  let rotation: Rotation;
  if (Array.isArray(raw.rotation)) {
    rotation = resizeRotation({ days: [], weeks: 0, looks: raw.rotation }, ["Mon", "Tue", "Wed", "Thu", "Fri"], Math.max(1, Math.ceil(raw.rotation.length / 5)));
  } else if (raw.rotation && Array.isArray(raw.rotation.looks)) {
    const days = Array.isArray(raw.rotation.days) && raw.rotation.days.length ? raw.rotation.days : ["Mon", "Tue", "Wed", "Thu", "Fri"];
    rotation = resizeRotation(raw.rotation, days, Math.max(1, Number(raw.rotation.weeks) || 1));
  } else {
    rotation = resizeRotation({ days: [], weeks: 0, looks: [] }, ["Mon", "Tue", "Wed", "Thu", "Fri"], 2);
  }
  const items: Item[] = raw.items.map((i: any) => ({
    ...i,
    price: Number(i.price) || 0,
    qty: Math.max(1, parseInt(i.qty, 10) || 1),
    owned: !!i.owned,
  }));
  const outfits: Outfit[] = Array.isArray(raw.outfits)
    ? raw.outfits.map((o: any) => ({ id: String(o.id), name: String(o.name || "Outfit"), look: normalizeLook(o.look) }))
    : [];
  return {
    version: 1,
    savedAt: Number(raw.savedAt) || Date.now(),
    title: raw.title || "Workweek Wardrobe",
    subtitle: raw.subtitle || "",
    items,
    outfits,
    rotation,
    figure: { ...DEFAULT_FIGURE, ...(raw.figure || {}) },
  };
}

/** Warnings for a rotation day compared with the previous day of the same week. */
export function dayWarnings(items: Item[], rot: Rotation, index: number, looks = rot.looks): string[] {
  if (index % rot.days.length === 0) return [];
  const cur = looks[index];
  const prev = looks[index - 1];
  const out: string[] = [];
  if (cur.pants && cur.pants === prev.pants) out.push("Same pants as yesterday");
  const shoes = findItem(items, cur.shoes);
  if (shoes && shoes.style !== "sneakers" && cur.shoes === prev.shoes) out.push("Same shoes as yesterday");
  if (cur.shirt && cur.shirt === prev.shirt) out.push("Same shirt as yesterday");
  return out;
}

/** How many rotation slots use this item. */
export function daysWorn(rot: Rotation, id: string) {
  return rot.looks.reduce((n, look) => n + SLOTS.filter(([s]) => look[s] === id).length, 0);
}

// ---------- mix and match ----------

export type Rng = () => number;

function luminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return 0.5;
  const v = parseInt(m[1], 16);
  return (0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255;
}

const pick = <T>(arr: T[], rng: Rng) => arr[Math.floor(rng() * arr.length)];

/** Belt whose darkness best matches the shoes (black shoes, black belt). */
export function matchingBelt(items: Item[], shoesId: string | null): string | null {
  const belts = items.filter((i) => i.cat === "belt");
  const shoes = findItem(items, shoesId);
  if (!belts.length) return null;
  if (!shoes) return belts[0].id;
  const target = luminance(shoes.color);
  return belts.reduce((best, b) =>
    Math.abs(luminance(b.color) - target) < Math.abs(luminance(best.color) - target) ? b : best,
  ).id;
}

/** Randomise every unlocked slot. Optional slots get "none" some of the time. */
export function shuffleLook(items: Item[], look: Look, locked: Partial<Record<Slot, boolean>> = {}, rng: Rng = Math.random): Look {
  const next = clone(look);
  for (const [slot] of SLOTS) {
    if (locked[slot] || slot === "belt") continue;
    const pool = items.filter((i) => i.cat === slot).map((i) => i.id as string | null);
    if (OPTIONAL_SLOTS[slot]) pool.push(null);
    if (pool.length) next[slot] = pick(pool, rng);
  }
  if (!locked.belt) next.belt = matchingBelt(items, next.shoes);
  return next;
}

/** The look with one slot swapped for each item of that category. */
export function variations(items: Item[], look: Look, slot: Slot): { id: string | null; look: Look }[] {
  const ids: (string | null)[] = items.filter((i) => i.cat === slot).map((i) => i.id);
  if (OPTIONAL_SLOTS[slot]) ids.unshift(null);
  return ids.map((id) => {
    const next = { ...look, [slot]: id };
    if (slot === "shoes" && look.belt) next.belt = matchingBelt(items, id);
    return { id, look: next };
  });
}

/**
 * Fill a whole rotation, spreading wear evenly and avoiding the day-to-day
 * repeats that dayWarnings flags. Leather shoes and pants never repeat on
 * consecutive days when there's an alternative.
 */
export function generateRotation(items: Item[], days: string[], weeks: number, rng: Rng = Math.random, layerChance = 0.4): Look[] {
  const per = days.length;
  const total = per * weeks;
  const used = new Map<string, number>();
  const bump = (id: string | null) => id && used.set(id, (used.get(id) || 0) + 1);
  const choose = (cat: Slot, avoid: (string | null)[]) => {
    const pool = items.filter((i) => i.cat === cat);
    if (!pool.length) return null;
    const ok = pool.filter((i) => !avoid.includes(i.id));
    const cands = ok.length ? ok : pool;
    const min = Math.min(...cands.map((i) => used.get(i.id) || 0));
    return pick(cands.filter((i) => (used.get(i.id) || 0) === min), rng).id;
  };
  const looks: Look[] = [];
  for (let d = 0; d < total; d++) {
    const prev = d % per === 0 ? null : looks[d - 1];
    const prevShoes = prev && findItem(items, prev.shoes);
    const look: Look = {
      layer: rng() < layerChance ? choose("layer", []) : null,
      shirt: choose("shirt", prev ? [prev.shirt] : []),
      pants: choose("pants", prev ? [prev.pants] : []),
      shoes: choose("shoes", prevShoes && prevShoes.style !== "sneakers" ? [prevShoes.id] : []),
      belt: null,
    };
    look.belt = matchingBelt(items, look.shoes);
    for (const [s] of SLOTS) bump(look[s]);
    looks.push(look);
  }
  return looks;
}

export function wardrobeTotals(items: Item[]) {
  const by: Record<string, { t: number; o: number; n: number }> = {};
  let all = 0, own = 0, pieces = 0;
  for (const it of items) {
    const sub = (+it.price || 0) * (+it.qty || 0);
    const c = (by[it.cat] ||= { t: 0, o: 0, n: 0 });
    c.t += sub;
    c.n += +it.qty || 0;
    pieces += +it.qty || 0;
    if (it.owned) { c.o += sub; own += sub; }
    all += sub;
  }
  return { by, all, own, pieces };
}
