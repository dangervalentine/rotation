import { useState } from "react";
import { Button, Check, Kicker, Select, StepAside } from "../design-system/index.ts";
import { findItem, shortName } from "../lib/model.ts";
import type { FigureShow, HairStyle, WardrobeData } from "../lib/types.ts";
import { OutfitFigure, PieceIcon } from "./common.tsx";

const HAIR: HairStyle[] = ["short", "long", "bun", "curly", "none"];
const SHOW: { value: FigureShow; label: string }[] = [
  { value: "face", label: "Full figure" },
  { value: "faceless", label: "No face" },
  { value: "outfit", label: "Outfit only" },
];
/** Black, dark brown, brown, auburn, blonde, grey. */
const HAIR_COLOURS = ["#1f1a17", "#4a3426", "#7a5232", "#9a4a2a", "#d8b46a", "#b8b4ae"];
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
  const show = figure.show ?? "face";
  // "Outfit only" prints the plain mannequin, as on the Outfits and Rotation tabs.
  const person = show !== "outfit";

  return (
    <div className="view">
      <section className="no-print" aria-label="Print settings">
        <StepAside><Button variant="primary" onClick={() => window.print()}>Print</Button></StepAside>
        <div className="print-controls">
          <Select className="f-show" id="figure-show" label="Figure" value={show} options={SHOW} onChange={(v) => setFig({ show: v as FigureShow })} />
          {person ? (
            <>
              <div className="rt-field">
                <span className="rt-field-label">Skin</span>
                <div className="skin-row">
                  {SKIN.map((c) => (
                    <button key={c} className="skin" title={c} aria-label={"Skin tone " + c} aria-pressed={figure.skin === c} onClick={() => setFig({ skin: c })} style={{ background: c }} />
                  ))}
                  <input className="rt-input rt-input-color" type="color" value={figure.skin} onChange={(e) => setFig({ skin: e.target.value })} aria-label="Custom skin colour" />
                </div>
              </div>
              <div className="rt-field">
                <span className="rt-field-label">Hair</span>
                <div className="skin-row">
                  {HAIR_COLOURS.map((c) => (
                    <button key={c} className="skin" title={c} aria-label={"Hair colour " + c} aria-pressed={figure.hair === c} onClick={() => setFig({ hair: c })} style={{ background: c }} />
                  ))}
                  <input className="rt-input rt-input-color" type="color" value={figure.hair} onChange={(e) => setFig({ hair: e.target.value })} aria-label="Custom hair colour" />
                </div>
              </div>
              <Select className="f-hair" id="hair-style" label="Hair style" value={figure.hairStyle} options={HAIR.map((h) => ({ value: h, label: h[0].toUpperCase() + h.slice(1) }))} onChange={(v) => setFig({ hairStyle: v as HairStyle })} />
            </>
          ) : null}
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
                          <OutfitFigure items={items} look={look} cartoon={person} figure={figure} width="100%" />
                          {names ? (
                            <ul>
                              {(["layer", "shirt", "pants", "shoes"] as const).map((s) => {
                                const it = findItem(items, look[s]);
                                return it ? (
                                  <li key={s}>
                                    <PieceIcon it={it} slot={s} className="cpiece" />
                                    <span>{shortName(it)}</span>
                                  </li>
                                ) : null;
                              })}
                            </ul>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <footer className="sheet-mark">
                {/* The favicon mark: a display-face R on oxblood. */}
                <svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">
                  <rect width="32" height="32" fill="var(--oxblood)" />
                  <text x="16" y="25" textAnchor="middle" fontSize="24" fill="var(--on-oxblood)" style={{ fontFamily: "var(--font-display)" }}>R</text>
                </svg>
                <Kicker tone="ink">Rotation</Kicker>
              </footer>
            </section>
          );
        })}
      </div>
    </div>
  );
}
