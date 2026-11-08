// Lighthouse audit of every view, in both themes, desktop and mobile.
// Usage: npm run build && npm run preview, then `npm run audit -- --phase before|after [--base http://localhost:4173/]`.
// Writes JSON + HTML reports and REPORT.md to specs/001-page-flow-refinement/lighthouse/.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import puppeteer from "puppeteer-core";

const arg = (name, dflt) => {
  const i = process.argv.indexOf("--" + name);
  return i > -1 ? process.argv[i + 1] : dflt;
};
const phase = arg("phase", "after");
const base = arg("base", "http://localhost:4173/");
if (!["before", "after"].includes(phase)) throw new Error("--phase must be before or after");

const OUT = path.resolve(import.meta.dirname, "../specs/001-page-flow-refinement/lighthouse");
const ROUTES = ["#wardrobe", "#outfits", "#rotation", "#rotation/day/0", "#print"];
const THEMES = ["light", "dark"];
const FORMS = ["desktop", "mobile"];
const CATS = ["accessibility", "best-practices", "performance", "seo"];
// body background per theme (tokens.json paper)
const PAPER = { light: "rgb(243, 239, 230)", dark: "rgb(18, 17, 15)" };

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const executablePath = process.env.CHROME_PATH || (existsSync(EDGE) ? EDGE : null);
if (!executablePath) throw new Error("Set CHROME_PATH to a Chromium-based browser");

const slug = (r) => r.replace(/^#/, "").replace(/\//g, "-");
mkdirSync(path.join(OUT, phase), { recursive: true });

const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-first-run"] });
try {
  for (const route of ROUTES) {
    for (const theme of THEMES) {
      for (const form of FORMS) {
        const page = await browser.newPage();
        await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
        const url = new URL(route, base).href;
        // Confirm the theme emulation takes effect before trusting the scores.
        await page.goto(url, { waitUntil: "networkidle0" });
        const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        if (bg !== PAPER[theme]) throw new Error(`${route} ${theme}: body background ${bg}, expected ${PAPER[theme]}`);

        const flags = { output: ["json", "html"], onlyCategories: CATS, logLevel: "error" };
        const result = await lighthouse(url, flags, form === "desktop" ? desktopConfig : undefined, page);
        const bgAfter = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        if (bgAfter !== PAPER[theme]) throw new Error(`${route} ${theme}: theme lost during audit (${bgAfter})`);

        const name = `${slug(route)}.${theme}.${form}`;
        const [json, html] = result.report;
        writeFileSync(path.join(OUT, phase, name + ".report.json"), json);
        writeFileSync(path.join(OUT, phase, name + ".report.html"), html);
        const s = Object.fromEntries(CATS.map((c) => [c, Math.round(result.lhr.categories[c].score * 100)]));
        console.log(`${phase} ${name}: a11y ${s.accessibility} · bp ${s["best-practices"]} · perf ${s.performance} · seo ${s.seo}`);
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

// ---------- REPORT.md ----------

function load(ph) {
  const dir = path.join(OUT, ph);
  if (!existsSync(dir)) return {};
  return Object.fromEntries(
    readdirSync(dir)
      .filter((f) => f.endsWith(".report.json"))
      .map((f) => [f.replace(".report.json", ""), JSON.parse(readFileSync(path.join(dir, f), "utf8"))]),
  );
}
const before = load("before");
const after = load("after");
const score = (lhr, c) => (lhr ? Math.round(lhr.categories[c].score * 100) : "–");
const cell = (k, c) => {
  const b = score(before[k], c);
  const a = score(after[k], c);
  return after[k] ? `${b} → **${a}**` : `${b}`;
};

const rows = [];
for (const route of ROUTES) for (const theme of THEMES) for (const form of FORMS) {
  const k = `${slug(route)}.${theme}.${form}`;
  rows.push(`| \`${route}\` | ${theme} | ${form} | ${CATS.map((c) => cell(k, c)).join(" | ")} |`);
}

const latest = Object.keys(after).length ? after : before;
const failing = [];
for (const [k, lhr] of Object.entries(latest)) {
  for (const cat of ["accessibility", "best-practices"]) {
    for (const ref of lhr.categories[cat].auditRefs) {
      const a = lhr.audits[ref.id];
      if (ref.weight > 0 && a.score !== null && a.score < 1) {
        failing.push(`| ${k} | ${cat} | \`${a.id}\` | ${a.title} | ${a.details?.items?.length ?? ""} |`);
      }
    }
  }
}

const reportPath = path.join(OUT, "REPORT.md");
const prev = existsSync(reportPath) ? readFileSync(reportPath, "utf8") : "";
const exceptions = prev.includes("## Exceptions") ? prev.slice(prev.indexOf("## Exceptions")) : "## Exceptions\n\nNone.\n";

writeFileSync(
  reportPath,
  `# Lighthouse report

Generated by \`scripts/lighthouse.mjs\` against \`npm run preview\` (production build). Browser: ${path.basename(executablePath)}.
Targets (spec SC-001): Accessibility = 100, Best Practices ≥ 95. Performance and SEO are recorded only.
Cells show before → **after** once both phases exist.

| Route | Theme | Form | Accessibility | Best practices | Performance | SEO |
|---|---|---|---|---|---|---|
${rows.join("\n")}

## Failing audits (${Object.keys(after).length ? "after" : "before"})

${failing.length ? "| Run | Category | Audit | Title | Items |\n|---|---|---|---|---|\n" + failing.join("\n") : "None."}

${exceptions}`,
);
console.log("Wrote " + path.relative(process.cwd(), reportPath));
