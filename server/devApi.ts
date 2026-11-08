import { promises as fs } from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { migrate } from "../src/lib/model.ts";
import { parseProductHtml } from "../src/lib/productParse.ts";

/**
 * Dev-server API so the local app reads and writes a JSON file on disk.
 *   GET  /api/health
 *   GET  /api/wardrobe          -> data file contents
 *   PUT  /api/wardrobe          -> validate, then replace the data file
 *   GET  /api/import?url=...    -> fetch a product page and guess item fields
 */
export function wardrobeFileApi(dataFile: string): Plugin {
  return {
    name: "wardrobe-file-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        if (!url.pathname.startsWith("/api/")) return next();
        try {
          if (url.pathname === "/api/health") return send(res, 200, { ok: true, file: path.relative(process.cwd(), dataFile) });
          if (url.pathname === "/api/wardrobe" && req.method === "GET") {
            return send(res, 200, JSON.parse(await fs.readFile(dataFile, "utf8")));
          }
          if (url.pathname === "/api/wardrobe" && req.method === "PUT") {
            const data = migrate(JSON.parse(await readBody(req)));
            const tmp = dataFile + ".tmp";
            await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n");
            await fs.rename(tmp, dataFile);
            return send(res, 200, { ok: true, savedAt: data.savedAt });
          }
          if (url.pathname === "/api/import" && req.method === "GET") {
            const target = url.searchParams.get("url") || "";
            if (!/^https?:\/\//i.test(target)) return send(res, 400, { error: "Enter a full http(s) link" });
            const html = await fetchPage(target);
            return send(res, 200, parseProductHtml(html, target));
          }
          send(res, 404, { error: "Not found" });
        } catch (e) {
          send(res, 500, { error: String((e as Error)?.message || e) });
        }
      });
    },
  };
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let s = "";
    req.setEncoding("utf8");
    req.on("data", (c) => {
      s += c;
      if (s.length > 5_000_000) reject(new Error("Body too large"));
    });
    req.on("end", () => resolve(s));
    req.on("error", reject);
  });
}

async function fetchPage(target: string) {
  const r = await fetch(target, {
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
    },
  });
  if (!r.ok) throw new Error(`The store returned ${r.status}`);
  return (await r.text()).slice(0, 3_000_000);
}
