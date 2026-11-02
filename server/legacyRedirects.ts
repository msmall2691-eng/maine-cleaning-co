import type { Express, Request, Response, NextFunction } from "express";

/**
 * The cleaning site's old URLs, redirected to where those pages live now.
 *
 * Until the pivot this app WAS the cleaning company, and its pages sat at the
 * root: /services, /about, /service-areas/sebago-lake and so on. Those URLs
 * are in Google's index, in Facebook posts, on business cards and in a few
 * hundred inbound links. The pages themselves still exist and still work —
 * they are the demo now — they have simply moved under /demo.
 *
 * Answering 404 for all of them would be the lazy option and the wrong one:
 * it breaks every inbound link and throws away the only thing the old site
 * still has going for it. A 301 keeps those visitors landing on something
 * real, and the demo's own `noindex` is what actually removes the pages from
 * the index — a redirect to a noindex page de-indexes the source URL too,
 * which is exactly the outcome we want.
 *
 * 301 rather than 302 on purpose: this move is permanent, and a temporary
 * redirect would leave the old URLs in the index indefinitely.
 *
 * ── Not redirected ──
 *  /privacy  — the business site has its OWN privacy page, and it is the one
 *              that describes what this site actually does. The cleaning
 *              company's policy is still served at /demo/privacy.
 *  /         — obviously. That is the new homepage.
 */

/** Exact paths that move wholesale under /demo. */
const LEGACY_EXACT = [
  "/book",
  "/about",
  "/how-it-works",
  "/service-areas",
  "/services",
  "/short-term-rentals",
  "/blog",
  "/terms",
  "/sms",
  "/portal",
  "/portal/login",
  "/portal/reset-password",
] as const;

/**
 * Path prefixes whose whole subtree moves. The slug is carried across
 * untouched, so /services/deep-cleaning lands on /demo/services/deep-cleaning
 * rather than dumping everyone on an index page — a redirect that loses the
 * specific page is barely better than a 404.
 */
const LEGACY_PREFIXES = [
  "/services/",
  "/service-areas/",
  "/blog/",
  "/booking/manage/",
] as const;

/** The /demo path a legacy URL should move to, or null if it isn't one. */
export function legacyTargetFor(pathname: string): string | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (p === "/" || p === "/privacy") return null;
  if (p.startsWith("/demo")) return null;
  if ((LEGACY_EXACT as readonly string[]).includes(p)) return `/demo${p}`;
  if (LEGACY_PREFIXES.some((prefix) => p.startsWith(prefix) && p.length > prefix.length)) {
    return `/demo${p}`;
  }
  return null;
}

export function registerLegacyRedirects(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // GET and HEAD only. A 301 on a POST is allowed to be replayed as a GET
    // by the client, which would silently turn a form submission into a
    // navigation — and the API lives under /api, which never matches here.
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const target = legacyTargetFor(req.path);
    if (!target) return next();
    // Query strings are preserved: /book?service=deep-clean still arrives
    // with its preselected category.
    const qs = req.originalUrl.includes("?")
      ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
      : "";
    res.redirect(301, target + qs);
  });
}
