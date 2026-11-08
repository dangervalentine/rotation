import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script without types
import { buildTokensCss, TOKENS_CSS, TOKENS_JSON } from "../scripts/build-tokens.mjs";

const tokens = JSON.parse(readFileSync(TOKENS_JSON, "utf8"));

function luminance(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

describe("design tokens", () => {
  it("tokens.css is up to date with tokens.json (run `npm run tokens`)", () => {
    expect(readFileSync(TOKENS_CSS, "utf8")).toBe(buildTokensCss(tokens));
  });

  it("token names are unique", () => {
    const names = Object.values(tokens)
      .filter((v: any) => v && Array.isArray(v.tokens))
      .flatMap((v: any) => v.tokens.map((t: any) => t.name));
    expect(new Set(names).size).toBe(names.length);
  });

  // Text pairs the README promises at 4.5:1 or better, in every theme.
  const pairs: [string, string][] = [
    ["ink", "paper"], ["ink", "paper-raised"], ["ink", "paper-sunk"],
    ["ink-muted", "paper"], ["ink-muted", "paper-raised"], ["ink-muted", "paper-sunk"],
    ["oxblood", "paper"], ["oxblood", "paper-raised"], ["oxblood", "oxblood-soft"], ["on-oxblood", "oxblood"],
    ["tobacco", "paper"], ["tobacco", "camel-soft"], ["loden", "paper"], ["loden", "loden-soft"],
    ["on-camel", "camel"], ["on-navy", "navy"],
  ];
  const color = (name: string, theme: string) => {
    const v = tokens.color.tokens.find((t: any) => t.name === name).value;
    return typeof v === "string" ? v : v[theme];
  };
  for (const { id } of tokens.color.themes) {
    for (const [fg, bg] of pairs) {
      it(`${fg} on ${bg} reads at 4.5:1 in ${id}`, () => {
        expect(contrast(color(fg, id), color(bg, id))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
