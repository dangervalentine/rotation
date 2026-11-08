import { STYLES } from "./model.ts";
import type { Category, Item } from "./types.ts";

/** What we could learn about a product from its page or URL. Every field is optional. */
export type ProductGuess = Partial<Pick<Item, "name" | "brand" | "price" | "image" | "color" | "cat" | "style" | "link">>;

const COLOR_WORDS: [RegExp, string][] = [
  [/\blight[\s-]?blue\b|\bsky\b/, "#b8cfe9"],
  [/\bnavy\b|\bmidnight\b/, "#1f2a45"],
  [/\bindigo\b|\bdenim\b|\brinse\b/, "#2b3a63"],
  [/\bchambray\b/, "#8fa7c6"],
  [/\bcharcoal\b/, "#45484e"],
  [/\bgr[ae]y\b|\bheather\b/, "#8b8e93"],
  [/\bblack\b|\bonyx\b|\bjet\b/, "#1a1a1a"],
  [/\bwhite\b|\bivory\b|\bcream\b|\becru\b/, "#f5f3ee"],
  [/\bolive\b|\bdill\b|\bsage\b|\bmoss\b/, "#5c603a"],
  [/\bgreen\b|\bforest\b/, "#2f5d3a"],
  [/\bstone\b|\bkhaki\b|\bsand\b|\bbeige\b|\btan\b/, "#cdbf9c"],
  [/\bcamel\b/, "#b8875a"],
  [/\bbrown\b|\bchocolate\b|\bespresso\b|\bmocha\b/, "#6b3f22"],
  [/\bburgundy\b|\bmaroon\b|\bwine\b|\boxblood\b/, "#6d1f2c"],
  [/\bred\b/, "#b3302f"],
  [/\bpink\b|\brose\b/, "#f0c9d2"],
  [/\bpurple\b|\blavender\b/, "#8c7bb8"],
  [/\byellow\b|\bmustard\b/, "#d8b44a"],
  [/\borange\b|\brust\b/, "#c46a2f"],
  [/\bblue\b/, "#4a6fa5"],
];

const KIND_WORDS: [RegExp, Category, string][] = [
  // Specific before generic: "undershirt" before "shirt", "boxer briefs" before "briefs", shoes before shirts.
  [/\bundershirt/, "undershirt", "crew"],
  [/\bsunglasses\b|\bshades\b/, "other", "sunglasses"],
  [/\bglasses\b|\bframes\b|\beyewear\b|\bspectacles\b/, "other", "glasses"],
  [/\bwatch(es)?\b/, "other", "watch"],
  [/\bscarf\b|\bscarves\b/, "other", "scarf"],
  [/\bneck ?tie|\btie\b/, "other", "tie"],
  [/\bhats?\b|\bcaps?\b|\bbeanie\b/, "other", "hat"],
  [/\bblazer|sport ?coat|suit jacket\b/, "layer", "blazer"],
  [/\bcardigan\b/, "layer", "cardigan"],
  [/\bhoodie\b|\bhooded\b/, "layer", "hoodie"],
  [/\bquarter[- ]zip|\b1\/4[- ]zip|\bhalf[- ]zip/, "layer", "quarter-zip"],
  [/\bsweater|jumper|pullover\b/, "layer", "sweater"],
  [/\bsweatshirt\b|\bcrew ?neck\b/, "layer", "crewneck"],
  [/\bbomber\b/, "layer", "bomber"],
  [/\bovercoat|topcoat|top coat|peacoat|pea coat\b/, "layer", "overcoat"],
  [/\bchore\b/, "layer", "chore coat"],
  [/\bjacket|coat|parka|overshirt|shacket\b/, "layer", "jacket"],
  [/\bchelsea\b/, "shoes", "chelsea boot"],
  [/\bderby|brogue|oxford shoe/, "shoes", "derby"],
  [/\bsandals?\b|\bslides?\b/, "shoes", "sandal"],
  [/\blace[- ]up boots?\b|\bwork boots?\b|\bhiking boots?\b/, "shoes", "lace-up boot"],
  [/\bpolo\b/, "shirt", "polo"],
  [/\bhenley\b/, "shirt", "henley"],
  [/\bt-?shirt|\btee\b|tank\b/, "shirt", "tee"],
  [/\bflannel shirt\b|\bflannel\b(?!.*(trouser|pant))/, "shirt", "flannel"],
  [/\bcamp collar|\bcuban collar|\bresort shirt/, "shirt", "camp collar"],
  [/\bdress shirt\b/, "shirt", "dress shirt"],
  [/\boxford|shirt|button[- ]?(down|up)|blouse\b/, "shirt", "oxford"],
  [/\bbraided belt|\bwoven belt/, "belt", "braided"],
  [/\bbelt\b/, "belt", "belt"],
  [/\bshorts\b/, "pants", "shorts"],
  [/\bskirt\b/, "pants", "skirt"],
  [/\bjeans?\b|\bdenim\b/, "pants", "jeans"],
  [/\bchinos?\b|\bkhakis?\b/, "pants", "chinos"],
  [/\bjoggers?\b|\bsweatpants\b/, "pants", "joggers"],
  [/\btrousers?\b|\bslacks\b/, "pants", "trousers"],
  [/\bpants\b/, "pants", "pants"],
  [/\bsneakers?|trainers?|runners?\b/, "shoes", "sneakers"],
  [/\bloafers?|moccasins?\b/, "shoes", "loafers"],
  [/\bboots?|chukka\b/, "shoes", "boots"],
  [/\bsocks?\b/, "basics", "socks"],
  [/\bboxer[- ]?briefs\b/, "basics", "boxer-briefs"],
  [/\bboxers?\b/, "basics", "boxers"],
  [/\bbriefs?\b/, "basics", "briefs"],
  [/\btrunks\b/, "basics", "trunks"],
  [/\bunderwear\b/, "basics", "underwear"],
  [/\bwallet\b/, "other", "other"],
];

