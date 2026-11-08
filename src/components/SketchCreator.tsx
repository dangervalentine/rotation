import { useEffect, useRef, useState } from "react";
import { Button, Field, Kicker, Notice, Swatch, Tiles } from "../design-system/index.ts";
import { dominantColour, sampleAt } from "../lib/colour.ts";
import { pieceSvg } from "../lib/figure.ts";
import { SLOTS } from "../lib/model.ts";
import { PALETTE } from "../lib/palette.ts";
import { makeSketch, SKETCH_DEFAULTS, sketchName, type SketchPart } from "../lib/sketch.ts";
import { cleanDetails, detailOptions, detailsOf, sketchStyles } from "../lib/styles.ts";
import type { Figure, Item } from "../lib/types.ts";
import { DetailFields, type DetailValue } from "./DetailFields.tsx";
import { loadPhoto, type LoadedPhoto } from "./photo.ts";

interface Draft {
  style: string;
  color: string;
  /** Sleeve, pattern and its second colour, hardware, length, buckle: kept across style changes, saved only where they apply. */
  details: DetailValue;
  name: string;
  image?: string;
}

const catOf = (part: SketchPart) => (part === "acc" ? "other" : part);
const partLabel = (part: SketchPart) => (part === "acc" ? "Accessory" : SLOTS.find(([s]) => s === part)![1]);
const A_PIECE: Record<SketchPart, string> = { layer: "a top layer", shirt: "a shirt", undershirt: "an undershirt", belt: "a belt", pants: "a pair of pants", shoes: "a pair of shoes", acc: "an accessory" };

/** A garment drawing for a style tile, in the draft's colour and details. */
function StyleArt({ part, style, color, details, figure }: { part: SketchPart; style: string; color: string; details: DetailValue; figure?: Figure }) {
  const item: Item = { id: "__tile", cat: catOf(part), name: style, style, color, price: 0, qty: 1, owned: false, ...details };
  const { svg, viewBox } = pieceSvg(item, undefined, figure);
  return <svg viewBox={viewBox} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/**
 * Sketch a piece the person doesn't own, in place inside the outfit builder.
 * Defaults are chosen so "Add to look" works straight away.
 */
export function SketchCreator({ part, items, figure, onDraftChange, onConfirm, onCancel }: {
  part: SketchPart;
  items: Item[];
  /** The person's figure, so head-worn accessory tiles show on their own head. */
  figure?: Figure;
  /** Fired on mount and on every change, for the builder's live figure. */
  onDraftChange: (draft: Omit<Item, "id">) => void;
  onConfirm: (draft: Omit<Item, "id">) => void;
  onCancel: () => void;
}) {
  const cat = catOf(part);
  const [d, setD] = useState<Draft>(() => ({ ...SKETCH_DEFAULTS[part], details: {}, name: "" }));
  const [photo, setPhoto] = useState<LoadedPhoto | null>(null);
  const [err, setErr] = useState("");
  const headRef = useRef<HTMLHeadingElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const build = () => makeSketch({ cat, style: d.style, color: d.color, ...d.details, name: d.name, image: d.image }, items);

  useEffect(() => { headRef.current?.focus(); }, []);
  useEffect(() => { onDraftChange(build()); }, [d]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = partLabel(part);
  const palette = PALETTE.find((p) => p.hex === d.color.toLowerCase());
  // What the colour swatch shows: the pattern only if this style can have one.
  const kept = cleanDetails({ cat, style: d.style, ...d.details });
  const shownPattern = detailsOf(kept).pattern;

  async function pickPhoto(file: File) {
    try {
      const p = await loadPhoto(file);
      setPhoto(p);
      setErr("");
      set({ image: p.dataUrl, color: dominantColour(p.pixels, p.width, p.height) });
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  function samplePhoto(e: React.MouseEvent<HTMLButtonElement>) {
    if (!photo) return;
    // Keyboard activation has no pointer position: use the suggested main colour.
    if (e.detail === 0) return set({ color: dominantColour(photo.pixels, photo.width, photo.height) });
    const r = e.currentTarget.querySelector("img")!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * photo.width;
    const y = ((e.clientY - r.top) / r.height) * photo.height;
    set({ color: sampleAt(photo.pixels, photo.width, photo.height, x, y) });
  }

  return (
    <form
      className="rt-creator"
      aria-labelledby="creator-h"
      data-escape-local=""
      noValidate
      onSubmit={(e) => { e.preventDefault(); onConfirm(build()); }}
      onKeyDown={(e) => {
        // Menus are portalled outside this form, so their Escape never reaches here.
        if (e.key === "Escape" && e.currentTarget.contains(e.target as Node)) { e.preventDefault(); e.stopPropagation(); onCancel(); }
      }}
    >
      <div className="rt-creator-head">
        <Kicker tone="accent">New piece · {label}</Kicker>
        <h3 id="creator-h" ref={headRef} tabIndex={-1} className="rt-creator-title">Sketch {A_PIECE[part]}</h3>
        <p className="lede">It goes in your Sketches to mix and match. It doesn't count toward costs.</p>
      </div>

      <div className="rt-creator-section">
        <Kicker>Style</Kicker>
        <Tiles
          label="Style"
          value={d.style}
          onChange={(style) => set({ style })}
          options={sketchStyles(cat).map((s) => ({ value: s, label: s, content: <StyleArt part={part} style={s} color={d.color} details={d.details} figure={figure} /> }))}
        />
      </div>

      {detailOptions(cat, d.style).length ? (
        <div className="rt-creator-section">
          <Kicker>Details</Kicker>
          <DetailFields cat={cat} style={d.style} value={d.details} color={d.color} variant="tiles" idPrefix="creator" onChange={(patch) => set({ details: { ...d.details, ...patch } })} />
        </div>
      ) : null}

      <div className="rt-creator-section">
        <div className="rt-creator-row">
          <Kicker>Colour</Kicker>
          <span className="rt-creator-colour"><Swatch color={d.color} stripe={kept.stripe} pattern={shownPattern} />{palette ? palette.name : "Custom"}</span>
        </div>
        <Tiles
          label="Colour"
          variant="swatch"
          value={palette?.name ?? ""}
          onChange={(name) => set({ color: PALETTE.find((p) => p.name === name)!.hex })}
          options={PALETTE.map((p) => ({ value: p.name, label: p.name, content: <Swatch color={p.hex} /> }))}
        />
        <div className="rt-creator-extras">
          <Field id="creator-custom" type="color" label="Custom colour" value={d.color} onChange={(e) => set({ color: e.target.value })} />
        </div>
      </div>

      <div className="rt-creator-section">
        <Kicker>From a photo</Kicker>
        {photo ? (
          <div className="rt-creator-photo">
            <button type="button" className="rt-photo-pick" onClick={samplePhoto} title="Click the garment to take its colour">
              <img src={photo.dataUrl} alt="Your photo. Click the garment to take its colour; press Enter for the suggested colour." />
            </button>
            <Button variant="ghost" size="sm" onClick={() => { setPhoto(null); set({ image: undefined }); }}>Remove photo</Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => fileRef.current?.click()}>Choose a photo…</Button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) pickPhoto(f); e.target.value = ""; }} />
        {err ? <Notice tone="warn">{err}</Notice> : null}
      </div>

      <Field id="creator-name" label="Name (optional)" value={d.name} placeholder={sketchName(d.color, d.style)} onChange={(e) => set({ name: e.target.value })} />

      <div className="actions">
        <Button variant="primary" type="submit">Add to look</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
