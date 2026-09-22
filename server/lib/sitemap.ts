/**
 * /robots.txt and /sitemap.xml.
 *
 * Both used to 404 into the SPA: `express.static` had no such file, so the
 * catch-all handed crawlers `index.html` with `content-type: text/html` and
 * HTTP 200. A crawler asking for robots.txt got a web page that happens to
 * parse as zero valid directives, and a sitemap that isn't XML is simply
 * rejected. Nothing errored anywhere, which is why it went unnoticed.
 *
 * These are generated rather than checked in as static files because the
 * blog is data: `client/src/lib/blog-data.ts` is the only place posts are
 * defined, and a hand-maintained sitemap would go stale the first time one
 * is added. Service pages are listed explicitly here — see SERVICE_SLUGS.
 */

import { blogPosts } from "@/lib/blog-data";

/**
 * The canonical origin, and deliberately NOT the request's own Host header.
 *
 * Both www.maineclean.co and maineclean.co currently answer 200 with no
 * redirect between them, so a host-derived sitemap would advertise apex URLs
 * to a crawler that arrived on the apex — contradicting the `rel=canonical`
 * in client/index.html, which names www. A sitemap that disagrees with the
 * page's own canonical tag is worse than no sitemap: it asks the crawler to
 * index URLs the page then tells it not to.
 *
 * Keep this in step with the canonical/og:url in client/index.html.
 */
export const CANONICAL_ORIGIN = (
  process.env.PUBLIC_SITE_URL || "https://www.maineclean.co"
).replace(/\/+$/, "");

/**
 * Service detail slugs, mirroring the keys of `servicesData`.
 *
 * Listed by hand on purpose: client/src/lib/services-data.ts imports icon
 * components from lucide-react, and importing it here would pull React
 * components into the Node server bundle for the sake of five strings.
 * `sitemap.test.ts` asserts this list still equals Object.keys(servicesData),
 * so adding a service without adding it here fails CI rather than silently
 * shipping a sitemap that omits the new page.
 */
export const SERVICE_SLUGS = [
  "residential",
  "deep-cleaning",
  "commercial",
  "vacation-rentals",
  "move-in-out",
] as const;

/**
 * Routes that exist in the router but must never be advertised.
 *
 *  - /booking/manage/:token is a capability URL. The token IS the customer's
 *    credential; there is no login in front of it. Listing one would publish
 *    someone's booking, and even the bare prefix is worth keeping crawlers
 *    away from.
 *  - /portal* is behind a sign-in and has nothing to index.
 *  - /api/* is not pages.
 */
export const DISALLOWED = ["/api/", "/portal", "/booking/manage/"] as const;

type SitemapEntry = { path: string; lastmod?: string; changefreq?: string; priority?: string };

/** The pages that aren't data-driven, in rough order of how much they matter. */
const STATIC_PAGES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/book", changefreq: "monthly", priority: "0.9" },
  { path: "/services", changefreq: "monthly", priority: "0.8" },
  { path: "/short-term-rentals", changefreq: "monthly", priority: "0.8" },
  { path: "/service-areas", changefreq: "monthly", priority: "0.7" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/blog", changefreq: "weekly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms", changefreq: "yearly", priority: "0.2" },
];

/**
 * "March 15, 2026" -> "2026-03-15", or undefined if it doesn't parse.
 *
 * Blog dates are written for humans in blog-data.ts. Sitemaps want W3C
 * dates, and an invalid `<lastmod>` invalidates the whole entry — so a date
 * that can't be parsed is left out rather than guessed at or replaced with
 * the build time, which would claim every post changed on every deploy.
 */
export function toW3CDate(human: string): string | undefined {
  const ms = Date.parse(human);
  if (Number.isNaN(ms)) return undefined;
  return new Date(ms).toISOString().slice(0, 10);
}

/** XML text escaping. Our URLs are tame, but a slug with an `&` would break the document. */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Every URL the sitemap advertises, in the order it advertises them. */
export function sitemapEntries(): SitemapEntry[] {
  return [
    ...STATIC_PAGES,
    ...SERVICE_SLUGS.map((slug) => ({
      path: `/services/${slug}`,
      changefreq: "monthly",
      priority: "0.7",
    })),
    ...blogPosts.map((post) => ({
      path: `/blog/${post.id}`,
      lastmod: toW3CDate(post.date),
      changefreq: "yearly",
      priority: "0.4",
    })),
  ];
}

export function buildSitemap(origin: string = CANONICAL_ORIGIN): string {
  const urls = sitemapEntries()
    .map(({ path, lastmod, changefreq, priority }) => {
      const lines = [`    <loc>${xmlEscape(origin + path)}</loc>`];
      if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
      if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
      if (priority) lines.push(`    <priority>${priority}</priority>`);
      return `  <url>\n${lines.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function buildRobotsTxt(origin: string = CANONICAL_ORIGIN): string {
  return `# The Maine Cleaning Co.
User-agent: *
${DISALLOWED.map((p) => `Disallow: ${p}`).join("\n")}
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
}
