import { useState } from "react";
import { Button, Check, Field, Kicker, SectionHead, Select } from "../design-system/index.ts";
import { findItem, shortName } from "../lib/model.ts";
import type { HairStyle, WardrobeData } from "../lib/types.ts";
import { OutfitFigure } from "./common.tsx";

const HAIR: HairStyle[] = ["short", "long", "bun", "curly", "none"];
const SKIN = ["#f8d9c0", "#f1c7a3", "#d9a47a", "#b07a52", "#7d5236", "#4f3324"];

/** The rotation as a printable sheet, one week per landscape page. */
export function PrintView({ data, setData }: { data: WardrobeData; setData: (d: WardrobeData) => void }) {
  const { items, rotation: rot, figure } = data;
  const per = rot.days.length;
  const [names, setNames] = useState(true);
  const [tagline, setTagline] = useState("Get dressed, look sharp, have a good week.");
  const setFig = (p: Partial<typeof figure>) => setData({ ...data, figure: { ...figure, ...p } });

  return (
    <div className="view">
      <section className="no-print" aria-labelledby="pr-h">
        <SectionHead id="pr-h" kicker="Print edition" title="Print your rotation" aside={<Button variant="primary" onClick={() => window.print()}>Print</Button>} />
        <div className="print-controls">
          <div className="rt-field">
            <span className="rt-field-label">Skin</span>
            <div className="skin-row">
              {SKIN.map((c) => (
                <button key={c} className="skin" title={c} aria-label={"Skin tone " + c} aria-pressed={figure.skin === c} onClick={() => setFig({ skin: c })} style={{ background: c }} />
              ))}
              <input className="rt-input rt-input-color" type="color" value={figure.skin} onChange={(e) => setFig({ skin: e.target.value })} aria-label="Custom skin colour" />
            </div>
          </div>
          <Field className="f-color" type="color" label="Hair" value={figure.hair} onChange={(e) => setFig({ hair: e.target.value })} />
          <Select className="f-hair" id="hair-style" label="Hair style" value={figure.hairStyle} options={HAIR.map((h) => ({ value: h, label: h[0].toUpperCase() + h.slice(1) }))} onChange={(v) => setFig({ hairStyle: v as HairStyle })} />
          <Field className="f-tagline" label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          <div className="rt-field">
            <span className="rt-field-label">Labels</span>
            <Check label="Show item names" checked={names} onChange={(e) => setNames(e.target.checked)} />
          </div>
        </div>
        <p className="lede">Each week prints on its own landscape page. Turn on “Background graphics” in the print dialog to keep the colours.</p>
      </section>

      <div className="sheet">
        {Array.from({ length: rot.weeks }, (_, w) => (
          <section className="cweek" key={w}>
            <header className="sheet-head">
              <div className="sheet-top">
                <Kicker tone="ink">The Wardrobe</Kicker>
                <span className="rt-spec">{rot.weeks > 1 ? `WEEK ${String(w + 1).padStart(2, "0")} OF ${String(rot.weeks).padStart(2, "0")}` : "THE WEEK"}</span>
              </div>
              <h2 className="sheet-title">{data.title}</h2>
              {tagline ? <p className="sheet-tag">{tagline}</p> : null}
            </header>
            <div className="cdays" style={{ ["--days" as string]: per }}>
              {rot.days.map((d, di) => {
                const look = rot.looks[w * per + di];
                return (
                  <div className="cday" key={di}>
                    <span className="dname">{d}</span>
                    <OutfitFigure items={items} look={look} cartoon figure={figure} width="100%" />
                    {names ? (
                      <ul>
                        {(["layer", "shirt", "pants", "shoes"] as const).map((s) => (look[s] ? <li key={s}>{shortName(findItem(items, look[s]))}</li> : null))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
