import { useEffect, useMemo, useRef, useState } from "react";
import { OutfitsView } from "./components/OutfitsView.tsx";
import { PrintView } from "./components/PrintView.tsx";
import { RotationView } from "./components/RotationView.tsx";
import { WardrobeView } from "./components/WardrobeView.tsx";
import { ConfirmDialog, Masthead, SaveBar, Segmented, Tabs } from "./design-system/index.ts";
import { clone, same } from "./lib/model.ts";
import { formatHash, parseHash, VIEW_ORDER, type Route, type ViewId } from "./lib/route.ts";
import { DATA_CHANGED, fingerprint, loadDraft, saveDraft, type Backend } from "./lib/storage.ts";
import type { WardrobeData } from "./lib/types.ts";

const LABELS: Record<ViewId, string> = { wardrobe: "Wardrobe & costs", outfits: "Outfits", rotation: "Rotation", print: "Print" };
/** The masthead's dek says what the current step is for. */
const DEKS: Record<ViewId, string> = {
  wardrobe: "Everything you own or mean to buy, and what it all costs.",
  outfits: "Put pieces together into looks, and keep the ones you like.",
  rotation: "Plan what to wear each day, for as many days and weeks as you like.",
  print: "Your plan on paper, to pin up by the closet.",
};
const content = (d: WardrobeData) => ({ ...d, savedAt: 0 });

type Theme = "system" | "light" | "dark";
const THEME_KEY = "wardrobe-rotation:theme"; // read before first paint by the script in index.html

/** Why the saved version on disk turned out to differ from the one the unsaved edits were made against. */
type Conflict = "startup" | "focus" | "save";

export function App({ backend, initial }: { backend: Backend; initial: WardrobeData }) {
  const [saved, setSaved] = useState(initial);
  const savedPrint = useMemo(() => fingerprint(saved), [saved]);
  // A draft made against a different version of the file is still restored, but the person is asked about it.
  const [startup] = useState(() => {
    const draft = loadDraft();
    if (!draft) return { data: clone(initial), conflict: null };
    const stale = draft.base !== fingerprint(initial) && !same(content(draft.data), content(initial));
    return { data: draft.data, conflict: stale ? ("startup" as const) : null };
  });
  const [data, setData] = useState(startup.data);
  const [conflict, setConflict] = useState<Conflict | null>(startup.conflict);
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) || "system");
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
  // An informational note belongs to the data it describes; the next edit clears it.
  const noteFor = useRef<WardrobeData | null>(null);
  function showLoaded(next: WardrobeData, text: string) {
    noteFor.current = next;
    setData(next);
    setStatus({ text, kind: "" });
  }
  useEffect(() => {
    if (noteFor.current && noteFor.current !== data) {
      noteFor.current = null;
      setStatus((s) => (s.kind === "" ? { text: "", kind: "" } : s));
    }
  }, [data]);
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
  useEffect(() => saveDraft(savedPrint, dirty ? data : null), [data, dirty, savedPrint]);

  // Coming back to the tab (or, in development, the data file changing): pick up changes made elsewhere.
  const checking = useRef(false);
  const latest = useRef({ savedPrint, dirty, conflict });
  latest.current = { savedPrint, dirty, conflict };
  useEffect(() => {
    const check = async () => {
      if (checking.current || latest.current.conflict || document.visibilityState !== "visible") return;
      checking.current = true;
      try {
        const disk = await backend.load();
        if (fingerprint(disk) === latest.current.savedPrint) return;
        setSaved(disk);
        if (latest.current.dirty) setConflict("focus");
        else showLoaded(clone(disk), changedText + " Loaded the newer version.");
      } catch {
        // Unreachable file or storage: keep working on what is loaded.
      } finally {
        checking.current = false;
      }
    };
    window.addEventListener("focus", check);
    window.addEventListener(DATA_CHANGED, check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      window.removeEventListener(DATA_CHANGED, check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [backend]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
    try {
      if (theme === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, theme);
    } catch {}
    // The browser chrome follows the chosen paper colour.
    const paper = getComputedStyle(root).getPropertyValue("--paper").trim();
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
      m.dataset.auto ??= m.content;
      m.content = theme === "system" ? m.dataset.auto : paper;
    });
  }, [theme]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save(force = false) {
    const next = { ...data, savedAt: Date.now() };
    setStatus({ text: "Saving…", kind: "" });
    checking.current = true; // our own write must not look like a change made elsewhere
    try {
      // Never overwrite a version this tab hasn't seen without asking.
      if (!force) {
        const disk = await backend.load();
        if (fingerprint(disk) !== savedPrint) {
          setSaved(disk);
          setConflict("save");
          setStatus({ text: "", kind: "" });
          return;
        }
      }
      await backend.save(next);
      saveDraft("", null);
      setSaved(next);
      setData(next);
      setStatus({ text: "", kind: "" });
    } catch (e) {
      setStatus({ text: "Couldn't save: " + String((e as Error)?.message || e), kind: "dirty" });
    } finally {
      checking.current = false;
    }
  }

  function loadNewer() {
    setConflict(null);
    showLoaded(clone(saved), "Loaded the newer version. Your unsaved changes were discarded.");
  }

  const where = backend.kind === "file" ? "data/wardrobe.json" : "this browser";
  const changedText = backend.kind === "file" ? "data/wardrobe.json changed on disk." : "Your wardrobe changed in another tab.";
  const conflictText: Record<Conflict, string> = {
    startup: "Your unsaved changes were made against an older version of " + where + ". Keep working on them, or load the newer version and discard them?",
    focus: changedText + " You have unsaved changes. Keep working on them, or load the newer version and discard them?",
    save: changedText + " Saving now would replace that newer version with yours.",
  };

  const pieces = data.items.length;
  const meta = (
    <>
      {backend.kind === "file" ? <>Local · saving to <b>data/wardrobe.json</b></> : <>Saved in <b>this browser</b></>}
      {" · "}
      {pieces} {pieces === 1 ? "piece" : "pieces"} · {data.rotation.days.length * data.rotation.weeks} days
    </>
  );

  return (
    <div className={"wrap rt-step-" + (VIEW_ORDER.indexOf(view) + 1)}>
      <Masthead
        className="no-print"
        meta={meta}
        title="Rotation"
        dek={DEKS[view]}
        tools={<Segmented label="Theme" options={[["system", "Auto"], ["light", "Light"], ["dark", "Dark"]]} value={theme} onChange={setTheme} />}
      >
        <Tabs label="Views" value={view} items={VIEW_ORDER.map((id, i) => ({ id, label: LABELS[id], href: "#" + id, step: (i + 1) as 1 | 2 | 3 | 4 }))} />
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
        onSave={() => save()}
      />

      <ConfirmDialog
        open={conflict !== null}
        onOpenChange={(o) => { if (!o) setConflict(null); }}
        title={conflict === "save" ? "A newer version is saved" : "The saved wardrobe changed"}
        description={conflict ? conflictText[conflict] : ""}
        actions={
          conflict === "save"
            ? [
                { label: "Save mine anyway", variant: "danger", onSelect: () => { setConflict(null); save(true); } },
                { label: "Load the newer version", onSelect: loadNewer },
                { label: "Cancel", variant: "ghost", onSelect: () => setConflict(null) },
              ]
            : [
                { label: "Load the newer version", onSelect: loadNewer },
                { label: "Keep my changes", variant: "primary", onSelect: () => setConflict(null) },
              ]
        }
      />
    </div>
  );
}
