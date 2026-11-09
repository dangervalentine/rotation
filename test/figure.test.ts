import { describe, expect, it } from "vitest";
import { basicsIconSvg, figureLayers, figureSvg, pieceSvg } from "../src/lib/figure.ts";
import { EMPTY_LOOK } from "../src/lib/model.ts";
import { STYLES } from "../src/lib/styles.ts";
import type { Item, Look, Slot } from "../src/lib/types.ts";

const SLOTS: Slot[] = ["layer", "shirt", "undershirt", "belt", "pants", "shoes"];
const item = (cat: Item["cat"], style: string, extra: Partial<Item> = {}): Item =>
  ({ id: cat + "-" + style, cat, name: style, style, color: "#5f6340", price: 0, qty: 1, owned: true, ...extra });
const lookOf = (items: Item[]): Look => {
  const l: Look = { ...EMPTY_LOOK };
  for (const i of items) if (i.cat !== "other" && i.cat !== "basics") l[i.cat as Slot] = i.id;
  const acc = items.filter((i) => i.cat === "other").map((i) => i.id);
  if (acc.length) l.acc = acc;
  return l;
};
const norm = (s: string) => s.replace(/\bp\d+\b/g, "pN");
/** Every element whose stroke is the figure's ink: garment and body outlines. */
const outlines = (svg: string, ink: string) => svg.match(new RegExp(`<[^>]*stroke="${ink}"[^>]*>`, "g")) || [];

describe("figure layers", () => {
  const full = [item("layer", "blazer"), item("shirt", "oxford", { color: "#a9c1dc" }), item("undershirt", "crew"), item("belt", "belt"), item("pants", "pants"), item("shoes", "loafers")];

  it("joins its layers into the figure", () => {
    for (const cartoon of [false, true])
      expect(norm(figureSvg(full, lookOf(full), { cartoon }))).toBe(norm(figureLayers(full, lookOf(full), { cartoon }).map((l) => l.svg).join("")));
  });

  it("shows a piece alone: only markup from its own layers", () => {
    for (const it of full) {
      const { svg } = pieceSvg(it);
      expect(svg.length).toBeGreaterThan(0);
      const own = figureLayers([it], lookOf([it])).filter((l) => l.part === it.cat).map((l) => l.svg).join("");
      expect(norm(svg)).toBe(norm(own));
      // No bare-figure body or other slots in a piece.
      expect(figureLayers([it], lookOf([it])).some((l) => l.part === "body" && svg.includes(l.svg))).toBe(false);
    }
  });

  it("draws legs on the plain figure under every bottom", () => {
    for (const style of STYLES.pants) {
      const items = [item("pants", style), item("shoes", "loafers")];
      const body = figureLayers(items, lookOf(items)).filter((l) => l.part === "body").map((l) => l.svg).join("");
      expect(body).toContain("M38 114");
    }
  });

  it("gives every outline a non-scaling stroke", () => {
    for (const cartoon of [false, true]) {
      const ink = cartoon ? "#3a3340" : "#4a4c52";
      const els = outlines(figureSvg(full, lookOf(full), { cartoon, figure: { skin: "#d9a07a", hair: "#2a1d14", hairStyle: "long" } }), ink);
      expect(els.length).toBeGreaterThan(10);
      for (const el of els) expect(el).toContain('vector-effect="non-scaling-stroke"');
    }
  });

  it("draws every style in a slot differently", () => {
    for (const slot of SLOTS) {
      const seen = new Map<string, string>();
      for (const style of STYLES[slot]) {
        const svg = norm(pieceSvg(item(slot, style)).svg);
        expect(seen.get(svg), `${slot}/${style} looks the same as ${seen.get(svg)}`).toBeUndefined();
        seen.set(svg, style);
      }
    }
  });

  it("draws an unknown style as the category's first style, without throwing", () => {
    expect(norm(pieceSvg(item("shirt", "kimono")).svg)).toBe(norm(pieceSvg(item("shirt", "oxford")).svg).replace(/oxford/g, "kimono"));
  });

  it("never draws an item that isn't in its own category's slot", () => {
    const sock = item("basics", "socks", { color: "#abcdef" });
    const look = { ...EMPTY_LOOK, shoes: sock.id, acc: [sock.id] };
    expect(figureSvg([sock], look, { cartoon: true })).not.toContain("#abcdef");
  });
});

