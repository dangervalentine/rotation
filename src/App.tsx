import { useEffect, useState } from "react";
import { OutfitsView } from "./components/OutfitsView.tsx";
import { PrintView } from "./components/PrintView.tsx";
import { RotationView } from "./components/RotationView.tsx";
import { WardrobeView } from "./components/WardrobeView.tsx";
import { Masthead, SaveBar, Tabs } from "./design-system/index.ts";
import { clone, same } from "./lib/model.ts";
import { loadDraft, saveDraft, type Backend } from "./lib/storage.ts";
import type { WardrobeData } from "./lib/types.ts";

const VIEWS = [
  ["rotation", "Rotation"],
  ["outfits", "Outfits"],
  ["wardrobe", "Wardrobe & costs"],
  ["print", "Print"],
] as const;
type View = (typeof VIEWS)[number][0];

const viewFromHash = (): View => (VIEWS.find(([v]) => "#" + v === location.hash)?.[0] ?? "rotation");
const content = (d: WardrobeData) => ({ ...d, savedAt: 0 });

export function App({ backend, initial }: { backend: Backend; initial: WardrobeData }) {
  const [saved, setSaved] = useState(initial);
  const [data, setData] = useState(() => loadDraft(initial.savedAt) || clone(initial));
  const [view, setView] = useState<View>(viewFromHash);
  const [status, setStatus] = useState({ text: "", kind: "" });
  const dirty = !same(content(data), content(saved));

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => saveDraft(saved.savedAt, dirty ? data : null), [data, dirty, saved.savedAt]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save() {
    const next = { ...data, savedAt: Date.now() };
    setStatus({ text: "Saving…", kind: "" });
    try {
      await backend.save(next);
      saveDraft(0, null);
      setSaved(next);
      setData(next);
      setStatus({ text: "", kind: "" });
    } catch (e) {
      setStatus({ text: "Couldn't save: " + String((e as Error)?.message || e), kind: "dirty" });
    }
  }

  const pieces = data.items.length;
  const meta = (
    <>
      {backend.kind === "file" ? <>Local · saving to <b>data/wardrobe.json</b></> : <>Saved in <b>this browser</b></>}
      {" · "}
      {pieces} {pieces === 1 ? "piece" : "pieces"} · {data.rotation.days.length * data.rotation.weeks} days
    </>
  );

  return (
    <div className="wrap">
      <Masthead
        className="no-print"
        meta={meta}
        title={<input className="title-input" value={data.title} aria-label="Wardrobe name" onChange={(e) => setData({ ...data, title: e.target.value })} />}
        dek={data.subtitle || undefined}
      >
        <Tabs label="Views" value={view} items={VIEWS.map(([id, label]) => ({ id, label, href: "#" + id }))} />
      </Masthead>

      <main>
        {view === "rotation" ? <RotationView data={data} setData={setData} /> : null}
        {view === "outfits" ? <OutfitsView data={data} setData={setData} /> : null}
        {view === "wardrobe" ? <WardrobeView data={data} setData={setData} backend={backend} /> : null}
        {view === "print" ? <PrintView data={data} setData={setData} /> : null}
      </main>

      <SaveBar
        className="savebar"
        dirty={dirty}
        error={status.kind === "dirty"}
        message={status.text || undefined}
        discardLabel="Discard changes"
        saveLabel="Save changes"
        onDiscard={() => { setData(clone(saved)); setStatus({ text: "", kind: "" }); }}
        onSave={save}
      />
    </div>
  );
}
