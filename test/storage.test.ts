import { describe, expect, it } from "vitest";
import { clone } from "../src/lib/model.ts";
import { fingerprint, sampleData } from "../src/lib/storage.ts";

describe("fingerprint", () => {
  const base = sampleData();

  it("ignores savedAt", () => {
    expect(fingerprint({ ...base, savedAt: 1 })).toBe(fingerprint({ ...base, savedAt: 2 }));
  });

  it("ignores key order and undefined fields", () => {
    const shuffled = clone(base);
    shuffled.items = shuffled.items.map((it) => Object.fromEntries(Object.entries(it).reverse()) as typeof it);
    shuffled.items[0] = { ...shuffled.items[0], image: undefined };
    const plain = clone(base);
    delete plain.items[0].image;
    expect(fingerprint(shuffled)).toBe(fingerprint(plain));
  });

  it("changes when the content changes, e.g. an image is added by hand", () => {
    const edited = clone(base);
    edited.items[0] = { ...edited.items[0], image: "https://example.com/new.jpg" };
    expect(fingerprint(edited)).not.toBe(fingerprint(base));
  });
});
