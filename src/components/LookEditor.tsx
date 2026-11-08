import { useEffect, useRef, useState } from "react";
import { Button, Check, Kicker, Segmented, Select, Tag } from "../design-system/index.ts";
import { canRedo, canUndo, initHistory, push, redo, undo, type History } from "../lib/history.ts";
import { canShuffle, findItem, OPTIONAL_SLOTS, same, shortName, shuffleLook, SLOTS, sortForPicker, variations } from "../lib/model.ts";
import { itemStatus, STATUS_LABEL } from "../lib/sketch.ts";
import type { Item, Look, Slot } from "../lib/types.ts";
import { itemOption, OutfitFigure } from "./common.tsx";
import { SketchCreator } from "./SketchCreator.tsx";

const NONE = "__none";
const CREATE = "__create";
const DRAFT = "__draft";
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface LookEditorProps {
  items: Item[];
  /** The committed look, controlled by the host. */
  look: Look;
  /** Every committed change: pick, shuffle, variation, undo/redo, sketch insert. Never previews. */
  onChange: (l: Look) => void;
  /** Add a sketch to the wardrobe and return its id. Called before onChange selects it. */
  onCreateItem: (it: Omit<Item, "id">) => string;
  /** Undo history starts over when this changes (another outfit or day). */
  historyKey: string;
  /** True while the piece creator is open, so the host can demote its own primary button. */
  onCreatingChange?: (creating: boolean) => void;
  /** Narrow layout for the Rotation day panel. */
  compact?: boolean;
}

const isTextField = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && !["checkbox", "radio", "button", "color", "file"].includes((t as HTMLInputElement).type)));

