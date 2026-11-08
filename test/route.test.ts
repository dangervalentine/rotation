import { describe, expect, it } from "vitest";
import { formatHash, parseHash, VIEW_ORDER } from "../src/lib/route.ts";

describe("routes", () => {
  it("defaults to the wardrobe view", () => {
    expect(parseHash("", 10)).toEqual({ view: "wardrobe", day: null });
    expect(parseHash("#", 10)).toEqual({ view: "wardrobe", day: null });
    expect(parseHash("#nope", 10)).toEqual({ view: "wardrobe", day: null });
  });

  it("follows the order of the work", () => {
    expect(VIEW_ORDER).toEqual(["wardrobe", "outfits", "rotation", "print"]);
  });

  it("opens each view", () => {
    for (const v of VIEW_ORDER) expect(parseHash("#" + v, 10)).toEqual({ view: v, day: null });
  });

  it("reads an open rotation day", () => {
    expect(parseHash("#rotation/day/2", 10)).toEqual({ view: "rotation", day: 2 });
    expect(parseHash("#rotation/day/0", 10)).toEqual({ view: "rotation", day: 0 });
  });

  it("drops days that are out of range or malformed", () => {
    for (const h of ["#rotation/day/10", "#rotation/day/-1", "#rotation/day/1.5", "#rotation/day/x", "#rotation/day/", "#rotation/week/1"]) {
      expect(parseHash(h, 10)).toEqual({ view: "rotation", day: null });
    }
  });

  it("only opens days on the rotation view", () => {
    expect(parseHash("#outfits/day/1", 10)).toEqual({ view: "outfits", day: null });
  });

  it("round-trips through formatHash", () => {
    for (const r of [{ view: "rotation", day: 3 }, { view: "rotation", day: null }, { view: "print", day: null }] as const) {
      expect(parseHash(formatHash(r), 10)).toEqual(r);
    }
    expect(formatHash({ view: "outfits", day: 2 })).toBe("#outfits");
  });
});
