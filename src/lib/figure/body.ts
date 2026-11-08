import type { Length, Sleeve } from "../types.ts";
import { outline, pair, path, poly, skinOf, type Paint } from "./paint.ts";

/**
 * Named points on the 120×200 figure. Garments end at these, so a length option
 * means the same thing on every style that has it.
 */
export const BODY = {
  neck: 28.5,
  shoulderL: { x: 39, y: 31 },
  shoulderR: { x: 81, y: 31 },
  elbow: 66,
  wrist: 88,
  chest: 50,
  waist: 110,
  crotch: 128,
  knee: 150,
  ankle: 180,
  sole: 192,
} as const;

export const at = (anchor: number, offset = 0) => anchor + offset;

/** Where a sleeve ends. Layers end a little shorter so a shirt cuff shows below them. */
export const sleeveEnd = (s: Sleeve | undefined, layer = false) =>
  s === "short" ? at(BODY.elbow, -10) : s === "rolled" ? at(BODY.elbow, 6) : at(BODY.wrist, layer ? -3 : 0);

/** Where a hem ends. */
export const hemEnd = (l: Length | undefined) =>
  l === "cropped" ? at(BODY.ankle, -14) : l === "knee" ? BODY.knee : l === "short" ? at(BODY.knee, -12) : BODY.ankle;

// The left arm (viewer's left) hangs slightly out from shoulder to wrist; the right arm mirrors it.
const ARM: [number, number, number][] = [
  // y, centre x, half width
  [36, 33, 7.2],
  [BODY.elbow, 27.6, 5.8],
  [BODY.wrist + 2, 24.4, 4.6],
];
export function armAt(y: number) {
  const [a, b] = y <= ARM[1][0] ? [ARM[0], ARM[1]] : [ARM[1], ARM[2]];
  const t = Math.max(0, Math.min(1.2, (y - a[0]) / (b[0] - a[0])));
  return { cx: a[1] + (b[1] - a[1]) * t, hw: a[2] + (b[2] - a[2]) * t };
}
const outer = (y: number, flare = 0): [number, number] => { const a = armAt(y); return [a.cx - a.hw - flare, y]; };
const inner = (y: number, flare = 0): [number, number] => { const a = armAt(y); return [a.cx + a.hw + flare, y]; };

/** Left sleeve (or bare arm) from the shoulder to `end`, as a closed path. Mirror it for the right. */
export function sleevePath(end: number, flare = 0) {
  const o40 = outer(40, flare);
  const mids = end > BODY.elbow + 2 ? [BODY.elbow] : [];
  const pts: [number, number][] = [...mids.map((y) => outer(y, flare)), outer(end, flare), inner(end, flare), ...mids.reverse().map((y) => inner(y, flare)), inner(50, flare), [43, 52]];
  return `M43 30 Q${(30 - flare).toFixed(1)} 29 ${o40[0].toFixed(1)} ${o40[1]} ` + poly(pts).replace(/^M/, "L");
}

/** A band across the arm between two heights (cuffs, ribbing, rolled turn-ups). */
export function armBand(top: number, bottom: number, flare = 0) {
  return poly([outer(top, flare), outer(bottom, flare), inner(bottom, flare), inner(top, flare)]);
}

/** The shaded underside of a sleeve, along its inner edge. */
export function sleeveShade(end: number, flare = 0) {
  const top = 52, w = 2.2;
  const mids = end > BODY.elbow + 2 ? [BODY.elbow] : [];
  const edge = [inner(top, flare), ...mids.map((y) => inner(y, flare)), inner(end, flare)].map(([x, y]) => [x - 0.6, y] as [number, number]);
  return poly([...edge, ...edge.slice().reverse().map(([x, y]) => [x - w, y] as [number, number])]);
}

/** Bare arms under every sleeve: skin on the cartoon, mannequin on the plain figure. */
export function arms(p: Paint) {
  const end = BODY.wrist + 2;
  const a = armAt(end);
  // Like a full-length sleeve, with a rounded wrist end.
  const o = outer(end), i = inner(end), mid = inner(BODY.elbow), m50 = inner(50);
  const arm = `M43 30 Q30 29 ${outer(40)[0].toFixed(1)} 40 L${outer(BODY.elbow)[0].toFixed(1)} ${BODY.elbow} L${o[0].toFixed(1)} ${end} Q${a.cx.toFixed(1)} ${end + 4} ${i[0].toFixed(1)} ${end} L${mid[0].toFixed(1)} ${BODY.elbow} L${m50[0].toFixed(1)} 50 L43 52 Z`;
  return pair(arm).map((x) => path(x, skinOf(p), outline(p))).join("");
}

/** Hands sit just below the wrist (cartoon only). */
export function hands(p: Paint) {
  const c = armAt(BODY.wrist + 2);
  return [c.cx, 120 - c.cx].map((x) => `<circle cx="${x.toFixed(1)}" cy="${BODY.wrist + 6}" r="5.5" fill="${skinOf(p)}" ${outline(p)}/>`).join("");
}

/** Torso and hips of the bare figure, behind every garment. */
export function torso(p: Paint) {
  return path("M50 28.5 L39 31 Q35 32.5 35.2 38 L35.8 60 L37.5 110 L36 116 L84 116 L82.5 110 L84.2 60 L84.8 38 Q85 32.5 81 31 L70 28.5 Q60 33 50 28.5 Z", skinOf(p), outline(p));
}

/** Legs from the hips to the ankle, behind every bottom; they show wherever a hem stops short. */
export function legs(p: Paint) {
  const leg = "M38 114 L59 114 L59 128 L54.5 150 L53.5 183 L40.5 183 L39 150 Z";
  return pair(leg).map((d) => path(d, skinOf(p), outline(p))).join("");
}