export function guessColor(text: string): string | undefined {
  const t = text.toLowerCase();
  return COLOR_WORDS.find(([re]) => re.test(t))?.[1];
}

export function guessKind(text: string): { cat: Category; style: string } | undefined {
  const t = text.toLowerCase();
  const hit = KIND_WORDS.find(([re]) => re.test(t));
  if (!hit) return undefined;
  const [, cat, style] = hit;
  return { cat, style: STYLES[cat].includes(style) ? style : STYLES[cat][0] };
}

/** Readable words from a product URL (path slug plus query values like color_name=dill). */
export function urlWords(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter((p) => /[a-z]{3}/i.test(p) && !/^(en|us|en-us|products?|p|men|mens|women|womens|browse)$/i.test(p));
    const q = [...u.searchParams.entries()].filter(([k]) => /color|colour/i.test(k)).map(([, v]) => v);
    return [...parts, ...q]
      .join(" ")
      .replace(/\.(html?|aspx?|php)$/i, "")
      .replace(/[-_+]+/g, " ")
      .replace(/\b[A-Z]?\d[\w]*\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

/** Offline guess from the URL alone. Works in the published build where pages can't be fetched. */
export function guessFromUrl(url: string): ProductGuess {
  const words = urlWords(url);
  const out: ProductGuess = { link: url };
  if (words) {
    out.name = words.charAt(0).toUpperCase() + words.slice(1);
    const kind = guessKind(words);
    if (kind) Object.assign(out, kind);
    const color = guessColor(words);
    if (color) out.color = color;
  }
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").split(".")[0];
    if (host) out.brand = host.charAt(0).toUpperCase() + host.slice(1);
  } catch {}
  return out;
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .trim();

function meta(html: string, key: string): string | undefined {
  const re = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${key.replace(/[:.]/g, "\\$&")}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decode(content) : undefined;
}

function findProduct(node: any): any {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = findProduct(n);
      if (hit) return hit;
    }
    return null;
  }
  const type = node["@type"];
  if (type === "Product" || type === "ProductGroup" || (Array.isArray(type) && type.includes("Product"))) return node;
  return findProduct(node["@graph"]) || null;
}

function firstOffer(p: any) {
  const o = p?.offers;
  const one = Array.isArray(o) ? o[0] : o;
  return one?.offers ? (Array.isArray(one.offers) ? one.offers[0] : one.offers) : one;
}

/** Parse a product page: JSON-LD Product first, then OpenGraph/meta tags, then <title>, then the URL. */
export function parseProductHtml(html: string, url: string): ProductGuess {
  const out: ProductGuess = { ...guessFromUrl(url) };
  let ldBrand = false;
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const p = findProduct(JSON.parse(m[1]));
      if (!p) continue;
      if (p.name) out.name = decode(String(p.name));
      const brand = typeof p.brand === "string" ? p.brand : p.brand?.name;
      if (brand) { out.brand = decode(String(brand)); ldBrand = true; }
      const offer = firstOffer(p);
      const price = parseFloat(offer?.price ?? offer?.lowPrice);
      if (!isNaN(price)) out.price = price;
      const img = Array.isArray(p.image) ? p.image[0] : p.image;
      if (img) out.image = typeof img === "string" ? img : img.url;
      if (p.color) out.color = guessColor(String(p.color)) || out.color;
      break;
    } catch {}
  }
  if (!out.name || out.name === guessFromUrl(url).name) {
    const t = meta(html, "og:title") || decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "");
    if (t) out.name = t.split(/\s[|–-]\s/)[0].trim();
  }
  if (out.price === undefined) {
    const p = parseFloat(meta(html, "product:price:amount") || meta(html, "og:price:amount") || meta(html, "price") || "");
    if (!isNaN(p)) out.price = p;
  }
  if (!out.image) out.image = meta(html, "og:image");
  const siteBrand = meta(html, "og:site_name") || meta(html, "product:brand");
  if (siteBrand && !ldBrand) out.brand = siteBrand;
  if (out.brand && out.name && !out.name.toLowerCase().includes(out.brand.toLowerCase())) out.name = `${out.brand} ${out.name}`;

  const text = `${out.name || ""} ${urlWords(url)}`;
  const kind = guessKind(out.name || "") || guessKind(text);
  if (kind) Object.assign(out, kind);
  const color = guessColor(text) || guessColor(meta(html, "product:color") || "");
  if (color) out.color = color;
  return out;
}
