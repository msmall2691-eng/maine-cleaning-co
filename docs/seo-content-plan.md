# SEO content plan

Written alongside the technical fixes in PR #75, which stopped 16 of 19 pages asking
Google to drop them from the index. That PR is the prerequisite: content added
before it lands would have inherited the homepage's canonical and never ranked
on its own. Everything below assumes it's merged.

Ordered by expected return per hour of work, not by how interesting it is.

---

## 0. Do these first — they cost almost nothing

These are not content. They gate whether content gets found at all.

1. **Submit `sitemap.xml` in Google Search Console** and use "Request indexing"
   on `/services`, `/short-term-rentals`, `/service-areas` and the five service
   pages. Those URLs were self-canonicalised to the homepage for as long as that
   tag has been live; Google won't revisit them quickly on its own. Nothing else
   in this document matters until the site is actually in the index.
2. **Verify the property for both hosts** (`maineclean.co` and
   `www.maineclean.co`) so the 301 can be seen working, and check Search Console
   for "Alternate page with proper canonical tag" warnings — that report is
   where the old bug's damage will show, and where its recovery will show too.
3. **Google Business Profile.** For a local cleaning company this outranks the
   website as a traffic source. Confirm: primary category (`House cleaning
   service`) plus secondaries, every service listed, service area matching the
   roster in `client/src/lib/service-areas.ts`, 10+ recent photos, hours, and
   the booking link pointed at `/book`. Review velocity matters more than review
   count — a steady trickle beats a burst.
4. **Point `maine-clean.co` at this site with a 301.** It's a separate B12 site
   on different DNS, so it has to be done at the registrar or in B12, not here.
   Until then the two compete for the same searches and split the signals.

---

## 1. The biggest content gap: the Sebago Lake region

The site sells coastal Airbnb turnovers. The visit data in
`client/src/components/ui/ServiceAreaMap.tsx` says the work is substantially
inland and lake-side:

| Town | Visits | Region |
|---|---|---|
| Portland | 848 | Greater Portland |
| Scarborough | 826 | Greater Portland |
| **Windham** | **656** | **Sebago Lake** |
| **Naples** | **641** | **Sebago Lake** |
| **Casco** | **335** | **Sebago Lake** |
| Falmouth | 235 | Greater Portland |
| Old Orchard Beach | 218 | Southern Beaches |
| South Portland | 122 | Greater Portland |
| Kennebunk | 86 | Southern Beaches |
| Wells | 80 | Southern Beaches |

Naples alone has roughly 3× the visits of Old Orchard Beach and 13×
Kennebunkport. Yet the word "Sebago" appears in no page copy, heading or
description anywhere on the site — its only occurrence in the codebase is a
coordinate row in `client/src/lib/coverage-index.ts`. Kennebunkport, at 49
visits, was named ahead of both Windham and Naples in the `/service-areas`
description until this plan was written (now corrected in
`client/src/lib/seo.ts`).

This matters beyond keyword volume. Lake-house work is a different job with
different language: camps and cottages rather than condos, **spring opening and
fall closing** cleans, docks and screened porches, mouse droppings after a
winter closed up, water turned back on. Searches like *camp opening cleaning
Maine*, *cottage closing clean Sebago*, *lake house cleaning Naples ME* have low
competition precisely because national cleaning brands don't know the category
exists. You already do this work hundreds of times a year.

**Recommended pages:**

- `/services/camp-opening-closing` — a real service page for seasonal
  opening/closing cleans, with what's included (water-on check, mouse cleanup,
  porch and dock furniture, linens out of storage, fridge restart). This is the
  highest-value single page on this list.
- `/service-areas/sebago-lake` — the region page, covering Windham, Naples,
  Casco, Raymond, Standish, Frye Island, Denmark, Baldwin.
- A blog post on timing: *When to book your camp's opening clean in Southern
  Maine* — seasonal, links to both pages above, and genuinely useful.

Add `seasonal`/`camp` to the service taxonomy in
`client/src/lib/services-data.ts` and the new slugs to `SERVICE_SLUGS` in
`server/lib/sitemap.ts`; the tests will tell you if you miss a spot.

---

## 2. Per-town pages — valuable, but easy to do badly

*house cleaning portland maine*, *airbnb cleaning kennebunkport*, *cleaners near
me in scarborough* are the searches that convert. One `/service-areas` page
listing all 47 communities will not rank for any of them.

**The trap:** 47 templated pages differing only by a town name are "doorway
pages" in Google's own words, and are actively penalised. The whole value is in
being specific. So: **6–8 pages, each genuinely different**, not 47.

Priority by actual volume, not by what sounds impressive:

1. Portland (848 visits)
2. Scarborough (826)
3. Windham (656)
4. Naples (641)
5. Falmouth (235)
6. Old Orchard Beach (218) — lead on STR turnovers here
7. Casco (335)
8. South Portland (122)

**What makes one of these pages real,** rather than a template fill:

- Your actual visit count for that town. You have the number; nobody else does.
- Neighbourhoods and landmarks by name — not decoration, it's what a local
  searcher recognises and what a crawler reads as locally specific.
- What the housing stock means for the work: Portland's Victorian triple-deckers
  and narrow stairwells, OOB's summer rental turnover churn, Naples' seasonal
  camps, Falmouth's larger single-family homes.
