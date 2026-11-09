import { describe, expect, it } from "vitest";
import seed from "../data/wardrobe.json";
import { daysWorn, EMPTY_LOOK, isEmptyLook, normalizeLook, dayWarnings, generateRotation, matchingBelt, migrate, resizeRotation, shuffleLook, sortForPicker, canShuffle, uniqueId, variations, wardrobeTotals } from "../src/lib/model.ts";
import { makeSketch } from "../src/lib/sketch.ts";
import type { Item, Slot } from "../src/lib/types.ts";
import { figureSvg, pieceSvg } from "../src/lib/figure.ts";

// Deterministic RNG for repeatable shuffles
const rng = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe("migrate", () => {
  it("reads the original single-file format", () => {
    const d = migrate({ items: [{ id: "a", cat: "shirt", name: "A", style: "oxford", color: "#fff", price: "5", qty: "2" }], rotation: Array(10).fill({ shirt: "a" }) });
    expect(d.rotation.days).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    expect(d.rotation.weeks).toBe(2);
    expect(d.rotation.looks[3]).toEqual({ layer: null, shirt: "a", undershirt: null, belt: null, pants: null, shoes: null });
    expect(d.items[0].price).toBe(5);
    expect(d.outfits).toEqual([]);
  });
  it("accepts the seed file", () => {
    const d = migrate(seed);
    expect(d.items.length).toBeGreaterThan(10);
    expect(d.rotation.looks).toHaveLength(10);
  });
  it("sorts old 'other' items into socks & underwear, undershirts and other", () => {
    const d = migrate(seed);
    const cat = (id: string) => d.items.find((i) => i.id === id);
    expect(cat("socks-white")).toMatchObject({ cat: "basics", style: "socks" });
    expect(cat("undershirt")).toMatchObject({ cat: "undershirt", style: "crew" });
    expect(cat("wallet")).toMatchObject({ cat: "other" });
  });
  it("rejects junk", () => {
    expect(() => migrate({ nope: 1 })).toThrow();
  });
  it("keeps item details, including values it doesn't know", () => {
    const d = migrate({ items: [{ id: "a", cat: "shirt", name: "A", style: "oxford", color: "#fff", sleeve: "rolled", pattern: "gingham", stripe: "#000" }, { id: "b", cat: "belt", name: "B", style: "belt", color: "#000", hardware: "silver", buckle: "plate" }, { id: "c", cat: "pants", name: "C", style: "pants", color: "#000", length: "capri" }] });
    expect(d.items[0]).toMatchObject({ sleeve: "rolled", pattern: "gingham", stripe: "#000" });
    expect(d.items[1]).toMatchObject({ hardware: "silver", buckle: "plate" });
    expect(d.items[2]).toMatchObject({ length: "capri" });
  });
  it("loads the sample wardrobe with every item, outfit and slot unchanged", () => {
    const d = migrate(seed);
    expect(d.items.map((i) => [i.id, i.color, i.stripe ?? null])).toEqual(seed.items.map((i: any) => [i.id, i.color, i.stripe ?? null]));
    expect(d.rotation.looks).toEqual(seed.rotation.looks.map((l: any) => normalizeLook(l)));
    expect(d.outfits.map((o) => o.look)).toEqual((seed.outfits ?? []).map((o: any) => normalizeLook(o.look)));
  });
  it("round-trips an export with every detail", () => {
    const d = migrate({ items: [{ id: "a", cat: "shirt", name: "A", style: "oxford", color: "#fff", price: 1, qty: 1, owned: true, sleeve: "short", pattern: "dot", stripe: "#123456" }, { id: "b", cat: "pants", name: "B", style: "pants", color: "#000", price: 1, qty: 1, owned: true, length: "cropped" }, { id: "c", cat: "belt", name: "C", style: "belt", color: "#000", price: 1, qty: 1, owned: true, hardware: "gunmetal", buckle: "d-ring" }] });
    expect(migrate(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });
});

describe("rotation rules", () => {
  const d = migrate(seed);
  it("flags repeats within a week but not across the week boundary", () => {
    const looks = d.rotation.looks.map((l) => ({ ...l }));
    looks[1].pants = looks[0].pants;
    looks[5].pants = looks[4].pants;
    expect(dayWarnings(d.items, d.rotation, 1, looks)).toContain("Same pants as yesterday");
    expect(dayWarnings(d.items, d.rotation, 5, looks)).toEqual([]);
  });
  it("generates a rotation with no warnings when the wardrobe allows it", () => {
    const looks = generateRotation(d.items, d.rotation.days, 2, rng(7));
    const rot = { ...d.rotation, looks };
    expect(looks).toHaveLength(10);
    looks.forEach((_, i) => expect(dayWarnings(d.items, rot, i)).toEqual([]));
    expect(looks.every((l) => l.shirt && l.pants && l.shoes)).toBe(true);
  });
  it("fills only the empty days, leaving the ones already set exactly as they are", () => {
    const keep = d.rotation.looks.map((l, i) => (i % 2 ? { ...EMPTY_LOOK } : l));
    const looks = generateRotation(d.items, d.rotation.days, d.rotation.weeks, rng(7), 0.4, keep);
    looks.forEach((l, i) => {
      if (i % 2) expect(l.shirt && l.pants && l.shoes).toBeTruthy();
      else expect(l).toEqual(d.rotation.looks[i]);
    });
  });
  it("leaves a full rotation untouched", () => {
    expect(generateRotation(d.items, d.rotation.days, d.rotation.weeks, rng(7), 0.4, d.rotation.looks)).toEqual(d.rotation.looks);
  });
  it("avoids repeating the kept day after a filled one", () => {
    for (let s = 1; s < 20; s++) {
      const keep = d.rotation.looks.map((l, i) => (i === 1 ? l : { ...EMPTY_LOOK }));
      const looks = generateRotation(d.items, d.rotation.days, d.rotation.weeks, rng(s), 0.4, keep);
      expect(dayWarnings(d.items, { ...d.rotation, looks }, 1)).toEqual([]);
    }
  });
  it("treats a day with only accessories as empty", () => {
    expect(isEmptyLook({ ...EMPTY_LOOK, acc: ["tie"] })).toBe(true);
    expect(isEmptyLook({ ...EMPTY_LOOK, layer: "x" })).toBe(false);
  });
  it("resizes, keeping existing days", () => {
    const r = resizeRotation(d.rotation, ["Mon", "Wed"], 3);
    expect(r.looks).toHaveLength(6);
    expect(r.looks[0]).toEqual(d.rotation.looks[0]);
  });
});

describe("mix and match", () => {
  const d = migrate(seed);
  it("keeps locked slots when shuffling", () => {
    const base = d.rotation.looks[0];
    for (let s = 1; s < 20; s++) expect(shuffleLook(d.items, base, { shirt: true, pants: true }, rng(s)).shirt).toBe(base.shirt);
  });
  it("matches a black belt to black shoes", () => {
    expect(matchingBelt(d.items, "beckman")).toBe("belt-black");
    expect(matchingBelt(d.items, "iron-ranger")).toBe("belt-brown");
  });
  it("offers one variation per item, plus none for optional slots", () => {
    const shirts = d.items.filter((i) => i.cat === "shirt").length;
    expect(variations(d.items, d.rotation.looks[0], "shirt")).toHaveLength(shirts);
    expect(variations(d.items, d.rotation.looks[0], "layer")[0].id).toBeNull();
  });
  it("makes unique ids", () => {
    expect(uniqueId("Blazer", [{ id: "blazer" }, { id: "blazer-2" }])).toBe("blazer-3");
  });
});

describe("figure", () => {
  const d = migrate(seed);
  it("draws a head only in cartoon mode", () => {
    const look = d.rotation.looks[0];
    expect(figureSvg(d.items, look)).not.toContain("<ellipse");
    expect(figureSvg(d.items, look, { cartoon: true, figure: d.figure })).toContain("<ellipse");
  });
});

describe("sketches", () => {
  const d = migrate(seed);
  const sketchesFor = (slots: Slot[]): Item[] =>
    slots.map((cat, n) => ({ id: "sk-" + cat, ...makeSketch({ cat, style: cat === "belt" ? "belt" : cat === "shoes" ? "loafers" : cat === "pants" ? "pants" : cat === "shirt" ? "oxford" : "blazer", color: n % 2 ? "#1d1d1f" : "#5a3e2b" }, d.items) }));
  it("leaves sketches out of every cost figure", () => {
    const before = wardrobeTotals(d.items);
    const withSketch = [...d.items, { ...sketchesFor(["layer"])[0], price: 500 }];
    expect(wardrobeTotals(withSketch)).toEqual(before);
  });
  it("never generates a sketch onto a day, belts included", () => {
    const items = [...d.items, ...sketchesFor(["layer", "shirt", "belt", "pants", "shoes"])];
    const looks = generateRotation(items, ["Mon", "Tue", "Wed", "Thu", "Fri"], 4, rng(7), 1);
    for (const l of looks) for (const id of Object.values(l)) expect(String(id)).not.toMatch(/^sk-/);
  });
});

describe("builder helpers", () => {
  const d = migrate(seed);
  it("shuffle always changes something when it can", () => {
    const r = rng(3);
    const locked = { layer: true, shirt: true, undershirt: true, belt: true, pants: true } as const;
    let look = d.rotation.looks[0];
    for (let i = 0; i < 25; i++) {
      const next = shuffleLook(d.items, look, locked, r);
      expect(next.shoes).not.toBe(look.shoes);
      look = next;
    }
  });
  it("returns the same look when everything is kept", () => {
    const all = { layer: true, shirt: true, undershirt: true, belt: true, pants: true, shoes: true };
    expect(canShuffle(d.items, all)).toBe(false);
    expect(shuffleLook(d.items, d.rotation.looks[0], all)).toEqual(d.rotation.looks[0]);
  });
  it("orders owned, then to buy, then sketches", () => {
    const base = { cat: "shirt" as const, style: "oxford", color: "#fff", price: 0, qty: 1 };
    const items = [
      { ...base, id: "s1", name: "S1", owned: false, sketch: true as const },
      { ...base, id: "b1", name: "B1", owned: false },
      { ...base, id: "o1", name: "O1", owned: true },
      { ...base, id: "b2", name: "B2", owned: false },
      { ...base, id: "o2", name: "O2", owned: true },
    ];
    expect(sortForPicker(items).map((i) => i.id)).toEqual(["o1", "o2", "b1", "b2", "s1"]);
  });
});

describe("piece silhouettes", () => {
  it("draws only the garment, not the bare mannequin", () => {
    const shoe = { id: "s", cat: "shoes" as const, name: "S", style: "boots", color: "#5a3e2b", price: 0, qty: 1, owned: false };
    const { svg } = pieceSvg(shoe, "shoes");
    expect(svg).toContain("#5a3e2b");
    expect(svg).not.toContain("#bbb");
  });
  it("shows a crew undershirt in an oxford's collar, and alone as a tee", () => {
    const items = [
      { id: "u", cat: "undershirt" as const, name: "U", style: "crew", color: "#123456", price: 0, qty: 1, owned: true },
      { id: "o", cat: "shirt" as const, name: "O", style: "oxford", color: "#abcdef", price: 0, qty: 1, owned: true },
    ];
    const empty = { layer: null, shirt: null, undershirt: null, belt: null, pants: null, shoes: null };
    expect(figureSvg(items, { ...empty, shirt: "o", undershirt: "u" })).toContain("#123456");
    expect(pieceSvg(items[0], "undershirt").svg).toContain("#123456");
  });
});

describe("accessories on a look", () => {
  const d = migrate(seed);
  it("keeps accessory ids unique and drops an empty or invalid list", () => {
    expect(normalizeLook({ shirt: "a", acc: ["g", "w", "g", 3 as any, ""] }).acc).toEqual(["g", "w"]);
    expect("acc" in normalizeLook({ shirt: "a", acc: [] })).toBe(false);
    expect("acc" in normalizeLook({ shirt: "a", acc: "g" as any })).toBe(false);
    expect(normalizeLook({ shirt: "a" })).toEqual({ layer: null, shirt: "a", undershirt: null, belt: null, pants: null, shoes: null });
  });
  it("carries accessories through shuffles and variations", () => {
    const look = { ...d.rotation.looks[0], acc: ["glasses"] };
    expect(shuffleLook(d.items, look, {}, rng(3)).acc).toEqual(["glasses"]);
    for (const v of variations(d.items, look, "shirt")) expect(v.look.acc).toEqual(["glasses"]);
  });
  it("never adds accessories when generating, but keeps the ones already on each day", () => {
    const keep = d.rotation.looks.map((l, i) => (i === 0 ? { ...l, acc: ["tie"] } : l));
    const looks = generateRotation(d.items, d.rotation.days, d.rotation.weeks, rng(5), 0.4, keep);
    expect(looks[0].acc).toEqual(["tie"]);
    expect(looks.slice(1).every((l) => !l.acc)).toBe(true);
    expect(generateRotation(d.items, d.rotation.days, d.rotation.weeks, rng(5)).every((l) => !l.acc)).toBe(true);
  });
  it("counts days an accessory is worn", () => {
    const rot = { ...d.rotation, looks: d.rotation.looks.map((l, i) => (i < 3 ? { ...l, acc: ["tie"] } : l)) };
    expect(daysWorn(rot, "tie")).toBe(3);
  });
});

describe("underwear in older files", () => {
  it("picks the specific style a name mentions", () => {
    const d = migrate({ items: ["Boxer briefs, black", "Woven boxers", "Cotton briefs", "Swim trunks", "Underwear 3-pack"].map((name, i) => ({ id: "u" + i, cat: "other", name, style: "other", color: "#000000" })) });
    expect(d.items.map((i) => [i.cat, i.style])).toEqual([["basics", "boxer-briefs"], ["basics", "boxers"], ["basics", "briefs"], ["basics", "trunks"], ["basics", "underwear"]]);
  });
});
