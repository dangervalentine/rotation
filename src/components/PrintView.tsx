import { useState } from "react";
import { Button, Check, Field, Kicker, SectionHead, Select } from "../design-system/index.ts";
import { findItem, shortName } from "../lib/model.ts";
import type { HairStyle, WardrobeData } from "../lib/types.ts";
import { OutfitFigure } from "./common.tsx";

const HAIR: HairStyle[] = ["short", "long", "bun", "curly", "none"];
const SKIN = ["#f8d9c0", "#f1c7a3", "#d9a47a", "#b07a52", "#7d5236", "#4f3324"];
/** Weeks per printed page: two rows of a five-day week is ten outfits. */
const WEEKS_PER_PAGE = 2;
const pad = (n: number) => String(n).padStart(2, "0");

/** The rotation as a printable sheet, two weeks (about ten outfits) per landscape page. */
export function PrintView({ data, setData }: { data: WardrobeData; setData: (d: WardrobeData) => void }) {
  const { items, rotation: rot, figure } = data;
  const per = rot.days.length;
  const perPage = WEEKS_PER_PAGE;
  const [names, setNames] = useState(true);
  const setFig = (p: Partial<typeof figure>) => setData({ ...data, figure: { ...figure, ...p } });

  return (
    <div className="view">
      <section className="no-print" aria-labelledby="pr-h">
        <SectionHead id="pr-h" number={4} kicker="Print edition" title="Print your rotation" aside={<Button variant="primary" onClick={() => window.print()}>Print</Button>} />
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
          <div className="rt-field">
            <span className="rt-field-label">Labels</span>
            <Check label="Show item names" checked={names} onCheckedChange={setNames} />
          </div>
        </div>
        <p className="lede">Each landscape page fits two weeks. Turn on “Background graphics” in the print dialog to keep the colours.</p>
      </section>

      <div className="sheet">
        {Array.from({ length: Math.ceil(rot.weeks / perPage) }, (_, p) => {
          const weeks = Array.from({ length: Math.min(perPage, rot.weeks - p * perPage) }, (_, i) => p * perPage + i);
          return (
            <section className="cpage" key={p} style={{ ["--rows" as string]: perPage }}>
              {weeks.map((w) => (
                <div className="cweek" key={w}>
                  {rot.weeks > 1 ? <span className="rt-spec cweek-label">WEEK {pad(w + 1)}</span> : null}
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
                </div>
              ))}
              <footer className="sheet-mark">
                <svg viewBox="0 0 24 16" width="18" height="12" aria-hidden="true">
                  <path d="M12 5.5V4.2a1.8 1.8 0 1 0-1.8-1.8M12 5.5 1.5 13.2c-.6.5-.3 1.3.5 1.3h20c.8 0 1.1-.8.5-1.3z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <Kicker tone="ink">The Wardrobe</Kicker>
              </footer>
            </section>
          );
        })}
      </div>
    </div>
  );
}