- Access notes that prove you've been there: parking on the peninsula, gate
  codes at lake associations, ferry schedules for the island communities.
- 2–3 testimonials from that town, if you have them.
- Honest travel/scheduling detail — which days you're routinely in that area.

If a page can't be written with that much specificity, don't publish it. Five
real pages beat twenty thin ones, and twenty thin ones can hurt the five.

---

## 3. A pricing page

*how much does house cleaning cost in maine* is high-volume, high-intent, and
currently answered by competitors and aggregators. You have an advantage most
cleaning companies don't: a working quote engine (`shared/pricing.ts`) and
transparent inputs.

`/pricing` should explain the model in words — square footage, bathrooms,
frequency, condition — give honest ranges, and hand off to the estimate tool.
Publishing ranges feels exposed; it also pre-qualifies every lead and kills the
"call for a quote" friction that loses the searcher to whoever answers first.

Mark it up as `Service` with an `offers`/`priceRange`, and link it from the
service pages and `/how-it-works`.

---

## 4. Blog: fewer, higher-intent posts

The six existing posts are competent but generic — *spring cleaning checklist*
competes with every lifestyle site on the internet. The posts worth writing are
the ones only an operator could write, aimed at someone close to hiring:

| Post | Why |
|---|---|
| What house cleaning actually costs in Southern Maine | Highest intent on this list; pairs with `/pricing` |
| The Airbnb turnover checklist we use (and what guests notice) | Host-facing, shareable, feeds `/short-term-rentals` |
| Move-out cleaning and your security deposit: what landlords check | High intent, seasonal around lease turnover |
| When to book your camp's opening clean | Owns the Sebago angle from §1 |
| What a deep clean includes that a standard clean doesn't | Answers the question your own FAQ says you get asked |
| How often should a rental be deep-cleaned between guests? | STR host question, long tail |

Each should link to the relevant service page — internal links from posts to
money pages are how a blog earns its keep.

**Two fixes to the existing posts:** blog images are hotlinked from
`images.unsplash.com`, which means external requests you don't control, no
`width`/`height` to prevent layout shift, and no image SEO. Move them to
`client/public/images` like the rest of the site. And the newest post is dated 22 March
2026, roughly seven months stale — `datePublished` is now in the structured
data, so that gap is machine-readable. Two posts a quarter is enough to keep
it from reading as abandoned.

---

## 5. Technical follow-ups (not in PR #75)

Deliberately left out to keep that PR reviewable:

- **The JS bundle is 980 KB (292 KB gzipped) in a single chunk.** That's the
  main Core Web Vitals exposure — LCP and INP on a phone on a bad connection,
  which is exactly how someone standing in a rental looks you up. Reading the
  build's own sourcemap, the 621 modules in that chunk break down as:

  | Package | Modules | Note |
  |---|---|---|
  | `framer-motion` + `motion-dom` + `motion-utils` | 259 | Used in 25 files |
  | `lucide-react` | 76 | Already per-icon imports; little to win |
  | `react-markdown` + its `micromark`/`mdast` chain | ~85 | **Only used by `/blog/:slug`** |

  The clean win is the third row: `react-markdown` is imported by exactly one
  page and costs every other page its parser. Lazy-load that route. After that,
  `framer-motion`'s `LazyMotion` with a reduced feature set is the next lever.

  `three`, `@react-three/*` and `recharts` are **not** in the bundle — I checked
  the module graph rather than assuming, and Rollup tree-shakes them because
  `ServiceAreaGlobe.tsx` and `ui/chart.tsx` are both dead code that nothing
  imports. Which is its own small finding: those two files and five
  dependencies (`three`, `@types/three`, `@react-three/fiber`,
  `@react-three/drei`, `recharts`) can be deleted outright. That won't make the
  site faster — it's already excluded — but it cuts install time, image size
  and the dependency surface.
- **Google Fonts loads as a blocking stylesheet.** Self-host the two families,
  or `preconnect` + `media="print" onload` to unblock render.
- **`/services` isn't linked from the footer** — the hub page is reachable only
  from the navbar, which isn't in the pre-rendered HTML. One footer link.
- **Alt text audit.** Decorative images correctly use `alt=""`, but content
  photos should describe the work, which is both accessibility and image search.
- **`README.md`'s `company-info.ts` example is stale** — it shows
  `info@maine-clean.co` and a `(207)` phone format that don't match the real
  file. Minor, but it's the doc someone reads first.

---

## How to measure any of this

Give it 8–12 weeks and watch three things in Search Console, not rankings:

1. **Pages indexed** — the direct read on whether the canonical fix worked.
   Expect this to climb first and fastest.
2. **Impressions per page** — whether new content is being shown at all. A page
   with impressions and no clicks needs a better title and description, which is
   a 10-minute fix in `client/src/lib/seo.ts`. A page with neither isn't
   competitive yet.
3. **Queries you didn't target** — the most useful column on the page. It tells
   you what people actually type, in their words, and every surprise there is a
   page or a paragraph worth writing.

Rankings move daily and tell you nothing on their own. Indexed pages and
impressions are the two numbers that answer "is this working".
