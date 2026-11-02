/**
 * Per-page SEO metadata: the primitives, and the meta for every static route.
 *
 * Why this file exists: client/index.html carries ONE set of head tags, and
 * `useSEO` used to rewrite only <title> and the meta description. Everything
 * else — canonical, og:*, twitter:* — stayed frozen at the homepage's values
 * on all 19 routes. The canonical was the expensive part: every page shipped
 * `<link rel="canonical" href="https://www.maineclean.co/">`, which tells a
 * search engine "this URL is a duplicate of the homepage, index that one
 * instead." Google honours that, so /services, /short-term-rentals,
 * /service-areas and all 11 service/blog pages were asking to be dropped
 * from the index. Only /privacy, /terms and /sms escaped, because
 * script/prerender.ts rewrites their tags at build time.
 *
 * Two consumers read from here, which is the point — they cannot drift:
 *   - `useSEO` (client/src/hooks/use-seo.ts) at runtime, for Google, which
 *     executes JavaScript.
 *   - script/prerender.ts at build time, for everything that does not: Bing
 *     and DuckDuckGo downstream of it, the social crawlers (Facebook,
 *     LinkedIn, iMessage, Slack never run JS), and the AI crawlers now
 *     sending referral traffic (OAI-SearchBot, PerplexityBot, ClaudeBot).
 *
 * Data-driven routes (/services/:slug, /blog/:slug) are NOT listed here.
 * Their meta comes from `serviceSeo()` / `blogPostSeo()` below, which take
 * the data object as an argument so this module never imports blog-data.ts
 * or services-data.ts — importing either would pull full post bodies and
 * lucide-react icon components into the bundle of every page that uses the
 * hook. client/src/lib/seo-routes.ts does the composing, and is only ever
 * imported at build time and by tests.
 */

import { COMMUNITIES_SERVED } from "./company-stats";
import { brand, SITE_ORIGIN } from "./brand";

/**
 * The canonical origin. Must agree with CANONICAL_ORIGIN in
 * server/lib/sitemap.ts — a sitemap that advertises a different host than
 * the page's own canonical tag asks the crawler to index URLs the page then
 * disowns. `seo.test.ts` asserts the two are equal, so changing one without
 * the other fails CI.
 *
 * Hardcoded rather than read from the environment because this runs in the
 * browser; the server reads PUBLIC_SITE_URL, and the test pins them together
 * for the default case.
 */
export const CANONICAL_ORIGIN = SITE_ORIGIN;

export const BASE_TITLE = brand.name;

/**
 * The default share image, as an ABSOLUTE url.
 *
 * It used to be `/opengraph.jpg`. The Open Graph protocol requires an
 * absolute URL, and Facebook, LinkedIn and iMessage do not resolve a
 * relative one against the page — they drop the image, so every shared link
 * rendered as a bare text card.
 */
export const DEFAULT_OG_IMAGE = `${CANONICAL_ORIGIN}/opengraph.jpg`;

export interface SeoMeta {
  /** Page title WITHOUT the brand suffix — `formatTitle` appends it. */
  title: string;
  description: string;
  /**
   * The canonical path for this page, e.g. "/services". Omitted on dynamic
   * routes, where the hook falls back to the current router location.
   */
  canonicalPath?: string;
  /** Absolute url. Defaults to DEFAULT_OG_IMAGE. */
  ogImage?: string;
  ogType?: "website" | "article";
  /** ISO date, emitted as article:published_time for blog posts. */
  publishedTime?: string;
  /** Page-specific schema.org JSON-LD, one object or several. */
  jsonLd?: unknown | unknown[];
  /**
   * Keep this page out of the index. For the portal, the admin screen and
   * the booking capability URL — pages that are either behind a sign-in or
   * ARE someone's credential.
   */
  noindex?: boolean;
}

/**
 * "About Us" -> "About Us | The Maine Cleaning Co."
 *
 * Strips a brand suffix the caller already added before appending ours.
 * /book and /booking/manage used to pass "Book a Cleaning · The Maine
 * Cleaning Co.", which the old hook turned into "... · The Maine Cleaning
 * Co. | The Maine Cleaning Co." — Google truncates titles around 580px, so
 * the duplicate ate the part a searcher reads.
 */
const BRAND_SUFFIX_RE = new RegExp(
  // BASE_TITLE, not a hardcoded name. This used to spell out the cleaning
  // company, so the moment the brand changed the dedupe silently stopped
  // working and every title that already carried the brand got a second copy.
  `\\s*[|·—-]\\s*${BASE_TITLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.?\\s*$`,
  "i",
);

