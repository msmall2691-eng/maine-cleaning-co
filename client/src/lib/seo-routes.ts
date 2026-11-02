/**
 * Every pre-renderable route, with its metadata, in one list.
 *
 * Build-time and test-time only.
 *
 * ── What changed when the business pivoted ───────────────────────────────
 * This used to enumerate the whole cleaning site: six service pages, the
 * service-area landing pages, every blog post. Those pages still exist and
 * still work — they live under /demo now (client/src/demo/DemoShell.tsx) as
 * proof that the system is real.
 *
 * They are deliberately NOT here any more, and that is a product decision
 * rather than a tidy-up. The Maine Cleaning Co. has wound down. A pre-rendered,
 * indexed page still ranking for "house cleaning Portland Maine" would send
 * real people to book a service nobody is going to turn up for. So the demo is
 * noindex (DEMO_PAGE_SEO forces it), absent from the sitemap, and disallowed
 * in robots.txt — three fences, because one of them will eventually move.
 *
 * Consumed by:
 *   - client/src/prerender-entry.tsx, to render each route to static HTML
 *   - client/src/lib/__tests__/seo.test.ts, to check this list and the
 *     sitemap advertise exactly the same URLs
 */

import { processFaqs } from "./brand";
import { STATIC_PAGE_SEO, faqPageJsonLd, type SeoMeta } from "./seo";

/** Canonical path -> metadata, for every page a crawler should be able to read. */
export const PRERENDER_ROUTES: Record<string, SeoMeta> = {
  ...STATIC_PAGE_SEO,

  // /process carries the FAQPage schema built from the same array the page's
  // accordion renders, so a rich result can never quote an answer the page
  // no longer gives.
  "/process": {
    ...STATIC_PAGE_SEO["/process"],
    jsonLd: faqPageJsonLd(processFaqs),
  },
};

/** The paths above, sorted for stable build output and readable diffs. */
export const PRERENDER_PATHS = Object.keys(PRERENDER_ROUTES).sort();
