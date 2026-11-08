import { useState } from "react";
import { clone, EMPTY_LOOK, findItem, same, shortName, shuffleLook, uniqueId } from "../lib/model.ts";
import type { Look, Outfit, WardrobeData } from "../lib/types.ts";
import { OutfitFigure } from "./common.tsx";
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
    <div className="rot-layout">
      <section className="panel" aria-labelledby="mm-h">
        <div className="panel-head">
          <h2 id="mm-h">Mix and match</h2>
          <span className="hint">{base ? <>Editing <b>{base.name}</b></> : "Build a look, then save it to your outfits."}</span>
        </div>
        <LookEditor items={items} look={look} onChange={setLook} />
        <div className="actions">
          <div className="toolbar">
            <label>
              Name
              <input type="text" value={name} placeholder="e.g. Rainy Monday" onChange={(e) => setName(e.target.value)} />
            </label>
          </div>
          {base ? (
            <button className="btn primary" onClick={saveExisting} disabled={!dirty}>Save changes to {base.name}</button>
          ) : null}
          <button className={"btn" + (base ? "" : " primary")} onClick={saveNew}>Save as new outfit</button>
          {base ? (
            <button className="btn ghost" onClick={() => { setEditing(null); setName(""); }}>Stop editing</button>
          ) : null}
        </div>
      </section>

      <section className="panel" aria-labelledby="lib-h">
        <div className="panel-head">
          <h2 id="lib-h">Saved outfits</h2>
          <span className="hint">{outfits.length} saved. Use them from the Rotation tab with “Wear a saved outfit”.</span>
        </div>
        {outfits.length ? (
          <div className="outfit-grid">
            {outfits.map((o) => (
              <article key={o.id} className="outfit-card">
                <input className="name" value={o.name} aria-label="Outfit name" onChange={(e) => rename(o.id, e.target.value)} />
                <OutfitFigure items={items} look={o.look} width={110} />
                <ul>
                  {(["layer", "shirt", "pants", "shoes"] as const).map((s) => (o.look[s] ? <li key={s}>{shortName(findItem(items, o.look[s]))}</li> : null))}
                </ul>
                <div className="actions" style={{ marginTop: 4 }}>
                  <button className="btn small" onClick={() => edit(o)}>Edit</button>
                  <button className="btn small" onClick={() => duplicate(o)}>Duplicate</button>
                  <button className="btn small danger" onClick={() => remove(o.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No saved outfits yet. Build one above and save it.</p>
        )}
      </section>
    </div>
  );
}