export function formatTitle(title: string): string {
  const bare = title.replace(BRAND_SUFFIX_RE, "").trim();
  return bare ? `${bare} | ${BASE_TITLE}` : BASE_TITLE;
}

/**
 * Absolute canonical url for a path. Query strings and hashes are dropped:
 * /book?service=deep-clean is the same page as /book, and advertising both
 * splits the ranking signal between them.
 */
export function canonicalUrl(path: string): string {
  const clean = path.split(/[?#]/)[0];
  const withSlash = clean.startsWith("/") ? clean : `/${clean}`;
  // Trailing slashes are stripped so /about/ and /about canonicalise to one
  // url; "/" itself stays "/".
  const normalised = withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
  return `${CANONICAL_ORIGIN}${normalised}`;
}

/** The LocalBusiness node every page's breadcrumb and service schema points at. */
export const ORGANIZATION_ID = `${CANONICAL_ORIGIN}/#organization`;

/**
 * schema.org BreadcrumbList. Google uses it for the breadcrumb trail shown
 * in place of the raw URL in a result, which is most of the value on nested
 * pages like /services/deep-cleaning.
 */
export function breadcrumbs(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

/**
 * schema.org FAQPage from a list of question/answer pairs.
 *
 * Takes the pairs as an argument rather than importing them so this module
 * stays free of page data. /how-it-works and every /services/:slug page has
 * its own set; both the page and the prerenderer build their schema from the
 * same arrays, so the markup cannot describe questions the page doesn't show
 * — which is Google's requirement for it, and the honest thing regardless.
 *
 * A note on expectations: Google restricted FAQ rich results to government
 * and health sites in 2023, so this will NOT put dropdowns in a cleaning
 * company's search result. It is still worth emitting — Bing uses it, and
 * the AI assistants people now ask for recommendations parse it directly.
 */
export function faqPageJsonLd(faqs: ReadonlyArray<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

/**
 * The business site's routes. These are the only pages that are indexed,
 * pre-rendered and advertised in the sitemap.
 */
export const STATIC_PAGE_SEO: Record<string, SeoMeta> = {
  "/": {
    title: `${brand.tagline}`,
    description: brand.promise,
    canonicalPath: "/",
  },
  "/systems": {
    title: "What Gets Built",
    description:
      "Instant quoting, lead intake, booking, a client portal, an operator dashboard and search that actually indexes — the whole path from a stranger to a repeat customer.",
    canonicalPath: "/systems",
  },
  "/proof": {
    title: "Proof — The System That Ran a Real Business",
    description:
      `Built for ${brand.operator.priorBusiness} and used for ${brand.operator.yearsRun} years to quote, book and invoice thousands of jobs across Southern Maine. Still online, in full, as a live demo.`,
    canonicalPath: "/proof",
  },
  "/process": {
    title: "How It Works — Fixed Scope, Fixed Price",
    description:
      "A conversation about the work, then a fixed scope and price in writing before anything starts. No hourly billing and no open-ended discovery phase.",
    canonicalPath: "/process",
  },
  "/contact": {
    title: "Book a Call",
    description:
      "An hour, free, and a straight answer about whether an operations system is worth building for your service business. If it isn't, you'll be told on the call.",
    canonicalPath: "/contact",
  },
  "/privacy": {
    title: "Privacy",
    description:
      "What this site collects, what it is used for, and how to have it deleted. One contact form and analytics — nothing else.",
    canonicalPath: "/privacy",
  },
};

/**
 * The DEMO's page metadata — the cleaning company's site, kept whole under
 * /demo as proof that the system is real.
 *
 * Every entry is forced `noindex` and stripped of its canonical by the
 * wrapper below. That is not tidiness, it is the point: the business has
 * wound down, and a page still ranking for "house cleaning Portland Maine"
 * would send real people to book a service nobody is going to deliver. The
 * sitemap drops these too, and robots.txt disallows /demo.
 */
const demoPages: Record<string, SeoMeta> = {
  "/": {
    title: "Airbnb Turnover & House Cleaning in Southern Maine",
    description:
      "Same-day Airbnb and VRBO turnovers, recurring house cleaning, and commercial janitorial across York and Cumberland County. Insured, certified crews since 2018.",
    canonicalPath: "/",
  },
  "/services": {
    title: "Cleaning Services in Southern Maine",
    description:
      "Residential, deep, commercial, move-in/move-out and vacation-rental cleaning across Southern Maine. Transparent pricing, eco-friendly products, insured crews.",
    canonicalPath: "/services",
  },
  "/short-term-rentals": {
    title: "Airbnb & VRBO Turnover Cleaning for Maine Hosts",
    description:
      "Same-day short-term rental turnovers with iCal sync, guest-ready standards and damage reporting for Airbnb and VRBO hosts across coastal Southern Maine.",
    canonicalPath: "/short-term-rentals",
  },
  "/service-areas": {
    title: "Service Areas in York & Cumberland County",
    description:
      // Towns named in rough order of how much work we actually do there
      // (the visit counts in ServiceAreaMap.tsx), not by which names sound
      // most like Maine. Windham and Naples each see an order of magnitude
      // more visits than Kennebunkport, which used to be named ahead of both.
      `Cleaning homes, camps and rentals in ${COMMUNITIES_SERVED} Southern Maine communities — Portland, Scarborough, Windham, Naples, Old Orchard Beach and Kennebunkport.`,
    canonicalPath: "/service-areas",
  },
  "/how-it-works": {
    title: "How Our Cleaning Service Works",
    description:
      "Get an estimate in under two minutes. See the five steps from first message to spotless space, how we handle keys and pets, and what the crew brings along.",
    canonicalPath: "/how-it-works",
  },
  "/about": {
    title: "About Our Southern Maine Cleaning Team",
    description:
      "Cleaning Southern Maine since 2018 with bonded, insured, background-checked crews and ISSA CIMS, GBAC STAR, IICRC and Green Seal certified practices.",
    canonicalPath: "/about",
  },
  "/blog": {
    title: "Cleaning Tips & Short-Term Rental Advice",
    description:
      "Seasonal checklists, cleaning technique and Airbnb hosting advice from a working Southern Maine cleaning crew — written by the people doing the cleaning.",
    canonicalPath: "/blog",
  },
  "/book": {
    title: "Book a Cleaning in Southern Maine",
    description:
      "Pick your date, tell us the essentials, get a confirmed booking. Residential, deep-clean and vacation-rental cleanings across York and Cumberland County.",
    canonicalPath: "/book",
  },
  "/privacy": {
    title: "Privacy Policy",
    description:
      "Privacy policy for The Maine Cleaning Co. — how we collect, use, and protect your personal information.",
    canonicalPath: "/privacy",
  },
  "/terms": {
    title: "Terms of Service",
    description:
      "Terms of service for The Maine Cleaning Co. cleaning and short-term rental turnover services.",
    canonicalPath: "/terms",
  },
  "/sms": {
    title: "Text Message (SMS) Program",
    description:
      "How The Maine Cleaning Co. uses text messages: booking confirmations, scheduling updates and reminders. Reply STOP to opt out, HELP for help.",
    canonicalPath: "/sms",
  },
};

/**
 * One wrapper rather than `noindex: true` typed onto eighteen entries — it
 * cannot be forgotten on a new one, and dropping `canonicalPath` stops a
 * demo page claiming to be the canonical copy of a URL that no longer serves
 * the business.
 */
export const DEMO_PAGE_SEO: Record<string, SeoMeta> = Object.fromEntries(
  Object.entries(demoPages).map(([path, meta]) => [
    path,
    { ...meta, canonicalPath: undefined, noindex: true },
  ]),
);

/**
 * Routes that must never be indexed, and why — see DISALLOWED in
 * server/lib/sitemap.ts, which keeps crawlers off the same paths. robots.txt
 * is the real fence; this is the belt to its braces, and it also stops these
 * pages inheriting the homepage's canonical if the fence ever moves.
 */
export const NOINDEX_PAGE_SEO: Record<string, SeoMeta> = {
  "/portal": {
    title: "Client Dashboard",
    description: "Manage your cleaning services, view quotes, and update your account.",
    noindex: true,
  },
  "/portal/login": {
    title: "Client Portal",
    description: "Sign in to your client portal to manage your cleaning services and account.",
    noindex: true,
  },
  "/portal/reset-password": {
    title: "Reset Password",
    description: "Reset the password for your client portal account.",
    noindex: true,
  },
};

/** The shape `servicesData` entries share, narrowed to what SEO needs. */
export interface SeoServiceLike {
  id: string;
  title: string;
  /**
   * Page title before the brand suffix, when `${title} in Southern Maine`
   * isn't the phrase people search. "Camp Opening & Closing" is the right
   * heading for the page and the wrong title for a result — nobody searches
   * for a camp opening without the word "cleaning" in it.
   */
  seoTitle?: string;
  shortDesc: string;
  /** The search snippet. See the note in services-data.ts on why it isn't shortDesc. */
  seoDescription?: string;
  description: string;
  faqs?: ReadonlyArray<{ q: string; a: string }>;
}

/**
 * Meta for /services/:slug.
 *
 * Emits schema.org Service pointing `provider` at the LocalBusiness node in
 * client/index.html by @id, so the two describe one business rather than
 * two unrelated entities — which is what separate, un-linked nodes mean to
 * a parser.
 */
export function serviceSeo(service: SeoServiceLike): SeoMeta {
  const path = `/services/${service.id}`;
  const jsonLd: unknown[] = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.title,
      description: service.description,
      serviceType: service.title,
      provider: { "@id": ORGANIZATION_ID },
      areaServed: [
        { "@type": "AdministrativeArea", name: "York County, ME" },
        { "@type": "AdministrativeArea", name: "Cumberland County, ME" },
      ],
      url: canonicalUrl(path),
    },
    breadcrumbs([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
      { name: service.title, path },
    ]),
  ];
  if (service.faqs?.length) jsonLd.push(faqPageJsonLd(service.faqs));

  // Demo page — see DEMO_PAGE_SEO. The service pages describe work the
  // business no longer takes, so they must not be indexed or claim a
  // canonical URL.
  return {
    title: service.seoTitle ?? `${service.title} in Southern Maine`,
    description: service.seoDescription ?? service.shortDesc,
    noindex: true,
    jsonLd,
  };
}

/** The shape `areaPages` entries share, narrowed to what SEO needs. */
export interface SeoAreaLike {
  slug: string;
  name: string;
  seoTitle: string;
  seoDescription: string;
  towns: string[];
  faqs?: ReadonlyArray<{ q: string; a: string }>;
}

/**
 * Meta for /service-areas/:slug.
 *
 * `areaServed` names the individual towns rather than the two counties. The
 * counties are already on the LocalBusiness node in index.html; what this
 * page adds is the granularity a local query actually has — somebody searches
 * for cleaners in Naples, not in Cumberland County.
 */
export function areaPageSeo(area: SeoAreaLike): SeoMeta {
  const path = `/service-areas/${area.slug}`;
  const jsonLd: unknown[] = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `Cleaning services in the ${area.name} area`,
      description: area.seoDescription,
      provider: { "@id": ORGANIZATION_ID },
      areaServed: area.towns.map((town) => ({
        "@type": "City",
        name: town,
        containedInPlace: { "@type": "State", name: "Maine" },
      })),
      url: canonicalUrl(path),
    },
    breadcrumbs([
      { name: "Home", path: "/" },
      { name: "Service Areas", path: "/service-areas" },
      { name: area.name, path },
    ]),
  ];
  if (area.faqs?.length) jsonLd.push(faqPageJsonLd(area.faqs));

  // Demo page — see the note in serviceSeo.
  return {
    title: area.seoTitle,
    description: area.seoDescription,
    noindex: true,
    jsonLd,
  };
}

