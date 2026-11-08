import { describe, expect, it } from "vitest";
import { dominantColour, rgbToHex, sampleAt } from "../src/lib/colour.ts";

/** A w×h RGBA buffer filled by fn(x, y) → [r, g, b, a]. */
function img(w: number, h: number, fn: (x: number, y: number) => number[]) {
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px.set(fn(x, y), (y * w + x) * 4);
  return px;
}
const olive = [95, 99, 64, 255];
const white = [255, 255, 255, 255];

describe("colour", () => {
  it("formats hex", () => {
    expect(rgbToHex(95, 99, 64)).toBe("#5f6340");
    expect(rgbToHex(300, -4, 15.6)).toBe("#ff0010");
  });
  it("finds the garment colour on a studio background", () => {
    // An olive garment in the middle third, white everywhere else (most pixels are white).
    const px = img(30, 30, (x, y) => (x >= 10 && x < 20 && y >= 10 && y < 20 ? olive : white));
    expect(dominantColour(px, 30, 30)).toBe("#5f6340");
  });
  it("uses the majority colour in the central box", () => {
    const px = img(20, 20, (x) => (x < 12 ? olive : [169, 193, 220, 255]));
    expect(dominantColour(px, 20, 20)).toBe("#5f6340");
  });
  it("falls back to white when nothing else is there", () => {
    expect(dominantColour(img(10, 10, () => white), 10, 10)).toBe("#ffffff");
  });
  it("skips transparent pixels", () => {
    const px = img(10, 10, (x) => (x < 7 ? [0, 0, 255, 0] : olive));
    expect(dominantColour(px, 10, 10)).toBe("#5f6340");
  });
  it("averages a 5×5 area and clamps at the edges", () => {
    const px = img(10, 10, (x) => (x < 5 ? [0, 0, 0, 255] : [200, 200, 200, 255]));
    expect(sampleAt(px, 10, 10, 0, 0)).toBe("#000000");
    expect(sampleAt(px, 10, 10, 9, 9)).toBe("#c8c8c8");
    // 5 columns around x=5: 3,4 black; 5,6,7 grey → 3/5 of 200
    expect(sampleAt(px, 10, 10, 5, 5)).toBe(rgbToHex(120, 120, 120));
  });
});
