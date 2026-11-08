import { luminance, mix, shade } from "../colour.ts";
import { detailsOf, HARDWARE_HEX } from "../styles.ts";
import type { Figure, Item, Pattern } from "../types.ts";

/** How the figure is being drawn: shared by every garment function. */
export interface Paint {
  cartoon: boolean;
  ink: string;
  /** Outline width in screen px (non-scaling), so tiles, cards and print match. */
  ow: number;
  /** Detail line width in user units (scales with the drawing, so small tiles stay clean). */
  dw: number;
  figure?: Figure;
}

/** A number rounded to 2 decimals, for tidy attribute values. */
export const n2 = (n: number) => Math.round(n * 100) / 100;

export const MANNEQUIN = "#e2ddd4";

export const makePaint = (cartoon: boolean, figure?: Figure): Paint => ({
  cartoon,
  ink: cartoon ? "#3a3340" : "#4a4c52",
  ow: cartoon ? 2 : 1.25,
  dw: cartoon ? 0.75 : 0.55,
  figure,
});

export const skinOf = (p: Paint) => (p.cartoon ? p.figure?.skin || "#f1c7a3" : MANNEQUIN);

/** Attributes for a garment outline. */
export const outline = (p: Paint, w = p.ow) =>
  `stroke="${p.ink}" stroke-width="${n2(w)}" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"`;

/** Attributes for an internal detail line (placket, seam, rib) on `fabric`. */
export const detail = (p: Paint, fabric: string, w = p.dw) => `fill="none" ${detailStroke(p, fabric, w)}`;

/** A colour that reads on top of `fabric`: lighter on dark cloth, darker on light. */
export const detailInk = (fabric: string, ink: string) => (luminance(fabric) < 0.3 ? mix(fabric, "#ffffff", 0.38) : mix(fabric, ink, 0.55));

/** Stroke attributes for a detail line. */
export const detailStroke = (p: Paint, fabric: string, w = p.dw) =>
  `stroke="${detailInk(fabric, p.ink)}" stroke-width="${n2(w)}" stroke-linecap="round" stroke-linejoin="round"`;

export const path = (d: string, fill: string, attrs = "") => `<path d="${d}" fill="${fill}"${attrs ? " " + attrs : ""}/>`;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** "M x y L x y …" through the points, optionally closed. */
export const poly = (pts: [number, number][], close = true) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${r1(x)} ${r1(y)}`).join(" ") + (close ? " Z" : "");

/** The same path reflected across the figure's centre line (x = 60). Absolute M/L/Q/C/Z commands only. */
export function mirror(d: string): string {
  return d.replace(/([MLQCZ])([^MLQCZ]*)/g, (_, cmd: string, args: string) => {
    const nums = args.trim() ? args.trim().split(/[\s,]+/).map(Number) : [];
    return cmd + nums.map((n, i) => (i % 2 === 0 ? r1(120 - n) : n)).join(" ") + (nums.length ? " " : "");
  }).trim();
}

/** A left-side path and its mirror image. */
export const pair = (d: string) => [d, mirror(d)];

export const hardwareHex = (it: Item) => HARDWARE_HEX[detailsOf(it).hardware ?? "brass"];

let patternSeq = 0;

/** One garment's paints: base fill (a pattern if it has one), depth shade and detail colour. */
export interface Fabric {
  defs: string;
  fill: string;
  base: string;
  shade: string;
}

/**
 * Fill for a garment, with its pattern (user-space units, so it lines up across the garment's separate shapes).
 * `scale` is the repeat in user units: about 6 for tops, 8 for pants, 4 for accessories.
 */
export function fabric(p: Paint, it: Item, scale = 6): Fabric {
  const base = it.color;
  const sh = shade(base, p.ink);
  const kind = detailsOf(it).pattern;
  const second = it.stripe;
  if (kind === "solid" || !second || second.toLowerCase() === base.toLowerCase()) return { defs: "", fill: base, base, shade: sh };
  const id = "p" + patternSeq++;
  return { defs: `<defs>${patternDef(id, base, second, kind, scale)}</defs>`, fill: `url(#${id})`, base, shade: sh };
}

function patternDef(id: string, base: string, second: string, kind: Pattern, scale: number): string {
  const s = kind === "gingham" || kind === "check" ? scale * 1.4 : scale;
  const open = (extra = "") => `<pattern id="${id}" width="${r1(s)}" height="${r1(s)}" patternUnits="userSpaceOnUse"${extra}><rect width="${r1(s)}" height="${r1(s)}" fill="${base}"/>`;
  switch (kind) {
    case "pinstripe":
      return open() + `<rect width="${r1(Math.max(0.8, s * 0.12))}" height="${r1(s)}" fill="${second}"/></pattern>`;
    case "breton":
      return open(` patternTransform="rotate(90)"`) + `<rect width="${r1(s / 3)}" height="${r1(s)}" fill="${second}"/></pattern>`;
    case "gingham":
      return open() + `<rect width="${r1(s / 2)}" height="${r1(s)}" fill="${second}" opacity="0.5"/><rect width="${r1(s)}" height="${r1(s / 2)}" fill="${second}" opacity="0.5"/></pattern>`;
    case "check":
      return (
        open() +
        `<rect width="${r1(s * 0.3)}" height="${r1(s)}" fill="${second}" opacity="0.65"/><rect width="${r1(s)}" height="${r1(s * 0.3)}" fill="${second}" opacity="0.65"/>` +
        `<rect x="${r1(s * 0.65)}" width="0.4" height="${r1(s)}" fill="${second}"/><rect y="${r1(s * 0.65)}" width="${r1(s)}" height="0.4" fill="${second}"/></pattern>`
      );
    case "dot":
      return open() + `<circle cx="${r1(s / 2)}" cy="${r1(s / 2)}" r="${r1(Math.max(0.8, s * 0.18))}" fill="${second}"/></pattern>`;
    default:
      return open() + `<rect width="${r1(s / 3)}" height="${r1(s)}" fill="${second}"/></pattern>`;
  }
}
