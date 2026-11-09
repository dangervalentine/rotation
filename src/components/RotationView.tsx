import { useEffect, useRef, useState, type RefObject } from "react";
import { Button, ConfirmDialog, Field, Kicker, Notice, RotationDay, Select, Sheet } from "../design-system/index.ts";
import { clone, dayLabel, dayWarnings, generateRotation, isEmptyLook, resizeRotation, same, uniqueId } from "../lib/model.ts";
import type { Route } from "../lib/route.ts";
import type { Item, Look, WardrobeData } from "../lib/types.ts";
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
    const [creating, setCreating] = useState(false);
    // Name for "Save as new outfit", typed for one day; any other day starts blank (its label is the fallback).
    const [outfitName, setOutfitName] = useState({ i: cur, v: "" });
    const name = outfitName.i === cur ? outfitName.v : "";
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
        return looks;
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
    /** `base` is the rotation to fill, when a change was just applied and isn't in `rot` yet. */
    function doGenerate(base = rot.looks) {
        const looks = generateRotation(items, rot.days, rot.weeks, undefined, undefined, base);
        setData({ ...data, rotation: { ...rot, looks } });
        setEdit(null);
        setNotice("");
    }
    function generate() {
        if (dirty) setPending({ kind: "generate" });
        else doGenerate();
    }
    function perform(p: Pending, looks?: Look[]) {
        if (p.kind === "close") exitDay();
        else if (p.kind === "leave") exitDay(p.hash);
        else if (p.kind === "go") navigate({ view: "rotation", day: p.index }, "replace");
        else doGenerate(looks);
    }
    function createItem(it: Omit<Item, "id">) {
        const id = uniqueId(it.name, items);
        setData({ ...data, items: [...items, { id, ...it }] });
        return id;
    }
    function saveAsOutfit() {
        const n = name.trim() || dayLabel(rot, cur);
        const id = uniqueId(n, outfits);
        setData({ ...data, outfits: [...outfits, { id, name: n, look: clone(draft) }] });
        setOutfitName({ i: cur, v: "" });
        setNotice(`Saved as “${n}” on the Outfits tab.`);
    }

    const shown = rot.looks.map((l, i) => (i === cur ? draft : l));
    const empty = rot.looks.filter(isEmptyLook).length;
    const prev = (cur + total - 1) % total;
    const next = (cur + 1) % total;

    return (
        <div className="view">
            <section aria-label="The rotation">
                <div className="rot-controls">
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
                    {/* Only ever fills empty days, so it can't overwrite anything; gone once every day is set.
                        One accent per screen: while a day is open, its Apply button is the primary action. */}
                    {empty === 0 ? null : (
                        <Button variant={open ? "secondary" : "primary"} onClick={generate} title="Fill the empty days, spreading wear evenly and avoiding repeats. Days you've already set are kept.">
                            {empty === total ? "Generate rotation" : `Fill ${empty} empty ${empty === 1 ? "day" : "days"}`}
                        </Button>
                    )}
                </div>
                {items.length ? null : (
                    <Notice tone="neutral">
                        No pieces yet. Start in <a href="#wardrobe">Wardrobe</a>.
                    </Notice>
                )}
                <p className="lede">Select a day to edit its outfit. Flags mark when the same pants, shirt or shoes are worn two days running.</p>
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
                footer={
                    <>
                        <Button variant={creating ? "secondary" : "primary"} onClick={apply} disabled={!dirty}>
                            Apply to {rot.days[cur % per]}
                        </Button>
                        <Button onClick={discard} disabled={!dirty}>Discard</Button>
                        {/* Bottom sheet only (styles.css): there it joins Apply and Discard, and Prev / Next are dropped. */}
                        <Button className="save-outfit-foot" onClick={saveAsOutfit}>Save as new outfit</Button>
                        <span className="sheet-nav">
                            <Button variant="ghost" size="sm" onClick={() => select(prev)} aria-label={"Previous day: " + dayLabel(rot, prev)}>← Prev</Button>
                            <Button variant="ghost" size="sm" onClick={() => select(next)} aria-label={"Next day: " + dayLabel(rot, next)}>Next →</Button>
                        </span>
                    </>
                }
            >
                <LookEditor
                    items={items}
                    look={draft}
                    onChange={setDraft}
                    onCreateItem={createItem}
                    historyKey={String(cur)}
                    onCreatingChange={setCreating}
                    toolbarStart={<Field className="f-name" label="Name" value={name} placeholder={dayLabel(rot, cur)} onChange={(e) => setOutfitName({ i: cur, v: e.target.value })} />}
                    toolbarEnd={<Button className="save-outfit-top" onClick={saveAsOutfit}>Save as new outfit</Button>}
                    stageActions={
                        outfits.length || notice ? (
                            <>
                                {outfits.length ? (
                                    <Select
                                        id="load-outfit"
                                        className="f-wear"
                                        label="Wear a saved outfit"
                                        value={PICK}
                                        options={[{ value: PICK, label: "Choose an outfit…" }, ...outfits.map((o) => ({ value: o.id, label: o.name }))]}
                                        onChange={(v) => {
                                            const o = outfits.find((x) => x.id === v);
                                            if (o) setDraft(clone(o.look));
                                        }}
                                    />
                                ) : null}
                                {notice ? <Notice>{notice}</Notice> : null}
                            </>
                        ) : null
                    }
                />
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
                    { label: "Apply", variant: "primary", onSelect: () => { const p = pending!; perform(p, apply()); } },
                    { label: "Discard", onSelect: () => { const p = pending!; discard(); perform(p); } },
                    { label: "Keep editing", variant: "ghost", onSelect: () => setPending(null) },
                ]}
            />
        </div>
    );
}
