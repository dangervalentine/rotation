import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { OutfitsView } from "./components/OutfitsView.tsx";
import { PrintView } from "./components/PrintView.tsx";
import { RotationView } from "./components/RotationView.tsx";
import { WardrobeView } from "./components/WardrobeView.tsx";
import { STEP_HEADS } from "./components/common.tsx";
import { GithubAttribution } from "./components/GithubAttribution.tsx";
import { Button, ConfirmDialog, Masthead, motionReduced, Segmented, Setting, Settings, StepHead, Tabs, Wordmark } from "./design-system/index.ts";
import { clone, same } from "./lib/model.ts";
import { formatHash, parseHash, stepChange, VIEW_ORDER, type Route, type StepDir } from "./lib/route.ts";
import { DATA_CHANGED, fingerprint, loadDraft, saveDraft, type Backend } from "./lib/storage.ts";
import type { WardrobeData } from "./lib/types.ts";

const content = (d: WardrobeData) => ({ ...d, savedAt: 0 });

type Theme = "system" | "light" | "dark";
const THEME_KEY = "wardrobe-rotation:theme"; // read before first paint by the script in index.html
/** "auto" follows the device's reduce-motion setting; "off" turns every animation off. */
type Motion = "auto" | "off";
const MOTION_KEY = "wardrobe-rotation:motion"; // also read before first paint

