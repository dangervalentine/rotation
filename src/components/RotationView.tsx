import { useEffect, useState } from "react";
import { Button, Field, Kicker, Notice, RotationDay, SectionHead, Select } from "../design-system/index.ts";
import { clone, dayLabel, dayWarnings, generateRotation, resizeRotation, same, uniqueId } from "../lib/model.ts";
import type { Look, WardrobeData } from "../lib/types.ts";
import { lookPieces, OutfitFigure } from "./common.tsx";
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
  const span = rot.weeks === 1 ? "One-week" : rot.weeks === 2 ? "Two-week" : `${rot.weeks}-week`;

  return (
    <div className="view">
      <section aria-labelledby="rot-h">
        <SectionHead
          id="rot-h"
          kicker={`${per} days × ${rot.weeks} ${rot.weeks === 1 ? "week" : "weeks"}`}
          title={`The ${span.toLowerCase()} rotation`}
          aside={
            <>
              <Field
                className="f-days"
                label="Days, comma separated"
                value={daysText}
                onChange={(e) => setDaysText(e.target.value)}
                onBlur={() => {
                  const days = daysText.split(",").map((d) => d.trim()).filter(Boolean);
                  if (!same(days, rot.days)) setShape(days, rot.weeks);
                }}
              />
              <Field className="f-weeks" label="Weeks" type="number" min={1} max={8} value={rot.weeks} onChange={(e) => setShape(rot.days, Math.min(8, Math.max(1, +e.target.value || 1)))} />
              <Button variant="primary" onClick={generate} title="Fill every day, spreading wear evenly and avoiding repeats">
                Generate rotation
              </Button>
            </>
          }
        />
        <p className="lede">Select a day to change its outfit. Flags mark the same pants, shirt or leather shoes two days running.</p>
        {Array.from({ length: rot.weeks }, (_, w) => (
          <div className="week" key={w} style={{ ["--days" as string]: per }}>
            <div className="wklabel">
              <Kicker tone="ink">Week {String(w + 1).padStart(2, "0")}</Kicker>
            </div>
            {rot.days.map((d, di) => {
              const i = w * per + di;
              const look = shown[i];
              return (
                <RotationDay
                  key={i}
                  day={d}
                  pieces={lookPieces(items, look).filter((p) => p.slot !== "belt")}
                  figure={<OutfitFigure items={items} look={look} />}
                  selected={i === cur}
                  edited={i === cur && dirty}
                  flags={dayWarnings(items, rot, i, shown).map((f) => f.replace("yesterday", rot.days[(di + per - 1) % per]))}
                  onClick={() => go(i)}
                />
              );
            })}
          </div>
        ))}
      </section>

      <section aria-labelledby="b-h">
        <SectionHead
          id="b-h"
          kicker={<>Editing {dayLabel(rot, cur)}</>}
          title="Outfit builder"
          aside={
            <>
              <Button variant="ghost" size="sm" onClick={() => go((cur + total - 1) % total)}>← Previous day</Button>
              <Button variant="ghost" size="sm" onClick={() => go((cur + 1) % total)}>Next day →</Button>
            </>
          }
        />
        {outfits.length ? (
          <div className="wear-saved">
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
        {notice ? <Notice>{notice}</Notice> : null}
        <div className="actions">
          <Button variant="primary" onClick={apply} disabled={!dirty}>
            Apply to {rot.days[cur % per]}
          </Button>
          <Button onClick={() => { setDraft(clone(rot.looks[cur])); setNotice(""); }} disabled={!dirty}>
            Discard changes
          </Button>
          <Button onClick={() => setDraft(clone(rot.looks[(cur + total - 1) % total]))}>Copy previous day</Button>
          <Button variant="ghost" onClick={saveAsOutfit}>Save as outfit</Button>
        </div>
      </section>
    </div>
  );
}
