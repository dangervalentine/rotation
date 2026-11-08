import { describe, expect, it } from "vitest";
import { migrate } from "../src/lib/model.ts";
import { nearestColourName, PALETTE } from "../src/lib/palette.ts";
import { itemStatus, makeSketch, promote, SKETCH_DEFAULTS, sketchName, uniqueName } from "../src/lib/sketch.ts";
import type { Item } from "../src/lib/types.ts";

const item = (over: Partial<Item> = {}): Item => ({ id: "x", cat: "shirt", name: "X", style: "oxford", color: "#fff", price: 0, qty: 1, owned: false, ...over });

describe("palette", () => {
  it("has 12 named colours", () => {
    expect(PALETTE).toHaveLength(12);
    expect(new Set(PALETTE.map((p) => p.name)).size).toBe(12);
  });
  it("names exact and near colours", () => {
    expect(nearestColourName("#5f6340")).toBe("olive");
    expect(nearestColourName("#23314b")).toBe("navy");
    expect(nearestColourName("#ffffff")).toBe("white");
  });
});

describe("naming", () => {
  it("builds a name from colour and style", () => {
    expect(sketchName("#5f6340", "jacket")).toBe("Olive jacket");
  });
  it("numbers clashes, ignoring case", () => {
    expect(uniqueName("Olive jacket", [{ name: "olive JACKET" }])).toBe("Olive jacket 2");
    expect(uniqueName("Olive jacket", [{ name: "Olive jacket" }, { name: "Olive jacket 2" }])).toBe("Olive jacket 3");
    expect(uniqueName("Olive jacket", [])).toBe("Olive jacket");
    // Pickers show names without the brand, so those count too.
    expect(uniqueName("Navy blazer", [{ name: "Suitsupply navy blazer", brand: "Suitsupply" }])).toBe("Navy blazer 2");
  });
});

describe("makeSketch", () => {
  it("stores only the details that differ from the style's defaults", () => {
    const s = makeSketch({ cat: "shirt", style: "oxford", color: "#fff", sleeve: "long", pattern: "gingham", stripe: "#7d9bc6" }, []);
    expect(s.sleeve).toBeUndefined();
    expect(s).toMatchObject({ pattern: "gingham", stripe: "#7d9bc6" });
    const b = makeSketch({ cat: "belt", style: "belt", color: "#000", hardware: "silver", sleeve: "short" }, []);
    expect(b).toMatchObject({ hardware: "silver" });
    expect(b.sleeve).toBeUndefined();
  });
  it("makes a $0, not-owned sketch with a generated name", () => {
    const s = makeSketch({ cat: "layer", ...SKETCH_DEFAULTS.layer, name: "  " }, []);
    expect(s).toMatchObject({ cat: "layer", style: "blazer", name: "Navy blazer", price: 0, qty: 1, owned: false, sketch: true });
    expect(s.stripe).toBeUndefined();
  });
  it("keeps a typed name, stripe and image", () => {
    const s = makeSketch({ cat: "shirt", style: "oxford", color: "#a9c1dc", stripe: "#7d9bc6", name: " Weekend oxford ", image: "data:image/jpeg;base64,AA" }, []);
    expect(s).toMatchObject({ name: "Weekend oxford", stripe: "#7d9bc6", image: "data:image/jpeg;base64,AA" });
  });
  it("rejects the other category and unknown styles", () => {
    expect(() => makeSketch({ cat: "other" as any, style: "other", color: "#000" }, [])).toThrow();
    expect(() => makeSketch({ cat: "shoes", style: "oxford", color: "#000" }, [])).toThrow();
  });
});

describe("status", () => {
  it("has exactly one status per item", () => {
    expect(itemStatus(item({ sketch: true }))).toBe("sketch");
    expect(itemStatus(item())).toBe("tobuy");
    expect(itemStatus(item({ owned: true }))).toBe("owned");
  });
  it("promotes a sketch to to-buy or owned", () => {
    const s = item({ sketch: true });
    expect(promote(s, "tobuy")).toEqual(item());
    expect(promote(s, "owned")).toEqual(item({ owned: true }));
    expect("sketch" in promote(s, "owned")).toBe(false);
  });
  it("migrate keeps only real sketches", () => {
    const d = migrate({
      items: [
        { ...item({ id: "a" }), sketch: true },
        { ...item({ id: "b", owned: true }), sketch: true },
        { ...item({ id: "c" }), sketch: "yes" },
      ],
    });
    expect(d.items.map((i) => i.sketch)).toEqual([true, undefined, undefined]);
  });
});

describe("accessory sketches", () => {
  it("sketches a drawable accessory but not the generic one", () => {
    expect(makeSketch({ cat: "other", style: "glasses", color: "#000000" }, [])).toMatchObject({ cat: "other", style: "glasses", sketch: true });
    expect(() => makeSketch({ cat: "other", style: "other", color: "#000000" }, [])).toThrow();
  });
});
