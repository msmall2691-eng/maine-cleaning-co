/**
 * Landing pages for a part of the service area, at /service-areas/<slug>.
 *
 * Why these exist: /service-areas lists all 47 communities on one page, which
 * ranks for none of the searches that actually convert — "house cleaning
 * naples maine", "camp cleaning sebago", "cleaners near me windham". A page
 * per area can rank for those, because it can say something specific.
 *
 * Why there is only ONE of them: 47 pages differing by a town name are
 * doorway pages in Google's own words, and are penalised rather than ranked.
 * The entire value is in the specifics — real visit counts, the actual access
 * problems, what the housing stock means for the work. If an area can't be
 * written up with that much particularity, it doesn't get a page. Five real
 * pages beat twenty thin ones, and twenty thin ones can drag the five down.
 *
 * Adding one: the entry here, SPA_ROUTES in server/static.ts, AREA_SLUGS in
 * server/lib/sitemap.ts, the Switch in client/src/prerender-entry.tsx. Tests
 * fail on any of those being missed.
 */

import { serviceVisits, visitsFor } from "./service-visits";

export interface AreaLocalDetail {
  title: string;
  body: string;
}

export interface AreaRelatedService {
  /** A slug in servicesData, or a top-level path. */
  href: string;
  label: string;
  blurb: string;
}

export interface AreaPage {
  slug: string;
  /** Short name, used in breadcrumbs and prose. */
  name: string;
  /** Page title before the brand suffix. */
  seoTitle: string;
  seoDescription: string;
  /** The <h1>. */
  headline: string;
  /** One line under the h1. Must be true and checkable — it's a claim. */
  tagline: string;
  lede: string;
  /**
   * Towns this page speaks for. Every one must appear in the advertised
   * roster (lib/service-areas.ts) AND the lookup index — naming a town we
   * don't advertise would be a promise this page isn't entitled to make.
   * `areaPages.test.ts` enforces both.
   */
  towns: string[];
  localDetail: AreaLocalDetail[];
  accessNotes: string[];
  faqs: Array<{ q: string; a: string }>;
  relatedServices: AreaRelatedService[];
}

