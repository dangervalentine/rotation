import { luminance } from "./colour.ts";
import type { Category, Figure, Item, Look, Outfit, Rotation, Slot, WardrobeData } from "./types.ts";

/** Categories in the order they're worn, top to bottom (outer before inner where they overlap). */
export const CATEGORIES: [Category, string][] = [
  ["layer", "Top layers"],
  ["shirt", "Shirts"],
  ["undershirt", "Undershirts"],
  ["belt", "Belts"],
  ["pants", "Pants"],
  ["basics", "Socks & underwear"],
  ["shoes", "Shoes"],
  ["other", "Accessories"],
];

export { STYLES } from "./styles.ts";

export const SLOTS: [Slot, string][] = [
  ["layer", "Top layer"],
  ["shirt", "Shirt"],
  ["undershirt", "Undershirt"],
  ["belt", "Belt"],
  ["pants", "Pants"],
  ["shoes", "Shoes"],
];

/** Slots an outfit may leave empty. */
export const OPTIONAL_SLOTS: Partial<Record<Slot, true>> = { layer: true, undershirt: true, belt: true };

export const EMPTY_LOOK: Look = { layer: null, shirt: null, undershirt: null, belt: null, pants: null, shoes: null };

/** Whether items of this category go into outfits (and so count days worn). */
export const isSlot = (cat: Category): cat is Slot => SLOTS.some(([s]) => s === cat);

export const DEFAULT_FIGURE: Figure = { skin: "#f1c7a3", hair: "#4a3426", hairStyle: "short" };

export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
export const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** A price as the style guide writes it: "$49.90", but no cents above $100 ("$399", "$2,749"). */
export const money = (n: number) => {
  const v = Number(n || 0);
  const cents = Math.abs(v) < 100 ? 2 : 0;
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: cents, maximumFractionDigits: cents });
};

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
  // Accessories: unique string ids, and no list at all when there are none.
  const acc = Array.isArray(raw?.acc) ? [...new Set(raw.acc.filter((a): a is string => typeof a === "string" && a !== ""))] : [];
  if (acc.length) look.acc = acc;
  return look;
}

/** Resize the rotation's looks to days * weeks, keeping what fits and padding with empty looks. */
export function resizeRotation(rot: Rotation, days: string[], weeks: number): Rotation {
  const n = days.length * weeks;
  const looks = Array.from({ length: n }, (_, i) => normalizeLook(rot.looks[i]));
  return { days, weeks, looks };
}

/** Older files put socks, underwear and undershirts in "other". Sort them into their own categories by name. */
function splitOther(i: any): Partial<Item> {
  if (i.cat !== "other") return {};
  const name = String(i.name || "").toLowerCase();
  if (/undershirt/.test(name)) return { cat: "undershirt", style: /v-?neck/.test(name) ? "v-neck" : "crew" };
  if (/\bsocks?\b/.test(name)) return { cat: "basics", style: "socks" };
  if (/underwear|boxers?|briefs?|trunks?/.test(name)) return { cat: "basics", style: underwearStyle(name) };
  return {};
}

/** The specific underwear style a name mentions, or the generic one. */
const underwearStyle = (name: string) =>
  /boxer[- ]?briefs/.test(name) ? "boxer-briefs" : /boxers?/.test(name) ? "boxers" : /briefs?/.test(name) ? "briefs" : /trunks?/.test(name) ? "trunks" : "underwear";

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
  const items: Item[] = raw.items.map((i: any) => {
    const it: Item = { ...i, ...splitOther(i), price: Number(i.price) || 0, qty: Math.max(1, parseInt(i.qty, 10) || 1), owned: !!i.owned };
    // A sketch is never owned; anything else in the field is dropped.
    if (i.sketch !== true || it.owned) delete it.sketch;
    return it;
  });
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
  return rot.looks.reduce((n, look) => n + SLOTS.filter(([s]) => look[s] === id).length + (look.acc?.includes(id) ? 1 : 0), 0);
}

// ---------- mix and match ----------

export type Rng = () => number;

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
function shufflePool(items: Item[], slot: Slot) {
  const pool = items.filter((i) => i.cat === slot).map((i) => i.id as string | null);
  if (OPTIONAL_SLOTS[slot]) pool.push(null);
  return pool;
}

