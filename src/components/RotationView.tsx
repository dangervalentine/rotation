import { useEffect, useState } from "react";
import { clone, dayLabel, dayWarnings, findItem, generateRotation, resizeRotation, same, shortName, uniqueId } from "../lib/model.ts";
import type { Look, WardrobeData } from "../lib/types.ts";
import { OutfitFigure, Select } from "./common.tsx";
import { LookEditor } from "./LookEditor.tsx";

const PICK = "__pick";

export function RotationView({ data, setData }: { data: WardrobeData; setData: (d: WardrobeData) => void }) {
  const { items, rotation: rot, outfits } = data;
  const per = rot.days.length;
  const total = rot.looks.length;
  const [sel, setSel] = useState(0);
  const [draft, setDraft] = useState<Look>(() => clone(rot.looks[0]));
  const [notice, setNotice] = useState("");
  const [daysText, setDaysText] = useState(rot.days.join(", "));
  const cur = Math.min(sel, total - 1);
  const dirty = !same(draft, rot.looks[cur]);

  useEffect(() => {
    if (!dirty) setDraft(clone(rot.looks[cur]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rot, cur]);
  useEffect(() => setDaysText(rot.days.join(", ")), [rot.days]);

  function go(i: number) {
    if (i === cur) return;
    if (dirty) {
      setNotice(`Apply or discard your changes to ${dayLabel(rot, cur)} before switching days.`);
      return;
    }
    setNotice("");
    setSel(i);
    setDraft(clone(rot.looks[i]));
  }
  function apply() {
    const looks = clone(rot.looks);
    looks[cur] = clone(draft);
    setData({ ...data, rotation: { ...rot, looks } });
    setNotice("");
  }
  function setShape(days: string[], weeks: number) {
    if (!days.length || weeks < 1) return;
    const next = resizeRotation(rot, days, weeks);
    setData({ ...data, rotation: next });
    setSel(0);
    setDraft(clone(next.looks[0]));
  }
  function generate() {
    if (dirty) return setNotice("Apply or discard your changes before generating a new rotation.");
    const looks = generateRotation(items, rot.days, rot.weeks);
    setData({ ...data, rotation: { ...rot, looks } });
    setDraft(clone(looks[cur]));
    setNotice("");
  }
  function saveAsOutfit() {
    const name = dayLabel(rot, cur);
    const id = uniqueId(name, outfits);
    setData({ ...data, outfits: [...outfits, { id, name, look: clone(draft) }] });
    setNotice(`Saved as “${name}” on the Outfits tab.`);
  }

  const shown = rot.looks.map((l, i) => (i === cur ? draft : l));

  return (
    <div className="rot-layout">
      <section className="panel" aria-labelledby="rot-h">
        <div className="panel-head">
          <h2 id="rot-h">{rot.weeks === 1 ? "One-week" : rot.weeks === 2 ? "Two-week" : `${rot.weeks}-week`} rotation</h2>
          <div className="toolbar">
            <label>
              Days
              <input
                type="text"
                value={daysText}
                onChange={(e) => setDaysText(e.target.value)}
                onBlur={() => {
                  const days = daysText.split(",").map((d) => d.trim()).filter(Boolean);
                  if (!same(days, rot.days)) setShape(days, rot.weeks);
                }}
                aria-label="Day names, comma separated"
              />
            </label>
            <label>
              Weeks
              <input type="number" min={1} max={8} value={rot.weeks} onChange={(e) => setShape(rot.days, Math.min(8, Math.max(1, +e.target.value || 1)))} />
            </label>
            <button className="btn" onClick={generate} title="Fill every day, spreading wear evenly and avoiding repeats">
              Generate rotation
            </button>
          </div>
        </div>
        <p className="hint" style={{ marginTop: -4 }}>Select a day to change its outfit.</p>
        {Array.from({ length: rot.weeks }, (_, w) => (
          <div className="week" key={w} style={{ ["--days" as string]: per }}>
            <div className="wklabel">Week {w + 1}</div>
            {rot.days.map((d, di) => {
              const i = w * per + di;
              const look = shown[i];
              const flags = dayWarnings(items, rot, i, shown);
              return (
                <button key={i} className={"day" + (i === cur ? " sel" : "")} aria-pressed={i === cur} onClick={() => go(i)}>
                  <OutfitFigure items={items} look={look} />
                  <div>
                    <div className="dn">
                      {d}
                      {i === cur && dirty ? <span className="edited"> edited</span> : null}
                    </div>
                    <ul>
                      {(["layer", "shirt", "pants", "shoes"] as const).map((s) => (
                        <li key={s}>{shortName(findItem(items, look[s]))}</li>
                      ))}
                    </ul>
                    {flags.map((f) => (
                      <span className="flag" key={f}>{f}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </section>

      <section className="panel builder" aria-labelledby="b-h">
        <div className="panel-head">
          <h2 id="b-h">Outfit builder</h2>
          <span className="hint">
            Editing <b>{dayLabel(rot, cur)}</b>
          </span>
        </div>
        {outfits.length ? (
          <div style={{ maxWidth: 320, marginBottom: 14 }}>
            <Select
              id="load-outfit"
              label="Wear a saved outfit"
              value={PICK}
              options={[{ value: PICK, label: "Choose an outfit…" }, ...outfits.map((o) => ({ value: o.id, label: o.name }))]}
              onChange={(v) => {
                const o = outfits.find((x) => x.id === v);
                if (o) setDraft(clone(o.look));
              }}
            />
          </div>
        ) : null}
        <LookEditor items={items} look={draft} onChange={setDraft} />
        {notice ? <p className="notice" role="status">{notice}</p> : null}
        <div className="actions">
          <button className="btn primary" onClick={apply} disabled={!dirty}>
            Apply to {rot.days[cur % per]}
          </button>
          <button className="btn" onClick={() => { setDraft(clone(rot.looks[cur])); setNotice(""); }} disabled={!dirty}>
            Discard changes
          </button>
          <button className="btn" onClick={() => setDraft(clone(rot.looks[(cur + total - 1) % total]))}>
            Copy previous day
          </button>
          <button className="btn" onClick={saveAsOutfit}>
            Save as outfit
          </button>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => go((cur + total - 1) % total)}>Previous day</button>
          <button className="btn ghost" onClick={() => go((cur + 1) % total)}>Next day</button>
        </div>
      </section>
    </div>
  );
}
