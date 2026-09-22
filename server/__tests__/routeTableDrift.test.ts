import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { isSpaRoute } from "../static";
import { sitemapEntries } from "../lib/sitemap";

/**
 * The route table now lives in three places, and two of them fail silently.
 *
 *  1. client/src/App.tsx — the source of truth; the only one that actually
 *     decides what renders.
 *  2. SPA_ROUTES in server/static.ts — decides whether a path gets HTTP 200
 *     or 404.
 *  3. STATIC_PAGES/SERVICE_SLUGS in server/lib/sitemap.ts — decides what is
 *     advertised to crawlers.
 *
 * Both copies carry a "keep in sync with App.tsx" comment, which is the tell.
 * The failure is invisible from a browser: add a route to App.tsx, forget
 * SPA_ROUTES, and the page renders perfectly for a human while returning 404
 * to every crawler — the page gets deindexed and nothing anywhere complains.
 * That is the same class of silent failure the prerender work was written to
 * fix, so it gets the same treatment: make CI notice instead of production.
 */

const APP_TSX = path.resolve(__dirname, "..", "..", "client", "src", "App.tsx");

/** The `path` of every <Route path="…"> in App.tsx, in file order. */
function routesDeclaredInApp(): string[] {
  const src = fs.readFileSync(APP_TSX, "utf-8");
  return [...src.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
}

/**
 * A wouter pattern to a concrete path `isSpaRoute` can be asked about:
 * `/services/:slug` -> `/services/sample`. Params never contain a slash,
 * which is exactly what the SPA_ROUTES regexes assume.
 */
function sampleFor(pattern: string): string {
  return pattern.replace(/:[^/]+/g, "sample");
}

describe("route table drift", () => {
  it("finds the routes in App.tsx at all", () => {
    // If the JSX is ever reformatted so this regex stops matching, every
    // other assertion here would vacuously pass. Fail loudly instead.
    const routes = routesDeclaredInApp();
    expect(routes.length).toBeGreaterThanOrEqual(15);
    expect(routes).toContain("/");
    expect(routes).toContain("/sms");
  });

  it("SPA_ROUTES covers every route declared in App.tsx", () => {
    const missing = routesDeclaredInApp()
      .map((pattern) => ({ pattern, sample: sampleFor(pattern) }))
      .filter(({ sample }) => !isSpaRoute(sample))
      .map(({ pattern }) => pattern);

    // A route here means App.tsx renders that page but server/static.ts
    // answers 404 for it. Add the matching regex to SPA_ROUTES.
    expect(missing).toEqual([]);
  });

  it("every URL the sitemap advertises is a route that returns 200", () => {
    // A sitemap entry the server 404s is the worst of both: we ask the
    // crawler to index it, then tell it the page does not exist.
    const notServed = sitemapEntries()
      .map((e) => e.path)
      .filter((p) => !isSpaRoute(p));

    expect(notServed).toEqual([]);
  });

  it("the sitemap advertises no path App.tsx cannot render", () => {
    const declared = new Set(routesDeclaredInApp().map(sampleFor));
    const unrenderable = sitemapEntries()
      .map((e) => e.path)
      // Collapse the concrete slugs back onto their pattern's sample form.
      .map((p) => p.replace(/^\/(services|blog)\/.+$/, "/$1/sample"))
      .filter((p) => !declared.has(p));

    expect(unrenderable).toEqual([]);
  });
});
