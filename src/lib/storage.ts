import seed from "../../data/wardrobe.json";
import { clone, migrate } from "./model.ts";
import { guessFromUrl, type ProductGuess } from "./productParse.ts";
import type { WardrobeData } from "./types.ts";

/**
 * Where the wardrobe lives.
 * - "file": `npm run dev`. The dev server reads and writes data/wardrobe.json.
 * - "browser": the published static build. Data is kept in this browser's localStorage,
 *   starting from the bundled copy of data/wardrobe.json.
 */
export interface Backend {
  kind: "file" | "browser";
  load(): Promise<WardrobeData>;
  save(data: WardrobeData): Promise<void>;
  /** Fill item fields from a product URL. */
  importUrl(url: string): Promise<{ guess: ProductGuess; fetched: boolean }>;
}

const DATA_KEY = "wardrobe-rotation:data";
const DRAFT_KEY = "wardrobe-rotation:draft";

export const sampleData = (): WardrobeData => migrate(clone(seed));

/** Fired when the data file changes on disk during development. The app re-checks it instead of reloading the page. */
export const DATA_CHANGED = "wardrobe:changed";
if (import.meta.hot) import.meta.hot.accept("../../data/wardrobe.json", () => window.dispatchEvent(new Event(DATA_CHANGED)));

const fileBackend: Backend = {
  kind: "file",
  async load() {
    const r = await fetch("/api/wardrobe");
    if (!r.ok) throw new Error(`Couldn't read data/wardrobe.json (${r.status})`);
    return migrate(await r.json());
  },
  async save(data) {
    const r = await fetch("/api/wardrobe", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error((await r.text()) || `Save failed (${r.status})`);
  },
  async importUrl(url) {
    const r = await fetch("/api/import?url=" + encodeURIComponent(url));
    if (!r.ok) return { guess: guessFromUrl(url), fetched: false };
    return { guess: await r.json(), fetched: true };
  },
};

const browserBackend: Backend = {
  kind: "browser",
  async load() {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (raw) return migrate(JSON.parse(raw));
    } catch {}
    return sampleData();
  },
  async save(data) {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  },
  async importUrl(url) {
    // A static page can't read other sites (CORS), so guess from the URL text.
    return { guess: guessFromUrl(url), fetched: false };
  },
};

export async function pickBackend(): Promise<Backend> {
  if (import.meta.env.DEV) {
    try {
      const r = await fetch("/api/health");
      if (r.ok) return fileBackend;
    } catch {}
  }
  return browserBackend;
}

/**
 * A short fingerprint of the wardrobe's content (savedAt and key order ignored).
 * Drafts record the fingerprint of the version they were made against, so a file changed on disk
 * (by hand, by a script, by another tab) is noticed even when its savedAt didn't move.
 */
export function fingerprint(data: WardrobeData): string {
  const stable = (v: unknown): string =>
    Array.isArray(v) ? "[" + v.map(stable).join(",") + "]"
    : v && typeof v === "object" ? "{" + Object.keys(v).filter((k) => (v as Record<string, unknown>)[k] !== undefined).sort().map((k) => JSON.stringify(k) + ":" + stable((v as Record<string, unknown>)[k])).join(",") + "}"
    : JSON.stringify(v);
  const text = stable({ ...data, savedAt: 0 });
  let h = 0x811c9dc5; // FNV-1a, 32-bit
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36) + "-" + text.length.toString(36);
}

/** Unsaved edits survive a reload. `base` is the fingerprint of the saved version they were made against
 *  (older drafts stored the saved version's savedAt number instead). */
export function loadDraft(): { base: string | number; data: WardrobeData } | null {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (d && d.data) return { base: d.base, data: migrate(d.data) };
  } catch {}
  return null;
}

export function saveDraft(base: string, data: WardrobeData | null) {
  try {
    if (data) localStorage.setItem(DRAFT_KEY, JSON.stringify({ base, data }));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export function downloadJson(data: WardrobeData, filename = "wardrobe.json") {
  const blob = new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