export const areaPages: Record<string, AreaPage> = {
  "sebago-lake": {
    slug: "sebago-lake",
    name: "Sebago Lake",
    seoTitle: "Cleaning Service for the Sebago Lake Towns",
    seoDescription:
      "House, camp and rental cleaning around Sebago Lake — Windham, Naples, Casco, Raymond, Standish and Frye Island. Seasonal opens and closes a specialty.",
    headline: "Cleaning on Sebago Lake",
    // Checkable against service-visits.ts, and the test checks it: Windham,
    // Naples and Casco are ranks 3, 4 and 5.
    tagline: "Three of our five busiest towns are on this lake.",
    lede:
      "Most people assume a Southern Maine cleaning company works the coast. We do — but more of our work happens around Sebago Lake than anywhere outside Portland and Scarborough. The work here is its own thing: camps that sit closed for seven months, rentals that turn over every Saturday in July, and year-round houses on roads the plow reaches last.",
    towns: ["Windham", "Naples", "Casco", "Raymond", "Standish", "Frye Island", "Denmark", "Baldwin"],
    localDetail: [
      {
        title: "Seasonal, not year-round",
        body: "A good share of what we clean up here is shut from October to May. That makes the spring open and the fall close the two visits that matter most, and they are a different job from a maintenance clean — seven months of dust, whatever got in over the winter, and linens that have been in a bin since Columbus Day.",
      },
      {
        title: "The season is compressed",
        body: "Memorial Day to Columbus Day is the whole year's work in five months, and everyone wants the same Saturday. Rentals on the lake turn over between an eleven o'clock checkout and a four o'clock check-in, which is a tighter window than most coastal properties ask for. We schedule the lake as routes rather than one-off visits, so a Saturday changeover is planned in May, not squeezed in that week.",
      },
      {
        title: "Lake houses get dirty differently",
        body: "Sand and lake water come in on feet and towels all summer, screened porches collect a season of pollen and spiders, and boat gear lives indoors half the time. In spring it's pollen on every sill; after a winter closed up it's mouse evidence in the cupboards. None of that is what a condo in Portland needs.",
      },
      {
        title: "Getting there is half the job",
        body: "Private roads, association gates, long unmarked driveways, and patches with no cell service to call you from. Frye Island is reachable only by the car ferry from Raymond, and the ferry itself is seasonal. We plan around all of it — but only if we know about it when you book, which is why the questions below are the ones we ask first.",
      },
    ],
    accessNotes: [
      "Gate codes for association roads, and the name of the association if the gate is shared",
      "Whether the driveway is passable for a van in mud season",
      "For Frye Island, your dates against the ferry schedule — we plan the crossing into the route",
      "Where the key is, and whether there's a lockbox or a caretaker to coordinate with",
      "Any stretch with no cell service, and a number that does reach you",
    ],
    faqs: [
      {
        q: "Do you clean camps that are only open in the summer?",
        a: "That's most of what we do on this lake. The spring opening and the fall closing clean are a service of their own — see Camp Opening & Closing for what each visit covers. Plenty of owners add a mid-season clean or two around guest stays, and some book a standing fortnightly visit for July and August.",
      },
      {
        q: "Can you actually get to Frye Island?",
        a: "Yes, and we do. The island is car-ferry only from Raymond and the ferry runs seasonally, so an island clean has to be planned around the crossing rather than slotted in on the day. Give us your dates early and tell us the ferry schedule you're working to, and we'll build the route around it.",
      },
      {
        q: "How far up the lake do you go?",
        a: "Windham, Raymond, Casco, Naples, Standish and Frye Island are routine, and we go west to Denmark and Baldwin. If you're further north than that, ask — the coverage checker on our service areas page will tell you straight away whether you're inside our range, and we'd rather say no clearly than take a booking we can't service properly.",
      },
      {
        q: "Can you handle a Saturday changeover between guests?",
        a: "In peak season, yes, provided it's on the schedule in advance. The eleven-to-four window is standard on the lake and we plan for it. What we can't reliably do is a same-day turnover booked on the Friday in the middle of July, because the day is already routed by then. Book the season in the spring and the Saturdays look after themselves.",
      },
    ],
    relatedServices: [
      {
        href: "/services/camp-opening-closing",
        label: "Camp Opening & Closing",
        blurb: "The spring open and the fall close, and what each one covers.",
      },
      {
        href: "/services/vacation-rentals",
        label: "Vacation Rental Turnovers",
        blurb: "Saturday changeovers, linens and restocking for lake rentals.",
      },
      {
        href: "/services/residential",
        label: "Residential Cleaning",
        blurb: "Recurring visits for the houses that are lived in year-round.",
      },
    ],
  },
};

export const AREA_PAGE_SLUGS = Object.keys(areaPages).sort();

export const getAreaPage = (slug: string): AreaPage | undefined => areaPages[slug];

/**
 * Visits across an area's towns, floored to the nearest hundred.
 *
 * Floored because the underlying counts are a manual figure from the booking
 * history and will drift — see the note in service-visits.ts. "1,800+" stays
 * true for a while after 1,855 stops being exact; "1,855" is wrong the moment
 * one more camp is cleaned.
 */
export function areaVisitTotal(area: AreaPage): number {
  const sum = area.towns.reduce((n, town) => n + (visitsFor(town) ?? 0), 0);
  return Math.floor(sum / 100) * 100;
}

/** "1,800+" */
export function areaVisitClaim(area: AreaPage): string {
  return `${areaVisitTotal(area).toLocaleString("en-US")}+`;
}

/**
 * The area's towns with their counts, busiest first, for the page's table.
 * A town outside the busiest subset in service-visits.ts has no count and is
 * listed without one rather than shown as zero.
 */
export function areaTownRows(area: AreaPage): Array<{ name: string; visits?: number }> {
  return area.towns
    .map((name) => ({ name, visits: visitsFor(name) }))
    .sort((a, b) => (b.visits ?? -1) - (a.visits ?? -1));
}

/** Busiest-first rank of a town among all towns we track, 1-based. */
export function townRank(name: string): number | undefined {
  const sorted = [...serviceVisits].sort((a, b) => b.visits - a.visits);
  const i = sorted.findIndex((c) => c.name === name);
  return i === -1 ? undefined : i + 1;
}