/** The shape `blogPosts` entries share, narrowed to what SEO needs. */
export interface SeoPostLike {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  image?: string;
}

/**
 * Meta for /blog/:slug.
 *
 * `datePublished` needs a W3C date, and blog-data.ts writes dates for humans
 * ("March 15, 2026"). An unparseable one is omitted rather than guessed at —
 * same rule as <lastmod> in server/lib/sitemap.ts, and for the same reason:
 * a wrong date is worse than an absent one.
 */
export function blogPostSeo(post: SeoPostLike): SeoMeta {
  const path = `/blog/${post.id}`;
  const ms = Date.parse(post.date);
  const published = Number.isNaN(ms) ? undefined : new Date(ms).toISOString().slice(0, 10);

  return {
    title: post.title,
    description: post.excerpt,
    // Demo page — see the note in serviceSeo.
    noindex: true,
    ogType: "article",
    ogImage: post.image && /^https?:\/\//.test(post.image) ? post.image : undefined,
    publishedTime: published,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        ...(published ? { datePublished: published } : {}),
        ...(post.image ? { image: post.image } : {}),
        author: { "@id": ORGANIZATION_ID },
        publisher: { "@id": ORGANIZATION_ID },
        mainEntityOfPage: canonicalUrl(path),
        url: canonicalUrl(path),
      },
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: "Journal", path: "/blog" },
        { name: post.title, path },
      ]),
    ],
  };
}
