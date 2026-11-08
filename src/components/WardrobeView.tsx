import React, { useMemo, useRef, useState } from "react";
import { Button, Check, Field, GarmentCard, Kicker, Notice, Segmented, SectionHead, Select, Stat, TextArea } from "../design-system/index.ts";
import { CATEGORIES, clone, daysWorn, migrate, money, shortName, SLOTS, STYLES, uniqueId, wardrobeTotals } from "../lib/model.ts";
import type { ProductGuess } from "../lib/productParse.ts";
import type { Backend } from "../lib/storage.ts";
import { downloadJson, sampleData } from "../lib/storage.ts";
import type { Category, Item, WardrobeData } from "../lib/types.ts";
import { Swatch } from "./common.tsx";

/** Whole dollars for headline figures ("$2,885"). */
const dollars = (n: number) => "$" + Math.round(n || 0).toLocaleString("en-US");

/** Brand from a name like "Uniqlo white oxford", when the item has no brand field. */
const brandOf = (it: Item) => (it.name !== shortName(it) ? it.name.slice(0, it.name.length - shortName(it).length).trim() : undefined);

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
      <div className="edit-head full">
        <Kicker tone="accent">{isNew ? "New item" : "Edit item"}</Kicker>
        {note ? <p className="lede">{note}</p> : null}
      </div>
      {f.image ? (
        <div className="preview full">
          <img src={f.image} alt="" referrerPolicy="no-referrer" />
          <span className="lede">Photo from the product page. Pick the swatch colour below to match it.</span>
        </div>
      ) : null}
      <Field className="full" id="f-name" label="Name" placeholder="Charcoal flannel trousers" value={f.name} error={err || undefined} hint="Colour, cut, type." onChange={(e) => { set("name", e.target.value); setErr(""); }} autoFocus />
      <Select id="f-cat" label="Category" value={f.cat} options={CATEGORIES.map(([v, l]) => ({ value: v, label: l }))} onChange={(c) => setF((p) => ({ ...p, cat: c as Category, style: STYLES[c as Category][0] }))} />
      <Select id="f-style" label="Style" value={STYLES[f.cat].includes(f.style) ? f.style : STYLES[f.cat][0]} options={STYLES[f.cat].map((s) => ({ value: s, label: s }))} onChange={(s) => set("style", s)} />
      <Field id="f-brand" label="Brand" value={f.brand || ""} onChange={(e) => set("brand", e.target.value)} />
      <div className="colors">
        <Field id="f-color" type="color" label="Colour" value={f.color} onChange={(e) => set("color", e.target.value)} />
        <Field
          id="f-stripe"
          type="color"
          label="Stripe"
          value={f.stripe}
          disabled={!f.stripeOn}
          onChange={(e) => set("stripe", e.target.value)}
          extra={<Check className="rt-check-sm" label="On" checked={f.stripeOn} onChange={(e) => set("stripeOn", e.target.checked)} />}
        />
      </div>
      <Field id="f-price" label="Price ($)" type="number" min="0" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value as unknown as number)} />
      <Field id="f-qty" label="Qty" type="number" min="1" step="1" value={f.qty} onChange={(e) => set("qty", e.target.value as unknown as number)} />
      <div className="rt-field">
        <span className="rt-field-label">Status</span>
        <Check label="I own this" checked={!!f.owned} onChange={(e) => set("owned", e.target.checked)} />
      </div>
      <Field className="full" id="f-link" label="Link" type="url" value={f.link || ""} onChange={(e) => set("link", e.target.value)} />
      <Field className="full" id="f-image" label="Image URL" type="url" value={f.image || ""} onChange={(e) => set("image", e.target.value)} />
      <TextArea className="full" id="f-notes" label="Notes" value={f.notes || ""} onChange={(e) => set("notes", e.target.value)} />
      <div className="actions full">
        <Button variant="primary" type="submit">{isNew ? "Add item" : "Save item"}</Button>
        <Button onClick={onCancel}>Cancel</Button>
        {isNew ? null : <Button variant="danger" onClick={onDelete}>Delete item</Button>}
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
  const [layout, setLayout] = useState<"table" | "cards">("table");
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

  const editItem = (it: Item) => { setNote(""); setEditing({ isNew: false, item: clone(it) }); };
  const toBuy = totals.all - totals.own;

  return (
    <div className="view">
      <div className="stats">
        <Stat value={dollars(totals.all)} label="Whole wardrobe" note={`${totals.pieces} pieces`} />
        <Stat value={dollars(totals.own)} label="Already owned" note={totals.all ? `${Math.round((totals.own / totals.all) * 100)}% of the total` : undefined} />
        <Stat value={dollars(toBuy)} label="Left to buy" note={toBuy ? `${items.filter((i) => !i.owned).length} items on the list` : "Nothing left to buy"} />
      </div>

      <section aria-labelledby="w-h">
        <SectionHead
          id="w-h"
          kicker="Inventory"
          title="Wardrobe & costs"
          aside={
            <>
              <Segmented label="Show as" options={[["table", "Table"], ["cards", "Cards"]]} value={layout} onChange={setLayout} />
              <Button variant="primary" onClick={() => { setNote(""); setEditing({ isNew: true, item: BLANK }); }}>Add an item</Button>
            </>
          }
        />
        <form className="urlbar" onSubmit={fromUrl}>
          <Field type="url" label="Add from a product link" placeholder="Paste a link to fill in an item" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button type="submit" disabled={busy || !url.trim()}>{busy ? "Reading…" : "Add from link"}</Button>
        </form>
        {editing ? (
          <ItemForm key={editing.item.id || "new:" + (editing.item.link || "")} initial={editing.item} isNew={editing.isNew} note={note} onSave={save} onCancel={() => setEditing(null)} onDelete={remove} />
        ) : null}
        {layout === "cards" ? (
          CATEGORIES.map(([cat, label]) => {
            const rows = items.filter((i) => i.cat === cat);
            if (!rows.length) return null;
            return (
              <div className="card-group" key={cat}>
                <Kicker tone="ink">{label} · {rows.length}</Kicker>
                <div className="garment-grid">
                  {rows.map((it) => (
                    <GarmentCard
                      key={it.id}
                      category={it.cat}
                      name={shortName(it)}
                      style={it.style}
                      brand={it.brand || brandOf(it)}
                      color={it.color}
                      stripe={it.stripe}
                      image={it.image}
                      price={money(it.price)}
                      qty={it.qty}
                      owned={!!it.owned}
                      worn={cat === "other" ? undefined : daysWorn(rot, it.id)}
                      onSelect={() => editItem(it)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
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
                          <td className="muted">{it.style}</td>
                          <td className="num">{money(it.price)}</td>
                          <td className="num">{it.qty}</td>
                          <td className="num">{money(it.price * it.qty)}</td>
                          <td className="num">{cat === "other" ? "" : daysWorn(rot, it.id)}</td>
                          <td>
                            <input className="rt-checkbox" type="checkbox" checked={!!it.owned} aria-label={"Owned: " + it.name} onChange={(e) => setData({ ...data, items: items.map((x) => (x.id === it.id ? { ...x, owned: e.target.checked } : x)) })} />
                          </td>
                          <td className="num"><Button variant="ghost" size="sm" onClick={() => editItem(it)}>Edit</Button></td>
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
        )}
      </section>

      <section aria-labelledby="d-h">
        <SectionHead
          id="d-h"
          level={3}
          kicker="Housekeeping"
          title="Your data"
          aside={
            <span className="lede">
              {backend.kind === "file" ? <>Saving to <b>data/wardrobe.json</b> on this computer.</> : <>Saving in <b>this browser</b>. Export a copy to move it to another device.</>}
            </span>
          }
        />
        <div className="actions">
          <Button onClick={() => downloadJson(data)}>Export JSON</Button>
          <Button onClick={() => fileRef.current?.click()}>Import JSON</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ""; }} />
          <Button variant="ghost" onClick={() => { setData({ ...sampleData(), savedAt: data.savedAt }); setMsg("Loaded the sample wardrobe. Save to keep it."); }}>Load sample wardrobe</Button>
          <Button variant="danger" onClick={() => { setData({ ...data, items: [], outfits: [], rotation: { ...rot, looks: rot.looks.map(() => ({ layer: null, shirt: null, belt: null, pants: null, shoes: null })) } }); setMsg("Cleared. Save to keep the empty wardrobe, or discard to undo."); }}>Start empty</Button>
        </div>
        {msg ? <Notice tone="neutral">{msg}</Notice> : null}
      </section>
    </div>
  );
}
