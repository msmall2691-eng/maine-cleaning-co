/**
 * The communities we serve — one roster, grouped by region.
 *
 * This is the single source for both the grouped lists on /service-areas and
 * every "N communities" figure on the site. It used to live inline in
 * ServiceAreas.tsx while the count was typed separately as "49+" in four
 * other files, so the page named 41 communities under a heading claiming 49.
 *
 * Six communities the map on that same page plots with real visit counts —
 * Casco, Limerick, Baldwin, Frye Island, Denmark and Waterboro — were missing
 * from the roster entirely. They're in "Midcoast & Outlying" now: the page
 * that exists to say where we work shouldn't omit places it already draws.
 *
 * Adding a community here updates the lists, the counts and the SEO
 * description together. There is nothing else to edit.
 */

export type ServiceRegion = {
  name: string;
  communities: string[];
};

export const serviceRegions: ServiceRegion[] = [
  {
    name: "Greater Portland",
    communities: [
      "Portland", "South Portland", "Cape Elizabeth", "Scarborough", "Westbrook",
      "Gorham", "Falmouth", "Cumberland", "Yarmouth", "Gray", "New Gloucester",
    ],
  },
  {
    name: "Southern Beaches",
    communities: [
      "Old Orchard Beach", "Saco", "Biddeford", "Kennebunk", "Kennebunkport",
      "Wells", "Ogunquit", "York", "York Beach", "Cape Neddick", "Kittery",
    ],
  },
  {
    name: "Midcoast & Outlying",
    communities: [
      "Brunswick", "Freeport", "Harpswell", "Bath", "Topsham", "Lisbon",
      "Windham", "Raymond", "Naples", "Standish", "Buxton", "Hollis",
      "Casco", "Limerick", "Baldwin", "Frye Island", "Denmark", "Waterboro",
    ],
  },
  {
    name: "Islands & Peninsula",
    communities: [
      "Peaks Island", "Long Island", "Chebeague Island", "South Freeport",
      "Casco Bay Islands", "Bailey Island", "Orrs Island",
    ],
  },
];

/** Every community we name, flattened and de-duplicated. */
export const ALL_COMMUNITIES: string[] = Array.from(
  new Set(serviceRegions.flatMap((r) => r.communities)),
);

/**
 * How many communities we name. Displayed with a "+" (see COMMUNITIES_SERVED
 * in company-stats.ts) because the roster is representative of York and
 * Cumberland County, not an exhaustive list of every town we'll travel to.
 */
export const TOTAL_COMMUNITIES = ALL_COMMUNITIES.length;
