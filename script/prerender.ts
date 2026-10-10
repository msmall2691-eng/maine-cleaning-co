/**
 * Pre-render every public page to static HTML after the Vite client build.
 *
 * For each path in client/src/lib/seo-routes.ts this takes the built
 * dist/public/index.html shell (so the real hashed asset tags are kept),
 * renders the page with the Footer into <div id="root">, and rewrites the
 * head — title, description, canonical, og:*, twitter:*, JSON-LD — from that
 * route's metadata. See client/src/prerender-entry.tsx for which crawlers
 * this is for and why the SPA shell alone was not enough.
 *
 * Output goes to dist/prerendered/, NOT dist/public/. That is deliberate:
 * express.static serves everything under dist/public, so writing
 * services.html there would publish /services.html as a second, crawlable
 * URL for the same page. server/static.ts maps each clean path to its file
 * from outside the static root, and 301s the legacy /<name>.html URLs the
 * previous version of this script did expose.
 *
 * Runs in build.ts after viteBuild() and is safe to run standalone:
 *   npx tsx script/prerender.ts
 */
import { createServer } from "vite";
import { mkdir, readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";
import { applyHead, outputFileFor } from "./html-head";

export { outputFileFor };

// Derived from import.meta.url rather than import.meta.dirname, which does
// not exist before Node 20.11. This file is the only one in the repo that
// runs as real ESM under tsx — vite.config.ts and server/vite.ts use
// import.meta.dirname too, but esbuild bundles those and rewrites it to
// __dirname, so they work anywhere. Here it was `undefined`, and
// path.resolve(undefined, "..") threw ERR_INVALID_ARG_TYPE on Railway's
// Node 18 builder while CI (Node 20) built it happily.
const thisFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(thisFile), "..");
const distPublic = path.join(root, "dist", "public");
const distPrerendered = path.join(root, "dist", "prerendered");

export async function prerender() {
  const shell = await readFile(path.join(distPublic, "index.html"), "utf-8");

  const vite = await createServer({
    root: path.join(root, "client"),
    configFile: path.join(root, "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "error",
    // No dev-server pre-bundling: this server only exists to ssrLoadModule
    // one entry, and the scan would still be running when we close it.
    optimizeDeps: { noDiscovery: true, include: [] },
  });

  try {
    const entry = (await vite.ssrLoadModule("/src/prerender-entry.tsx")) as typeof import("../client/src/prerender-entry");

    for (const routePath of entry.PRERENDER_PATHS) {
      const meta = entry.PRERENDER_ROUTES[routePath];
      const body = entry.render(routePath);
      const { html } = applyHead(shell, routePath, meta, body);

      const outName = outputFileFor(routePath);
      const outPath = path.join(distPrerendered, outName);
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, html, "utf-8");

      const textLen = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
      console.log(`prerendered ${routePath} -> prerendered/${outName} (${textLen} chars of text)`);
    }
    console.log(`prerendered ${entry.PRERENDER_PATHS.length} pages`);
  } finally {
    await vite.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  prerender().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
