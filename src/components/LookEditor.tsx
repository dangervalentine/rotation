import { useState } from "react";
import { Button, Check, Kicker, Segmented, Select } from "../design-system/index.ts";
import { findItem, OPTIONAL_SLOTS, shortName, shuffleLook, SLOTS, variations } from "../lib/model.ts";
import type { Item, Look, Slot } from "../lib/types.ts";
import { itemOption, OutfitFigure } from "./common.tsx";

const NONE = "__none";

/** Figure + one picker per slot, with shuffle (respecting locks) and a strip of one-slot variations. */
export function LookEditor({ items, look, onChange }: { items: Item[]; look: Look; onChange: (l: Look) => void }) {
  const [locked, setLocked] = useState<Partial<Record<Slot, boolean>>>({});
  const [vary, setVary] = useState<Slot>("shirt");
  const vars = variations(items, look, vary);

  return (
    <>
      <div className="builder-grid">
        <div className="builder-figure">
          <OutfitFigure items={items} look={look} />
        </div>
        <div className="fields">
          {SLOTS.map(([slot, label]) => {
            const opts = items.filter((i) => i.cat === slot).map(itemOption);
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
                  <Check
                    className="rt-check-sm"
                    label="Keep"
                    title="Keep this piece when shuffling"
                    checked={!!locked[slot]}
                    onCheckedChange={(v) => setLocked({ ...locked, [slot]: v })}
                  />
                }
              />
            );
          })}
          <div className="full">
            <Button onClick={() => onChange(shuffleLook(items, look, locked))}>Shuffle unkept pieces</Button>
          </div>
        </div>
      </div>

      <div className="try-head">
        <Kicker tone="ink">Try every</Kicker>
        <Segmented label="Piece to vary" options={SLOTS} value={vary} onChange={setVary} />
      </div>
      {vars.length ? (
        <div className="var-strip">
          {vars.map((v) => (
            <button key={v.id || NONE} className="var" aria-pressed={look[vary] === v.id} onClick={() => onChange(v.look)}>
              <OutfitFigure items={items} look={v.look} width={64} />
              <span>{v.id ? shortName(findItem(items, v.id)) : "None"}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="lede">No items in this category yet. Add some on the Wardrobe tab.</p>
      )}
    </>
  );
}
