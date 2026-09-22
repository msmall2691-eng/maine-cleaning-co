import { describe, it, expect } from "vitest";
import {
  buildRobotsTxt,
  buildSitemap,
  sitemapEntries,
  toW3CDate,
  SERVICE_SLUGS,
  DISALLOWED,
} from "../sitemap";
import { servicesData } from "@/lib/services-data";
import { blogPosts } from "@/lib/blog-data";

const ORIGIN = "https://www.maineclean.co";

describe("SERVICE_SLUGS", () => {
  /**
   * The point of this file. server/lib/sitemap.ts lists service slugs by hand
   * rather than importing services-data.ts, because that module pulls icon
   * components from lucide-react into what is otherwise a Node bundle. The
   * cost of that choice is drift, and this is what pays it: add a service and
   * forget the sitemap, and CI says so here instead of the page quietly never
   * being indexed.
   */
  it("matches the keys of servicesData exactly", () => {
    expect([...SERVICE_SLUGS].sort()).toEqual(Object.keys(servicesData).sort());
  });
});

describe("toW3CDate", () => {
  it("converts the human dates blog-data.ts actually uses", () => {
    expect(toW3CDate("March 15, 2026")).toBe("2026-03-15");
    expect(toW3CDate("February 28, 2026")).toBe("2026-02-28");
  });

  it("returns undefined rather than an invalid date", () => {
    // An unparseable <lastmod> invalidates the whole <url> entry, so the
    // builder must be able to omit it. Guessing, or substituting the build
    // time, would tell crawlers every post changed on every deploy.
    expect(toW3CDate("sometime last spring")).toBeUndefined();
    expect(toW3CDate("")).toBeUndefined();
  });
});

describe("buildSitemap", () => {
  const xml = buildSitemap(ORIGIN);

  it("is a well-formed urlset", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.trimEnd().endsWith("</urlset>")).toBe(true);
    // Every opened tag closed.
    expect((xml.match(/<url>/g) ?? []).length).toBe((xml.match(/<\/url>/g) ?? []).length);
  });

  it("lists the home page and the booking page", () => {
    expect(xml).toContain(`<loc>${ORIGIN}/</loc>`);
    expect(xml).toContain(`<loc>${ORIGIN}/book</loc>`);
  });

  it("lists every service detail page", () => {
    for (const slug of Object.keys(servicesData)) {
      expect(xml).toContain(`<loc>${ORIGIN}/services/${slug}</loc>`);
    }
  });

  it("lists every blog post, so a new post cannot be missed", () => {
    for (const post of blogPosts) {
      expect(xml).toContain(`<loc>${ORIGIN}/blog/${post.id}</loc>`);
    }
  });

  it("never advertises the capability URL or the signed-in portal", () => {
    // /booking/manage/:token is the customer's only credential for that
    // booking. Publishing one in a sitemap would hand it to every crawler.
    expect(xml).not.toContain("/booking/manage");
    expect(xml).not.toContain("/portal");
  });

  it("uses the canonical www origin, not a bare apex", () => {
    // Both hosts answer 200 with no redirect between them, and
    // client/index.html names www as canonical. A sitemap advertising apex
    // URLs would contradict the canonical tag on the pages it points at.
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) expect(loc.startsWith(`${ORIGIN}/`)).toBe(true);
  });

  it("emits no duplicate URLs", () => {
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(new Set(locs).size).toBe(locs.length);
  });

  it("emits only valid W3C lastmod dates", () => {
    for (const [, d] of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("covers every entry sitemapEntries reports", () => {
    expect((xml.match(/<url>/g) ?? []).length).toBe(sitemapEntries().length);
  });
});

describe("buildRobotsTxt", () => {
  const txt = buildRobotsTxt(ORIGIN);

  it("points at the sitemap with an absolute URL", () => {
    // Relative Sitemap: lines are ignored; the spec requires an absolute URL.
    expect(txt).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  it("applies to all crawlers", () => {
    expect(txt).toContain("User-agent: *");
  });

  it("disallows the API, the portal and the booking capability URLs", () => {
    for (const path of DISALLOWED) {
      expect(txt).toContain(`Disallow: ${path}`);
    }
  });

  it("does not disallow the whole site", () => {
    // `Disallow: /` on its own line would deindex everything. Guarding it
    // because it is one stray character away from the intended `Disallow: /api/`.
    expect(txt.split("\n").some((line) => line.trim() === "Disallow: /")).toBe(false);
  });
});