/** Figure + a styled list of pieces, with sketching, shuffle (respecting keeps), undo/redo and one-slot variations. */
export function LookEditor({ items, look, onChange, onCreateItem, historyKey, onCreatingChange, compact }: LookEditorProps) {
  // History follows the host's look: a new key starts over; any other outside change (wear an outfit,
  // copy the previous day) is recorded so it can be undone too.
  const [hist, setHist] = useState<{ key: string; h: History<Look> }>(() => ({ key: historyKey, h: initHistory(look) }));
  let h = hist.h;
  if (hist.key !== historyKey) {
    h = initHistory(look);
    setHist({ key: historyKey, h });
  } else if (!same(look, h.present)) {
    h = push(h, look);
    setHist({ key: historyKey, h });
  }
  const present = h.present;

  const [locked, setLocked] = useState<Partial<Record<Slot, boolean>>>({});
  const [vary, setVary] = useState<Slot>("shirt");
  const [preview, setPreview] = useState<{ slot: Slot; id: string | null } | null>(null);
  const [creating, setCreating] = useState<{ slot: Slot; draft: Omit<Item, "id"> | null } | null>(null);
  const [changed, setChanged] = useState<{ slots: Slot[]; seq: number }>({ slots: [], seq: 0 });
  const [status, setStatus] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const isCreating = creating !== null;
  useEffect(() => { onCreatingChange?.(isCreating); }, [isCreating]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => onCreatingChange?.(false), []); // eslint-disable-line react-hooks/exhaustive-deps

  function commit(next: Look, message = "") {
    const slots = SLOTS.map(([s]) => s).filter((s) => present[s] !== next[s]);
    setHist({ key: historyKey, h: push(h, next) });
    setChanged((c) => ({ slots, seq: c.seq + 1 }));
    setPreview(null);
    setStatus(message);
    onChange(next);
  }
  function step(dir: "undo" | "redo") {
    const nh = dir === "undo" ? undo(h) : redo(h);
    if (nh === h) return;
    setHist({ key: historyKey, h: nh });
    setChanged((c) => ({ slots: SLOTS.map(([s]) => s).filter((s) => present[s] !== nh.present[s]), seq: c.seq + 1 }));
    setStatus(dir === "undo" ? "Undone" : "Redone");
    onChange(nh.present);
  }
  function shuffle() {
    if (!canShuffle(items, locked)) return setStatus("Nothing left to shuffle");
    commit(shuffleLook(items, present, locked), "Shuffled");
  }
  const focusSlot = (slot: Slot) => requestAnimationFrame(() => document.getElementById("slot-" + slot)?.focus());
  function openCreator(slot: Slot) {
    setPreview(null);
    setCreating({ slot, draft: null });
  }
  function confirmSketch(it: Omit<Item, "id">) {
    const slot = creating!.slot;
    const id = onCreateItem(it);
    setCreating(null);
    commit({ ...present, [slot]: id }, `Added ${it.name}`);
    focusSlot(slot);
  }
  function cancelSketch() {
    const slot = creating!.slot;
    setCreating(null);
    focusSlot(slot);
  }

  // What the figure shows: the committed look, with a sketch in progress or a highlighted option on top.
  let figItems = items;
  let figLook = present;
  if (creating?.draft) {
    figItems = [...items, { id: DRAFT, ...creating.draft }];
    figLook = { ...present, [creating.slot]: DRAFT };
  } else if (preview) {
    figLook = { ...present, [preview.slot]: preview.id };
  }

  const vars = variations(items, present, vary);
  const varyLabel = SLOTS.find(([s]) => s === vary)![1];

  return (
    <div
      ref={rootRef}
      className={cx("builder", compact && "is-compact", isCreating && "is-creating")}
      onKeyDown={(e) => {
        if (isCreating || !(e.ctrlKey || e.metaKey) || isTextField(e.target)) return;
        const k = e.key.toLowerCase();
        if (k === "z" && !e.shiftKey) { e.preventDefault(); step("undo"); }
        else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); step("redo"); }
      }}
    >
      <div className="builder-grid">
        <div className="builder-figure">
          {/* Keyed on the committed look, so a real change replays the entrance; previews swap instantly. */}
          <div className="builder-figure-art" key={JSON.stringify(present)}>
            <OutfitFigure items={figItems} look={figLook} />
          </div>
          {creating ? <Kicker tone="accent" className="builder-figure-note">Preview</Kicker> : null}
        </div>

        {creating ? (
          <SketchCreator
            key={creating.slot}
            slot={creating.slot}
            items={items}
            onDraftChange={(draft) => setCreating((c) => (c ? { ...c, draft } : c))}
            onConfirm={confirmSketch}
            onCancel={cancelSketch}
          />
        ) : (
          <div className="builder-side">
            <ul className="piece-list" aria-label="Pieces">
              {SLOTS.map(([slot, label]) => {
                const own = sortForPicker(items.filter((i) => i.cat === slot));
                const cur = findItem(items, present[slot]);
                const st = cur ? itemStatus(cur) : null;
                const pulse = changed.slots.includes(slot) ? <span key={changed.seq} className="piece-pulse" aria-hidden="true" /> : null;
                const keep = (
                  <Check
                    className="rt-check-sm"
                    label={<>Keep<span className="sr-only"> {label.toLowerCase()}</span></>}
                    title="Keep this piece when shuffling"
                    checked={!!locked[slot]}
                    onCheckedChange={(v) => setLocked({ ...locked, [slot]: v })}
                  />
                );
                if (!own.length) {
                  return (
                    <li key={slot} className="piece-row is-empty">
                      <div className="piece-empty">
                        <Kicker>{label}</Kicker>
                        <span className="lede">No {label.toLowerCase()} in your wardrobe yet.</span>
                      </div>
                      <Button id={"slot-" + slot} size="sm" onClick={() => openCreator(slot)}>Create a piece</Button>
                      {pulse}
                    </li>
                  );
                }
                const opts = own.map(itemOption);
                if (OPTIONAL_SLOTS[slot]) opts.unshift({ value: NONE, label: "None", swatch: null });
                opts.push({ value: CREATE, label: "Create a piece…", action: true });
                return (
                  <li key={slot} className={cx("piece-row", locked[slot] && "is-kept")}>
                    <Select
                      id={"slot-" + slot}
                      label={label}
                      value={present[slot] || NONE}
                      options={opts}
                      onChange={(v) => commit({ ...present, [slot]: v === NONE ? null : v })}
                      onHighlight={(v) => setPreview(v === null ? null : { slot, id: v === NONE ? null : v })}
                      onAction={() => openCreator(slot)}
                      extra={
                        <span className="piece-extra">
                          {st && st !== "owned" ? <Tag tone={st}>{STATUS_LABEL[st]}</Tag> : null}
                          {keep}
                        </span>
                      }
                    />
                    {pulse}
                  </li>
                );
              })}
            </ul>
            <div className="builder-tools">
              <Button onClick={shuffle}>Shuffle unkept pieces</Button>
              <Button variant="ghost" size="sm" onClick={() => step("undo")} aria-disabled={!canUndo(h)} aria-keyshortcuts="Control+Z Meta+Z">Undo</Button>
              <Button variant="ghost" size="sm" onClick={() => step("redo")} aria-disabled={!canRedo(h)} aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y">Redo</Button>
              <p className="builder-status" role="status">{status}</p>
            </div>
          </div>
        )}
      </div>

      {creating ? null : (
        <>
          <div className="try-head">
            <Kicker tone="ink">Try every</Kicker>
            <Segmented label="Piece to vary" options={SLOTS} value={vary} onChange={setVary} />
          </div>
          {items.some((i) => i.cat === vary) ? (
            <div className="var-strip" role="group" aria-label={"Try every " + varyLabel.toLowerCase()}>
              {vars.map((v) => {
                const it = findItem(items, v.id);
                return (
                  <button key={v.id || NONE} type="button" className="var" aria-pressed={present[vary] === v.id} onClick={() => commit(v.look)}>
                    <OutfitFigure items={items} look={v.look} width={64} />
                    <span>{it ? shortName(it) : "None"}</span>
                    {it?.sketch ? <Tag tone="sketch">Sketch</Tag> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="lede try-empty">
              No {varyLabel.toLowerCase()} to try yet.{" "}
              <Button variant="ghost" size="sm" onClick={() => openCreator(vary)}>Create a piece</Button>
            </p>
          )}
        </>
      )}
    </div>
  );
}
