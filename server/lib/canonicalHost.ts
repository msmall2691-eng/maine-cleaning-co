/**
 * Send every request for the site to one host, with a 301.
 *
 * www.maineclean.co and maineclean.co both answered 200 with no redirect
 * between them. To a search engine those are two sites serving identical
 * content: links, crawl budget and ranking signals split across the pair,
 * and which one appears in results is Google's guess rather than our
 * declaration. The `rel=canonical` in every page now names www, but a
 * canonical tag is a hint — a 301 is not.
 *
 * Deliberately conservative about what it will redirect. The alias set is
 * derived from the canonical host alone (the apex of a www host, or the www
 * form of an apex), so a request arriving on anything else — localhost, a
 * *.railway.app domain, a preview URL, Railway's internal healthcheck — is
 * passed straight through. A middleware that redirected every unrecognised
 * host would be one typo away from a redirect loop on the live site.
 */

import type { RequestHandler } from "express";

/** Strip the port: "maineclean.co:8080" -> "maineclean.co". */
function hostnameOf(host: string): string {
  return host.replace(/:\d+$/, "").toLowerCase();
}

/**
 * The hosts that should 301 to `canonicalHost`.
 *
 * For "www.maineclean.co" that is "maineclean.co", and vice versa. Nothing
 * else: an arbitrary host could be a legitimate deployment URL, and guessing
 * is how you break one.
 */
export function aliasesOf(canonicalHost: string): string[] {
  const host = hostnameOf(canonicalHost);
  if (host.startsWith("www.")) return [host.slice(4)];
  // An apex canonical: redirect its www form to it.
  return [`www.${host}`];
}

/**
 * Reads the canonical host from PUBLIC_SITE_URL, falling back to the same
 * default as CANONICAL_ORIGIN in server/lib/sitemap.ts — the host the
 * sitemap advertises and the pages name is necessarily the host to redirect
 * to, so both read one setting.
 */
export function canonicalHostFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.PUBLIC_SITE_URL || "https://www.maineclean.co";
  try {
    return hostnameOf(new URL(raw).host);
  } catch {
    return "www.maineclean.co";
  }
}

export interface CanonicalHostOptions {
  canonicalHost: string;
  /**
   * Upgrade http to https on the canonical host. Off in development, where
   * there is no TLS to upgrade to and this would make the site unreachable.
   */
  forceHttps: boolean;
}

export function canonicalHostRedirect({ canonicalHost, forceHttps }: CanonicalHostOptions): RequestHandler {
  const aliases = new Set(aliasesOf(canonicalHost));

  return (req, res, next) => {
    // Only navigations. A 301 on a POST would turn a form submission into a
    // GET and lose the body; browsers and bots alike treat it as a trap.
    if (req.method !== "GET" && req.method !== "HEAD") return next();

    // The API is addressed by clients that were given a specific host —
    // including Railway's healthcheck, which does not use the public one.
    if (req.path.startsWith("/api/")) return next();

    const host = hostnameOf(req.headers.host || "");
    if (!host) return next();

    const wrongHost = aliases.has(host);
    // req.protocol honours x-forwarded-proto because index.ts sets
    // "trust proxy" — Railway terminates TLS upstream, so without that this
    // would see http for every request and redirect in a loop.
    const insecure = forceHttps && host === canonicalHost && req.protocol !== "https";

    if (!wrongHost && !insecure) return next();

    res.redirect(301, `https://${canonicalHost}${req.originalUrl}`);
  };
}
