import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { AREA_SLUGS, BLOG_SLUGS, SERVICE_SLUGS } from "./lib/sitemap";

/** Regex-escape a slug so a `.` in one can never act as a wildcard. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * `/services/(residential|deep-cleaning|…)` — the slugs we actually have,
 * not "any slug".
 *
 * `/^\/services\/[^/]+$/` matched anything, so /services/not-a-service got
 * HTTP 200 and the empty SPA shell. That is a soft 404: the page a human sees
 * says "Service Not Found", while the status line tells every crawler the
 * page exists. Google reports these in Search Console and spends crawl budget
 * re-fetching them, and a mistyped link in the wild never surfaces as a
 * broken one. The three families below are closed sets we can check against.
 *
 * An empty set would make `(?:)` match the bare prefix, so it is refused
 * outright rather than quietly turned into a wildcard.
 */
function familyPattern(prefix: string, slugs: readonly string[]): RegExp {
  if (slugs.length === 0) {
    throw new Error(`static: no slugs for ${prefix} — refusing to build a pattern that matches nothing or everything`);
  }
  return new RegExp(`^${prefix}/(?:${slugs.map(escapeRegExp).join("|")})$`);
}

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
  // The token IS the customer's credential and can be any string, so this
  // one stays open: the server cannot tell a wrong token from a right one
  // without a database round trip, and the page itself handles a bad one.
  /^\/booking\/manage\/[^/]+$/,
  /^\/portal$/,
  /^\/portal\/login$/,
  /^\/portal\/reset-password$/,
  /^\/about$/,
  /^\/how-it-works$/,
  /^\/service-areas$/,
  familyPattern("/service-areas", AREA_SLUGS),
  /^\/services$/,
  familyPattern("/services", SERVICE_SLUGS),
  /^\/short-term-rentals$/,
  /^\/blog$/,
  familyPattern("/blog", BLOG_SLUGS),
  /^\/privacy$/,
  /^\/terms$/,
  /^\/sms$/,
];

export function isSpaRoute(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return SPA_ROUTES.some((re) => re.test(p));
}

/**
 * The file script/prerender.ts writes for a path, relative to
 * dist/prerendered. Mirrors `outputFileFor` in that script — the build
 * decides the name, this resolves it back at request time, and
 * `prerenderServing.test.ts` checks the two agree for every route.
 *
 * Returns null for a path that could not be a pre-rendered page, so a
 * crafted request cannot reach outside the directory: anything with a dot,
 * a backslash or a traversal segment is refused rather than normalised.
 */
export function prerenderedFileFor(pathname: string): string | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (!isSpaRoute(p)) return null;
  if (p === "/") return "index.html";
  if (!/^(\/[A-Za-z0-9_-]+){1,2}$/.test(p)) return null;
  return `${p.replace(/^\//, "")}.html`;
}

/**
 * Pre-rendered pages live OUTSIDE the static root on purpose.
 *
 * They used to be written into dist/public, where express.static serves
 * everything — so /privacy.html was a second crawlable URL for the same page
 * as /privacy. Duplicate URLs split ranking signals and waste crawl budget.
 * Serving them from dist/prerendered keeps one URL per page, and the legacy
 * .html paths are 301'd below in case any were linked or indexed.
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  const prerenderedPath = path.resolve(__dirname, "prerendered");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // The previous location of these files. A 301 rather than a 404 so any
  // link or index entry pointing at /privacy.html lands on /privacy and
  // passes its value along instead of dead-ending.
  app.get(/^\/([A-Za-z0-9_-]+)\.html$/, (req, res, next) => {
    const name = req.params[0];
    if (name === "index") return next();
    if (!isSpaRoute(`/${name}`)) return next();
    res.redirect(301, `/${name}`);
  });

  /**
   * Pre-rendered HTML, before express.static and before the SPA fallback, so
   * the clean path (not a filename) is what serves each page. A page with no
   * pre-rendered file falls through to the shell rather than failing — a
   * missing file should cost us the crawler-readable copy, not the site.
   */
  app.get(/.*/, (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const pathname = new URL(req.originalUrl, "http://localhost").pathname;
    const file = prerenderedFileFor(pathname);
    if (!file) return next();

    const abs = path.resolve(prerenderedPath, file);
    // Belt to the braces of the pattern in prerenderedFileFor: refuse
    // anything that resolved outside the directory.
    if (!abs.startsWith(prerenderedPath + path.sep) || !fs.existsSync(abs)) return next();

    res.sendFile(abs);
  });

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
