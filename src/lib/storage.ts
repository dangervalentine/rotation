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

// Unsaved edits survive a reload, tied to the version they were made against.
export function loadDraft(base: number): WardrobeData | null {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (d && d.base === base && d.data) return migrate(d.data);
  } catch {}
  return null;
}

export function saveDraft(base: number, data: WardrobeData | null) {
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
