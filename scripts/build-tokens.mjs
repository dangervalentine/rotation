// Compiles design-system/tokens.json into src/design-system/tokens.css.
// Run `npm run tokens` after editing tokens.json; `npm test` fails if the CSS is stale.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const TOKENS_JSON = path.join(root, "design-system/tokens.json");
export const TOKENS_CSS = path.join(root, "src/design-system/tokens.css");

const ref = (v) => String(v).replace(/^\{(.+)\}$/, "var(--$1)");
const pick = (value, theme, first) => (typeof value === "string" ? value : value[theme] ?? value[first]);
const decl = (name, value) => `  --${name}: ${ref(value)};`;
const kebab = (s) => s.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

export function buildTokensCss(tokens) {
  const themes = tokens.color.themes.map((t) => t.id);
  const [first, ...rest] = themes;
  const themed = [...tokens.color.tokens, ...(tokens.shadow?.tokens ?? [])];
  const block = (theme) => themed.map((t) => decl(t.name, pick(t.value, theme, first))).join("\n");
  const out = [`/* ${tokens.name} — generated from design-system/tokens.json by scripts/build-tokens.mjs. Do not edit. */`];

  out.push(`:root,\n[data-theme="${first}"] {\n  color-scheme: light;\n${block(first)}\n}`);
  for (const theme of rest) {
    // Forced themes are for the screen; print always uses the first (Newsprint).
    out.push(`@media screen {\n  [data-theme="${theme}"] {\n    color-scheme: dark;\n${block(theme).replace(/^/gm, "  ")}\n  }\n}`);
    out.push(`@media screen and (prefers-color-scheme: dark) {\n  :root:not([data-theme="${first}"]) {\n    color-scheme: dark;\n${block(theme).replace(/^/gm, "  ")}\n  }\n}`);
  }

  const flat = Object.entries(tokens)
    .filter(([k, v]) => !["name", "version", "color", "type", "shadow"].includes(k) && v && Array.isArray(v.tokens))
    .flatMap(([, v]) => v.tokens.map((t) => decl(t.name, t.value)));
  const fonts = Object.entries(tokens.type.families).map(([k, v]) => `  --font-${k}: ${v};`);
  out.push(`:root {\n${[...flat, ...fonts].join("\n")}\n}`);

  for (const g of tokens.type.groups) {
    for (const s of g.styles) {
      const props = [`font-family: var(--font-${s.family ?? g.family});`];
      for (const k of ["fontSize", "lineHeight", "fontWeight", "letterSpacing", "fontStyle"]) if (s[k] !== undefined) props.push(`${kebab(k)}: ${s[k]};`);
      out.push(`.type-${s.name} { ${props.join(" ")} }`);
    }
  }
  return out.join("\n\n") + "\n";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const css = buildTokensCss(JSON.parse(readFileSync(TOKENS_JSON, "utf8")));
  writeFileSync(TOKENS_CSS, css);
  console.log("Wrote " + path.relative(root, TOKENS_CSS));
}
