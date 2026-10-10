/**
 * Visits per town — the busiest places we work, with real counts.
 *
 * Extracted from ServiceAreaMap.tsx so it has more than one reader. The map
 * plots it; the area pages in area-pages.ts quote it. Before this, a page
 * wanting to say "Windham is our third busiest town" had to retype the
 * number, which is how the four separate answers to "how many communities"
 * described in company-stats.ts came about in the first place.
 *
 * This is a SUBSET: the busiest towns, not all of them. The full roster is
 * lib/service-areas.ts. Summing these therefore understates the lifetime
 * total, which is why company-stats.ts keeps that figure separately rather
 * than deriving one here — see the note on CLEANS_COUNT.
 *
 * The counts come from the booking history and are not derivable from
 * anything in this repo, so they go stale the same way CLEANS_COUNT does.
 * Anything quoting them should read conservatively ("1,800+", not "1,855").
 */

/** Which of our services a town actually buys, for the map's filter. */
export type ServiceType = "residential" | "commercial" | "vacation";

export type ServiceVisitCity = {
  name: string;
  lat: number;
  lng: number;
  visits: number;
  services: ServiceType[];
};

export const serviceVisits: ServiceVisitCity[] = [
  { name: "Portland", lat: 43.6591, lng: -70.2568, visits: 848, services: ["residential", "commercial"] },
  { name: "Scarborough", lat: 43.5781, lng: -70.3222, visits: 826, services: ["residential", "commercial"] },
  { name: "Windham", lat: 43.7985, lng: -70.4039, visits: 656, services: ["residential"] },
  { name: "Naples", lat: 43.9781, lng: -70.6075, visits: 641, services: ["residential", "vacation"] },
  { name: "Casco", lat: 43.9580, lng: -70.5175, visits: 335, services: ["residential", "vacation"] },
  { name: "Falmouth", lat: 43.7298, lng: -70.2378, visits: 235, services: ["residential", "commercial"] },
  { name: "Old Orchard Beach", lat: 43.5168, lng: -70.3773, visits: 218, services: ["residential", "vacation"] },
  { name: "South Portland", lat: 43.6415, lng: -70.2580, visits: 122, services: ["residential", "commercial"] },
  { name: "Kennebunk", lat: 43.3884, lng: -70.5449, visits: 86, services: ["residential", "vacation"] },
  { name: "Wells", lat: 43.3222, lng: -70.5800, visits: 80, services: ["residential", "vacation"] },
  { name: "Limerick", lat: 43.6880, lng: -70.7930, visits: 79, services: ["residential"] },
  { name: "Gorham", lat: 43.6795, lng: -70.4434, visits: 72, services: ["residential", "commercial"] },
  { name: "Baldwin", lat: 43.8386, lng: -70.7700, visits: 63, services: ["residential"] },
  { name: "Frye Island", lat: 43.8600, lng: -70.5500, visits: 57, services: ["residential", "vacation"] },
  { name: "Kennebunkport", lat: 43.3612, lng: -70.4767, visits: 49, services: ["residential", "vacation"] },
  { name: "Denmark", lat: 43.9700, lng: -70.7900, visits: 42, services: ["residential"] },
  { name: "Waterboro", lat: 43.5368, lng: -70.7192, visits: 34, services: ["residential"] },
  { name: "Standish", lat: 43.7570, lng: -70.5594, visits: 32, services: ["residential"] },
  { name: "Raymond", lat: 43.8945, lng: -70.4700, visits: 29, services: ["residential"] },
  { name: "Cape Elizabeth", lat: 43.5636, lng: -70.2000, visits: 28, services: ["residential", "commercial"] },
];

/** Highest single-town count, for scaling the map's bars and node radii. */
export const maxVisits = Math.max(...serviceVisits.map((c) => c.visits));

/** Visits for one town, or undefined if it isn't in the busiest subset. */
export function visitsFor(name: string): number | undefined {
  return serviceVisits.find((c) => c.name === name)?.visits;
}

/**
 * Towns ordered busiest first. `rankOf` is 1-based, so a page can say "our
 * third busiest town" and have it stay true when the numbers are updated.
 */
export function rankOf(name: string): number | undefined {
  const sorted = [...serviceVisits].sort((a, b) => b.visits - a.visits);
  const i = sorted.findIndex((c) => c.name === name);
  return i === -1 ? undefined : i + 1;
}
