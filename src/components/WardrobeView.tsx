import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Checkbox, ConfirmDialog, Field, GarmentCard, Kicker, Notice, Segmented, SectionHead, Select, Stat, Tag, TextArea } from "../design-system/index.ts";
import { CATEGORIES, clone, daysWorn, EMPTY_LOOK, isSlot, migrate, money, shortName, SLOTS, STYLES, uniqueId, wardrobeTotals } from "../lib/model.ts";
import type { ProductGuess } from "../lib/productParse.ts";
import { itemHash } from "../lib/route.ts";
import { itemStatus, promote, STATUS_LABEL, type ItemStatus } from "../lib/sketch.ts";
import type { Backend } from "../lib/storage.ts";
import { downloadJson, sampleData } from "../lib/storage.ts";
import { cleanDetails, DETAIL_KEYS, detailOptions, detailsOf } from "../lib/styles.ts";
import type { Category, Item, Look, WardrobeData } from "../lib/types.ts";
import { ItemArt, PageHead, Swatch } from "./common.tsx";
import { DetailFields } from "./DetailFields.tsx";

/** Whole dollars for headline figures ("$2,885"). */
const dollars = (n: number) => "$" + Math.round(n || 0).toLocaleString("en-US");

/** Brand from a name like "Uniqlo white oxford", when the item has no brand field. */
const brandOf = (it: Item) => (it.name !== shortName(it) ? it.name.slice(0, it.name.length - shortName(it).length).trim() : undefined);

type Draft = Omit<Item, "id"> & { id?: string };

/** Take an accessory off a look (in place), dropping the list when it empties. */
function dropAccessory(l: Look, id: string) {
  if (!l.acc) return;
  l.acc = l.acc.filter((a) => a !== id);
  if (!l.acc.length) delete l.acc;
}

type Editing = { isNew: boolean; item: Partial<Item> } | null;

const BLANK: Partial<Item> = { cat: "shirt", name: "", style: "oxford", color: "#9fb3cc", price: 0, qty: 1, owned: false, link: "" };

function ItemForm({ initial, isNew, note, onSave, onCancel, onDelete, cancelLabel = "Cancel" }: { initial: Partial<Item>; isNew: boolean; note?: string; onSave: (i: Omit<Item, "id">) => void; onCancel: () => void; onDelete: () => void; cancelLabel?: string }) {
  const [f, setF] = useState<Draft>(() => ({ ...(BLANK as Item), ...initial }));
  const [err, setErr] = useState("");
  const [status, setStatus] = useState<ItemStatus>(() => itemStatus({ owned: false, ...initial } as Item));
  const statuses: ItemStatus[] = initial.sketch ? ["sketch", "tobuy", "owned"] : ["tobuy", "owned"];
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
      owned: status === "owned",
    };
    if (status === "sketch") out.sketch = true;
    for (const k of ["link", "image", "brand", "notes"] as const) {
      const v = (f[k] || "").trim();
      if (v) out[k] = v;
    }
    // Details the saved style doesn't use (or that match its defaults) aren't stored.
    if (f.stripe) out.stripe = f.stripe;
    for (const k of DETAIL_KEYS) if (f[k] !== undefined) (out as Record<string, unknown>)[k] = f[k];
    onSave(cleanDetails(out));
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
      <Field className="full" id="f-name" label="Name" placeholder="Charcoal flannel trousers" value={f.name} error={err || undefined} hint="Colour, cut, type." onChange={(e) => { set("name", e.target.value); setErr(""); }} autoFocus={isNew} />
      <Select id="f-cat" label="Category" value={f.cat} options={CATEGORIES.map(([v, l]) => ({ value: v, label: l }))} onChange={(c) => setF((p) => ({ ...p, cat: c as Category, style: STYLES[c as Category][0] }))} />
      <Select id="f-style" label="Style" value={STYLES[f.cat].includes(f.style) ? f.style : STYLES[f.cat][0]} options={STYLES[f.cat].map((s) => ({ value: s, label: s }))} onChange={(s) => set("style", s)} />
      <Field id="f-brand" label="Brand" value={f.brand || ""} onChange={(e) => set("brand", e.target.value)} />
      <div className="colors">
        <Field id="f-color" type="color" label="Colour" value={f.color} onChange={(e) => set("color", e.target.value)} />
      </div>
      {detailOptions(f.cat, f.style).length ? (
        <div className="full">
          <DetailFields cat={f.cat} style={f.style} value={f} color={f.color} variant="compact" idPrefix="f" onChange={(patch) => setF((p) => ({ ...p, ...patch }))} />
        </div>
      ) : null}
      <Field id="f-price" label="Price ($)" type="number" min="0" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value as unknown as number)} />
      <Field id="f-qty" label="Qty" type="number" min="1" step="1" value={f.qty} onChange={(e) => set("qty", e.target.value as unknown as number)} />
      <div className="rt-field">
        <span className="rt-field-label">Status</span>
        <Segmented label="Status" options={statuses.map((s) => [s, STATUS_LABEL[s]] as [ItemStatus, string])} value={status} onChange={setStatus} />
      </div>
      <Field className="full" id="f-link" label="Link" type="url" value={f.link || ""} onChange={(e) => set("link", e.target.value)} />
      <Field className="full" id="f-image" label="Image URL" type="url" value={f.image || ""} onChange={(e) => set("image", e.target.value)} />
      <TextArea className="full" id="f-notes" label="Notes" value={f.notes || ""} onChange={(e) => set("notes", e.target.value)} />
      <div className="actions full">
        <Button variant="primary" type="submit">{isNew ? "Add item" : "Save item"}</Button>
        <Button onClick={onCancel}>{cancelLabel}</Button>
        {isNew ? null : <Button variant="danger" onClick={onDelete}>Delete item</Button>}
      </div>
    </form>
  );
}

