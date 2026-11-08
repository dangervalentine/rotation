import { useState } from "react";
import { findItem, OPTIONAL_SLOTS, shortName, shuffleLook, SLOTS, variations } from "../lib/model.ts";
import type { Item, Look, Slot } from "../lib/types.ts";
import { OutfitFigure, Select } from "./common.tsx";

const NONE = "__none";

/** Figure + one picker per slot, with shuffle (respecting locks) and a strip of one-slot variations. */
export function LookEditor({ items, look, onChange }: { items: Item[]; look: Look; onChange: (l: Look) => void }) {
  const [locked, setLocked] = useState<Partial<Record<Slot, boolean>>>({});
  const [vary, setVary] = useState<Slot>("shirt");
  const vars = variations(items, look, vary);

  return (
    <>
      <div className="builder-grid">
        <OutfitFigure items={items} look={look} width={170} />
        <div className="fields">
          {SLOTS.map(([slot, label]) => {
            const opts = items.filter((i) => i.cat === slot).map((i) => ({ value: i.id, label: shortName(i), swatch: i as Item | null }));
            if (OPTIONAL_SLOTS[slot]) opts.unshift({ value: NONE, label: "None", swatch: null });
            return (
              <Select
                key={slot}
                id={"slot-" + slot}
                label={label}
                value={look[slot] || NONE}
                options={opts}
                onChange={(v) => onChange({ ...look, [slot]: v === NONE ? null : v })}
                extra={
                  <label className="lock" title="Keep this piece when shuffling">
                    <input type="checkbox" checked={!!locked[slot]} onChange={(e) => setLocked({ ...locked, [slot]: e.target.checked })} />
                    keep
                  </label>
                }
              />
            );
          })}
          <div className="actions full" style={{ marginTop: 0 }}>
            <button className="btn" onClick={() => onChange(shuffleLook(items, look, locked))}>
              Shuffle unkept pieces
            </button>
          </div>
        </div>
      </div>

      <div className="panel-head" style={{ marginTop: 18, marginBottom: 6 }}>
        <span className="hint">Try every</span>
        <div className="seg" role="group" aria-label="Piece to vary">
          {SLOTS.map(([slot, label]) => (
            <button key={slot} className={slot === vary ? "on" : ""} aria-pressed={slot === vary} onClick={() => setVary(slot)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {vars.length ? (
        <div className="var-strip">
          {vars.map((v) => (
            <button key={v.id || NONE} className={"var" + (look[vary] === v.id ? " on" : "")} onClick={() => onChange(v.look)}>
              <OutfitFigure items={items} look={v.look} width={70} />
              <span>{v.id ? shortName(findItem(items, v.id)) : "None"}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="hint">No items in this category yet. Add some on the Wardrobe tab.</p>
      )}
    </>
  );
}
