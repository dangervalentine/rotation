import { useState } from "react";
import { findItem, shortName } from "../lib/model.ts";
import type { HairStyle, WardrobeData } from "../lib/types.ts";
import { OutfitFigure, Select } from "./common.tsx";

const HAIR: HairStyle[] = ["short", "long", "bun", "curly", "none"];
const SKIN = ["#f8d9c0", "#f1c7a3", "#d9a47a", "#b07a52", "#7d5236", "#4f3324"];

/** The rotation as a cute printable sheet, one week per page. */
export function PrintView({ data, setData }: { data: WardrobeData; setData: (d: WardrobeData) => void }) {
  const { items, rotation: rot, figure } = data;
  const per = rot.days.length;
  const [names, setNames] = useState(true);
  const [tagline, setTagline] = useState("Get dressed, look sharp, have a great week!");
  const setFig = (p: Partial<typeof figure>) => setData({ ...data, figure: { ...figure, ...p } });

  return (
    <div className="rot-layout">
      <section className="panel no-print" aria-labelledby="pr-h">
        <div className="panel-head">
          <h2 id="pr-h">Print your rotation</h2>
          <button className="btn primary" onClick={() => window.print()}>Print</button>
        </div>
        <div className="print-controls">
          <label>
            Skin
            {SKIN.map((c) => (
              <button key={c} className="sw" title={c} aria-label={"Skin tone " + c} aria-pressed={figure.skin === c} onClick={() => setFig({ skin: c })} style={{ background: c, width: 22, height: 22, cursor: "pointer", outline: figure.skin === c ? "2px solid var(--accent)" : "none", outlineOffset: 2 }} />
            ))}
            <input type="color" value={figure.skin} onChange={(e) => setFig({ skin: e.target.value })} aria-label="Custom skin color" />
          </label>
          <label>
            Hair
            <input type="color" value={figure.hair} onChange={(e) => setFig({ hair: e.target.value })} aria-label="Hair color" />
          </label>
          <div style={{ minWidth: 140 }}>
            <Select id="hair-style" label="Hair style" value={figure.hairStyle} options={HAIR.map((h) => ({ value: h, label: h }))} onChange={(v) => setFig({ hairStyle: v as HairStyle })} />
          </div>
          <label>
            <input type="checkbox" checked={names} onChange={(e) => setNames(e.target.checked)} /> Show item names
          </label>
          <label>
            Tagline
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} style={{ font: "14px var(--font-body)", padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--card)", color: "var(--ink)", width: 280 }} />
          </label>
        </div>
        <p className="hint" style={{ marginBottom: 0 }}>Each week prints on its own landscape page. Turn on “Background graphics” in the print dialog to keep the colors.</p>
      </section>

      <div className="sheet">
        <h2>{data.title}</h2>
        {tagline ? <p className="tagline">{tagline}</p> : null}
        {Array.from({ length: rot.weeks }, (_, w) => (
          <section className="cweek" key={w}>
            {rot.weeks > 1 ? <h3>Week {w + 1}</h3> : null}
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
