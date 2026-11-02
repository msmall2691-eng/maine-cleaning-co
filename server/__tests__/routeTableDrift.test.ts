import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { isSpaRoute } from "../static";
import { AREA_SLUGS, BLOG_SLUGS, SERVICE_SLUGS, sitemapEntries } from "../lib/sitemap";

/**
 * The route table now lives in three places, and two of them fail silently.
 *
 *  1. client/src/App.tsx — the source of truth; the only one that actually
 *     decides what renders.
 *  2. SPA_ROUTES in server/static.ts — decides whether a path gets HTTP 200
 *     or 404.
 *  3. STATIC_PAGES/SERVICE_SLUGS/AREA_SLUGS in server/lib/sitemap.ts —
 *     decides what is advertised to crawlers.
 *
 * Both copies carry a "keep in sync with App.tsx" comment, which is the tell.
 * The failure is invisible from a browser: add a route to App.tsx, forget
 * SPA_ROUTES, and the page renders perfectly for a human while returning 404
 * to every crawler — the page gets deindexed and nothing anywhere complains.
 * That is the same class of silent failure the prerender work was written to
 * fix, so it gets the same treatment: make CI notice instead of production.
 */

const APP_TSX = path.resolve(__dirname, "..", "..", "client", "src", "App.tsx");
const DEMO_TSX = path.resolve(__dirname, "..", "..", "client", "src", "demo", "DemoShell.tsx");

function routesIn(file: string): string[] {
  const src = fs.readFileSync(file, "utf-8");
  return [...src.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
}

/**
 * Every route the client can render, as a path the server can be asked about.
 *
 * There are two routers now. App.tsx owns the business site and mounts the
 * demo at /demo; DemoShell.tsx owns the demo's own routes, declared RELATIVE
 * to that mount because they live inside `<Router base="/demo">`. Reading
 * only App.tsx would leave eighteen demo pages unguarded — which is the exact
 * silent failure this file exists to catch, just moved one directory over.
 *
 * The `/demo/*` mount pattern is dropped: it is a deliberate catch-all
 * so an unknown demo path reaches the client's NotFound page, and the server
 * is supposed to answer 404 for it. The concrete demo routes below are what
 * actually need SPA_ROUTES coverage. `declaresTheDemoMount` asserts the mount
 * itself is still there.
 */
function routesDeclaredInApp(): string[] {
  const app = routesIn(APP_TSX).filter((p) => p !== "/demo/*");
  const demo = routesIn(DEMO_TSX).map((p) => (p === "/" ? "/demo" : `/demo${p}`));
  return [...new Set([...app, ...demo])];
}

/**
 * A wouter pattern to a concrete path `isSpaRoute` can be asked about.
 *
 * `/services/:slug` used to become `/services/sample`, which worked only
 * while SPA_ROUTES matched any slug. Now that the dynamic families are
 * checked against the real slug lists, a made-up one is correctly a 404 —
 * so a REAL example is taken from the sitemap where one exists.
 *
 * `/booking/manage/:token` has no sitemap entry by design (the token is a
 * credential, never advertised) and its route is deliberately still open to
 * any string, so it keeps the substituted form.
 */
function exampleFor(pattern: string): string {
  const asRegExp = patternToRegExp(pattern);
  const advertised = sitemapEntries().map((e) => e.path).find((p) => asRegExp.test(p));
  if (advertised) return advertised;
  // The demo's dynamic families are no longer advertised anywhere (it is
  // noindex), so a real slug comes from the same closed lists the server
  // validates against — still derived, never re-typed.
  const demoConcrete = [
    ...SERVICE_SLUGS.map((s) => `/demo/services/${s}`),
    ...AREA_SLUGS.map((s) => `/demo/service-areas/${s}`),
    ...BLOG_SLUGS.map((s) => `/demo/blog/${s}`),
  ];
  const real = demoConcrete.find((p) => asRegExp.test(p));
  return real ?? pattern.replace(/:[^/]+\*?/g, "sample");
}

/**
 * A wouter pattern to a RegExp that matches the real paths it renders:
 * `/services/:slug` -> /^\/services\/[^/]+$/.
 *
 * Replaces a hardcoded `/^\/(services|blog)\/.+$/` that collapsed concrete
 * sitemap slugs back onto their pattern. That list was itself a fourth copy
 * of the route table, and it drifted the first time a new route family was
 * added: `/service-areas/sebago-lake` read as unrenderable because the
 * alternation had never heard of it, while App.tsx rendered it perfectly.
 * Deriving the patterns means the next family needs no edit here.
 */
function patternToRegExp(pattern: string): RegExp {
  const source = pattern
    .split("/")
    .map((seg) =>
      seg.startsWith(":") ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    )
    .join("/");
  return new RegExp(`^${source}$`);
}

describe("route table drift", () => {
  it("finds the routes in both routers at all", () => {
    // If the JSX is ever reformatted so this regex stops matching, every
    // other assertion here would vacuously pass. Fail loudly instead.
    const routes = routesDeclaredInApp();
    expect(routes.length).toBeGreaterThanOrEqual(15);
    // one from each router, so neither file can silently stop being read
    expect(routes).toContain("/");
    expect(routes).toContain("/systems");
    expect(routes).toContain("/demo/sms");
  });

  it("still mounts the demo", () => {
    // Dropped from the coverage list above because it is a deliberate
    // catch-all, so it needs its own assertion or nothing checks the demo is
    // reachable at all.
    expect(routesIn(APP_TSX)).toContain("/demo/*");
    expect(routesIn(APP_TSX)).toContain("/demo");
  });

  it("SPA_ROUTES covers every route declared in App.tsx", () => {
    const missing = routesDeclaredInApp()
      .map((pattern) => ({ pattern, example: exampleFor(pattern) }))
      .filter(({ example }) => !isSpaRoute(example))
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
    const patterns = routesDeclaredInApp().map(patternToRegExp);
    const unrenderable = sitemapEntries()
      .map((e) => e.path)
      .filter((p) => !patterns.some((re) => re.test(p)));

    expect(unrenderable).toEqual([]);
  });
});
