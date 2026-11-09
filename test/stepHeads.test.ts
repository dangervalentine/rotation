import { describe, expect, it } from "vitest";
import { STEP_HEADS } from "../src/components/common.tsx";
import { VIEW_ORDER } from "../src/lib/route.ts";

describe("step heads", () => {
  it("has one head per view, in the order of the work", () => {
    expect(Object.keys(STEP_HEADS)).toEqual(VIEW_ORDER);
    for (const v of VIEW_ORDER) expect(STEP_HEADS[v].number).toBe(VIEW_ORDER.indexOf(v) + 1);
  });

  it("titles each page with its step's name", () => {
    expect(VIEW_ORDER.map((v) => STEP_HEADS[v].title)).toEqual(["Wardrobe", "Outfits", "Rotation", "Print"]);
  });

  it("gives every step a dek", () => {
    for (const v of VIEW_ORDER) expect(STEP_HEADS[v].dek.length).toBeGreaterThan(0);
  });
});
