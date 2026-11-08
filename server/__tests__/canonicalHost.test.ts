import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import {
  aliasesOf,
  canonicalHostFromEnv,
  canonicalHostRedirect,
} from "../lib/canonicalHost";

/**
 * www.maineclean.co and maineclean.co both answered 200 with no redirect, so
 * search engines saw two sites with identical content and split every signal
 * between them. The canonical tags name www; this middleware makes it binding.
 */
function run(
  req: Partial<Request> & { headers?: Record<string, string> },
  opts: { canonicalHost?: string; forceHttps?: boolean } = {},
) {
  const handler = canonicalHostRedirect({
    canonicalHost: opts.canonicalHost ?? "www.maineclean.co",
    forceHttps: opts.forceHttps ?? true,
  });
  const next = vi.fn();
  const redirect = vi.fn();
  handler(
    { method: "GET", path: "/", originalUrl: "/", protocol: "https", headers: {}, ...req } as Request,
    { redirect } as unknown as Response,
    next,
  );
  return { next, redirect };
}

describe("aliasesOf", () => {
  it("maps a www canonical to its apex", () => {
    expect(aliasesOf("www.maineclean.co")).toEqual(["maineclean.co"]);
  });

  it("maps an apex canonical to its www form", () => {
    expect(aliasesOf("maineclean.co")).toEqual(["www.maineclean.co"]);
  });

  /**
   * Only ever the one counterpart. A middleware that redirected any
   * unrecognised host would be one typo away from a loop on the live site,
   * and would break every *.railway.app and preview URL on the way there.
   */
  it("claims nothing else", () => {
    expect(aliasesOf("www.maineclean.co")).toHaveLength(1);
  });
});

describe("canonicalHostFromEnv", () => {
  it("defaults to the host the sitemap and canonical tags name", () => {
    expect(canonicalHostFromEnv({} as NodeJS.ProcessEnv)).toBe("www.maineclean.co");
  });

  it("follows PUBLIC_SITE_URL, which the sitemap reads too", () => {
    expect(canonicalHostFromEnv({ PUBLIC_SITE_URL: "https://staging.example.com" } as NodeJS.ProcessEnv))
      .toBe("staging.example.com");
  });

  it("falls back rather than throwing on an unparseable value", () => {
    expect(canonicalHostFromEnv({ PUBLIC_SITE_URL: "not a url" } as NodeJS.ProcessEnv))
      .toBe("www.maineclean.co");
  });
});

describe("canonicalHostRedirect", () => {
  it("301s the apex to www, keeping the path and query", () => {
    const { redirect } = run({
      headers: { host: "maineclean.co" },
      originalUrl: "/services/deep-cleaning?utm_source=gbp",
    });
    expect(redirect).toHaveBeenCalledWith(301, "https://www.maineclean.co/services/deep-cleaning?utm_source=gbp");
  });

  it("301 rather than 302 — a temporary redirect transfers no ranking signal", () => {
    const { redirect } = run({ headers: { host: "maineclean.co" } });
    expect(redirect.mock.calls[0][0]).toBe(301);
  });

  it("leaves a request already on the canonical host alone", () => {
    const { next, redirect } = run({ headers: { host: "www.maineclean.co" } });
    expect(next).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("upgrades http to https on the canonical host", () => {
    const { redirect } = run({
      headers: { host: "www.maineclean.co" },
      protocol: "http",
      originalUrl: "/book",
    });
    expect(redirect).toHaveBeenCalledWith(301, "https://www.maineclean.co/book");
  });

  it("does not force https when told not to — dev has none to offer", () => {
    const { next } = run(
      { headers: { host: "www.maineclean.co" }, protocol: "http" },
      { forceHttps: false },
    );
    expect(next).toHaveBeenCalled();
  });

  /**
   * Hosts we do not recognise pass through: localhost, Railway's own domain
   * and any preview URL have to keep working, and the canonical tags handle
   * the duplicate-content side of those on their own.
   */
  it.each(["localhost", "127.0.0.1", "maine-cleaning-co-production.up.railway.app"])(
    "passes %s through untouched",
    (host) => {
      const { next, redirect } = run({ headers: { host } });
      expect(next).toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    },
  );

  /**
   * A 301 on a POST turns the submission into a GET and drops the body, so
   * every booking and quote form on the apex would silently fail.
   */
  it.each(["POST", "PUT", "PATCH", "DELETE"])("never redirects a %s", (method) => {
    const { next, redirect } = run({ method, headers: { host: "maineclean.co" } });
    expect(next).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  /**
   * The API is addressed by clients given a specific host — including
   * Railway's healthcheck, which does not use the public one and would see
   * the deploy as failed if it got a redirect instead of 200.
   */
  it("never redirects an /api request", () => {
    const { next, redirect } = run({
      headers: { host: "maineclean.co" },
      path: "/api/health",
      originalUrl: "/api/health",
    });
    expect(next).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("passes through a request with no Host header at all", () => {
    const { next } = run({ headers: {} });
    expect(next).toHaveBeenCalled();
  });
});
