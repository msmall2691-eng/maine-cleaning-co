import { describe, it, expect } from "vitest";
import { isSpaRoute, prerenderedFileFor } from "../static";
import { AREA_SLUGS, BLOG_SLUGS, SERVICE_SLUGS, sitemapEntries } from "../lib/sitemap";

// The SPA catch-all used to answer 200 for every path. Known client routes
// still get 200; anything else gets the shell with a real 404 status.
describe("isSpaRoute", () => {
  it.each([
    "/", "/book", "/booking/manage/abc123", "/portal", "/portal/login",
    "/portal/reset-password", "/about", "/how-it-works", "/service-areas",
    "/services", "/short-term-rentals", "/blog", "/privacy", "/terms",
    "/sms", "/about/",
  ])("%s is a known route", (p) => {
    expect(isSpaRoute(p)).toBe(true);
  });

  // Real slugs, read from the same lists the server validates against, so
  // adding or renaming one can't leave this test asserting a dead URL.
  it.each(SERVICE_SLUGS.map((s) => `/services/${s}`))("%s is a known route", (p) => {
    expect(isSpaRoute(p)).toBe(true);
  });

  it.each(AREA_SLUGS.map((s) => `/service-areas/${s}`))("%s is a known route", (p) => {
    expect(isSpaRoute(p)).toBe(true);
  });

  it.each(BLOG_SLUGS.map((s) => `/blog/${s}`))("%s is a known route", (p) => {
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
    "/services/not-a-service",
    "/services/residential-cleaning",
    "/service-areas/not-a-place",
    "/service-areas/portland",
    "/blog/not-a-post",
    "/blog/some-post",
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
    "/booking/manage/anything-at-all",
    "/booking/manage/9f2c1e4a-0000-4444-8888-aaaabbbbcccc",
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
  it.each(["/services/not-a-service", "/blog/not-a-post", "/service-areas/not-a-place"])(
    "has no pre-rendered file for %s",
    (p) => {
      expect(prerenderedFileFor(p)).toBeNull();
    },
  );

  it("still resolves a real page", () => {
    expect(prerenderedFileFor(`/services/${SERVICE_SLUGS[0]}`)).toBe(`services/${SERVICE_SLUGS[0]}.html`);
  });
});
