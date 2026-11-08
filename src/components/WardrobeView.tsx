import React, { useMemo, useRef, useState } from "react";
import { CATEGORIES, clone, daysWorn, migrate, money, SLOTS, STYLES, uniqueId, wardrobeTotals } from "../lib/model.ts";
import type { ProductGuess } from "../lib/productParse.ts";
import type { Backend } from "../lib/storage.ts";
import { downloadJson, sampleData } from "../lib/storage.ts";
import type { Category, Item, WardrobeData } from "../lib/types.ts";
import { Select, Swatch } from "./common.tsx";

type Draft = Omit<Item, "id"> & { id?: string; stripeOn: boolean; stripe: string };
type Editing = { isNew: boolean; item: Partial<Item> } | null;

const BLANK: Partial<Item> = { cat: "shirt", name: "", style: "oxford", color: "#9fb3cc", price: 0, qty: 1, owned: false, link: "" };

function ItemForm({ initial, isNew, note, onSave, onCancel, onDelete }: { initial: Partial<Item>; isNew: boolean; note?: string; onSave: (i: Omit<Item, "id">) => void; onCancel: () => void; onDelete: () => void }) {
  const [f, setF] = useState<Draft>(() => ({ ...(BLANK as Item), ...initial, stripeOn: !!initial.stripe, stripe: initial.stripe || "#7d9bc6" }));
  const [err, setErr] = useState("");
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setF((p) => ({ ...p, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setErr("Enter a name for the item.");
    const out: Omit<Item, "id"> = {
      cat: f.cat,
      name: f.name.trim(),
      style: f.style,
      color: f.color,
      price: parseFloat(String(f.price)) || 0,
      qty: Math.max(1, parseInt(String(f.qty), 10) || 1),
      owned: !!f.owned,
    };
    if (f.stripeOn) out.stripe = f.stripe;
    for (const k of ["link", "image", "brand", "notes"] as const) {
      const v = (f[k] || "").trim();
      if (v) out[k] = v;
    }
    onSave(out);
  }

  return (
    <form className="edit" onSubmit={submit} noValidate>
      {note ? <p className="hint full" style={{ gridColumn: "1/-1", margin: 0 }}>{note}</p> : null}
      {f.image ? (
        <div className="preview">
          <img src={f.image} alt="" referrerPolicy="no-referrer" />
          <span>Photo from the product page. Pick the swatch color below to match it.</span>
        </div>
      ) : null}
      <Select id="f-cat" label="Category" value={f.cat} options={CATEGORIES.map(([v, l]) => ({ value: v, label: l }))} onChange={(c) => setF((p) => ({ ...p, cat: c as Category, style: STYLES[c as Category][0] }))} />
      <div className="field full">
        <label htmlFor="f-name">Name</label>
        <input id="f-name" value={f.name} onChange={(e) => { set("name", e.target.value); setErr(""); }} autoFocus />
      </div>
      <Select id="f-style" label="Style" value={STYLES[f.cat].includes(f.style) ? f.style : STYLES[f.cat][0]} options={STYLES[f.cat].map((s) => ({ value: s, label: s }))} onChange={(s) => set("style", s)} />
      <div className="field">
        <label htmlFor="f-brand">Brand</label>
        <input id="f-brand" value={f.brand || ""} onChange={(e) => set("brand", e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="f-color">Color</label>
        <input type="color" id="f-color" value={f.color} onChange={(e) => set("color", e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="f-stripeon">Stripe</label>
        <div className="inline">
          <input type="checkbox" id="f-stripeon" checked={f.stripeOn} onChange={(e) => set("stripeOn", e.target.checked)} />
          <input type="color" aria-label="Stripe color" value={f.stripe} disabled={!f.stripeOn} onChange={(e) => set("stripe", e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="f-price">Price ($)</label>
        <input id="f-price" type="number" min="0" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value as unknown as number)} />
      </div>
      <div className="field">
        <label htmlFor="f-qty">Qty</label>
        <input id="f-qty" type="number" min="1" step="1" value={f.qty} onChange={(e) => set("qty", e.target.value as unknown as number)} />
      </div>
      <div className="field">
        <label htmlFor="f-owned">Owned</label>
        <input id="f-owned" type="checkbox" checked={!!f.owned} onChange={(e) => set("owned", e.target.checked)} />
      </div>
      <div className="field full">
        <label htmlFor="f-link">Link</label>
        <input id="f-link" type="url" value={f.link || ""} onChange={(e) => set("link", e.target.value)} />
      </div>
      <div className="field full">
        <label htmlFor="f-image">Image URL</label>
        <input id="f-image" type="url" value={f.image || ""} onChange={(e) => set("image", e.target.value)} />
      </div>
      <div className="field full">
        <label htmlFor="f-notes">Notes</label>
        <textarea id="f-notes" value={f.notes || ""} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div className="actions full">
        <button className="btn primary" type="submit">{isNew ? "Add item" : "Save item"}</button>
        <button className="btn" type="button" onClick={onCancel}>Cancel</button>
        {isNew ? null : <button className="btn danger" type="button" onClick={onDelete}>Delete item</button>}
        {err ? <span className="err" role="alert">{err}</span> : null}
      </div>
    </form>
  );
}

export function WardrobeView({ data, setData, backend }: { data: WardrobeData; setData: (d: WardrobeData) => void; backend: Backend }) {
  const { items, rotation: rot } = data;
  const [editing, setEditing] = useState<Editing>(null);
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const totals = useMemo(() => wardrobeTotals(items), [items]);

  function save(it: Omit<Item, "id">) {
    const nextItems = clone(items);
    const looks = clone(rot.looks);
    const outfits = clone(data.outfits);
    if (editing!.isNew) {
      nextItems.push({ id: uniqueId(it.name, nextItems), ...it });
    } else {
      const old = nextItems.find((x) => x.id === editing!.item.id)!;
      // Moving an item to another category takes it out of outfits that used it in the old slot.
      if (old.cat !== it.cat) {
        for (const l of [...looks, ...outfits.map((o) => o.look)]) if ((l as any)[old.cat] === old.id) (l as any)[old.cat] = null;
      }
      Object.keys(old).forEach((k) => delete (old as any)[k]);
      Object.assign(old, { id: editing!.item.id }, it);
    }
    setData({ ...data, items: nextItems, rotation: { ...rot, looks }, outfits });
    setEditing(null);
  }
  function remove() {
    const id = editing!.item.id!;
    const clear = (l: any) => SLOTS.forEach(([s]) => { if (l[s] === id) l[s] = null; });
    const looks = clone(rot.looks); looks.forEach(clear);
    const outfits = clone(data.outfits); outfits.forEach((o) => clear(o.look));
    setData({ ...data, items: items.filter((i) => i.id !== id), rotation: { ...rot, looks }, outfits });
    setEditing(null);
  }
  async function fromUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    try {
      const { guess, fetched } = await backend.importUrl(url.trim());
      const g: ProductGuess = guess;
      setEditing({ isNew: true, item: { ...BLANK, ...g, link: url.trim() } });
      setNote(
        fetched
          ? "Filled in from the product page. Check the details, then add it."
          : backend.kind === "browser"
            ? "Guessed from the link text. The published version can't open other sites, so check the details."
            : "Couldn't read that page, so these are guesses from the link text. Check the details.",
      );
      setUrl("");
    } finally {
      setBusy(false);
    }
  }
  async function importFile(file: File) {
    try {
      const next = migrate(JSON.parse(await file.text()));
      setData({ ...next, savedAt: data.savedAt });
      setMsg(`Loaded ${next.items.length} items from ${file.name}. Save to keep them.`);
    } catch (e) {
      setMsg("That file isn't a wardrobe file: " + String((e as Error).message));
    }
  }

  return (
    <div className="ward">
      <div className="stats">
        <div className="stat"><b>{money(totals.all)}</b><span>Whole wardrobe, {totals.pieces} pieces</span></div>
        <div className="stat"><b>{money(totals.own)}</b><span>Already owned</span></div>
        <div className="stat"><b>{money(totals.all - totals.own)}</b><span>Left to buy</span></div>
      </div>

      <section className="panel" aria-labelledby="w-h">
        <div className="panel-head">
          <h2 id="w-h">Wardrobe and costs</h2>
          <button className="btn primary" onClick={() => { setNote(""); setEditing({ isNew: true, item: BLANK }); }}>Add an item</button>
        </div>
        <form className="urlbar" onSubmit={fromUrl}>
          <input type="url" placeholder="Paste a product link to fill in an item" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Product link" />
          <button className="btn" type="submit" disabled={busy || !url.trim()}>{busy ? "Reading…" : "Add from link"}</button>
        </form>
        {editing ? (
          <ItemForm key={editing.item.id || "new:" + (editing.item.link || "")} initial={editing.item} isNew={editing.isNew} note={note} onSave={save} onCancel={() => setEditing(null)} onDelete={remove} />
        ) : null}
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Item</th><th>Style</th><th className="num">Price</th><th className="num">Qty</th><th className="num">Subtotal</th><th className="num">Days worn</th><th>Owned</th>
                <th><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(([cat, label]) => {
                const rows = items.filter((i) => i.cat === cat);
                const t = totals.by[cat] || { t: 0, o: 0, n: 0 };
                return (
                  <React.Fragment key={cat}>
                    <tr className="cat"><td colSpan={8}>{label}</td></tr>
                    {rows.map((it) => (
                      <tr key={it.id}>
                        <td>
                          <span className="namecell">
                            {it.image ? <img className="thumb" src={it.image} alt="" referrerPolicy="no-referrer" /> : null}
                            <Swatch it={it} />
                            {it.link ? <a href={it.link} target="_blank" rel="noopener">{it.name}</a> : it.name}
                          </span>
                        </td>
                        <td>{it.style}</td>
                        <td className="num">{money(it.price)}</td>
                        <td className="num">{it.qty}</td>
                        <td className="num">{money(it.price * it.qty)}</td>
                        <td className="num">{cat === "other" ? "" : daysWorn(rot, it.id)}</td>
                        <td>
                          <input type="checkbox" checked={!!it.owned} aria-label={"Owned: " + it.name} onChange={(e) => setData({ ...data, items: items.map((x) => (x.id === it.id ? { ...x, owned: e.target.checked } : x)) })} />
                        </td>
                        <td><button className="btn small" onClick={() => { setNote(""); setEditing({ isNew: false, item: clone(it) }); }}>Edit</button></td>
                      </tr>
                    ))}
                    <tr className="tot">
                      <td>{label} total</td><td /><td />
                      <td className="num">{t.n}</td>
                      <td className="num">{money(t.t)}</td>
                      <td />
                      <td colSpan={2} className="muted">{t.o ? money(t.o) + " owned" : ""}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" aria-labelledby="d-h">
        <div className="panel-head">
          <h2 id="d-h">Your data</h2>
          <span className="hint">
            {backend.kind === "file" ? <>Saving to <b>data/wardrobe.json</b> on this computer.</> : <>Saving in <b>this browser</b>. Export a copy to move it to another device.</>}
          </span>
        </div>
        <div className="datarow">
          <button className="btn" onClick={() => downloadJson(data)}>Export JSON</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Import JSON</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ""; }} />
          <button className="btn" onClick={() => { setData({ ...sampleData(), savedAt: data.savedAt }); setMsg("Loaded the sample wardrobe. Save to keep it."); }}>Load sample wardrobe</button>
          <button className="btn danger" onClick={() => { setData({ ...data, items: [], outfits: [], rotation: { ...rot, looks: rot.looks.map(() => ({ layer: null, shirt: null, belt: null, pants: null, shoes: null })) } }); setMsg("Cleared. Save to keep the empty wardrobe, or discard to undo."); }}>Start empty</button>
          {msg ? <span className="hint" role="status">{msg}</span> : null}
        </div>
      </section>
    </div>
  );
}
