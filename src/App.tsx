import { useEffect, useRef, useState } from "react";
import { OutfitsView } from "./components/OutfitsView.tsx";
import { PrintView } from "./components/PrintView.tsx";
import { RotationView } from "./components/RotationView.tsx";
import { WardrobeView } from "./components/WardrobeView.tsx";
import { Masthead, SaveBar, Tabs } from "./design-system/index.ts";
import { clone, same } from "./lib/model.ts";
import { formatHash, parseHash, VIEW_ORDER, type Route, type ViewId } from "./lib/route.ts";
import { loadDraft, saveDraft, type Backend } from "./lib/storage.ts";
import type { WardrobeData } from "./lib/types.ts";

const LABELS: Record<ViewId, string> = { wardrobe: "Wardrobe & costs", outfits: "Outfits", rotation: "Rotation", print: "Print" };
const content = (d: WardrobeData) => ({ ...d, savedAt: 0 });

export function App({ backend, initial }: { backend: Backend; initial: WardrobeData }) {
  const [saved, setSaved] = useState(initial);
  const [data, setData] = useState(() => loadDraft(initial.savedAt) || clone(initial));
  const looks = data.rotation.looks.length;
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash, looks));
  const view = route.view;
  const routeRef = useRef(route);
  routeRef.current = route;
  /** Set by RotationView: returns false (and asks to apply or discard) when leaving the open day would drop changes. */
  const closeGuard = useRef<((nextHash: string) => boolean) | null>(null);
  const bypassGuard = useRef(false);
  const openedByPush = useRef(false);
  const [status, setStatus] = useState({ text: "", kind: "" });
  const dirty = !same(content(data), content(saved));

  // Back, forward and nav links. Leaving an open day with unapplied changes is held until the person decides.
  useEffect(() => {
    const onNav = () => {
      const prev = routeRef.current;
      const next = parseHash(location.hash, looks);
      if (next.view === prev.view && next.day === prev.day) return;
      if (prev.day !== null && !bypassGuard.current && closeGuard.current && !closeGuard.current(location.hash)) {
        history.pushState(null, "", formatHash(prev));
        return;
      }
      bypassGuard.current = false;
      if (next.day === null) openedByPush.current = false;
      routeRef.current = next; // popstate and hashchange both fire for one navigation
      setRoute(next);
    };
    window.addEventListener("popstate", onNav);
    window.addEventListener("hashchange", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("hashchange", onNav);
    };
  }, [looks]);

  function navigate(next: Route, mode: "push" | "replace") {
    if (mode === "push" && routeRef.current.day === null && next.day !== null) openedByPush.current = true;
    history[mode === "push" ? "pushState" : "replaceState"](null, "", formatHash(next));
    routeRef.current = next;
    setRoute(next);
  }
  /** Close the open day (or go to `hash`) without asking: the caller has already applied or discarded. */
  function exitDay(hash?: string) {
    bypassGuard.current = true;
    if (hash) location.hash = hash;
    else if (openedByPush.current) history.back();
    else {
      bypassGuard.current = false;
      navigate({ view: "rotation", day: null }, "replace");
    }
  }
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
        <Tabs label="Views" value={view} items={VIEW_ORDER.map((id) => ({ id, label: LABELS[id], href: "#" + id }))} />
      </Masthead>

      <main>
        {view === "wardrobe" ? <WardrobeView data={data} setData={setData} backend={backend} /> : null}
        {view === "outfits" ? <OutfitsView data={data} setData={setData} /> : null}
        {view === "rotation" ? <RotationView data={data} setData={setData} day={route.day} navigate={navigate} exitDay={exitDay} closeGuard={closeGuard} /> : null}
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
