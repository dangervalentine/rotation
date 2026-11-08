/**
 * Every garment the renderer can draw, on one page, for reviewing the art by eye.
 * `npm run gallery` writes garment-gallery.html at the repo root (git-ignored).
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { basicsIconSvg, figureSvg, pieceSvg, VIEWBOX } from "../src/lib/figure.ts";
import { EMPTY_LOOK, STYLES } from "../src/lib/model.ts";
import type { Figure, Item, Look, Slot } from "../src/lib/types.ts";

const SLOTS: Slot[] = ["layer", "shirt", "undershirt", "belt", "pants", "shoes"];
const COLOUR: Record<Slot, string> = { layer: "#22304a", shirt: "#a9c1dc", undershirt: "#f4f3ef", belt: "#5a3e2b", pants: "#3b3d42", shoes: "#5a3e2b" };
const FIG: Figure = { skin: "#d9a07a", hair: "#2a1d14", hairStyle: "short" };
const PAPER = "#f4efe6";

let seq = 0;
const item = (cat: Item["cat"], style: string, extra: Partial<Item> = {}): Item =>
  ({ id: "g" + seq++, cat, name: style, style, color: (COLOUR as Record<string, string>)[cat] ?? "#1d1d1f", price: 0, qty: 1, owned: true, ...extra });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const tile = (it: Item, label: string, size = 110, ground = PAPER) => {
  const { svg, viewBox } = pieceSvg(it, undefined, FIG);
  return `<figure style="background:${ground}"><svg width="${size}" height="${size}" viewBox="${viewBox}">${svg}</svg><figcaption>${esc(label)}</figcaption></figure>`;
};
const look = (items: Item[], cartoon: boolean, label: string, extra: Partial<Look> = {}, figure = FIG) => {
  const l: Look = { ...EMPTY_LOOK, ...extra };
  for (const it of items) if (it.cat !== "other") l[it.cat as Slot] = it.id;
  const acc = items.filter((i) => i.cat === "other").map((i) => i.id);
  if (acc.length) l.acc = acc;
  const vb = cartoon ? VIEWBOX.cartoon : VIEWBOX.plain;
  return `<figure style="background:#fff"><svg width="150" height="${cartoon ? 288 : 250}" viewBox="${vb}">${figureSvg(items, l, { cartoon, figure })}</svg><figcaption>${esc(label)}</figcaption></figure>`;
};

const sections: [string, string][] = [];
const row = (title: string, cells: string[]) => sections.push([title, `<div class="row">${cells.join("")}</div>`]);

// 1. Every style per category
for (const slot of SLOTS) row(`Styles · ${slot}`, STYLES[slot].map((s) => tile(item(slot, s), s)));

// 2. White garments on three grounds
for (const ground of ["#ffffff", PAPER, "#1d1d1f"])
  row(`White tops on ${ground}`, [...STYLES.shirt.map((s) => tile(item("shirt", s, { color: "#f4f3ef" }), s, 110, ground)), ...STYLES.undershirt.map((s) => tile(item("undershirt", s, { color: "#f4f3ef" }), s, 110, ground))]);

// 3. Every bottom on both figures
const bottoms = STYLES.pants.flatMap((p) => {
  const items = [item("shirt", "oxford"), item("pants", p), item("shoes", "loafers"), item("belt", "belt")];
  return [look(items, false, p + " · plain"), look(items, true, p + " · cartoon")];
});
row("Bottoms on the figure", bottoms);

// 4. Details
const SLEEVES = ["long", "short", "rolled"] as const;
const PATTERNS = ["stripe", "pinstripe", "breton", "gingham", "check", "dot"] as const;
const HARDWARE = ["brass", "silver", "gunmetal", "black"] as const;
const LENGTHS = ["full", "cropped", "knee", "short"] as const;
row("Details · sleeves", ["oxford", "tee", "polo"].flatMap((s) => SLEEVES.map((sl) => tile(item("shirt", s, { sleeve: sl }), `${s} · ${sl}`))).concat(SLEEVES.map((sl) => tile(item("layer", "blazer", { sleeve: sl }), `blazer · ${sl}`))));
row("Details · patterns at 110px", PATTERNS.flatMap((pt) => [tile(item("shirt", "oxford", { color: "#f4f3ef", pattern: pt, stripe: "#22304a" }), "oxford · " + pt), tile(item("pants", "pants", { color: "#c9c1b1", pattern: pt, stripe: "#5a3e2b" }), "pants · " + pt)]));
row("Details · patterns at 64px", PATTERNS.map((pt) => tile(item("shirt", "oxford", { color: "#f4f3ef", pattern: pt, stripe: "#22304a" }), pt, 64)));
row("Details · hardware", HARDWARE.flatMap((h) => [tile(item("belt", "belt", { hardware: h }), "belt · " + h), tile(item("layer", "blazer", { hardware: h }), "blazer · " + h)]).concat((["frame", "plate", "d-ring"] as const).map((b) => tile(item("belt", "belt", { buckle: b }), "buckle · " + b))));
row("Details · lengths", (["pants", "skirt"] as const).flatMap((s) => LENGTHS.flatMap((l) => {
  const items = [item("shirt", "tee"), item("pants", s, { length: l }), item("shoes", "sneakers")];
  return [look(items, false, `${s} · ${l}`), look(items, true, `${s} · ${l}`)];
})));
row("Details · patterned shirt under an open blazer", [
  look([item("layer", "blazer"), item("shirt", "oxford", { color: "#f4f3ef", pattern: "gingham", stripe: "#7d9bc6" }), item("pants", "pants", { color: "#c9c1b1" }), item("belt", "belt"), item("shoes", "loafers")], true, "gingham under blazer"),
  look([item("layer", "cardigan", { color: "#5f6340", sleeve: "short" }), item("shirt", "oxford", { sleeve: "long", pattern: "stripe", stripe: "#22304a", color: "#f4f3ef" }), item("pants", "pants"), item("shoes", "boots")], false, "short-sleeved layer over long sleeves"),
]);

// 5. Accessories
const ACC = ["glasses", "sunglasses", "watch", "hat", "tie", "scarf"];
const ACC_COLOUR: Record<string, string> = { glasses: "#1d1d1f", sunglasses: "#5a3e2b", watch: "#5a3e2b", hat: "#22304a", tie: "#5e1f24", scarf: "#b08a5a" };
row("Accessories · tiles", ACC.map((a) => tile(item("other", a, { color: ACC_COLOUR[a] }), a)));
row("Accessories · on every hair style", (["short", "long", "bun", "curly", "none"] as const).flatMap((hairStyle) =>
  [["glasses"], ["sunglasses"], ["hat"]].map((as) => look([item("shirt", "tee"), item("pants", "pants"), item("shoes", "sneakers"), ...as.map((a) => item("other", a, { color: ACC_COLOUR[a] }))], true, `${as.join("+")} · ${hairStyle}`, {}, { ...FIG, hairStyle }))));
row("Accessories · combinations", [
  look([item("shirt", "oxford"), item("pants", "pants"), item("shoes", "loafers"), item("other", "glasses", { color: "#1d1d1f" }), item("other", "sunglasses", { color: "#5a3e2b" })], true, "glasses + sunglasses"),
  ...STYLES.layer.map((l) => look([item("layer", l), item("shirt", "oxford"), item("pants", "pants"), item("shoes", "loafers"), item("other", "tie", { color: "#5e1f24" }), item("other", "watch", { color: "#5a3e2b" })], true, `tie + watch · ${l}`)),
  look([item("layer", "jacket"), item("shirt", "tee"), item("pants", "pants"), item("shoes", "boots"), item("other", "scarf", { color: "#b08a5a", pattern: "check", stripe: "#5e1f24" })], false, "scarf · plain"),
]);

// 6. Socks & underwear: icons only, never on the figure
row("Basics · icons", STYLES.basics.flatMap((b) => ["#22304a", "#f4f3ef", "#5e1f24"].map((c) => `<figure style="background:${PAPER}"><svg width="64" height="64" viewBox="0 0 24 24">${basicsIconSvg(item("basics", b, { color: c }))}</svg><figcaption>${esc(b)}</figcaption></figure>`)));

const html = `<!doctype html><meta charset="utf-8"><title>Garment gallery</title>
<style>body{font:12px system-ui,sans-serif;margin:24px;background:#fbf9f5;color:#222}h2{font:600 14px system-ui;margin:28px 0 8px}
.row{display:flex;flex-wrap:wrap;gap:8px}figure{margin:0;padding:6px;text-align:center;border:1px solid #e3ddd2}figcaption{margin-top:4px;color:#555}</style>
<h1>Garment gallery</h1>${sections.map(([t, b]) => `<h2>${esc(t)}</h2>${b}`).join("")}`;
const out = path.resolve(import.meta.dirname, "..", "garment-gallery.html");
writeFileSync(out, html);
console.log("Wrote " + out);