/** Why the saved version on disk turned out to differ from the one the unsaved edits were made against. */
type Conflict = "startup" | "focus" | "save";
/** Edits are saved this long after the last change, so a run of quick changes is written once. */
const AUTOSAVE_MS = 500;

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
  const [motion, setMotion] = useState<Motion>(() => (document.documentElement.dataset.motion === "reduce" ? "off" : "auto"));
  const looks = data.rotation.looks.length;
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash, looks));
  const view = route.view;
  const routeRef = useRef(route);
  routeRef.current = route;
  /** Which way the last step change went: the head rolls and the page slides that way. */
  const [dir, setDir] = useState<StepDir>("forward");
  const stepTransition = useRef(0);
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
      if (next.view === prev.view && next.day === prev.day && next.item === prev.item) return;
      if (prev.day !== null && !bypassGuard.current && closeGuard.current && !closeGuard.current(location.hash)) {
        history.pushState(null, "", formatHash(prev));
        return;
      }
      bypassGuard.current = false;
      if (next.day === null) openedByPush.current = false;
      applyRoute(next);
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
    applyRoute(next);
  }
  /** Show `next`. A move to another step rolls the head and slides the page, in the order of the work, and lands at the top. */
  function applyRoute(next: Route) {
    const d = stepChange(routeRef.current.view, next.view);
    routeRef.current = next; // popstate and hashchange both fire for one navigation; the second sees the same route and stops
    if (!d) return setRoute(next);
    const show = () => {
      setDir(d);
      setRoute(next);
      window.scrollTo(0, 0);
    };
    if (!document.startViewTransition || motionReduced()) return show();
    const root = document.documentElement;
    const id = ++stepTransition.current;
    root.dataset.stepDir = d;
    // A newer move skips this one; only the latest clears the direction.
    const t = document.startViewTransition(() => flushSync(show));
    t.ready.catch(() => {});
    t.finished.finally(() => {
      if (stepTransition.current === id) delete root.dataset.stepDir;
    });
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
  // Until a change is saved it is also kept as a draft, so a failed save or a closed tab doesn't lose it.
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
    const root = document.documentElement;
    if (motion === "off") root.dataset.motion = "reduce";
    else delete root.dataset.motion;
    try {
      if (motion === "off") localStorage.setItem(MOTION_KEY, "off");
      else localStorage.removeItem(MOTION_KEY);
    } catch {}
  }, [motion]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Every change saves itself. Not while a conflict is open, and not again for the same data after a failure (Retry does that).
  const saving = useRef(false);
  const failedFor = useRef<WardrobeData | null>(null);
  useEffect(() => {
    if (!dirty || conflict || saving.current || failedFor.current === data) return;
    const t = setTimeout(() => save(), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [data, saved, dirty, conflict]);

  async function save(force = false) {
    const next = { ...data, savedAt: Date.now() };
    saving.current = true;
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
      // Only `saved` moves: edits made while the write was in flight stay in `data` and save next.
      failedFor.current = null;
      setSaved(next);
      setStatus({ text: "", kind: "" });
    } catch (e) {
      failedFor.current = data;
      setStatus({ text: "Couldn't save: " + String((e as Error)?.message || e), kind: "dirty" });
    } finally {
      saving.current = false;
      checking.current = false;
    }
  }

  function loadNewer() {
    setConflict(null);
    showLoaded(clone(saved), "Loaded the newer version. Your unsaved changes were dropped.");
  }
  function keepMine() {
    setConflict(null);
    save(true);
  }

  const where = backend.kind === "file" ? "data/wardrobe.json" : "this browser";
  const changedText = backend.kind === "file" ? "data/wardrobe.json changed on disk." : "Your wardrobe changed in another tab.";
  const conflictText: Record<Conflict, string> = {
    startup: "Your unsaved changes were made against an older version of " + where + ". Keep yours and save them over it, or load the newer version and drop yours?",
    focus: changedText + " You have unsaved changes. Keep yours and save them over it, or load the newer version and drop yours?",
    save: changedText + " Keep yours and save them over it, or load the newer version and drop yours?",
  };

  // Saving is quiet; the bar only speaks up when a save fails.
  const meta = (
    <span className="save-status is-error" role="status">
      {status.kind === "dirty" ? <>{status.text} <Button variant="ghost" size="sm" onClick={() => save()}>Retry</Button></> : null}
    </span>
  );

  return (
    <div className={"wrap rt-step-" + (VIEW_ORDER.indexOf(view) + 1)}>
      <Masthead
        className="no-print"
        brand={<Wordmark name="Rotation" href="#wardrobe" />}
        meta={meta}
        tools={
          <Settings>
            <Setting label="Theme">
              <Segmented label="Theme" options={[["system", "Auto"], ["light", "Light"], ["dark", "Dark"]]} value={theme} onChange={setTheme} />
            </Setting>
            <Setting label="Animation" note="Auto follows your device's reduce-motion setting. Off stills every animation, including the move between steps.">
              <Segmented label="Animation" options={[["auto", "Auto"], ["off", "Off"]]} value={motion} onChange={setMotion} />
            </Setting>
          </Settings>
        }
      >
        <Tabs label="Views" value={view} items={VIEW_ORDER.map((id) => ({ id, label: STEP_HEADS[id].title, href: "#" + id, step: STEP_HEADS[id].number }))} />
      </Masthead>

      <main>
        {/* The Print step's head stays off paper, as it always has; the other steps print theirs. */}
        <StepHead {...STEP_HEADS[view]} dir={dir} className={view === "print" ? "no-print" : undefined}>
          <div className="step-page">
            {view === "wardrobe" ? <WardrobeView data={data} setData={setData} backend={backend} item={route.item} /> : null}
            {view === "outfits" ? <OutfitsView data={data} setData={setData} /> : null}
            {view === "rotation" ? <RotationView data={data} setData={setData} day={route.day} navigate={navigate} exitDay={exitDay} closeGuard={closeGuard} /> : null}
            {view === "print" ? <PrintView data={data} setData={setData} /> : null}
          </div>
        </StepHead>
      </main>

      <ConfirmDialog
        open={conflict !== null}
        title={conflict === "save" ? "A newer version is saved" : "The saved wardrobe changed"}
        description={conflict ? conflictText[conflict] : ""}
        // Escape or closing keeps your changes, which autosave then writes over the newer version.
        onOpenChange={(o) => { if (!o) setConflict(null); }}
        actions={[
          { label: "Load the newer version", onSelect: loadNewer },
          { label: "Keep mine", variant: "primary", onSelect: keepMine },
        ]}
      />
      <footer>
        <GithubAttribution />
      </footer>
    </div>
  );
}