/** Whether shuffling could change anything: some unkept slot (the belt follows the shoes) has a choice. */
export function canShuffle(items: Item[], locked: Partial<Record<Slot, boolean>> = {}) {
  return SLOTS.some(([slot]) => slot !== "belt" && !locked[slot] && shufflePool(items, slot).length > 1);
}

/** Randomise every unlocked slot. Returns a different look whenever one is possible. */
export function shuffleLook(items: Item[], look: Look, locked: Partial<Record<Slot, boolean>> = {}, rng: Rng = Math.random): Look {
  const once = () => {
    const next = clone(look);
    for (const [slot] of SLOTS) {
      if (locked[slot] || slot === "belt") continue;
      const pool = shufflePool(items, slot);
      if (pool.length) next[slot] = pick(pool, rng);
    }
    if (!locked.belt) next.belt = matchingBelt(items, next.shoes);
    return next;
  };
  let next = once();
  for (let tries = 0; tries < 8 && same(next, look) && canShuffle(items, locked); tries++) next = once();
  return next;
}

/** Picker order: owned, then to buy, then sketches; wardrobe order within each. */
export function sortForPicker(items: Item[]): Item[] {
  const rank = (i: Item) => (i.sketch ? 2 : i.owned ? 0 : 1);
  return items.map((it, n) => ({ it, n })).sort((a, b) => rank(a.it) - rank(b.it) || a.n - b.n).map((x) => x.it);
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

/** Whether a day has no garments on it yet (accessories alone don't count). */
export const isEmptyLook = (look: Look | undefined) => !look || SLOTS.every(([s]) => !look[s]);

/**
 * Fill the empty days of a rotation, spreading wear evenly and avoiding the
 * day-to-day repeats that dayWarnings flags. Leather shoes and pants never
 * repeat on consecutive days when there's an alternative. Days in `keep` that
 * already have garments are left exactly as they are, and count toward both.
 */
export function generateRotation(all: Item[], days: string[], weeks: number, rng: Rng = Math.random, layerChance = 0.4, keep: Look[] = []): Look[] {
  // Sketches are only placed by hand, never generated (including through belt matching).
  const items = all.filter((i) => !i.sketch);
  const per = days.length;
  const total = per * weeks;
  const kept = (d: number) => (isEmptyLook(keep[d]) ? null : keep[d]);
  const used = new Map<string, number>();
  const bump = (id: string | null) => id && used.set(id, (used.get(id) || 0) + 1);
  for (let d = 0; d < total; d++) {
    const look = kept(d);
    if (look) for (const [s] of SLOTS) bump(look[s]);
  }
  const choose = (cat: Slot, avoid: (string | null)[]) => {
    const pool = items.filter((i) => i.cat === cat);
    if (!pool.length) return null;
    const ok = pool.filter((i) => !avoid.includes(i.id));
    const cands = ok.length ? ok : pool;
    const min = Math.min(...cands.map((i) => used.get(i.id) || 0));
    return pick(cands.filter((i) => (used.get(i.id) || 0) === min), rng).id;
  };
  const leather = (look: Look | null) => {
    const shoes = look && findItem(items, look.shoes);
    return shoes && shoes.style !== "sneakers" ? shoes.id : null;
  };
  const looks: Look[] = [];
  for (let d = 0; d < total; d++) {
    const own = kept(d);
    if (own) {
      looks.push(clone(own));
      continue;
    }
    // Neighbours within the week: the day before, and the day after when it's kept.
    const near = [d % per === 0 ? null : looks[d - 1], d % per === per - 1 ? null : kept(d + 1)].filter((l): l is Look => !!l);
    const look: Look = {
      layer: rng() < layerChance ? choose("layer", []) : null,
      shirt: choose("shirt", near.map((l) => l.shirt)),
      undershirt: choose("undershirt", []),
      pants: choose("pants", near.map((l) => l.pants)),
      shoes: choose("shoes", near.map(leather)),
      belt: null,
    };
    look.belt = matchingBelt(items, look.shoes);
    // Accessories are only ever put on by hand: keep each day's.
    if (keep[d]?.acc?.length) look.acc = [...keep[d].acc!];
    for (const [s] of SLOTS) bump(look[s]);
    looks.push(look);
  }
  return looks;
}

export function wardrobeTotals(items: Item[]) {
  const by: Record<string, { t: number; o: number; n: number }> = {};
  let all = 0, own = 0, pieces = 0;
  for (const it of items) {
    if (it.sketch) continue; // sketches are ideas, not costs
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
