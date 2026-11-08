import { describe, expect, it } from "vitest";
import { cleanDetails, detailOptions, detailsOf, STYLES, styleSpec } from "../src/lib/styles.ts";
import type { Item } from "../src/lib/types.ts";

const it_ = (cat: Item["cat"], style: string, extra: Partial<Item> = {}) => ({ cat, style, color: "#123456", ...extra });

describe("style registry", () => {
  it("keeps each category's original styles first, in their original order", () => {
    const original: Record<string, string[]> = {
      layer: ["blazer", "sweater", "cardigan", "jacket"],
      shirt: ["oxford", "polo", "tee"],
      undershirt: ["crew", "v-neck"],
      belt: ["belt"],
      pants: ["pants", "shorts", "skirt"],
      basics: ["socks", "underwear"],
      shoes: ["boots", "sneakers", "loafers"],
    };
    for (const [cat, list] of Object.entries(original)) expect(STYLES[cat as Item["cat"]].slice(0, list.length)).toEqual(list);
    expect(STYLES.other).toContain("other");
  });

  it("falls back to the category's first style for an unknown style", () => {
    expect(styleSpec("shirt", "kimono")).toBe(styleSpec("shirt", "oxford"));
  });

  it("gives each style its default details", () => {
    expect(detailsOf(it_("shirt", "oxford")).sleeve).toBe("long");
    expect(detailsOf(it_("shirt", "polo")).sleeve).toBe("short");
    expect(detailsOf(it_("shirt", "tee")).sleeve).toBe("short");
    expect(detailsOf(it_("pants", "pants")).length).toBe("full");
    expect(detailsOf(it_("pants", "shorts")).length).toBe("short");
    expect(detailsOf(it_("pants", "skirt")).length).toBe("knee");
    expect(detailsOf(it_("belt", "belt"))).toMatchObject({ hardware: "brass", buckle: "frame", pattern: "solid" });
  });

  it("reads an old stripe colour as a stripe pattern", () => {
    expect(detailsOf(it_("shirt", "oxford", { stripe: "#7d9bc6" })).pattern).toBe("stripe");
    expect(detailsOf(it_("shirt", "oxford", { stripe: "#7d9bc6", pattern: "gingham" })).pattern).toBe("gingham");
    expect(detailsOf(it_("shirt", "oxford", { pattern: "gingham" })).pattern).toBe("solid");
  });

  it("ignores unknown or inapplicable values when drawing", () => {
    expect(detailsOf(it_("shirt", "oxford", { sleeve: "puffed" as never })).sleeve).toBe("long");
    expect(detailsOf(it_("belt", "belt", { sleeve: "short" })).sleeve).toBeUndefined();
  });

  it("offers only the options a style uses", () => {
    expect(detailOptions("shirt", "oxford")).toEqual(["sleeve", "pattern"]);
    expect(detailOptions("belt", "belt")).toEqual(["hardware", "buckle"]);
    expect(detailOptions("shoes", "boots")).toEqual([]);
    expect(detailOptions("layer", "blazer")).toEqual(["sleeve", "pattern", "hardware"]);
  });

  it("drops inapplicable and default details when saving", () => {
    expect(cleanDetails({ cat: "belt", style: "belt", sleeve: "short", stripe: "#fff", pattern: "dot" })).toEqual({ cat: "belt", style: "belt" });
    expect(cleanDetails({ cat: "shirt", style: "oxford", sleeve: "long" })).toEqual({ cat: "shirt", style: "oxford" });
    expect(cleanDetails({ cat: "shirt", style: "oxford", sleeve: "rolled" })).toEqual({ cat: "shirt", style: "oxford", sleeve: "rolled" });
    expect(cleanDetails({ cat: "shirt", style: "oxford", pattern: "stripe", stripe: "#fff" })).toEqual({ cat: "shirt", style: "oxford", stripe: "#fff" });
    expect(cleanDetails({ cat: "shirt", style: "oxford", pattern: "solid", stripe: "#fff" })).toEqual({ cat: "shirt", style: "oxford" });
    expect(cleanDetails({ cat: "shirt", style: "oxford", pattern: "gingham", stripe: "#fff" })).toEqual({ cat: "shirt", style: "oxford", pattern: "gingham", stripe: "#fff" });
  });
});
