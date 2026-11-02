/**
 * The business, in one file.
 *
 * ──────────────────────────────────────────────────────────────────────────
 *  ⚠️  THE NAME BELOW IS A WORKING TITLE, NOT A DECISION.
 *
 *  Change `name`, `shortName` and `domain` here and the whole site follows:
 *  the navbar wordmark, every page title, the canonical URLs, the Open Graph
 *  tags, the JSON-LD business schema and the footer. Nothing hardcodes it.
 *
 *  Two places outside this file also carry the name, because they are read
 *  before JavaScript runs and cannot import a module:
 *    - client/index.html  — <title>, og:*, twitter:*, the JSON-LD block
 *    - server/lib/sitemap.ts — CANONICAL_ORIGIN (and PUBLIC_SITE_URL in prod)
 *  `brand.test.ts` fails if those drift from this file, so you cannot change
 *  one and forget the others.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Why a config file at all: this is the same pattern the product itself is
 * sold on. `company-info.ts` is what makes the cleaning build re-skinnable
 * for the next client in an afternoon; this site is built the same way, which
 * means the site is its own smallest case study.
 */

/** The canonical origin, with no trailing slash. Mirrored in server/lib/sitemap.ts. */
export const SITE_ORIGIN = "https://www.smallworks.systems";

export const brand = {
  /** Working title — see the banner above. */
  name: "Smallworks",
  /** Used where the full name is too long: the mobile wordmark, tight labels. */
  shortName: "Smallworks",
  /** Bare host, for display. Keep in step with SITE_ORIGIN. */
  domain: "smallworks.systems",

  /** One line, under the wordmark. */
  tagline: "Operations software for local service businesses",

  /**
   * The positioning, in one sentence. This is the single most load-bearing
   * string on the site — it is the meta description, the og:description and
   * the first thing under the headline.
   */
  promise:
    "I spent seven years running a cleaning company and built the software that ran it. Now I build that same system for other local service businesses.",

  contact: {
    email: "msmall2691@gmail.com",
    emailHref: "mailto:msmall2691@gmail.com",
    /** Optional. Leave blank to hide every phone affordance on the site. */
    phoneDisplay: "",
    phoneHref: "",
  },

  /** Shown on the proof page and in the footer credit. */
  operator: {
    name: "Mike Small",
    /** The business that proves the pitch. */
    priorBusiness: "The Maine Cleaning Co.",
    yearsRun: 7,
    foundedYear: 2018,
  },

  /**
   * Where the live demo lives. The cleaning site is kept running, in full,
   * as proof — see client/src/demo/. It is `noindex` and its write paths are
   * blocked, because the business behind it has wound down and nobody should
   * be able to book a clean that will never happen.
   */
  demoPath: "/demo",
} as const;

/**
 * What gets built, as data rather than as markup.
 *
 * The /systems page, the homepage summary and the proof page's checklist all
 * render from this one array, so a capability can never be described three
 * different ways on three pages — which is exactly the drift that made the
 * cleaning site read as unfinished.
 */
export type Capability = {
  id: string;
  title: string;
  /** One line, for the homepage grid. */
  summary: string;
  /** The longer case, for /systems. */
  detail: string;
  /** Concrete, checkable claims. No adjectives. */
  points: string[];
  /** Path into the live demo that shows this working, if there is one. */
  demo?: string;
};

