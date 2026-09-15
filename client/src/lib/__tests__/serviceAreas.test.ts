import { describe, it, expect } from "vitest";
import { serviceRegions, ALL_COMMUNITIES, TOTAL_COMMUNITIES } from "../service-areas";
import { COVERAGE_INDEX } from "../coverage-index";
import { COMMUNITIES_SERVED, CLEANS_SINCE_2018, CLEANS_SINCE_2018_PLAIN } from "../company-stats";

/**
 * These numbers had drifted into three answers to the same question because
 * every page typed its own. The point of these tests is that the drift can't
 * come back: the count is derived, and the two rosters have to agree.
 */
describe("service-area roster", () => {
  it("names each community exactly once", () => {
    const all = serviceRegions.flatMap((r) => r.communities);
    const dupes = all.filter((c, i) => all.indexOf(c) !== i);
    expect(dupes).toEqual([]);
    expect(ALL_COMMUNITIES).toHaveLength(all.length);
  });

  it("derives the displayed count from the roster rather than a literal", () => {
    expect(TOTAL_COMMUNITIES).toBe(ALL_COMMUNITIES.length);
    expect(COMMUNITIES_SERVED).toBe(`${ALL_COMMUNITIES.length}+`);
  });

  it("can be looked up: every advertised community is in the coverage index", () => {
    // The checker matches on typed name, so a town we advertise but don't
    // index returns nothing to a visitor who lives there. "Casco Bay Islands"
    // is a grouping label, not a place — there is nothing to geocode.
    const indexed = new Set(COVERAGE_INDEX.map((c) => c.name));
    const missing = ALL_COMMUNITIES.filter(
      (c) => c !== "Casco Bay Islands" && !indexed.has(c),
    );
    expect(missing).toEqual([]);
  });

  it("gives every indexed community usable coordinates", () => {
    for (const c of COVERAGE_INDEX) {
      // Southern Maine, generously bounded.
      expect(c.lat, c.name).toBeGreaterThan(42.5);
      expect(c.lat, c.name).toBeLessThan(45.5);
      expect(c.lng, c.name).toBeGreaterThan(-71.5);
      expect(c.lng, c.name).toBeLessThan(-68.5);
    }
  });

  it("indexes each community once", () => {
    const names = COVERAGE_INDEX.map((c) => c.name);
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });
});

describe("company stats", () => {
  it("states the lifetime cleans figure once, conservatively", () => {
    // /about claimed 5,000+ while /service-areas claimed 4,715+. Both are "+"
    // claims, so the lower one is the only one that can't be false given the
    // other. If this changes it should be because there's a real count.
    expect(CLEANS_SINCE_2018).toBe("4,715+");
    // The prose and tile forms are the same number, so they can't disagree.
    expect(CLEANS_SINCE_2018).toBe(`${CLEANS_SINCE_2018_PLAIN}+`);
  });
});