describe("details on the figure", () => {
  const PATTERNS = ["stripe", "pinstripe", "breton", "gingham", "check", "dot"] as const;

  it("puts each pattern inside the garment's own layer", () => {
    for (const pattern of PATTERNS) {
      const shirt = item("shirt", "oxford", { pattern, stripe: "#ffffff" });
      const layers = figureLayers([shirt], lookOf([shirt]));
      const own = layers.filter((l) => l.part === "shirt").map((l) => l.svg).join("");
      expect(own).toContain("<pattern");
      expect(layers.filter((l) => l.part !== "shirt").some((l) => l.svg.includes("<pattern"))).toBe(false);
    }
  });

  it("turns breton stripes sideways", () => {
    expect(pieceSvg(item("shirt", "tee", { pattern: "breton", stripe: "#ffffff" })).svg).toContain('patternTransform="rotate(90)"');
  });

  it("draws a pattern in the garment's own colour as solid", () => {
    expect(pieceSvg(item("shirt", "oxford", { pattern: "gingham", stripe: "#5F6340" })).svg).not.toContain("<pattern");
  });

  it("ends sleeves where the sleeve option says", () => {
    const svgs = (["long", "short", "rolled"] as const).map((sleeve) => norm(pieceSvg(item("shirt", "oxford", { sleeve })).svg));
    expect(new Set(svgs).size).toBe(3);
  });

  it("ends hems where the length option says, with legs showing below", () => {
    const svgs = (["full", "cropped", "knee", "short"] as const).map((length) => norm(pieceSvg(item("pants", "pants", { length })).svg));
    expect(new Set(svgs).size).toBe(4);
  });

  it("colours hardware", () => {
    expect(pieceSvg(item("belt", "belt", { hardware: "silver" })).svg).toContain("#c3c6cb");
    expect(pieceSvg(item("layer", "blazer", { hardware: "black" })).svg).toContain("#1d1d1f");
  });
});

describe("accessories on the figure", () => {
  const base = [item("shirt", "oxford", { color: "#a9c1dc" }), item("pants", "pants"), item("shoes", "loafers")];
  const acc = (style: string, color = "#123456") => item("other", style, { color });
  const fig = { skin: "#d9a07a", hair: "#2a1d14", hairStyle: "short" as const };

  it("leaves the face off a faceless figure but keeps the head and hair", () => {
    const fig = { skin: "#d9a07a", hair: "#2a1d14", hairStyle: "short" as const };
    const face = figureSvg([], EMPTY_LOOK, { cartoon: true, figure: fig });
    const blank = figureSvg([], EMPTY_LOOK, { cartoon: true, figure: { ...fig, show: "faceless" } });
    expect(face).toContain("#f19aa6");
    expect(blank).not.toContain("#f19aa6");
    expect(blank).not.toContain('r="0.6"');
    expect(blank).toContain("#d9a07a");
    expect(blank).toContain("#2a1d14");
  });

  it("puts head-worn accessories on the cartoon only", () => {
    for (const style of ["glasses", "sunglasses", "hat"]) {
      const items = [...base, acc(style)];
      expect(figureSvg(items, lookOf(items), { cartoon: true, figure: fig })).toContain("#123456");
      expect(figureSvg(items, lookOf(items))).not.toContain("#123456");
    }
  });

  it("draws a watch, tie and scarf on both figures", () => {
    for (const style of ["watch", "tie", "scarf"]) {
      const items = [...base, acc(style)];
      expect(figureSvg(items, lookOf(items), { cartoon: true, figure: fig })).toContain("#123456");
      expect(figureSvg(items, lookOf(items))).toContain("#123456");
    }
  });

  it("draws sunglasses over glasses, and one of each style", () => {
    const glasses = acc("glasses", "#111111"), sun = acc("sunglasses", "#222222");
    const both = [...base, glasses, sun];
    const svg = figureSvg(both, lookOf(both), { cartoon: true, figure: fig });
    expect(svg).toContain("#222222");
    expect(svg).not.toContain("#111111");
    const tie1 = { ...acc("tie", "#333333"), id: "t1" }, tie2 = { ...acc("tie", "#444444"), id: "t2" };
    const ties = [...base, tie1, tie2];
    const tsvg = figureSvg(ties, lookOf(ties));
    expect(tsvg).toContain("#333333");
    expect(tsvg).not.toContain("#444444");
  });

  it("never draws the generic accessory", () => {
    const wallet = acc("other", "#abcdef");
    expect(figureSvg([...base, wallet], lookOf([...base, wallet]), { cartoon: true, figure: fig })).not.toContain("#abcdef");
  });

  it("shows head-worn accessory tiles on a faint head", () => {
    expect(pieceSvg(acc("glasses")).svg).toContain('opacity="0.35"');
    expect(pieceSvg(acc("tie")).svg).not.toContain('opacity="0.35"');
  });
});

describe("socks & underwear icons", () => {
  it("draws each style differently, and an unknown style as generic underwear", () => {
    const styles = STYLES.basics;
    const icons = styles.map((style) => basicsIconSvg(item("basics", style)));
    expect(new Set(icons).size).toBe(styles.length);
    expect(basicsIconSvg(item("basics", "thong"))).toBe(basicsIconSvg(item("basics", "underwear")));
  });
});