/** The item's shop page, opened in a new tab. Nothing when the item has no link. */
function ShopLink({ it }: { it: Item }) {
  if (!it.link) return null;
  return (
    <a className="rt-btn rt-btn-ghost rt-btn-sm" href={it.link} target="_blank" rel="noopener noreferrer" aria-label={`${it.name} at the shop (opens in a new tab)`}>
      Shop ↗
    </a>
  );
}

const usesItem = (l: Look, id: string) => SLOTS.some(([s]) => l[s] === id) || !!l.acc?.includes(id);

/** One piece on its own page: the plate and its facts, then the editor. */
function ItemDetail({ it, data, onSave, onDelete, promoteButtons }: { it: Item; data: WardrobeData; onSave: (i: Omit<Item, "id">) => void; onDelete: () => void; promoteButtons: (it: Item) => React.ReactNode }) {
  // Bumped to reset the form: after a save (so it shows what was stored) or on Undo edits.
  const [rev, setRev] = useState(0);
  const status = itemStatus(it);
  const brand = it.brand || brandOf(it);
  const outfits = data.outfits.filter((o) => usesItem(o.look, it.id));
  const label = CATEGORIES.find(([c]) => c === it.cat)?.[1] ?? it.cat;
  return (
    <div className="view">
      <PageHead view="wardrobe" />
      <a className="backlink" href="#wardrobe">← Wardrobe</a>
      <section className="detail" aria-labelledby="i-h">
        <GarmentCard
          category={it.cat}
          name={shortName(it)}
          style={it.style}
          brand={brand}
          color={it.color}
          stripe={it.stripe}
          pattern={detailsOf(it).pattern}
          image={it.image}
          art={<ItemArt it={it} />}
          price={money(it.price)}
          qty={it.qty}
          owned={!!it.owned}
          status={status}
        />
        <div className="detail-body">
          <SectionHead id="i-h" kicker={label + " · " + it.style} title={it.name} />
          <dl className="facts">
            {brand ? <><dt>Brand</dt><dd>{brand}</dd></> : null}
            <dt>Status</dt><dd>{STATUS_LABEL[status]}</dd>
            <dt>Price</dt><dd>{money(it.price)}{it.qty > 1 ? ` × ${it.qty}` : ""}</dd>
            {isSlot(it.cat) || it.cat === "other" ? <><dt>Days worn</dt><dd>{daysWorn(data.rotation, it.id)}</dd></> : null}
            {outfits.length ? <><dt>In outfits</dt><dd>{outfits.map((o) => o.name).join(", ")}</dd></> : null}
          </dl>
          {it.notes ? <p className="lede">{it.notes}</p> : null}
          {it.link || it.sketch ? (
            <div className="actions">
              {it.link ? <a className="rt-btn" href={it.link} target="_blank" rel="noopener noreferrer">View at the shop ↗</a> : null}
              {it.sketch ? promoteButtons(it) : null}
            </div>
          ) : null}
        </div>
      </section>
      <ItemForm
        key={it.id + ":" + rev}
        initial={clone(it)}
        isNew={false}
        onSave={(next) => { onSave(next); setRev((n) => n + 1); }}
        onCancel={() => setRev((n) => n + 1)}
        cancelLabel="Undo edits"
        onDelete={onDelete}
      />
    </div>
  );
}

