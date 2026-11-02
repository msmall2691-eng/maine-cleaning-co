import { describe, it, expect } from "vitest";
import { isSpaRoute, prerenderedFileFor } from "../static";
import { AREA_SLUGS, BLOG_SLUGS, SERVICE_SLUGS, sitemapEntries } from "../lib/sitemap";
import { legacyTargetFor } from "../legacyRedirects";

// The SPA catch-all used to answer 200 for every path. Known client routes
// still get 200; anything else gets the shell with a real 404 status.
describe("isSpaRoute", () => {
  // The business site.
  it.each([
    "/", "/systems", "/proof", "/process", "/contact", "/privacy", "/systems/",
  ])("%s is a known route", (p) => {
    expect(isSpaRoute(p)).toBe(true);
  });

  // The demo — the cleaning company's system, kept whole under /demo.
  it.each([
    "/demo", "/demo/book", "/demo/booking/manage/abc123", "/demo/portal",
    "/demo/portal/login", "/demo/portal/reset-password", "/demo/about",
    "/demo/how-it-works", "/demo/service-areas", "/demo/services",
    "/demo/short-term-rentals", "/demo/blog", "/demo/privacy", "/demo/terms",
    "/demo/sms", "/demo/about/",
  ])("%s is a known route", (p) => {
    expect(isSpaRoute(p)).toBe(true);
  });

  /**
   * The cleaning site's OLD root-level URLs. They are not routes any more —
   * those pages moved under /demo — but they must not simply 404 either:
   * server/legacyRedirects.ts answers them with a 301 to the /demo copy, so
   * the hundreds of inbound links and index entries still land somewhere
   * real. This asserts the router no longer claims them, which is what makes
   * the redirect reachable.
   */
  it.each([
    "/book", "/about", "/how-it-works", "/service-areas", "/services",
    "/short-term-rentals", "/blog", "/terms", "/sms", "/portal",
  ])("%s is no longer a route here (it 301s to /demo)", (p) => {
    expect(isSpaRoute(p)).toBe(false);
    expect(legacyTargetFor(p)).toBe(`/demo${p}`);
  });

  it("does not redirect the two paths that still mean something here", () => {
    // / is the new homepage; /privacy is the BUSINESS's privacy page, not
    // the cleaning company's (which is still at /demo/privacy).
    expect(legacyTargetFor("/")).toBeNull();
    expect(legacyTargetFor("/privacy")).toBeNull();
    expect(legacyTargetFor("/demo/about")).toBeNull();
  });

  it("carries the slug across on a legacy deep link", () => {
    expect(legacyTargetFor("/services/deep-cleaning")).toBe("/demo/services/deep-cleaning");
    expect(legacyTargetFor("/service-areas/sebago-lake")).toBe("/demo/service-areas/sebago-lake");
    expect(legacyTargetFor("/blog/spring-cleaning-checklist")).toBe("/demo/blog/spring-cleaning-checklist");
  });

  // Real slugs, read from the same lists the server validates against, so
  // adding or renaming one can't leave this test asserting a dead URL.
  it.each(SERVICE_SLUGS.map((s) => `/demo/services/${s}`))("%s is a known route", (p) => {
    expect(isSpaRoute(p)).toBe(true);
  });

  it.each(AREA_SLUGS.map((s) => `/demo/service-areas/${s}`))("%s is a known route", (p) => {
    expect(isSpaRoute(p)).toBe(true);
  });

  it.each(BLOG_SLUGS.map((s) => `/demo/blog/${s}`))("%s is a known route", (p) => {
    expect(isSpaRoute(p)).toBe(true);
  });

  it.each([
    "/zzz-garbage", "/about/nested/too-deep", "/services/a/b", "/privacy-policy",
    "/booking/manage", "/admin", "/wp-login.php",
  ])("%s is not a known route", (p) => {
    expect(isSpaRoute(p)).toBe(false);
  });

  /**
   * The soft-404 case, and the reason the dynamic families are validated
   * against real slug lists rather than `[^/]+`.
   *
   * These used to answer HTTP 200 with the empty SPA shell: the page a human
   * saw said "Service Not Found" while the status line told every crawler the
   * page existed. Google reports those in Search Console and keeps spending
   * crawl budget re-fetching them, and a mistyped link in the wild never
   * surfaces as a broken one.
   */
  it.each([
    "/demo/services/not-a-service",
    "/demo/services/residential-cleaning",
    "/demo/service-areas/not-a-place",
    "/demo/service-areas/portland",
    "/demo/blog/not-a-post",
    "/demo/blog/some-post",
  ])("%s is a soft 404 and must not answer 200", (p) => {
    expect(isSpaRoute(p)).toBe(false);
  });

  /**
   * The booking link stays open on purpose: the token in the path is the
   * customer's only credential and can be any string, so the server cannot
   * tell a wrong one from a right one without a database round trip. The page
   * itself handles a bad token.
   */
  it.each([
    "/demo/booking/manage/anything-at-all",
    "/demo/booking/manage/9f2c1e4a-0000-4444-8888-aaaabbbbcccc",
  ])("%s stays servable — the token is a credential, not a slug", (p) => {
    expect(isSpaRoute(p)).toBe(true);
  });

  /** A slug containing a regex metacharacter must be matched literally. */
  it("treats a dotted path as a typo, not a wildcard", () => {
    expect(isSpaRoute("/services/residentialxcleaning")).toBe(false);
    expect(isSpaRoute("/services/residential.")).toBe(false);
  });

  /**
   * The invariant the whole thing exists to protect: we never advertise a URL
   * we then answer 404 for. routeTableDrift.test.ts asserts the same from the
   * other direction; this is cheap enough to assert in both places.
   */
  it("serves every URL the sitemap advertises", () => {
    const notServed = sitemapEntries().map((e) => e.path).filter((p) => !isSpaRoute(p));
    expect(notServed).toEqual([]);
  });
});

describe("prerenderedFileFor", () => {
  /**
   * Unknown slugs now resolve to no file at all, rather than naming one the
   * build never wrote. Same outcome either way — the shell gets served — but
   * the status is 404 now, so the two have to agree.
   */
  it.each([
    "/demo/services/not-a-service",
    "/demo/blog/not-a-post",
    "/demo/service-areas/not-a-place",
  ])("has no pre-rendered file for %s", (p) => {
    expect(prerenderedFileFor(p)).toBeNull();
  });

  /**
   * The demo is noindex, so the build writes nothing for it. Resolving a file
   * name here anyway would cost a stat() per request for a file that is never
   * going to exist.
   */
  it.each([`/demo/services/${SERVICE_SLUGS[0]}`, "/demo", "/demo/about"])(
    "writes no pre-rendered file for the demo route %s",
    (p) => {
      expect(prerenderedFileFor(p)).toBeNull();
    },
  );

  it("still resolves a real page", () => {
    expect(prerenderedFileFor("/")).toBe("index.html");
    expect(prerenderedFileFor("/systems")).toBe("systems.html");
    expect(prerenderedFileFor("/proof")).toBe("proof.html");
  });
});
