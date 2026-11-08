import { useEffect, useRef, useState, type RefObject } from "react";
import { Button, ConfirmDialog, Field, Kicker, Notice, RotationDay, SectionHead, Select, Sheet } from "../design-system/index.ts";
import { clone, dayLabel, dayWarnings, generateRotation, resizeRotation, same, uniqueId } from "../lib/model.ts";
import type { Route } from "../lib/route.ts";
import type { Look, WardrobeData } from "../lib/types.ts";
import { lookPieces, OutfitFigure } from "./common.tsx";
import { LookEditor } from "./LookEditor.tsx";

const PICK = "__pick";

/** An action held back until the person applies or discards the open day's changes. */
type Pending = { kind: "close" } | { kind: "go"; index: number } | { kind: "generate" } | { kind: "leave"; hash: string };

export interface RotationViewProps {
  data: WardrobeData;
  setData: (d: WardrobeData) => void;
  /** The day whose editing panel is open (from the URL), or null. */
  day: number | null;
  navigate: (route: Route, mode: "push" | "replace") => void;
  /** Close the panel (or go to `hash`) without asking. */
  exitDay: (hash?: string) => void;
  closeGuard: RefObject<((nextHash: string) => boolean) | null>;
}

export function RotationView({ data, setData, day, navigate, exitDay, closeGuard }: RotationViewProps) {
  const { items, rotation: rot, outfits } = data;
  const per = rot.days.length;
  const total = rot.looks.length;
  const open = day !== null && day < total;
  // After closing, keep pointing at the last open day so focus returns to it.
  const lastOpen = useRef(0);
  if (open) lastOpen.current = day;
  const cur = Math.min(open ? day : lastOpen.current, total - 1);
  // Working copy of the open day's look. It belongs to one day index; any other day shows its saved look.
  const [edit, setEdit] = useState<{ i: number; look: Look } | null>(null);
  const draft = edit && edit.i === cur ? edit.look : rot.looks[cur];
  const dirty = open && !same(draft, rot.looks[cur]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [notice, setNotice] = useState("");
  const [daysText, setDaysText] = useState(rot.days.join(", "));
  const dayRefs = useRef(new Map<number, HTMLButtonElement>());
  const returnFocus = useRef<HTMLElement | null>(null);
  returnFocus.current = dayRefs.current.get(cur) ?? null;

  useEffect(() => setDaysText(rot.days.join(", ")), [rot.days]);
  // Leaving the open day (Back, nav links) waits for apply or discard when there are changes.
  closeGuard.current = (hash) => {
    if (!dirty) return true;
    setPending({ kind: "leave", hash });
    return false;
  };
  useEffect(() => () => { closeGuard.current = null; }, [closeGuard]);

  // F6 moves between the calendar and the docked panel beside it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "F6" || document.documentElement.dataset.sheet !== "side") return;
      e.preventDefault();
      toggleRegion();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  function toggleRegion() {
    const sheet = document.querySelector<HTMLElement>(".rt-sheet");
    if (sheet?.contains(document.activeElement)) dayRefs.current.get(cur)?.focus();
    else sheet?.querySelector<HTMLElement>(".rt-sheet-title")?.focus();
  }

  function setDraft(look: Look) {
    setEdit({ i: cur, look });
  }
  function select(i: number) {
    setNotice("");
    if (!open) {
      navigate({ view: "rotation", day: i }, "push");
      requestAnimationFrame(() => dayRefs.current.get(i)?.scrollIntoView({ block: "nearest", inline: "nearest" }));
    } else if (i !== cur) {
      if (dirty) setPending({ kind: "go", index: i });
      else navigate({ view: "rotation", day: i }, "replace");
    }
  }
  function requestClose() {
    if (dirty) setPending({ kind: "close" });
    else exitDay();
  }
  function apply() {
    const looks = clone(rot.looks);
    looks[cur] = clone(draft);
    setData({ ...data, rotation: { ...rot, looks } });
    setEdit(null);
    setNotice("");
  }
  function discard() {
    setEdit(null);
    setNotice("");
  }
  function setShape(days: string[], weeks: number) {
    if (!days.length || weeks < 1) return;
    const next = resizeRotation(rot, days, weeks);
    setData({ ...data, rotation: next });
    setEdit(null);
    if (open && cur >= next.looks.length) exitDay();
  }
  function doGenerate() {
    const looks = generateRotation(items, rot.days, rot.weeks);
    setData({ ...data, rotation: { ...rot, looks } });
    setEdit(null);
    setNotice("");
  }
  function generate() {
    if (dirty) setPending({ kind: "generate" });
    else doGenerate();
  }
  function perform(p: Pending) {
    if (p.kind === "close") exitDay();
    else if (p.kind === "leave") exitDay(p.hash);
    else if (p.kind === "go") navigate({ view: "rotation", day: p.index }, "replace");
    else doGenerate();
  }
  function saveAsOutfit() {
    const name = dayLabel(rot, cur);
    const id = uniqueId(name, outfits);
    setData({ ...data, outfits: [...outfits, { id, name, look: clone(draft) }] });
    setNotice(`Saved as “${name}” on the Outfits tab.`);
  }

  const shown = rot.looks.map((l, i) => (i === cur ? draft : l));
  const span = rot.weeks === 1 ? "One-week" : rot.weeks === 2 ? "Two-week" : `${rot.weeks}-week`;
  const prev = (cur + total - 1) % total;
  const next = (cur + 1) % total;

  return (
    <div className="view">
      <section aria-labelledby="rot-h">
        <SectionHead
          id="rot-h"
          number={3}
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
              {/* One accent per screen: while a day is open, its Apply button is the primary action. */}
              <Button variant={open ? "secondary" : "primary"} onClick={generate} title="Fill every day, spreading wear evenly and avoiding repeats">
                Generate rotation
              </Button>
            </>
          }
        />
        {items.length ? null : (
          <Notice tone="neutral">
            No pieces yet. Start in <a href="#wardrobe">Wardrobe &amp; costs</a>.
          </Notice>
        )}
        <p className="lede">Select a day to edit its outfit. Flags mark the same pants, shirt or leather shoes two days running.</p>
        <div className="days">
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
                    ref={(el) => {
                      if (el) dayRefs.current.set(i, el);
                      else dayRefs.current.delete(i);
                    }}
                    day={d}
                    pieces={lookPieces(items, look).filter((p) => p.slot !== "belt")}
                    figure={<OutfitFigure items={items} look={look} />}
                    selected={open && i === cur}
                    expanded={open && i === cur}
                    edited={open && i === cur && dirty}
                    flags={dayWarnings(items, rot, i, shown).map((f) => f.replace("yesterday", rot.days[(di + per - 1) % per]))}
                    onClick={() => select(i)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <Sheet
        open={open}
        onOpenChange={(o) => { if (!o) requestClose(); }}
        kicker={dirty ? "Editing · not applied" : "Editing"}
        title={dayLabel(rot, cur)}
        returnFocusRef={returnFocus}
        headActions={
          <Button variant="ghost" size="sm" className="rt-sheet-back" onClick={toggleRegion} title="F6 moves between the calendar and this panel">
            Calendar
          </Button>
        }
        footer={
          <>
            <Button variant="primary" onClick={apply} disabled={!dirty}>
              Apply to {rot.days[cur % per]}
            </Button>
            <Button onClick={discard} disabled={!dirty}>Discard</Button>
            <span className="sheet-nav">
              <Button variant="ghost" size="sm" onClick={() => select(prev)} aria-label={"Previous day: " + dayLabel(rot, prev)}>← Prev</Button>
              <Button variant="ghost" size="sm" onClick={() => select(next)} aria-label={"Next day: " + dayLabel(rot, next)}>Next →</Button>
            </span>
          </>
        }
      >
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
          <Button onClick={() => setDraft(clone(rot.looks[prev]))}>Copy previous day</Button>
          <Button variant="ghost" onClick={saveAsOutfit}>Save as outfit</Button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => { if (!o) setPending(null); }}
        onCloseAutoFocus={(e) => {
          // Back to the panel if it is still open, otherwise to the day it was editing.
          e.preventDefault();
          requestAnimationFrame(() => {
            const title = document.querySelector<HTMLElement>('.rt-sheet[data-state="open"] .rt-sheet-title');
            (title ?? dayRefs.current.get(cur))?.focus();
          });
        }}
        title={`Unapplied changes to ${dayLabel(rot, cur)}`}
        description="Apply them to this day, or discard them, before you move on."
        actions={[
          { label: "Apply", variant: "primary", onSelect: () => { const p = pending!; apply(); perform(p); } },
          { label: "Discard", onSelect: () => { const p = pending!; discard(); perform(p); } },
          { label: "Keep editing", variant: "ghost", onSelect: () => setPending(null) },
        ]}
      />
    </div>
  );
}
