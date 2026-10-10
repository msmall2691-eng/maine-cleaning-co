import { describe, it, expect } from "vitest";
import {
  areaPages,
  AREA_PAGE_SLUGS,
  areaTownRows,
  areaVisitClaim,
  areaVisitTotal,
  townRank,
} from "../area-pages";
import { serviceVisits, maxVisits, visitsFor, rankOf } from "../service-visits";
import { ALL_COMMUNITIES } from "../service-areas";
import { COVERAGE_INDEX } from "../coverage-index";
import { areaPageSeo, CANONICAL_ORIGIN } from "../seo";
import { AREA_SLUGS } from "../../../../server/lib/sitemap";

describe("area pages", () => {
  /**
   * Same drift guard as SERVICE_SLUGS: the sitemap lists these slugs by hand
   * because it is a Node bundle with no business importing client page data.
   * The cost of that choice is drift, and this is what pays it.
   */
  it("are advertised by the sitemap, exactly", () => {
    expect([...AREA_SLUGS].sort()).toEqual(AREA_PAGE_SLUGS);
  });

  it("key each entry by its own slug", () => {
    for (const [slug, area] of Object.entries(areaPages)) {
      expect(area.slug).toBe(slug);
    }
  });

  /**
   * The load-bearing test in this file. Naming a town on a landing page
   * advertises it, and the roster in service-areas.ts is what we have decided
   * to advertise. A page naming a town the roster omits makes a promise the
   * business has not agreed to — Sebago, Bridgton and Harrison are in the
   * lookup index but deliberately not on the roster, and it would be very
   * easy to reach for them while writing about Sebago Lake.
   */
  it("name only towns the roster already advertises", () => {
    for (const area of Object.values(areaPages)) {
      for (const town of area.towns) {
        expect(ALL_COMMUNITIES, `${area.slug} names ${town}`).toContain(town);
      }
    }
  });

  /** And every named town has to be findable by the coverage box. */
  it("name only towns a visitor can look up", () => {
    const indexed = new Set(COVERAGE_INDEX.map((c) => c.name));
    for (const area of Object.values(areaPages)) {
      for (const town of area.towns) {
        expect(indexed, `${area.slug} names ${town}`).toContain(town);
      }
    }
  });

  it("give each page enough substance to be worth indexing", () => {
    for (const area of Object.values(areaPages)) {
      // Not arbitrary: a page thinner than this is the templated doorway page
      // the module's own docstring refuses to ship.
      expect(area.towns.length, area.slug).toBeGreaterThanOrEqual(4);
      expect(area.localDetail.length, area.slug).toBeGreaterThanOrEqual(3);
      expect(area.faqs.length, area.slug).toBeGreaterThanOrEqual(3);
      expect(area.lede.length, area.slug).toBeGreaterThan(150);
      for (const detail of area.localDetail) {
        expect(detail.body.length, `${area.slug}/${detail.title}`).toBeGreaterThan(120);
      }
    }
  });

  it("keep descriptions in the range a result shows", () => {
    for (const area of Object.values(areaPages)) {
      expect(area.seoDescription.length, area.slug).toBeGreaterThan(70);
      expect(area.seoDescription.length, area.slug).toBeLessThanOrEqual(165);
    }
  });

  it("link only to services that exist", async () => {
    const { servicesData } = await import("../services-data");
    for (const area of Object.values(areaPages)) {
      for (const svc of area.relatedServices) {
        const slug = svc.href.replace(/^\/services\//, "");
        expect(Object.keys(servicesData), `${area.slug} links ${svc.href}`).toContain(slug);
      }
    }
  });
});

describe("Sebago Lake", () => {
  const sebago = areaPages["sebago-lake"];

  /**
   * The page's tagline is a factual claim about the business, so it is held to
   * the data rather than to taste. If the booking history shifts and Windham,
   * Naples and Casco stop being ranks 3-5, this fails and the sentence has to
   * change — which is the whole point of deriving the page's numbers from
   * service-visits.ts instead of typing them in.
   */
  it("really does have three of the five busiest towns", () => {
    expect(sebago.tagline).toBe("Three of our five busiest towns are on this lake.");
    const ranks = ["Windham", "Naples", "Casco"].map((t) => townRank(t));
    expect(ranks).toEqual([3, 4, 5]);
    for (const rank of ranks) {
      expect(rank).toBeLessThanOrEqual(5);
    }
  });

  it("claims a visit total that is real and conservative", () => {
    const exact = sebago.towns.reduce((n, t) => n + (visitsFor(t) ?? 0), 0);
    const claimed = areaVisitTotal(sebago);
    // Floored to the nearest hundred, so the claim stays true as the real
    // figure grows and never overstates it.
    expect(claimed).toBeLessThanOrEqual(exact);
    expect(exact - claimed).toBeLessThan(100);
    expect(areaVisitClaim(sebago)).toMatch(/^[\d,]+\+$/);
  });

  it("lists its towns busiest first", () => {
    const rows = areaTownRows(sebago);
    const counts = rows.map((r) => r.visits ?? -1);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
    expect(rows[0].name).toBe("Windham");
  });

  it("points at the camp service, which is the page's reason to exist", () => {
    expect(sebago.relatedServices.map((s) => s.href)).toContain("/services/camp-opening-closing");
  });

  it("gets its own canonical and area schema", () => {
    const meta = areaPageSeo(sebago);
    expect(meta.canonicalPath).toBe("/service-areas/sebago-lake");

    const schema = meta.jsonLd as Array<Record<string, any>>;
    expect(schema.map((n) => n["@type"])).toEqual(["Service", "BreadcrumbList", "FAQPage"]);

    const service = schema[0];
    expect(service.provider).toEqual({ "@id": `${CANONICAL_ORIGIN}/#organization` });
    // Towns, not counties: a local search has town granularity, and the
    // counties are already on the LocalBusiness node in index.html.
    expect(service.areaServed.map((a: any) => a.name)).toEqual(sebago.towns);

    const crumbs = schema[1];
    expect(crumbs.itemListElement.map((i: any) => i.item)).toEqual([
      "https://www.maineclean.co/",
      "https://www.maineclean.co/service-areas",
      "https://www.maineclean.co/service-areas/sebago-lake",
    ]);

    expect(schema[2].mainEntity).toHaveLength(sebago.faqs.length);
  });
});

describe("service-visits", () => {
  /**
   * Extracted from ServiceAreaMap.tsx so the area pages could quote it. The
   * map scales its bars and node radii by maxVisits, so an extraction that
   * lost or reordered a row would change the drawing silently.
   */
  it("kept the map's data intact", () => {
    expect(serviceVisits).toHaveLength(20);
    expect(serviceVisits[0]).toMatchObject({ name: "Portland", visits: 848 });
    expect(maxVisits).toBe(848);
    expect(maxVisits).toBe(Math.max(...serviceVisits.map((c) => c.visits)));
  });

  it("names each town once, with usable coordinates", () => {
    const names = serviceVisits.map((c) => c.name);
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
    for (const c of serviceVisits) {
      expect(c.lat, c.name).toBeGreaterThan(42.5);
      expect(c.lat, c.name).toBeLessThan(45.5);
      expect(c.visits, c.name).toBeGreaterThan(0);
    }
  });

  it("tracks only towns we advertise", () => {
    for (const c of serviceVisits) {
      expect(ALL_COMMUNITIES, c.name).toContain(c.name);
    }
  });

  it("agrees with itself on ranking", () => {
    expect(rankOf("Portland")).toBe(1);
    expect(rankOf("Nowhere")).toBeUndefined();
    expect(visitsFor("Nowhere")).toBeUndefined();
    // area-pages re-exports its own rank helper; they must not disagree.
    expect(townRank("Windham")).toBe(rankOf("Windham"));
  });
});
