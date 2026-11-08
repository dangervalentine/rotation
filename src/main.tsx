import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { pickBackend } from "./lib/storage.ts";
import "./styles.css";

const root = createRoot(document.getElementById("root")!);

pickBackend()
  .then(async (backend) => root.render(<App backend={backend} initial={await backend.load()} />))
  .catch((e) => root.render(<p style={{ padding: 24 }}>Couldn't load the wardrobe: {String(e?.message || e)}</p>));
