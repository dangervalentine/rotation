import { useState } from "react";
import { Button, Field, LookCard, Notice, SectionHead } from "../design-system/index.ts";
import { clone, EMPTY_LOOK, same, shuffleLook, uniqueId } from "../lib/model.ts";
import type { Look, Outfit, WardrobeData } from "../lib/types.ts";
import { lookPieces, OutfitFigure } from "./common.tsx";
import { LookEditor } from "./LookEditor.tsx";

/** Saved outfit library plus a mix-and-match workspace. */
export function OutfitsView({ data, setData }: { data: WardrobeData; setData: (d: WardrobeData) => void }) {
  const { items, outfits } = data;
  const [editing, setEditing] = useState<string | null>(null);
  const [look, setLook] = useState<Look>(() => shuffleLook(items, clone(EMPTY_LOOK)));
  const [name, setName] = useState("");
  const base = outfits.find((o) => o.id === editing) || null;
  const dirty = base ? !same(base.look, look) || base.name !== name : true;

  function edit(o: Outfit) {
    setEditing(o.id);
    setLook(clone(o.look));
    setName(o.name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function saveNew() {
    const n = name.trim() || `Outfit ${outfits.length + 1}`;
    const id = uniqueId(n, outfits);
    setData({ ...data, outfits: [...outfits, { id, name: n, look: clone(look) }] });
    setEditing(id);
    setName(n);
  }
  function saveExisting() {
    setData({ ...data, outfits: outfits.map((o) => (o.id === editing ? { ...o, name: name.trim() || o.name, look: clone(look) } : o)) });
  }
  function remove(id: string) {
    setData({ ...data, outfits: outfits.filter((o) => o.id !== id) });
    if (id === editing) setEditing(null);
  }
  function duplicate(o: Outfit) {
    const n = o.name + " copy";
    setData({ ...data, outfits: [...outfits, { id: uniqueId(n, outfits), name: n, look: clone(o.look) }] });
  }
  function rename(id: string, n: string) {
    setData({ ...data, outfits: outfits.map((o) => (o.id === id ? { ...o, name: n } : o)) });
  }

  return (
    <div className="view">
      <section aria-labelledby="mm-h">
        <SectionHead
          id="mm-h"
          number={2}
          kicker={base ? <>Editing {base.name}</> : "Workspace"}
          title="Mix and match"
          aside={<span className="lede">{base ? "Change the pieces, then save." : "Build a look, then save it to your outfits."}</span>}
        />
        {items.length ? null : (
          <Notice tone="neutral">
            No pieces yet. Start in <a href="#wardrobe">Wardrobe &amp; costs</a>.
          </Notice>
        )}
        <LookEditor items={items} look={look} onChange={setLook} />
        <div className="actions">
          <Field className="f-name" label="Name" value={name} placeholder="Rainy Monday" onChange={(e) => setName(e.target.value)} />
          {base ? (
            <Button variant="primary" onClick={saveExisting} disabled={!dirty}>Save changes to {base.name}</Button>
          ) : null}
          <Button variant={base ? "secondary" : "primary"} onClick={saveNew}>Save as new outfit</Button>
          {base ? (
            <Button variant="ghost" onClick={() => { setEditing(null); setName(""); }}>Stop editing</Button>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="lib-h">
        <SectionHead
          id="lib-h"
          kicker={`${outfits.length} saved`}
          title="The lookbook"
          aside={<span className="lede">Wear them from the Rotation tab with “Wear a saved outfit”.</span>}
        />
        {outfits.length ? (
          <div className="look-grid">
            {outfits.map((o, i) => (
              <LookCard
                key={o.id}
                number={i + 1}
                selected={o.id === editing}
                kicker={o.id === editing ? "Editing" : "Look"}
                name={<input value={o.name} aria-label="Outfit name" onChange={(e) => rename(o.id, e.target.value)} />}
                figure={<OutfitFigure items={items} look={o.look} />}
                pieces={lookPieces(items, o.look)}
              >
                <Button size="sm" onClick={() => edit(o)}>Edit</Button>
                <Button size="sm" onClick={() => duplicate(o)}>Duplicate</Button>
                <Button size="sm" variant="danger" onClick={() => remove(o.id)}>Delete</Button>
              </LookCard>
            ))}
          </div>
        ) : (
          <p className="empty">No looks yet. Shuffle a few pieces above and save the one you’d wear.</p>
        )}
      </section>
    </div>
  );
}
