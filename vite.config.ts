import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { wardrobeFileApi } from "./server/devApi.ts";

export default defineConfig({
  // Relative asset paths so the build works from any folder or static host.
  base: "./",
  plugins: [react(), wardrobeFileApi(path.resolve(import.meta.dirname, "data/wardrobe.json"))],
});