export function WardrobeView({ data, setData, backend, item }: { data: WardrobeData; setData: (d: WardrobeData) => void; backend: Backend; item?: string }) {
  const { items, rotation: rot } = data;
  const [editing, setEditing] = useState<Editing>(null);
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  /** A whole-wardrobe replacement waiting for a yes: changes save at once, so these ask first. */
  const [replacing, setReplacing] = useState<{ title: string; label: string; next: WardrobeData; done: string } | null>(null);
  const [layout, setLayout] = useState<"table" | "cards">("table");
  const fileRef = useRef<HTMLInputElement>(null);
  const totals = useMemo(() => wardrobeTotals(items), [items]);

  /** Add a new item (no `id`), or replace the item with `id`. */
  function save(it: Omit<Item, "id">, id?: string) {
    const nextItems = clone(items);
    const looks = clone(rot.looks);
    const outfits = clone(data.outfits);
    if (id === undefined) {
      nextItems.push({ id: uniqueId(it.name, nextItems), ...it });
    } else {
      const old = nextItems.find((x) => x.id === id)!;
      // Moving an item to another category takes it out of outfits that used it in the old slot.
      if (old.cat !== it.cat) {
        for (const l of [...looks, ...outfits.map((o) => o.look)]) {
          if ((l as any)[old.cat] === old.id) (l as any)[old.cat] = null;
          if (old.cat === "other") dropAccessory(l, old.id);
        }
      }
      Object.keys(old).forEach((k) => delete (old as any)[k]);
      Object.assign(old, { id }, it);
    }
    setData({ ...data, items: nextItems, rotation: { ...rot, looks }, outfits });
    setEditing(null);
  }
  function remove(id: string) {
    const clear = (l: any) => { SLOTS.forEach(([s]) => { if (l[s] === id) l[s] = null; }); dropAccessory(l, id); };
    const looks = clone(rot.looks); looks.forEach(clear);
    const outfits = clone(data.outfits); outfits.forEach((o) => clear(o.look));
    setData({ ...data, items: items.filter((i) => i.id !== id), rotation: { ...rot, looks }, outfits });
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
      setReplacing({ title: `Replace your wardrobe with ${file.name}?`, label: "Import", next: { ...next, savedAt: data.savedAt }, done: `Loaded ${next.items.length} items from ${file.name}.` });
    } catch (e) {
      setMsg("That file isn't a wardrobe file: " + String((e as Error).message));
    }
  }

  const promoteItem = (id: string, to: "tobuy" | "owned") => setData({ ...data, items: items.map((x) => (x.id === id ? promote(x, to) : x)) });
  const toBuy = totals.all - totals.own;
  const sketches = items.filter((i) => i.sketch);
  const real = items.length - sketches.length;
  const owned = items.filter((i) => i.owned).length;
  const promoteButtons = (it: Item) => (
    <>
      <Button variant="ghost" size="sm" onClick={() => promoteItem(it.id, "tobuy")}>Move to To buy</Button>
      <Button size="sm" onClick={() => promoteItem(it.id, "owned")}>I own this</Button>
    </>
  );

  // Opening an item starts at the top of its page; coming back puts its row in view again.
  const lastOpen = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (item) {
      lastOpen.current = item;
      window.scrollTo(0, 0);
      return;
    }
    const row = lastOpen.current ? document.getElementById("item-" + lastOpen.current) : null;
    lastOpen.current = undefined;
    if (!row) return;
    row.scrollIntoView({ block: "center" });
    row.querySelector<HTMLElement>("a[href^='#wardrobe/item/']")?.focus({ preventScroll: true });
  }, [item]);

  if (item) {
    const it = items.find((x) => x.id === item);
    if (!it) {
      return (
        <div className="view">
          <a className="backlink" href="#wardrobe">← Wardrobe</a>
          <Notice tone="neutral">That item isn't in your wardrobe.</Notice>
        </div>
      );
    }
    return (
      <ItemDetail
        it={it}
        data={data}
        onSave={(next) => save(next, it.id)}
        onDelete={() => { remove(it.id); location.replace("#wardrobe"); }}
        promoteButtons={promoteButtons}
      />
    );
  }

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return (
    <div className="view">
      <PageHead
        view="wardrobe"
        aside={
          <>
            <Segmented label="Show as" options={[["table", "Table"], ["cards", "Cards"]]} value={layout} onChange={setLayout} />
            <Button variant="primary" onClick={() => { setNote(""); setEditing({ isNew: true, item: BLANK }); }}>Add an item</Button>
          </>
        }
      />
      <div className="stats">
        <Stat value={real} label="In the collection" note={sketches.length ? `Plus ${plural(sketches.length, "sketch", "sketches")}` : undefined} />
        <Stat value={owned} label="Owned" note={real - owned ? `${real - owned} still to buy` : "Nothing left to buy"} />
        <Stat value={dollars(totals.all)} label="Value" note={toBuy ? `${dollars(toBuy)} of it still to buy` : undefined} />
      </div>

      <section aria-label="Collection">
        <form className="urlbar" onSubmit={fromUrl}>
          <Field type="url" label="Add from a product link" placeholder="Paste a link to fill in an item" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button type="submit" disabled={busy || !url.trim()}>{busy ? "Reading…" : "Add from link"}</Button>
        </form>
        {editing ? (
          <ItemForm key={"new:" + (editing.item.link || "")} initial={editing.item} isNew note={note} onSave={(it) => save(it)} onCancel={() => setEditing(null)} onDelete={() => setEditing(null)} />
        ) : null}
        {layout === "cards" ? (
          <>
          {CATEGORIES.map(([cat, label]) => {
            const rows = items.filter((i) => i.cat === cat && !i.sketch);
            if (!rows.length) return null;
            return (
              <div className="card-group" key={cat}>
                <Kicker tone="ink">{label} · {rows.length}</Kicker>
                <div className="garment-grid">
                  {rows.map((it) => (
                    <GarmentCard
                      key={it.id}
                      id={"item-" + it.id}
                      category={it.cat}
                      name={shortName(it)}
                      style={it.style}
                      brand={it.brand || brandOf(it)}
                      color={it.color}
                      stripe={it.stripe}
                      pattern={detailsOf(it).pattern}
                      image={it.image}
                      art={<ItemArt it={it} />}
                      price={money(it.price)}
                      qty={it.qty}
                      owned={!!it.owned}
                      worn={isSlot(cat) || cat === "other" ? daysWorn(rot, it.id) : undefined}
                      href={itemHash(it.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {sketches.length ? (
            <div className="card-group">
              <Kicker tone="ink">Sketches · {sketches.length}</Kicker>
              <p className="lede">Ideas from the outfit builder. They aren't counted in the totals or picked by Generate rotation.</p>
              <div className="garment-grid">
                {sketches.map((it) => (
                  <div className="sketch-card" key={it.id} id={"item-" + it.id}>
                    <GarmentCard
                      category={it.cat}
                      name={shortName(it)}
                      style={it.style}
                      color={it.color}
                      stripe={it.stripe}
                      pattern={detailsOf(it).pattern}
                      image={it.image}
                      art={<ItemArt it={it} />}
                      price={money(it.price)}
                      owned={false}
                      status="sketch"
                      worn={daysWorn(rot, it.id)}
                      href={itemHash(it.id)}
                    />
                    <div className="actions">{promoteButtons(it)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          </>
        ) : (
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th><th>Style</th><th className="num">Price</th><th className="num">Qty</th><th className="num">Days worn</th><th>Owned</th>
                  <th><span className="sr-only">Shop link</span></th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map(([cat, label]) => {
                  const rows = items.filter((i) => i.cat === cat && !i.sketch);
                  return (
                    <React.Fragment key={cat}>
                      <tr className="cat"><td colSpan={7}>{label}{rows.length ? <span className="cat-note">{plural(rows.length, "item", "items")}</span> : null}</td></tr>
                      {rows.map((it) => (
                        <tr key={it.id} id={"item-" + it.id}>
                          <td>
                            <span className="namecell">
                              {it.image ? <img className="thumb" src={it.image} alt="" referrerPolicy="no-referrer" /> : null}
                              {it.cat === "basics" ? <ItemArt it={it} className="item-icon" /> : <Swatch it={it} />}
                              <a href={itemHash(it.id)}>{it.name}</a>
                            </span>
                          </td>
                          <td className="muted">{it.style}</td>
                          <td className="num">{money(it.price)}</td>
                          <td className="num">{it.qty}</td>
                          <td className="num">{isSlot(cat) || cat === "other" ? daysWorn(rot, it.id) : ""}</td>
                          <td>
                            <Checkbox checked={!!it.owned} aria-label={"Owned: " + it.name} onCheckedChange={(v) => setData({ ...data, items: items.map((x) => (x.id === it.id ? { ...x, owned: v } : x)) })} />
                          </td>
                          <td className="num"><ShopLink it={it} /></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
                {sketches.length ? (
                  <>
                    <tr className="cat"><td colSpan={7}>Sketches · {sketches.length} <span className="cat-note">Not counted in the totals</span></td></tr>
                    {sketches.map((it) => (
                      <tr key={it.id} id={"item-" + it.id} className="is-sketch">
                        <td>
                          <span className="namecell">
                            {it.image ? <img className="thumb" src={it.image} alt="" referrerPolicy="no-referrer" /> : null}
                            {it.cat === "basics" ? <ItemArt it={it} className="item-icon" /> : <Swatch it={it} />}
                            <a href={itemHash(it.id)}>{it.name}</a>
                          </span>
                        </td>
                        <td className="muted">{it.style}</td>
                        <td className="num muted">{money(it.price)}</td>
                        <td className="num muted">{it.qty}</td>
                        <td className="num">{daysWorn(rot, it.id)}</td>
                        <td><Tag tone="sketch">Sketch</Tag></td>
                        <td className="num"><span className="row-actions">{promoteButtons(it)}<ShopLink it={it} /></span></td>
                      </tr>
                    ))}
                  </>
                ) : null}
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
          <Button variant="ghost" onClick={() => setReplacing({ title: "Replace your wardrobe with the sample?", label: "Load sample", next: { ...sampleData(), savedAt: data.savedAt }, done: "Loaded the sample wardrobe." })}>Load sample wardrobe</Button>
          <Button variant="danger" onClick={() => setReplacing({ title: "Clear your wardrobe?", label: "Start empty", next: { ...data, items: [], outfits: [], rotation: { ...rot, looks: rot.looks.map(() => clone(EMPTY_LOOK)) } }, done: "Cleared. You're starting empty." })}>Start empty</Button>
        </div>
        {msg ? <Notice tone="neutral">{msg}</Notice> : null}
        <ConfirmDialog
          open={replacing !== null}
          onOpenChange={(o) => { if (!o) setReplacing(null); }}
          title={replacing?.title ?? ""}
          description={`This removes your ${items.length} ${items.length === 1 ? "piece" : "pieces"}, outfits and rotation, and saves straight away. Export JSON first if you want a copy.`}
          actions={[
            { label: replacing?.label ?? "Replace", variant: "danger", onSelect: () => { if (replacing) { setData(replacing.next); setMsg(replacing.done); } setReplacing(null); } },
            { label: "Cancel", variant: "ghost", onSelect: () => setReplacing(null) },
          ]}
        />
      </section>
    </div>
  );
}
