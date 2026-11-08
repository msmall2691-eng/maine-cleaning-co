/**
 * Every pre-renderable route, with its metadata, in one list.
 *
 * Build-time and test-time only. This module imports blog-data.ts (full post
 * bodies) and services-data.ts (lucide-react icon components), so importing
 * it from a page would drag both into that page's bundle. The runtime hook
 * reads client/src/lib/seo.ts instead, and the two agree because the
 * per-route metadata here is produced by the same `STATIC_PAGE_SEO` entries
 * and `serviceSeo()` / `blogPostSeo()` helpers the pages call.
 *
 * Consumed by:
 *   - client/src/prerender-entry.tsx, to render each route to static HTML
 *   - client/src/lib/__tests__/seo.test.ts, to check this list and the
 *     sitemap advertise exactly the same URLs
 */

import { areaPages } from "./area-pages";
import { blogPosts } from "./blog-data";
import { servicesData } from "./services-data";
import { howItWorksFaqs } from "./faq-data";
import {
  STATIC_PAGE_SEO,
  areaPageSeo,
  blogPostSeo,
  faqPageJsonLd,
  serviceSeo,
  type SeoMeta,
} from "./seo";

/** Canonical path -> metadata, for every page a crawler should be able to read. */
export const PRERENDER_ROUTES: Record<string, SeoMeta> = {
  ...STATIC_PAGE_SEO,

  // /how-it-works carries the FAQPage schema built from the same array the
  // page's accordion renders.
  "/how-it-works": {
    ...STATIC_PAGE_SEO["/how-it-works"],
    jsonLd: faqPageJsonLd(howItWorksFaqs),
  },

  ...Object.fromEntries(
    Object.values(servicesData).map((service) => [`/services/${service.id}`, serviceSeo(service)]),
  ),

  ...Object.fromEntries(
    Object.values(areaPages).map((area) => [`/service-areas/${area.slug}`, areaPageSeo(area)]),
  ),

  ...Object.fromEntries(blogPosts.map((post) => [`/blog/${post.id}`, blogPostSeo(post)])),
};

/** The paths above, sorted for stable build output and readable diffs. */
export const PRERENDER_PATHS = Object.keys(PRERENDER_ROUTES).sort();
