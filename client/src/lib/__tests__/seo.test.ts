import { describe, it, expect } from "vitest";
import {
  CANONICAL_ORIGIN,
  DEFAULT_OG_IMAGE,
  STATIC_PAGE_SEO,
  NOINDEX_PAGE_SEO,
  blogPostSeo,
  canonicalUrl,
  formatTitle,
  serviceSeo,
} from "../seo";
import { PRERENDER_ROUTES, PRERENDER_PATHS } from "../seo-routes";
import { servicesData } from "../services-data";
import { blogPosts } from "../blog-data";
import { CANONICAL_ORIGIN as SERVER_ORIGIN, sitemapEntries } from "../../../../server/lib/sitemap";

describe("CANONICAL_ORIGIN", () => {
  /**
   * The sitemap advertises URLs on one host and every page's canonical tag
   * names one host. If they disagree, the sitemap asks a crawler to index
   * URLs that each then disown — worse than having no sitemap. Two constants
   * exist because one runs in the browser and one in Node; this is what keeps
   * them one value.
   */
  it("matches the server's", () => {
    expect(CANONICAL_ORIGIN).toBe(SERVER_ORIGIN);
  });

  it("has no trailing slash, so canonicalUrl can't produce a double one", () => {
    expect(CANONICAL_ORIGIN).not.toMatch(/\/$/);
  });

  it("uses an absolute og:image — Facebook and LinkedIn drop a relative one", () => {
    expect(DEFAULT_OG_IMAGE).toMatch(/^https:\/\//);
  });
});

describe("formatTitle", () => {
  it("appends the brand", () => {
    expect(formatTitle("About Us")).toBe("About Us | The Maine Cleaning Co.");
  });

  /**
   * /book and /booking/manage used to pass a title that already ended in the
   * brand, which the old hook suffixed again. Google truncates around 580px,
   * so the duplicate ate the words a searcher actually reads.
   */
  it("does not double up a brand the caller already added", () => {
    expect(formatTitle("Book a Cleaning · The Maine Cleaning Co.")).toBe(
      "Book a Cleaning | The Maine Cleaning Co.",
    );
    expect(formatTitle("Manage Your Booking | The Maine Cleaning Co.")).toBe(
      "Manage Your Booking | The Maine Cleaning Co.",
    );
  });

  it("falls back to the bare brand", () => {
    expect(formatTitle("")).toBe("The Maine Cleaning Co.");
  });
});

describe("canonicalUrl", () => {
  it("is absolute and rooted at the canonical origin", () => {
    expect(canonicalUrl("/services")).toBe("https://www.maineclean.co/services");
  });

  it("keeps the root path's slash", () => {
    expect(canonicalUrl("/")).toBe("https://www.maineclean.co/");
  });

  /**
   * /book?service=deep-clean is the same page as /book. Advertising both
   * splits one page's ranking signal across two URLs, and the service pages
   * all link in with that parameter.
   */
  it("drops query strings and hashes", () => {
    expect(canonicalUrl("/book?service=deep-clean")).toBe("https://www.maineclean.co/book");
    expect(canonicalUrl("/about#team")).toBe("https://www.maineclean.co/about");
  });

  it("normalises a trailing slash away", () => {
    expect(canonicalUrl("/about/")).toBe("https://www.maineclean.co/about");
  });
});

describe("PRERENDER_ROUTES", () => {
  /**
   * The point of this file, and the mirror of SERVICE_SLUGS in
   * sitemap.test.ts. The sitemap decides which URLs we ask crawlers to
   * fetch; this registry decides which get a crawler-readable copy and their
   * own head tags. A URL in one and not the other is either a page we
   * advertise and serve as an empty shell, or a page we pre-render and never
   * mention. Both are silent, so both fail here instead.
   */
  it("advertises exactly the URLs the sitemap does", () => {
    const sitemapPaths = sitemapEntries().map((e) => e.path).sort();
    expect(PRERENDER_PATHS).toEqual(sitemapPaths);
  });

  it("covers every service and every blog post", () => {
    for (const slug of Object.keys(servicesData)) {
      expect(PRERENDER_ROUTES[`/services/${slug}`]).toBeDefined();
    }
    for (const post of blogPosts) {
      expect(PRERENDER_ROUTES[`/blog/${post.id}`]).toBeDefined();
    }
  });

  /**
   * Duplicate titles and descriptions are how a site tells Google its pages
   * are interchangeable — the same message the shared canonical was sending.
   */
  it("gives every page a distinct title and description", () => {
    const titles = PRERENDER_PATHS.map((p) => PRERENDER_ROUTES[p].title);
    const descriptions = PRERENDER_PATHS.map((p) => PRERENDER_ROUTES[p].description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("canonicalises each page to its own path", () => {
    for (const path of PRERENDER_PATHS) {
      const meta = PRERENDER_ROUTES[path];
      expect(canonicalUrl(meta.canonicalPath ?? path)).toBe(canonicalUrl(path));
    }
  });

  /** Nothing pre-rendered should be asking not to be indexed. */
  it("pre-renders no noindex page", () => {
    for (const path of PRERENDER_PATHS) {
      expect(PRERENDER_ROUTES[path].noindex ?? false).toBe(false);
    }
    for (const meta of Object.values(NOINDEX_PAGE_SEO)) {
      expect(meta.noindex).toBe(true);
    }
  });

  /**
   * Not style policing: Google truncates a description near 160 characters
   * and writes its own when ours is too thin, so the end of a long one is
   * wasted work and a short one is a wasted slot.
   */
  it("keeps descriptions inside the length a result actually shows", () => {
    for (const path of PRERENDER_PATHS) {
      const { description } = PRERENDER_ROUTES[path];
      expect(description.length, `${path} description`).toBeGreaterThan(70);
      expect(description.length, `${path} description`).toBeLessThanOrEqual(165);
    }
  });

  it("has a registry entry for every static path it claims", () => {
    for (const [path, meta] of Object.entries(STATIC_PAGE_SEO)) {
      expect(meta.canonicalPath).toBe(path);
    }
  });
});

describe("serviceSeo", () => {
  const service = servicesData.residential;

  it("points the Service's provider at the LocalBusiness in index.html", () => {
    const schema = serviceSeo(service).jsonLd as Array<Record<string, unknown>>;
    const node = schema.find((n) => n["@type"] === "Service")!;
    // Not a copy of the business details: a reference, so a parser reads one
    // organisation rather than one per service page.
    expect(node.provider).toEqual({ "@id": `${CANONICAL_ORIGIN}/#organization` });
  });

  it("emits a breadcrumb trail to the service", () => {
    const schema = serviceSeo(service).jsonLd as Array<Record<string, any>>;
    const crumbs = schema.find((n) => n["@type"] === "BreadcrumbList")!;
    expect(crumbs.itemListElement.map((i: any) => i.item)).toEqual([
      "https://www.maineclean.co/",
      "https://www.maineclean.co/services",
      "https://www.maineclean.co/services/residential",
    ]);
  });

  /**
   * The generated title is `${title} in Southern Maine`, which is right for
   * four of the six services and wrong for the camp one: "Camp Opening &
   * Closing" is the heading the page wants and not a phrase anyone searches,
   * because nobody looks for a camp opening without the word "cleaning".
   */
  it("defaults the page title to the service name plus the region", () => {
    expect(serviceSeo(service).title).toBe("Residential Cleaning in Southern Maine");
  });

  it("lets a service override that title when the generated one misses the search", () => {
    const camp = servicesData["camp-opening-closing"];
    expect(camp.seoTitle).toBeDefined();
    expect(serviceSeo(camp).title).toBe(camp.seoTitle);
    // The point of the override: the words someone would actually type.
    expect(serviceSeo(camp).title).toMatch(/cleaning/i);
  });

  it("carries the service's own FAQs, so the markup matches the page", () => {
    const schema = serviceSeo(service).jsonLd as Array<Record<string, any>>;
    const faq = schema.find((n) => n["@type"] === "FAQPage")!;
    expect(faq.mainEntity).toHaveLength(service.faqs.length);
    expect(faq.mainEntity[0].name).toBe(service.faqs[0].q);
  });
});

describe("blogPostSeo", () => {
  it("converts the human date blog-data.ts uses into a W3C one", () => {
    const meta = blogPostSeo({
      id: "x",
      title: "T",
      excerpt: "E",
      date: "March 15, 2026",
    });
    expect(meta.publishedTime).toBe("2026-03-15");
    expect(meta.ogType).toBe("article");
  });

  /**
   * Same rule as <lastmod> in server/lib/sitemap.ts: an unparseable date is
   * omitted rather than guessed at or replaced with the build time, which
   * would claim every post was published the day we deployed.
   */
  it("omits a date it cannot parse rather than inventing one", () => {
    const meta = blogPostSeo({ id: "x", title: "T", excerpt: "E", date: "sometime last spring" });
    expect(meta.publishedTime).toBeUndefined();
    const schema = meta.jsonLd as Array<Record<string, unknown>>;
    expect(schema[0]).not.toHaveProperty("datePublished");
  });

  it("marks up every real post without throwing", () => {
    for (const post of blogPosts) {
      const schema = blogPostSeo(post).jsonLd as Array<Record<string, unknown>>;
      expect(schema.map((n) => n["@type"])).toEqual(["BlogPosting", "BreadcrumbList"]);
    }
  });
});
