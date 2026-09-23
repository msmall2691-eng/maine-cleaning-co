/**
 * Pre-render the policy pages to static HTML after the Vite client build.
 *
 * For each path in client/src/prerender-entry.tsx this takes the built
 * dist/public/index.html shell (so the real hashed asset tags are kept),
 * drops the server-rendered page markup into <div id="root">, swaps the
 * <title>, meta description, OG tags and canonical for the page's own, and
 * writes dist/public/<name>.html. server/static.ts serves that file for the
 * path; express.static also exposes it at /<name>.html.
 *
 * Runs in build.ts after viteBuild() and is safe to run standalone:
 *   npx tsx script/prerender.ts
 */
import { createServer } from "vite";
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

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
const SITE = "https://www.maineclean.co";
const BASE_TITLE = "The Maine Cleaning Co.";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function replaceOnce(html: string, pattern: RegExp, replacement: string, label: string): string {
  if (!pattern.test(html)) throw new Error(`prerender: could not find ${label} in index.html`);
  return html.replace(pattern, replacement);
}

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

    for (const [routePath, page] of Object.entries(entry.PRERENDER_PAGES)) {
      const body = entry.render(routePath);
      const title = `${page.title} | ${BASE_TITLE}`;
      const url = `${SITE}${routePath}`;

      let html = shell;
      html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`, "<title>");
      html = replaceOnce(
        html,
        /<meta name="description" content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${escapeHtml(page.description)}" />`,
        "meta description",
      );
      html = html
        .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
        .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`)
        .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`)
        .replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
        .replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`)
        .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`);
      html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`, '<div id="root">');

      const outName = `${routePath.replace(/^\//, "")}.html`;
      await writeFile(path.join(distPublic, outName), html, "utf-8");
      const textLen = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
      console.log(`prerendered ${routePath} -> ${outName} (${textLen} chars of text)`);
    }
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
