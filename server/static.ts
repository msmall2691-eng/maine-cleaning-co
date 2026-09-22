import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Paths that are pre-rendered to static HTML at build time
 * (script/prerender.ts). Served as-is so the policy text is in the response
 * body without JavaScript — that is how a carrier's A2P 10DLC reviewer reads
 * the privacy-policy URL declared on the campaign. Keep in sync with
 * client/src/prerender-entry.tsx.
 */
const PRERENDERED: Record<string, string> = {
  "/privacy": "privacy.html",
  "/terms": "terms.html",
  "/sms": "sms.html",
};

/**
 * Every route the SPA router (client/src/App.tsx) knows how to render.
 * Anything else still gets the shell so the client-side NotFound page
 * renders, but with HTTP 404 — the old catch-all answered 200 for every
 * path, so a bot, a link checker or a reviewer could never tell a real
 * page from a typo. Keep in sync with App.tsx.
 */
export const SPA_ROUTES: RegExp[] = [
  /^\/$/,
  /^\/book$/,
  /^\/booking\/manage\/[^/]+$/,
  /^\/portal$/,
  /^\/portal\/login$/,
  /^\/portal\/reset-password$/,
  /^\/about$/,
  /^\/how-it-works$/,
  /^\/service-areas$/,
  /^\/services$/,
  /^\/services\/[^/]+$/,
  /^\/short-term-rentals$/,
  /^\/blog$/,
  /^\/blog\/[^/]+$/,
  /^\/privacy$/,
  /^\/terms$/,
  /^\/sms$/,
];

export function isSpaRoute(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return SPA_ROUTES.some((re) => re.test(p));
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Pre-rendered policy pages. Registered before express.static so the
  // route (not the .html filename) is what serves them.
  for (const [route, file] of Object.entries(PRERENDERED)) {
    const abs = path.resolve(distPath, file);
    if (!fs.existsSync(abs)) {
      console.warn(`[static] ${route} is not pre-rendered (${file} missing) — falling back to the SPA shell`);
      continue;
    }
    app.get(route, (_req, res) => {
      res.sendFile(abs);
    });
  }

  app.use(express.static(distPath));

  // Unknown API paths are JSON 404s, never the HTML shell. Registered after
  // registerRoutes() so every real /api handler wins first.
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  // SPA fallback: known client routes get the shell with 200; anything else
  // gets the shell (so the NotFound page renders) with a real 404 status.
  app.use("/{*path}", (req, res) => {
    // req.path is mount-relative inside app.use (always "/") — read the
    // original request path instead.
    const pathname = new URL(req.originalUrl, "http://localhost").pathname;
    res.status(isSpaRoute(pathname) ? 200 : 404);
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
