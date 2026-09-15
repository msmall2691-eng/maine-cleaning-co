/**
 * Lookup index for the "am I in your area?" box: every place a visitor is
 * likely to type.
 *
 * Membership here does NOT decide coverage — CoverageCheck's MAX_MILES
 * distance check does — so this list is deliberately wider than the marketing
 * roster in service-areas.ts. It must, however, contain everything that roster
 * advertises, or an advertised town matches nothing when a visitor types it.
 * coverageIndex.test.ts enforces exactly that.
 *
 * "Casco Bay Islands" is the one roster entry with no entry here: it is a
 * grouping label, not a place, and there is nothing to geocode.
 *
 * `zip` is optional — used only for lookup hints.
 */

export type CoverageCommunity = { name: string; lat: number; lng: number; zip?: string };

export const COVERAGE_INDEX: CoverageCommunity[] = [
  // Cumberland County
  { name: "Portland", lat: 43.6591, lng: -70.2568, zip: "04101" },
  { name: "South Portland", lat: 43.6415, lng: -70.2580, zip: "04106" },
  { name: "Cape Elizabeth", lat: 43.5636, lng: -70.2000, zip: "04107" },
  { name: "Scarborough", lat: 43.5781, lng: -70.3222, zip: "04074" },
  { name: "Falmouth", lat: 43.7298, lng: -70.2378, zip: "04105" },
  { name: "Cumberland", lat: 43.7940, lng: -70.2380, zip: "04021" },
  { name: "Yarmouth", lat: 43.8000, lng: -70.1830, zip: "04096" },
  { name: "Freeport", lat: 43.8570, lng: -70.1030, zip: "04032" },
  { name: "Pownal", lat: 43.9020, lng: -70.1900, zip: "04069" },
  { name: "North Yarmouth", lat: 43.8280, lng: -70.2340, zip: "04097" },
  { name: "Gray", lat: 43.8891, lng: -70.3300, zip: "04039" },
  { name: "New Gloucester", lat: 43.9660, lng: -70.2920, zip: "04260" },
  { name: "Windham", lat: 43.7985, lng: -70.4039, zip: "04062" },
  { name: "Gorham", lat: 43.6795, lng: -70.4434, zip: "04038" },
  { name: "Standish", lat: 43.7570, lng: -70.5594, zip: "04084" },
  { name: "Naples", lat: 43.9781, lng: -70.6075, zip: "04055" },
  { name: "Casco", lat: 43.9580, lng: -70.5175, zip: "04015" },
  { name: "Raymond", lat: 43.8945, lng: -70.4700, zip: "04071" },
  { name: "Sebago", lat: 43.9010, lng: -70.6710, zip: "04029" },
  { name: "Bridgton", lat: 44.0530, lng: -70.7130, zip: "04009" },
  { name: "Harrison", lat: 44.1160, lng: -70.6620, zip: "04040" },
  { name: "Frye Island", lat: 43.8600, lng: -70.5500, zip: "04071" },
  // York County
  { name: "Old Orchard Beach", lat: 43.5168, lng: -70.3773, zip: "04064" },
  { name: "Saco", lat: 43.5010, lng: -70.4430, zip: "04072" },
  { name: "Biddeford", lat: 43.4926, lng: -70.4534, zip: "04005" },
  { name: "Buxton", lat: 43.6540, lng: -70.5220, zip: "04093" },
  { name: "Hollis", lat: 43.6110, lng: -70.5990, zip: "04042" },
  { name: "Limerick", lat: 43.6880, lng: -70.7930, zip: "04048" },
  { name: "Waterboro", lat: 43.5368, lng: -70.7192, zip: "04087" },
  { name: "Alfred", lat: 43.4780, lng: -70.7150, zip: "04002" },
  { name: "Lyman", lat: 43.5230, lng: -70.6060, zip: "04002" },
  { name: "Arundel", lat: 43.4260, lng: -70.4780, zip: "04046" },
  { name: "Kennebunk", lat: 43.3884, lng: -70.5449, zip: "04043" },
  { name: "Kennebunkport", lat: 43.3612, lng: -70.4767, zip: "04046" },
  { name: "Wells", lat: 43.3222, lng: -70.5800, zip: "04090" },
  { name: "Ogunquit", lat: 43.2494, lng: -70.5983, zip: "04090" },
  { name: "York", lat: 43.1616, lng: -70.6485, zip: "03909" },
  { name: "Kittery", lat: 43.0904, lng: -70.7395, zip: "03904" },
  { name: "Eliot", lat: 43.1490, lng: -70.7910, zip: "03903" },
  { name: "South Berwick", lat: 43.2350, lng: -70.8080, zip: "03908" },
  { name: "Berwick", lat: 43.2680, lng: -70.8620, zip: "03901" },
  { name: "North Berwick", lat: 43.3050, lng: -70.7350, zip: "03906" },
  { name: "Sanford", lat: 43.4390, lng: -70.7740, zip: "04073" },
  { name: "Springvale", lat: 43.4700, lng: -70.7960, zip: "04083" },
  { name: "Shapleigh", lat: 43.5300, lng: -70.8480, zip: "04076" },
  { name: "Acton", lat: 43.5340, lng: -70.9110, zip: "04001" },
  { name: "Newfield", lat: 43.6480, lng: -70.8710, zip: "04056" },
  { name: "Parsonsfield", lat: 43.7350, lng: -70.9280, zip: "04047" },
  { name: "Cornish", lat: 43.7940, lng: -70.8060, zip: "04020" },
  { name: "Baldwin", lat: 43.8386, lng: -70.7700, zip: "04024" },
  { name: "Denmark", lat: 43.9700, lng: -70.7900, zip: "04022" },
  // Midcoast + Casco Bay. These are advertised on /service-areas but were
  // missing from this index, so typing them matched nothing. Coordinates are
  // used for the distance readout and for matching typed input — the in-area
  // decision is the MAX_MILES check, not membership of this list.
  { name: "Brunswick", lat: 43.9145, lng: -69.9653, zip: "04011" },
  { name: "Bath", lat: 43.9106, lng: -69.8214, zip: "04530" },
  { name: "Topsham", lat: 43.9245, lng: -69.9756, zip: "04086" },
  { name: "Harpswell", lat: 43.7942, lng: -69.9806, zip: "04079" },
  { name: "Lisbon", lat: 44.0320, lng: -70.1034, zip: "04250" },
  { name: "Westbrook", lat: 43.6770, lng: -70.3712, zip: "04092" },
  { name: "Peaks Island", lat: 43.6562, lng: -70.1975, zip: "04108" },
  { name: "Long Island", lat: 43.6901, lng: -70.1617, zip: "04050" },
  { name: "Chebeague Island", lat: 43.7434, lng: -70.1206, zip: "04017" },
  { name: "Orrs Island", lat: 43.7720, lng: -69.9631, zip: "04066" },
  { name: "Bailey Island", lat: 43.7290, lng: -69.9980, zip: "04003" },
  { name: "South Freeport", lat: 43.8190, lng: -70.1070, zip: "04078" },
  { name: "Cape Neddick", lat: 43.1817, lng: -70.6259, zip: "03902" },
  { name: "York Beach", lat: 43.1712, lng: -70.6095, zip: "03910" },
];
