import { describe, expect, it } from "vitest";
import seed from "../data/wardrobe.json";
import { dayWarnings, generateRotation, matchingBelt, migrate, resizeRotation, shuffleLook, uniqueId, variations } from "../src/lib/model.ts";
import { figureSvg } from "../src/lib/figure.ts";

// Deterministic RNG for repeatable shuffles
const rng = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe("migrate", () => {
  it("reads the original single-file format", () => {
    const d = migrate({ items: [{ id: "a", cat: "shirt", name: "A", style: "oxford", color: "#fff", price: "5", qty: "2" }], rotation: Array(10).fill({ shirt: "a" }) });
    expect(d.rotation.days).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    expect(d.rotation.weeks).toBe(2);
    expect(d.rotation.looks[3]).toEqual({ layer: null, shirt: "a", belt: null, pants: null, shoes: null });
    expect(d.items[0].price).toBe(5);
    expect(d.outfits).toEqual([]);
  });
  it("accepts the seed file", () => {
    const d = migrate(seed);
    expect(d.items.length).toBeGreaterThan(10);
    expect(d.rotation.looks).toHaveLength(10);
  });
  it("rejects junk", () => {
    expect(() => migrate({ nope: 1 })).toThrow();
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
