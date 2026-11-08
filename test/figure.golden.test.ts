import { describe, expect, it } from "vitest";
import { figureSvg, pieceSvg } from "../src/lib/figure.ts";
import { EMPTY_LOOK } from "../src/lib/model.ts";
import type { HairStyle, Item, Look, Slot } from "../src/lib/types.ts";

/**
 * Byte-for-byte record of the renderer's output. The stage-1 refactor must leave this unchanged;
 * it is updated on purpose only when the drawings change.
 */
const norm = (s: string) => s.replace(/\bp\d+\b/g, "pN");

const COLOUR: Record<Slot, string> = { layer: "#2c3e63", shirt: "#a9c4e4", undershirt: "#f4f3ef", belt: "#6b4426", pants: "#4a4d52", shoes: "#6b4426" };
const ORIGINAL: Record<Slot, string[]> = {
  layer: ["blazer", "sweater", "cardigan", "jacket"],
  shirt: ["oxford", "polo", "tee"],
  undershirt: ["crew", "v-neck"],
  belt: ["belt"],
  pants: ["pants", "shorts", "skirt"],
  shoes: ["boots", "sneakers", "loafers"],
};
const item = (cat: Slot, style: string, extra: Partial<Item> = {}): Item =>
  ({ id: cat, cat, name: style, style, color: COLOUR[cat], price: 0, qty: 1, owned: true, ...extra });

const LOOKS: [Slot, string][][] = [
  [["layer", "blazer"], ["shirt", "oxford"], ["undershirt", "crew"], ["belt", "belt"], ["pants", "pants"], ["shoes", "loafers"]],
  [["shirt", "tee"], ["pants", "shorts"], ["shoes", "sneakers"]],
  [["layer", "cardigan"], ["shirt", "polo"], ["pants", "skirt"], ["shoes", "boots"]],
  [["layer", "jacket"], ["shirt", "oxford"], ["belt", "belt"], ["pants", "pants"], ["shoes", "boots"]],
  [["layer", "sweater"], ["shirt", "oxford"], ["pants", "pants"], ["shoes", "sneakers"]],
];
const build = (parts: [Slot, string][]) => {
  const items = parts.map(([s, st]) => item(s, st));
  const look: Look = { ...EMPTY_LOOK };
  for (const [s] of parts) look[s] = s;
  return { items, look };
};

describe("figure golden output", () => {
  for (const slot of Object.keys(ORIGINAL) as Slot[])
    for (const style of ORIGINAL[slot])
      it(`piece ${slot}/${style}`, () => expect(norm(pieceSvg(item(slot, style), slot).svg)).toMatchSnapshot());

  it("piece striped oxford", () => expect(norm(pieceSvg(item("shirt", "oxford", { stripe: "#7d9bc6" }), "shirt").svg)).toMatchSnapshot());
  it("undershirt alone stands in for the shirt", () => expect(norm(figureSvg([item("undershirt", "v-neck")], { ...EMPTY_LOOK, undershirt: "undershirt" }))).toMatchSnapshot());

  LOOKS.forEach((parts, n) => {
    it(`look ${n} plain`, () => { const { items, look } = build(parts); expect(norm(figureSvg(items, look))).toMatchSnapshot(); });
    it(`look ${n} cartoon`, () => {
      const { items, look } = build(parts);
      expect(norm(figureSvg(items, look, { cartoon: true, figure: { skin: "#d9a07a", hair: "#2a1d14", hairStyle: "short" } }))).toMatchSnapshot();
    });
  });

  for (const hairStyle of ["short", "long", "bun", "curly", "none"] as HairStyle[])
    it(`hair ${hairStyle}`, () => expect(norm(figureSvg([], EMPTY_LOOK, { cartoon: true, figure: { skin: "#f1c7a3", hair: "#4a3426", hairStyle } }))).toMatchSnapshot());
});