export const capabilities: Capability[] = [
  {
    id: "quoting",
    title: "Instant quoting",
    summary:
      "A customer describes the job and gets a real price range on the spot, before you ever pick up the phone.",
    detail:
      "Most local service sites end at a contact form, so every price takes a call, a site visit and two days. A quoting engine moves that to the first thirty seconds — the customer self-qualifies, and you only spend time on jobs worth quoting properly.",
    points: [
      "Priced from your real numbers — rates, minimums, travel, frequency discounts",
      "Property type, size, condition and add-ons all feed the range",
      "Quotes are non-binding by design, so a weird job still gets a human",
      "Every quote is captured as a lead whether or not they book",
    ],
    demo: "/demo/#get-estimate",
  },
  {
    id: "intake",
    title: "Lead intake that does not leak",
    summary:
      "Every enquiry lands in one place, gets an instant acknowledgement, and is retried if delivery fails.",
    detail:
      "The usual setup is a form that emails you, which works until it doesn't — a bad SMTP day silently drops the lead and nobody finds out. Intake here is persisted first and delivered second, with retries and a sweep for anything that failed.",
    points: [
      "Enquiry is written to the database before any email is attempted",
      "Automatic retry with backoff, plus a scheduled sweep for stuck sends",
      "The customer gets an immediate, honest response-time commitment",
      "Phone, email and SMS routes all land in the same inbox",
    ],
  },
  {
    id: "booking",
    title: "Booking and scheduling",
    summary:
      "Customers pick a date, you confirm it, and both sides have the same record of what was agreed.",
    detail:
      "Booking is where most small operators lose hours a week to phone tag. The flow here takes the quote the customer already built, collects what's needed to actually do the job, and hands them a link to manage it themselves.",
    points: [
      "Date selection with your real lead time and blackout rules",
      "Self-serve reschedule and cancel via a one-time link in the confirmation",
      "Confirmations and reminders by email, SMS-ready",
      "Every booking carries the quote it came from, so nothing is re-keyed",
    ],
    demo: "/demo/book",
  },
  {
    id: "portal",
    title: "A client portal",
    summary:
      "Repeat customers sign in to see their history, upcoming visits, documents and payments.",
    detail:
      "For recurring work — cleaning, lawn care, pool service, property management — a portal is what turns a customer into an account. It also cuts the 'when are you coming / can I get that invoice' traffic to near zero.",
    points: [
      "Accounts created automatically on first booking, with a welcome email",
      "Quote and booking history, upcoming schedule, documents",
      "Password reset, session auth, per-account data isolation",
      "Tested against cross-account access, not just assumed safe",
    ],
    demo: "/demo/portal/login",
  },
  {
    id: "admin",
    title: "An operator dashboard",
    summary:
      "The back office: leads, quotes, bookings and customers in one screen built for the person running the business.",
    detail:
      "Built for an operator, not an analyst. The question it answers is 'what needs me today' — not 'what was our quarter-over-quarter conversion'. It is the screen I actually used every morning.",
    points: [
      "Lead queue with status, source and age",
      "Quote and booking detail without digging through email",
      "Customer records with full history",
      "Works on a phone, because that is where you'll read it",
    ],
  },
  {
    id: "seo",
    title: "Search that actually indexes",
    summary:
      "Every page is pre-rendered with its own title, description, canonical and structured data — including per-town landing pages.",
    detail:
      "A normal React site serves crawlers an empty div and one set of head tags copied from the homepage. That is invisible to Bing, to every social preview, and to the AI crawlers now sending real traffic. This builds static HTML for every public page at deploy time.",
    points: [
      "Pre-rendered HTML per route — readable with JavaScript switched off",
      "Per-page canonical, Open Graph and Twitter tags, not the homepage's",
      "LocalBusiness and FAQ structured data",
      "Service-area landing pages generated from the towns you actually serve",
    ],
    demo: "/demo/service-areas",
  },
];

/**
 * How an engagement runs. Four steps, deliberately — a process page with nine
 * stages is a process nobody believes.
 */
export const processSteps = [
  {
    step: "01",
    title: "A conversation about the work",
    detail:
      "Not a requirements document. How jobs actually get priced, who answers the phone, where the time goes, what you've already tried. An hour, free, and you get a straight answer about whether this is worth doing at all.",
  },
  {
    step: "02",
    title: "A fixed scope and a fixed price",
    detail:
      "What's being built, what it costs, and when it lands — in writing, before anything starts. No hourly billing and no discovery phase that quietly becomes the project.",
  },
  {
    step: "03",
    title: "Build, with your numbers in it",
    detail:
      "Your rates, your services, your towns, your brand. You see it running early and often — not a mockup, the real thing on a real URL you can click through.",
  },
  {
    step: "04",
    title: "Launch, then stay reachable",
    detail:
      "Deployed, indexed, and handed over with the documentation to run it. Support after launch is a monthly arrangement, not a surprise invoice.",
  },
] as const;

/**
 * The questions people actually ask, used by /process AND by the FAQPage
 * structured data in seo-routes.ts — so the rich result can never quote an
 * answer the page no longer gives.
 */
export const processFaqs = [
  {
    q: "How long does it take?",
    a: "A first version is usually live in a few weeks, not months — the system already exists and the work is fitting it to your business, not inventing it. The exact window is part of the fixed scope you get before anything starts.",
  },
  {
    q: "Do I own it?",
    a: "Yes. Your code, your repository, your hosting account, your domain and your database. There is no platform you are renting and nothing that stops working if you and I part ways.",
  },
  {
    q: "What do you need from me?",
    a: "Your real numbers — rates, minimums, travel, the services you actually sell and the towns you actually cover — plus a couple of hours of conversation. If you have photos of your own work, those matter more than you'd think.",
  },
  {
    q: "What happens after launch?",
    a: "Support is a monthly arrangement agreed up front: hosting, updates, fixes and small changes. You are never going to get a surprise invoice for a bug. You can also take the whole thing in-house and run it yourself.",
  },
  {
    q: "Can you work with the site I already have?",
    a: "Sometimes. If you're on a page builder with a domain and some ranking worth keeping, that can usually be preserved and pointed at the new system. If it's a template nobody has touched since 2019, replacing it is cheaper than fighting it.",
  },
  {
    q: "What if my pricing is complicated?",
    a: "Most of them are, and that's usually the point — a quoting engine earns its keep precisely when the rules are fiddly. Square footage bands, condition multipliers, frequency discounts, travel, minimums, add-ons and custom-quote escape hatches are all normal.",
  },
];

/**
 * Who this is for. Named plainly, because 'SMBs' is not a customer and the
 * visitor needs to recognise themselves in the first ten seconds.
 */
export const idealClients = [
  "Cleaning and janitorial",
  "Short-term rental management",
  "Lawn, landscaping and snow",
  "Pool and spa service",
  "Pest control",
  "HVAC, plumbing and electrical",
  "Moving and junk removal",
  "Property maintenance",
] as const;
