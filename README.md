# The Maine Cleaning Co. — Website & Quoting Platform

A full-stack, production-grade cleaning company website with an integrated instant pricing calculator, lead intake pipeline, client portal, and AI features. Built to be remixed for any local service business.

---

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Design System & UI Tokens](#design-system--ui-tokens)
3. [Page Structure & Layout](#page-structure--layout)
4. [Component Library (Custom)](#component-library-custom)
5. [Pricing Engine](#pricing-engine)
6. [Lead Intake Pipeline](#lead-intake-pipeline)
7. [API Reference](#api-reference)
8. [Client Portal](#client-portal)
9. [Admin Dashboard](#admin-dashboard)
10. [AI Features](#ai-features)
11. [Data Models](#data-models)
12. [Key Files](#key-files)
13. [Business Info & Config](#business-info--config)
14. [Environment Variables](#environment-variables)
15. [Scripts](#scripts)
16. [Remix Guide](#remix-guide)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Routing | wouter (lightweight SPA router) |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Animation | Framer Motion |
| State / Data | TanStack Query (React Query) |
| Backend | Express.js 5, Node.js, TypeScript |
| ORM | Drizzle ORM |
| Database | PostgreSQL (Neon / Replit managed) |
| Auth | express-session + connect-pg-simple + bcryptjs |
| Email | Gmail API via Google OAuth (googleapis) |
| AI | OpenAI GPT-4o-mini (cleaning tip + chat) |
| Maps / Address | OpenStreetMap Nominatim (free, no API key) |
| Weather | Open-Meteo API (free, no API key) |

---

## Design System & UI Tokens

### Color Palette (CSS variables in `client/src/index.css`)

The site ships **light and dark themes**; every token below is declared twice,
under `:root` and under `.dark`. The values here are the light theme — read
`index.css` for the dark pair. Light is the default.

The palette is **the Maine shoreline**: deep navy, seafoam green, sand beige,
driftwood grey. Light is sand with navy ink; dark is navy with sand ink.

```css
/* light */
--background:   40 30% 96%    /* sand beige — page background */
--foreground:   212 44% 15%   /* deep navy — text */
--card:         40 33% 99%    /* palest sand — card surface */
--primary:      209 54% 26%   /* deep navy — CTAs, links, accents */
--primary-foreground: 40 33% 99%
--muted-foreground: 209 14% 36%   /* driftwood grey */
--seafoam:      174 46% 25%
--sand:         38 34% 88%
--driftwood:    209 12% 40%
--border:       38 20% 86%
--radius:       0.875rem      /* default card / button border radius */
```

`--seafoam`, `--sand`, `--driftwood` and `--navy` are registered as Tailwind
colours, so `text-seafoam` and `border-driftwood` work. They are the same four
colours the `--brand-*` family carries — the brand names are for CATEGORICAL
use (telling one service tile from its neighbour), the shoreline names are for
when you mean *that colour*.

**Every pair is contrast-checked by script, not by eye.** `node
scripts/check-contrast.mjs` prints all 30 and exits non-zero on a failure
(lowest in the current palette: 5.44:1, against the 4.5:1 AA needs for body
text). It carries its own copy of the values so it can be run in one command,
and `client/src/lib/__tests__/shorelinePalette.test.ts` re-derives the same
ratios from the tokens **as declared in `index.css`**, so that copy cannot
quietly drift from the stylesheet and keep reporting green.

> **`--primary-foreground` is NOT white on the dark theme.** Dark `--primary`
> is a *light* blue (`212 58% 62%`) so that it works as link and accent ink on
> a dark page. White on top of that is **2.92:1** — which was every filled
> button on the site, plus the whole closing-CTA band, failing AA and failing
> even the 3:1 large-text floor. Dark `--primary-foreground` is therefore
> `222 45% 10%` (6.24:1). If you ever re-light `--primary`, re-check its
> foreground in the same change.

#### Section bands

```css
--band-tint:  30 9% 94%      /* light step   — <Section tone="tint"> */
--band-sink:  32 11% 90%     /* deeper step  — <Section tone="sink"> */

--deep:            215 45% 17%   /* the inverted band — SAME in both themes */
--deep-foreground: 210 22% 86%   /* 10.64:1 on --deep */
--deep-muted:      210 18% 72%   /*  7.32:1 */
--deep-accent:     202 75% 70%   /*  7.58:1 */
```

`tint` and `sink` are soft vertical gradients that fade to nothing at both
edges, so a band reads as a change in weight rather than a ruled line.

`deep` (`<Section tone="deep">`, `.band-deep`) is the loud one. It **redefines
the theme tokens on itself** — `--card`, `--muted-foreground`, `--primary`, the
whole `--brand-*` family — so cards, muted text and buttons inside it invert
automatically and need no variant of their own. It does not flip with the
theme: it is a fixed dark panel in both, the way print uses a reversed panel.

Use it sparingly: at most one mid-page band, plus the page close. `<ClosingCTA>`
and the footer already share this surface, so a page ends in one dark region
rather than two stacked navy slabs.

#### Brand family — derived from the logo

`--primary` and the four `--brand-*` steps are sampled from the actual logo
artwork (`client/public/images/logo.webp`): the navy of the lettering and
lighthouse measures `hsl(232 39% 15%)`, the spruce `hsl(163 49% 17%)`. That
ink is far too dark to be a UI colour, so the family keeps the hues and lifts
them to usable lightness.

```css
--brand-navy:   214 55% 36%   /* = --primary */
--brand-harbor: 196 52% 34%
--brand-pine:   166 48% 27%   /* the logo's spruce */
--brand-stone:  212 14% 38%
```

Registered as Tailwind colours, so `text-brand-pine`, `bg-brand-navy/10` and
`border-brand-harbor/30` all work. **Each token carries its own light and dark
value, so they never need a `dark:` variant** — adding one overrides the token
and breaks the dark theme.

**Use them for CATEGORICAL colour only** — service icons, feature tiles, stat
tiles, quick actions: places where the hue is arbitrary decoration telling one
card from its neighbour. Before this family existed those surfaces reached for
whichever Tailwind hue was nearest (`blue-500` beside `emerald-500` beside
`orange-500` beside `slate-500`, four unrelated families on one row), which is
what stopped the site reading as one thing.

**Never use them for SEMANTIC colour.** An error stays red, a rating star stays
gold, the availability dot stays green, and another company's mark keeps its
own colour (Instagram `#C13584`, Facebook `#1877F2`). The test: *would a
colourblind user lose information if this were grey?* If yes, the hue is
carrying meaning and must not be flattened into the palette.

Lowest contrast ratio in the family is 5.65:1 against `--background`, against
the 4.5:1 AA needs for body text. Re-check with the ratio script in the commit
for #61 if you retune any of them.

### Typography

- **Display**: `--font-display` — **Playfair Display** (Google Fonts), a
  high-contrast didone. `--font-serif` is the old name for the same stack,
  kept so existing `font-serif` utilities keep rendering; it genuinely is a
  serif now.
- **Body / UI**: `--font-sans` — Inter.

The display weights are **600, and the tracking about -0.01em**, not the 700 /
-0.035em the scale used to carry. Those numbers were tuned for Space Grotesk,
an even-stroke grotesk that takes tight tracking happily. Playfair's hairlines
are genuinely hair-thin at 4.75rem, and 700 at -0.035em closed the counters
and collided the thin strokes of neighbouring letters.

**Where the display face does NOT belong:** controls and small labels. The FAQ
accordion triggers, the footer column headings and the certification chips are
`<h3>`/`<h4>` elements at 12–15px that read as UI rather than as headings on a
page — they stay Inter. The rule is *display face for display-sized headings,
UI face for controls and small-caps labels*, not *serif for every h3*. When
the display face was a grotesk this distinction was nearly invisible; against
a serif it is loud, which is why fourteen hand-rolled `font-bold text-base`
headings were moved onto `.type-h3` in the same change.

**Every display-sized piece of text comes from one of four classes in
`index.css`. Do not write out a font family or a font size for a heading
again.**

| Class | Use | Size |
|---|---|---|
| `.type-display` | a landing page's `h1` | `clamp(2.6rem, 6vw, 4.75rem)` |
| `.type-display-sm` | a detail page's `h1` — a service, a town, a post, the legal pages | `clamp(2rem, 4vw, 3.25rem)` |
| `.type-h2` | section headings | `clamp(1.9rem, 3.4vw, 2.9rem)` |
| `.type-h3` | sub-headings, card titles | `clamp(1.1rem, 1.5vw, 1.3rem)` |

Plus `.type-lead` for a standfirst and `.type-eyebrow` for the small uppercase
line above a heading.

Why: there were **five different `h1` recipes across eight public pages** —
Inter 800 at 4.5rem on the homepage, Inter 800 at 4rem on About / How It Works
/ Service Areas, Inter 800 at 3.75rem on Short-Term Rentals, Space Grotesk 700
at 3.5rem on Services / Book / Blog — while `<SectionHeading>` rendered every
`h2` in Space Grotesk. On most pages the largest text on screen was in a
different typeface from the heading directly beneath it.

The sizes are fluid, so there are no breakpoint jumps to keep in sync either,
and each class sets `text-wrap: balance` — which is what stops a headline
stranding one word on its last line ("The Way Cleaning / **Be.**").

- **Section headings are set by `<SectionHeading>`** (`client/src/components/layout/Section.tsx`), not written out per page.
- **Page openings are set by `<PageHero>`** (`client/src/components/layout/PageHero.tsx`) — see Page Structure.
- **Headline accent**: `.heading-accent` — the emphasised word in a headline, in
  solid `--primary`. It replaced `.hero-gradient-text`, a five-stop animated
  gradient in hues nothing else on the site used, which measured **1.80:1**
  against the page at its lightest stop.
- **Section heading accent**: `.section-heading-accent` (centred) / `.heading-rule-left` (left) — pseudo-element rule under the heading.

### Card Styles

```css
.card-soft   — subtle bg, border/20, box-shadow with ambient glow, 2px hover lift
.card-glass  — glassmorphism: backdrop-blur(20px), saturation 1.3, inset highlight
.kpi-card    — stat/metric card: glassmorphic, slightly more opaque
.card-gradient-border — gradient border via CSS mask compositing on the estimate widget
```

### Section Backgrounds

Set with `<Section tone="...">`, never by hand:

- `plain` (default) — inherits the page background.
- `tint` / `sink` — soft gradient bands, transparent at both edges.
- `deep` — the inverted navy panel. See **Section bands** above for the rules.

### Animation Classes

```css
.section-fade          — IntersectionObserver fade-in (0.8s cubic-bezier slide-up), respects prefers-reduced-motion
.hero-aurora           — dual-layer animated gradient mesh (radial blobs, 8s/12s reverse loop)
.hero-dot-grid         — subtle CSS dot pattern that drifts (20s animation)
.marquee-track         — continuous horizontal marquee (services list scrolling behind hero)
.skeleton-shimmer      — shimmer loading state placeholder
.navbar-glass          — frosted glass navbar: hsl(222 22% 15% / 0.88) + blur(28px) + brightness(1.08)
```

### Spacing Rhythm

- Section padding: `py-16 sm:py-24` (most sections)
- Container max-width: `max-w-5xl` for content, `max-w-3xl` for CTAs
- Card gaps: `gap-4 sm:gap-5`
- Hero top padding: `pt-32 sm:pt-40 md:pt-44`

---

## Page Structure & Layout

### Page openings (`/src/components/layout/PageHero.tsx`)

`/about`, `/how-it-works`, `/service-areas`, `/short-term-rentals` and
`/services` each used to carry their own near-identical copy of the hero
markup, and they had drifted — three different `h1` recipes between them, and
a photo column set to `lg:aspect-[5/4]` on one page and `lg:aspect-[4/5]` on
the next. That second difference is why the heroes measured 685px, 936px,
936px and 946px tall, and why two of them had ~250px of empty column under the
copy: the picture beside it was taller than anything there was to say.

`<PageHero>` takes `eyebrow` / `title` / `lead` / `actions` / `meta` and either
a `photo` or a custom `media` node. The media gets a **shared fluid height
band** (`lg:h-[clamp(25rem,34vw,31rem)]`) rather than an aspect ratio, so the
two columns stay the same length and every page opens at the same size. The
four single-photo pages now measure 675px each.

Wrap the emphasised word of a `title` in `<span className="heading-accent">`.

### Navigation Bar (`/src/components/layout/Navbar.tsx`)

**Desktop**: Fixed top, transparent → frosted glass on scroll (12px threshold). Left: text wordmark. Center: nav links. Right: phone number + "Get an Estimate" pill CTA.

**Mobile**: Hamburger (rotates to X with Framer Motion). Tap opens animated full-width dropdown with staggered link animations, backdrop blur overlay, and body scroll lock. Bottom of drawer: Phone button + "Get an Estimate" button.

**Active link**: Framer Motion `layoutId="nav-active-dot"` — animated blue dot slides between active links.

**Nav links**: Home `/` · Services `/services` · About `/about` · Service Areas `/service-areas` · Airbnb & STR `/short-term-rentals` · Blog `/blog`

---

### Home Page (`/`) — the shoreline

The homepage is a single scroll-driven piece: coast footage, tide-driven
animation and optional ambient surf. It is composed from
`client/src/components/shore/`, one file per movement, rather than from one
long component — each movement has its own motion behaviour, its own
accessibility obligations, and in one case its own network call.

| # | Section | File | What it does |
|---|---------|------|--------------|
| 1 | Hero | `ShoreHero.tsx` | Full-viewport coast plate. Poster paints first; the video fades in over it. Three parallax layers. Carries the motion + sound switches. |
| 2 | Services as tide pools | `TidePools.tsx` | Four pools that fill with water as they scroll in, staggered. Each links to its `/services/<id>` page. |
| 3 | About with a lighthouse beam | `Beacon.tsx` | A blurred gradient wedge sweeps the copy on hover **and on focus-within**. |
| 4 | Testimonials as buoys | `Buoys.tsx` | Six real Google reviews, each bobbing on its own period. Native scroll-snap carousel, arrow keys included. |
| 5 | Contact | `Bottle.tsx` | The form. Posts to `/api/intake/submit`. |
| 6 | Tide line | `TideLine.tsx` | The closing CTA. Deliberately not full-viewport — five of those is a rhythm, six is a trudge. |

#### A note on the copy

The first version of this page named every section after the metaphor —
"Four pools, filled on every visit", "Moored up and still here", "Put it in a
bottle". The headings are plain now, and the `h1` is the company's existing
"The Way Cleaning Should Be."

Two of those were not just twee, they worked against the business: a
testimonials section headed "Moored up and still here" reads as *we have
survived*, and naming the contact form after a message in a bottle promises
the slowest, least reliable delivery there is on the one element meant to
convert. **The design, the motion and the file names are unchanged** — the
sections are still built as tide pools and buoys, because that is what they
look like. Only the words a visitor reads changed.

#### Where the form goes

**`POST /api/intake/submit`** — the same endpoint the estimator uses. So a
note sent from the bottle is written to `intake_submissions`, emails the
office, forwards to BrightBase Ops through the retry ledger, and appears in
the admin dashboard, exactly like every other lead.

This is worth stating because the brief for this redesign asked for
submissions to go to a new Supabase project instead. They do not. The site
already has a Postgres database holding every submission; a second store would
have meant leads that never reached the office, and a paused Supabase project
(the free tier pauses after about a week of inactivity) refuses connections
outright, so the form would have dropped real enquiries silently.

#### Motion and sound

`client/src/lib/motion.tsx` resolves **three** states — `auto` (follow the OS,
the default), `full`, `reduced` — and writes the answer to
`<html data-motion>`. CSS and `useParallax` both read that attribute, so one
switch governs both. Before this they each asked `prefers-reduced-motion`
separately and agreed only by coincidence; neither could be overridden.

Two details that are easy to get wrong when touching this:

- **Reduced motion shows FULL tide pools, not empty ones.** Stopping an
  animation must not leave the design looking unfinished.
- **An explicit `full` must beat an OS `reduce`.** Every other reduced-motion
  block in `index.css` is a bare media query that no control can override, so
  the shoreline rules are guarded with `:root:not([data-motion="full"])`.
  Without that, a visitor whose OS asks for less motion could never opt in.

Sound **never autoplays** — WCAG 2.1 SC 1.4.2, and every browser blocks it
anyway. The button is the feature. What is remembered is the choice, not the
playback: a returning visitor still arrives to silence. It pauses when the tab
is hidden, and the 460 KB file is `preload="none"`, so it downloads on the
first click and not before.

#### The navbar over a dark hero

The bar is transparent until you scroll, and its light-theme ink is deep navy
— which over this footage measured about **1.6:1**. A page declares its own
hero tone (`<html data-hero-tone="dark">`, set by `ShoreHero` and cleared on
unmount) and `index.css` recolours `.navbar-top` for that case. Keyed off the
page rather than the route, so a second dark-hero page needs no change.

Measured against the composited plate (brightest pixel behind each run of
text): wordmark 11.49:1, nav links 6.91:1, h1 6.57:1, standfirst 5.15:1.

The standfirst was **3.46:1 before** a fix — it cleared the 3:1 floor for
large text but not the 4.5:1 body text needs. Darkening the whole scrim would
have cost the water, so `.shore-scrim` carries a **copy wash**: a left-to-right
gradient that is heavy behind the text column and gone by two-thirds across,
where the open water is. If you swap the footage for something brighter on the
left, re-measure — no test can check composited video pixels.

#### Media

`client/public/media/` — 3.4 MB total, all U.S. National Park Service footage
of Acadia National Park, public domain under 17 U.S.C. §105. Provenance, the
exact ffmpeg invocations and the rules for replacing any of it are in
`client/public/media/CREDITS.md`.

The hero video never loads on a phone (`min-width: 768px`), never loads under
reduced motion, and never loads when the browser reports `saveData` or a 2G
connection. Those visitors keep the poster, which is a photograph of the same
water.

### About Page (`/about`)

**1. Hero** — Page hero with aurora/dot-grid background, "About Maine Cleaning Co." heading, subtitle, Get Estimate + Call buttons

**2. Story + Achievement Grid**
- Left: 3-paragraph company story (founded 2018, growth, values), two CTA buttons (How It Works + Service Areas)
- Right: 2×3 grid of `kpi-card` achievement stats — Est. 2018 · 5,000+ Cleans · 93% Recurring · 49+ Communities · 4.9★ · 30+ Yrs Experience

**3. Values Grid** (alternate section bg)
- 6 `card-glass` cards with colored icon badges: Reliable Scheduling (blue) · Eco Products (green) · All Property Types (primary) · Clear Communication (violet) · Fully Insured (orange) · Local Team (rose)

**4. Eco Products**
- Left: photo of Melaleuca EcoSense products
- Right: heading, description, 5 pill tags (Non-Toxic · Biodegradable · Kid & Pet Safe · etc.), `AICleaningTip` component

**5. Client Testimonials** (alternate section bg)
- 3 `card-soft` cards with quote icon, italic testimonial text, star rating, and attribution
- Google Reviews link button below

**6. Certifications**
- Same `Certifications` component as Home

**7. Instagram CTA** (alternate section bg)
- Centered card with gradient Instagram icon, handle, description, two buttons (Follow on Instagram + Facebook Page)

**8. Bottom CTA Band** — primary-color full-width section, Get My Estimate + Call buttons

---

### Services Page (`/services`)

- 5 service cards with icon, title, description, pricing hint, "Learn more →" link
- `CleaningQuiz` component — "Not Sure Where to Start?" — 3-question interactive quiz recommending the right service
- Links to all 5 service detail pages

---

### Service Detail Pages (`/services/:slug`)

Slug options: `residential` · `deep-cleaning` · `commercial` · `vacation-rentals` · `move-in-out`

Structure per page:
1. Breadcrumbs (Home > Services > [Name])
2. Hero — service name, desc, key tags, "Get Estimate" + "Call" CTA
3. What's Included — checklist grid
4. Good Fit For — 3 use-case cards
5. FAQ accordion (service-specific questions)
6. Bottom CTA band

Data source: `client/src/lib/services-data.ts`

---

### Airbnb & STR Page (`/short-term-rentals`)

Dedicated landing page for vacation rental hosts:
- STR-specific hero, turnover timing highlights
- Features for hosts: same-day flips, linen service, guest-ready checklists
- Intake form (routes to custom quote in `InstantEstimate`)

---

### How It Works Page (`/how-it-works`)

5-step visual timeline with icons, numbered steps, and supporting copy. FAQ section at bottom.

---

### Service Areas Page (`/service-areas`)

- `ServiceAreaMap` component (force-directed network graph, canvas-based)
- KPI strip: 93% Recurring · 7% One-Time · 49+ Communities · 7+ Years
- Full list of 49+ communities served across York & Cumberland County
- Bottom CTA band

---

### Blog (`/blog` and `/blog/:slug`)

Static blog powered by `client/src/lib/blog-data.ts`. Posts rendered with Markdown-style formatting. Featured image, author, date, tags, category. Sidebar with recent posts.

---

### Client Portal (`/portal`, `/portal/login`, `/portal/reset-password`)

See [Client Portal](#client-portal) section.

---

### Admin Dashboard (`/admin`)

See [Admin Dashboard](#admin-dashboard) section.

---

### Footer (`/src/components/layout/Footer.tsx`)

**Structure:**
1. CTA banner — "Ready for a cleaner space?" + "Get Estimate" button
2. 4-column grid:
   - **Brand column**: Wordmark + tagline + Phone/Text/Email contact links
   - **Services**: Residential · Deep Cleaning · Airbnb & Vacation Rental · Commercial · Move-In/Out
   - **Company**: About Us · How It Works · Service Areas · Blog
   - **Service Area + Connect**: Location text, Facebook, Instagram, Leave a Review (Google)
3. Bottom bar — copyright, Privacy Policy, Terms of Service, "Built by msmall.org"

**No duplicate links** — STR and Vacation Rental consolidated to one entry.

---

### Sticky Mobile Bar (`StickyMobileBar.tsx`)

Appears after 400px scroll on mobile only (`lg:hidden`). Three actions in a bar fixed to `bottom-0`:
- "Get Estimate" — scrolls to `#get-estimate`
- "Text" — SMS href
- "Call" — phone href

---

## Component Library (Custom)

### `InstantEstimate.tsx`

The core conversion tool. See full [Pricing Engine](#pricing-engine) section.

### `AIChatWidget.tsx`

Floating bottom-right chat bubble. Powered by GPT-4o-mini via `/api/ai/chat`. Features:
- Pulse + glow animation on bubble
- Minimizable chat window with message history
- Rate-limited (10 msgs/min per IP)
- System prompt context: company info, services, pricing

### `AICleaningTip.tsx`

Card component that fetches `/api/ai/cleaning-tip`. Shows AI-generated seasonal cleaning tip. 24-hour server-side cache. Graceful fallback to curated static tips if AI unavailable.

### `ServiceAreaMap.tsx`

Canvas-based force-directed network graph. 20 city nodes orbit 5 service-type hub nodes. Continuous rotation animation. Below the graph: top 10 locations with mini progress bars.

### `ServiceAreaGlobe.tsx`

Alternative globe-style map visualization for the service area.

### `Certifications.tsx`

Row of 5 certification badges: ISSA CIMS · OSHA Certified · Green Seal · AHCA COVID-19 · AHCA Professional House Cleaner.

### `CleaningQuiz.tsx`

3-step interactive quiz on the Services page: "What matters most?" → "What's your home size?" → "How often do you want cleaning?" → recommends a service with a description and CTA.

### `StickyMobileBar.tsx`

Fixed bottom action bar for mobile. See layout section above.

### `AddressInput` (inside `InstantEstimate.tsx`)

Address autocomplete using OpenStreetMap Nominatim. Debounced 400ms, filtered to Maine. Populates ZIP code automatically on selection.

---

## Pricing Engine

**Location**: `shared/pricing.ts` — `computeEstimate()`.

This is the *only* implementation of the math. The browser widget
(`InstantEstimate.tsx`) and the server recompute (`server/lib/quoteEngine.ts`)
both import that one function, which is what makes the price a customer sees
and the price forwarded to BrightBase equal by construction rather than by
coincidence. **Change pricing here and nowhere else** — a second copy anywhere
is a customer being quoted one number and the operator receiving another.

`shared/pricing-vectors.json` is the cross-repo contract pinning this engine
against Bright-Space's Python port; `server/__tests__/pricingParity.test.ts`
enforces it. Regenerate with `npm run gen:pricing-vectors` after any
intentional rate change.

### Category Flow

| Category | Flow |
|----------|------|
| `residential` | Shows full calculator (sqft, baths, frequency, pets, condition) |
| `deep-clean` | Shows calculator without frequency selector (always biweekly rate) |
| `str` | Custom quote form (no instant price — complexity varies) |
| `commercial` | Custom quote form (no instant price) |

### Formula (v2 — Three-Tier Piecewise)

```
RATE = $60 per labor-unit

// Piecewise sqft → labor units (decreasing marginal rate)
sqftUnits:
  sf ≤ 1500    →  sf / 680
  sf ≤ 3000    →  (1500/680) + (sf−1500) / 1050
  sf > 3000    →  (1500/680) + (1500/1050) + (sf−3000) / 1400

// Bathroom adjustment (supports half-baths in 0.5 steps)
bathAdj = max(0, (bathrooms − 1) × 0.40)

// Condition & pet addons
condUnits: maintenance=0, moderate=+0.50, heavy=+1.00
petUnits:  none=0, some=+0.30, heavy=+0.60

// Deep clean multiplier (scales with home size)
deepMult:
  sf ≤ 1200  →  1.60×
  sf ≤ 2000  →  1.65×
  sf ≤ 3000  →  1.75×
  sf > 3000  →  1.80×

labor = (sqftUnits + bathAdj + condUnits + petUnits) × deepMult

// Frequency multiplier
weekly=0.85×, biweekly=1.0×, monthly=1.15×, one-time=1.50×

raw = labor × freqMultiplier × RATE
final = max(minJob, round(raw / 5) × 5)
min = round(final × 0.96 / 5) × 5
max = round(final × 1.04 / 5) × 5
```

**Minimums**: Standard = $130, Deep Clean = $225

### Sample Outputs (biweekly, maintained, no pets)

| Size | 2 Bath Standard | 2 Bath Deep Clean |
|------|-----------------|-------------------|
| 1,000 sq ft | $125–$135 | $215–$235 |
| 1,500 sq ft | $150–$160 | $250–$270 |
| 2,000 sq ft | $180–$190 | $295–$315 |
| 2,500 sq ft | $205–$225 | $360–$390 |
| 3,000 sq ft | $230–$250 | $410–$440 |
| 4,000 sq ft | $275–$295 | $495–$535 |

<sub>Biweekly, maintained condition, no pets — the widget's defaults. Generated
from `computeEstimate()`; the previous table had drifted by up to $50 at the
larger sizes. Regenerate rather than hand-editing.</sub>

### Half-Bath Support

Bathrooms stepper increments in 0.5 steps (1.0, 1.5, 2.0, 2.5 … 6.0). Displayed as "1½", "2½" etc.

The true fractional count is submitted to the API — **not** `Math.round()`. An
earlier version of this file documented rounding "for DB compatibility"; that
was the cause of a real parity bug (a 2.5-bath home priced as 2 baths on the
server and 2.5 in the browser) and the column is `real`, so there was never
anything to be compatible with. `bathrooms` is validated as `multipleOf(0.5)`
in `server/lib/validators.ts` precisely to keep the half-bath intact. Do not
reintroduce the rounding.

### Estimate Display

Rich pill-tag summary below the price range:
- Always visible: sq ft · baths · Clean Type · Frequency (if residential)
- Conditional (amber pills): Home condition (if not "maintained")
- Conditional (orange pills): Pet hair (if not "none")

---

## Lead Intake Pipeline

### Flow

```
User fills InstantEstimate (or custom quote form for STR/commercial)
  ↓
POST /api/intake/submit
  ↓
Server validates with Zod
  ↓
Saves to intakeSubmissions table (PostgreSQL)
  ↓
sendIntakeNotification()
  ↓ → Branded HTML email to info@maine-clean.co (Reply-To: customer)
  ↓ → Customer confirmation email (if email provided)
  ↓
If email provided → creates or finds portal account
  ↓
Response includes portalCreated / existingAccount flags
  ↓
Frontend: Step 3 success screen shown
  If portalCreated → "Your Client Portal is Ready" CTA
  If existingAccount → "Log in to your portal" CTA
```

### Submission Payload

```typescript
{
  sqft?: number              // undefined for STR/commercial
  serviceType: "standard" | "deep" | "str" | "commercial"
  frequency?: string         // "weekly" | "biweekly" | "monthly" | "one-time"
  bathrooms?: number         // rounded integer
  petHair?: string           // "none" | "some" | "heavy"
  condition?: string         // "maintenance" | "moderate" | "heavy"
  estimateMin?: number       // calculated min price
  estimateMax?: number       // calculated max price
  name?: string
  email?: string
  phone?: string
  notes?: string
  zip?: string
  address?: string
  photos?: string[]          // base64 data URIs, max 3, max 2MB each
  source: "website_form"
}
```

---

## API Reference

### Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create portal account |
| POST | `/api/auth/login` | — | Login (rate: 5/min) |
| POST | `/api/auth/logout` | — | Clear session |
| GET | `/api/auth/me` | session | Get current user |
| POST | `/api/auth/forgot-password` | — | Send reset email (rate: 3/15min) |
| POST | `/api/auth/reset-password` | token | Apply new password |

### Intake / Quotes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/intake/submit` | — | Submit estimate/quote request (rate: 5/min) |
| POST | `/api/quotes` | — | Legacy quote endpoint |
| GET | `/api/quotes` | admin | List leads (paginated, filterable) |
| GET | `/api/quotes/:id` | admin | Get single lead |
| PATCH | `/api/quotes/:id/status` | admin | Update lead status |
| DELETE | `/api/quotes/:id` | admin | Archive lead |

### Portal (requires session auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/portal/quotes` | Client's own quotes |
| POST | `/api/portal/quotes/:id/approve` | Approve a quoted estimate |
| GET | `/api/portal/onboarding/:quoteId` | Get onboarding checklist |
| PUT | `/api/portal/onboarding/:quoteId` | Save onboarding form |
| GET | `/api/portal/contracts` | Client's contracts |
| POST | `/api/portal/contracts/:id/sign` | Sign a contract |
| GET | `/api/portal/schedule` | Upcoming cleanings |
| POST | `/api/portal/schedule` | Create cleaning appointment |
| PATCH | `/api/portal/schedule/:id` | Update appointment |
| DELETE | `/api/portal/schedule/:id` | Cancel appointment |
| GET | `/api/portal/payments` | Invoice history |

### Utility

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/weather` | 5-day forecast for Portland ME (30-min cache) |
| GET | `/api/ai/cleaning-tip` | AI seasonal tip (24-hr cache) |
| POST | `/api/ai/chat` | AI chat assistant (rate: 10/min) |

---

## Client Portal

**Routes**: `/portal/login` (login/register) · `/portal` (dashboard) · `/portal/reset-password`

### Auth Flow

- Email + password registration. bcryptjs 10 rounds. 30-day session cookie (PostgreSQL-backed).
- Forgot password: 1-hour token sent via Gmail. Case-insensitive email lookup.
- Portal accounts are auto-created when a lead submits with an email address (temp password emailed to them).

### Portal Dashboard Sections

1. **Welcome** — Name, quick action cards
2. **Quotes** — Submitted estimate requests, status badges, approve quoted prices
3. **Onboarding** — Service-specific fillable forms (dark-themed)
4. **Documents** — Signed service agreements + contracts; digital signature
5. **Schedule** — Monthly drag-and-drop calendar. Status flow: requested → upcoming → completed
6. **Payments** — Invoice history and status

---

## Admin Dashboard

**Route**: `/admin` — requires `requireAdmin` middleware (admin@maine-clean.co + ADMIN_PASSWORD env var)

### Features

- Status filter tabs with lead counts: All · New · Reviewed · Booked · Transferred
- Expandable table rows with full lead details (contact info, address, photos, timestamps, notes)
- Mobile: card layout (table on desktop, stacked cards on mobile)
- CSV export of all visible leads
- Archive (soft delete) individual leads
- Auto-refresh every 30 seconds
- Photo thumbnails for uploaded property images

---

## AI Features

### Chat Widget

File: `client/src/components/ui/AIChatWidget.tsx`

- Floating bottom-right chat bubble with blue glow pulse animation
- On open: animated chat window with company context pre-loaded
- Backend: `POST /api/ai/chat` — calls OpenAI GPT-4o-mini with system prompt covering services, pricing, service area, eco products, and how to book
- Rate limited: 10 msgs/min per IP
- Graceful error handling — shows friendly error if API fails

### Cleaning Tip

File: `client/src/components/ui/AICleaningTip.tsx`

- Server-side cached for 24 hours (avoids repeated OpenAI calls)
- Prompt: seasonal cleaning tip relevant to Maine's coastal climate
- Fallback: curated array of 10 static tips used if OpenAI unavailable
- Shown on About page and in the estimate widget area

---

## Data Models

**File**: `shared/schema.ts`

```typescript
// Lead / Quote Submissions
intakeSubmissions {
  id, name, email, phone, address, zip,
  sqft, bathrooms, serviceType, frequency, petHair, condition,
  estimateMin, estimateMax, notes, photos (text[]),
  status ("New"|"Reviewed"|"Booked"|"Transferred"),
  archived, source, createdAt, updatedAt
}

// Portal Users
users {
  id, email, password (hashed), name, role ("client"|"admin"),
  resetToken, resetTokenExpiry, createdAt
}

// Portal Quotes (linked to user + intake)
quoteLeads {
  id, userId, ...same fields as intakeSubmissions
}

// Portal: Scheduled Cleanings
scheduledCleanings {
  id, userId, title, date, timeSlot, status, notes, serviceType
}

// Portal: Contracts
contracts {
  id, userId, title, content, signedAt, signedBy, createdAt
}

// Portal: Payments
payments {
  id, userId, amount, status, dueDate, paidAt, description
}

// AI Chat
conversations { id, userId, createdAt }
messages { id, conversationId, role, content, createdAt }
```

---

## Key Files

| Path | Purpose |
|------|---------|
| `shared/schema.ts` | All Drizzle table definitions + Zod insert schemas |
| `server/db.ts` | PostgreSQL pool + Drizzle instance |
| `server/storage.ts` | `DatabaseStorage` class — all CRUD operations |
| `server/routes.ts` | All Express API routes |
| `server/auth.ts` | Session setup, requireAuth/requireAdmin middleware |
| `server/email.ts` | Gmail API integration — lead notification + customer confirmation HTML emails |
| `server/lib/quoteEngine.ts` | Server-side quote normalization helpers |
| `server/lib/normalize.ts` | Lead data normalizer |
| `server/lib/validators.ts` | Zod schemas for API validation |
| `client/src/App.tsx` | Route definitions, providers (Query, Auth, Tooltip, Toast) |
| `client/src/index.css` | All design tokens, card styles, animations, aurora, marquee |
| `client/src/lib/company-info.ts` | Single source of truth: phone, email, SMS, socials, address |
| `client/src/lib/services-data.ts` | All 5 service definitions: title, slug, icon, checklist, FAQ |
| `client/src/lib/blog-data.ts` | Static blog posts array |
| `client/src/lib/gallery-data.ts` | Gallery image paths + captions |
| `client/src/lib/auth.tsx` | `AuthContext` — login, register, logout, refresh |
| `client/src/pages/Home.tsx` | Full homepage with all sections |
| `client/src/pages/About.tsx` | About page (no photos, stat grid, testimonials) |
| `client/src/pages/ServiceDetail.tsx` | Dynamic service detail template |
| `client/src/pages/Admin.tsx` | Admin lead management dashboard |
| `client/src/pages/Portal.tsx` | Full client portal (all sections) |
| `client/src/components/layout/Navbar.tsx` | Responsive navbar with mobile drawer |
| `client/src/components/layout/Footer.tsx` | Footer with 4-column grid + CTA banner |
| `client/src/components/ui/InstantEstimate.tsx` | Full pricing calculator + lead form (3-step) |
| `client/src/components/ui/AIChatWidget.tsx` | Floating AI chat widget |
| `client/src/components/ui/StickyMobileBar.tsx` | Mobile bottom action bar |
| `client/src/components/ui/Certifications.tsx` | Certification badges row |
| `client/src/components/ui/ServiceAreaMap.tsx` | Force-directed network graph |
| `client/index.html` | Site-wide head defaults, JSON-LD LocalBusiness structured data |
| `client/src/lib/seo.ts` | Per-page title/description/canonical registry + schema.org helpers |
| `client/src/lib/seo-routes.ts` | Every pre-renderable route, build/test only (imports page data) |
| `client/src/lib/faq-data.ts` | /how-it-works FAQ pairs, shared by the page and its FAQPage schema |
| `client/src/hooks/use-seo.ts` | Writes the head tags at runtime from that registry |
| `client/src/prerender-entry.tsx` | Build-time SSR entry — renders every public page |
| `script/prerender.ts` | Writes `dist/prerendered/*.html` after the Vite build |
| `script/html-head.ts` | Pure head-rewriting transform, unit-tested against the real shell |
| `server/lib/canonicalHost.ts` | 301s the apex to www, and http to https |
| `server/lib/sitemap.ts` | Generated `/robots.txt` and `/sitemap.xml` |

---

## Search & Crawlers

Every public page has its **own** title, description, canonical URL, Open
Graph tags and structured data, and ships them in two places:

1. **At runtime** — `useSEO` writes them into the head on navigation. This is
   what Google and Bing see after executing the app's JavaScript.
2. **At build time** — `script/prerender.ts` renders all 22 public routes to
   `dist/prerendered/*.html` with the same tags baked in, plus the page's text
   and the Footer's internal links.

Both read one registry (`client/src/lib/seo.ts`), so they cannot disagree.

The build-time copy is not redundant. Facebook, LinkedIn, iMessage and Slack
never run JavaScript — they read `og:*` from the HTML as served. Bing does not
run it reliably, and DuckDuckGo, Ecosia and Brave lean on Bing's index. The AI
crawlers now sending referral traffic (OAI-SearchBot, PerplexityBot, ClaudeBot)
mostly read static HTML. Before this existed, all of them got an empty
`<div id="root">` and the homepage's metadata on every URL.

**Adding a page** means touching four places, each guarded by a test:

| Place | What breaks without it |
|---|---|
| `STATIC_PAGE_SEO` in `client/src/lib/seo.ts` | No metadata; `seo.test.ts` fails |
| The `Switch` in `client/src/prerender-entry.tsx` | Renders blank; `prerenderRender.test.ts` fails |
| `App.tsx` router | 404 in the browser |
| `SPA_ROUTES` in `server/static.ts` | Served with HTTP 404 |
| `STATIC_PAGES` in `server/lib/sitemap.ts` | Not advertised; `seo.test.ts` fails |

Things deliberately **not** done, with reasons, since each looks like an
oversight:

- **No `aggregateRating` in the JSON-LD.** The reviews are real and live on the
  Google Business Profile, which is exactly why: Google builds the star snippet
  from the profile itself, and its policy disallows self-serving review markup
  on a `LocalBusiness`. Hardcoding one earns no snippet and risks a manual
  action.
- **No `meta keywords`.** Ignored by Google since 2009; a stuffed one is a
  negative signal to Bing.
- **FAQPage markup is still emitted** even though Google restricted FAQ rich
  results to government and health sites in 2023 — Bing uses it, and so do the
  assistants people ask for recommendations.
- **`dist/prerendered/` sits outside `dist/public/`.** `express.static` serves
  everything under `public`, so a file there would publish `/services.html` as a
  second crawlable URL for the same page. The legacy `/<name>.html` paths 301 to
  their clean equivalents.

---

## Business Info & Config

All business details live in **one file**: `client/src/lib/company-info.ts`

```typescript
export const companyInfo = {
  name: "The Maine Cleaning Co.",
  tagline: "Est. 2018 · Southern Maine",
  contact: {
    phone: "+12075720502",
    phoneDisplay: "(207) 572-0502",
    phoneHref: "tel:+12075720502",
    smsHref: "sms:+12075720502",
    email: "info@maine-clean.co",
    emailHref: "mailto:info@maine-clean.co",
  },
  socials: {
    facebook: "https://www.facebook.com/mainecleaningco",
    instagram: "https://www.instagram.com/mainecleaningco/",
    google: "https://g.page/r/CYnY6ulFfvDtEAE/review",
  },
  address: {
    area: "York & Cumberland County",
    region: "Southern Maine",
  },
  founded: 2018,
};
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...    # Neon / Replit PostgreSQL connection string

# Auth
SESSION_SECRET=...               # Express session secret (long random string)
ADMIN_PASSWORD=...               # Admin user password (auto-seeded on startup)

# Email (Gmail OAuth via Replit Google integration)
# Set up via Replit Integrations → Google Mail — no manual env var needed

# AI (optional)
OPENAI_API_KEY=...               # GPT-4o-mini for chat widget + cleaning tips

# Street View in the estimator (optional) — see "Property photos" below
GOOGLE_MAPS_API_KEY=...          # unset = the estimator simply shows no photo

# BrightBase Ops — the only lead destination (see server/lib/brightbase.ts)
BRIGHTBASE_API_URL=https://brightbase-production.up.railway.app  # unset = forwards recorded as "skipped"

# Failed-forward retry sweep (all optional — sensible defaults)
RETRY_SWEEP_INTERVAL_MINUTES=10  # Cadence. Floored at 1 min; bad values fall back to 10
RETRY_SWEEP_DISABLED=1           # Set to switch the background sweep off entirely
CRON_SECRET=...                  # Only needed for an EXTERNAL cron; see below
```

### Property photos in the estimator

When `GOOGLE_MAPS_API_KEY` is set, the estimator shows a Street View photo of
the address a customer types. Unset, the frame never appears and nothing else
changes — the same way the coastal-conditions widget hides itself when the
weather API is unreachable.

To set it up: in a Google Cloud project with billing enabled, turn on the
**Street View Static API**, create an API key, and set it in Railway. Restrict
the key to that one API — the key is used only from our own server, so an
HTTP-referrer restriction would not apply and an IP restriction would need
Railway's egress addresses, which move. The API restriction is the part that
matters: it is what stops a leaked key being spent on anything else.

The key never reaches the browser. `GET /api/property-photo?address=…` proxies
it, because the Street View Static API takes its key as a `key=` query
parameter and ignores `X-Goog-Api-Key` — so a key used from the page would sit
in the page source. `server/lib/streetView.ts` has the rest of the reasoning,
including why it branches on the response's `status` field rather than on the
HTTP status (the API answers 200 while refusing).

Cost control, in three places: the free metadata endpoint is asked first and
the billed image endpoint only once there is confirmed imagery; results are
cached in-process for a day and in the browser for a day; and the client does
not ask at all until the address has a house number, a state and a ZIP after
the state. The route is rate limited to 20 requests a minute per IP.

The customer's address is sent to Google — that is the mechanism — and is
never written to our logs, including on the error paths.

### The failed-forward retry sweep

When a booking can't be forwarded to BrightBase, the inline retries in
`server/lib/leadForward.ts` give up after about three seconds and the attempt
becomes a `failed` row in the `lead_forwards` ledger — payload and target URL
included, so it can be replayed verbatim. Without something replaying them,
a BrightBase outage longer than a few seconds means the site accepts the
booking, emails the customer "Booking Request Received!", and the job never
reaches the operator.

`server/lib/retryScheduler.ts` runs that replay in-process on a timer. It
needs **no configuration and no secret** — it starts automatically wherever
the app runs, as long as `DATABASE_URL` is set (with no database there is no
ledger to replay, so it doesn't start). It won't overlap itself, and it only
logs when a sweep actually found something.

`POST /api/admin/forwards/retry` is unchanged and still available for a human
triggering a sweep on demand. It also accepts `x-cron-secret: $CRON_SECRET`,
so an external cron can be pointed at it as a second trigger — that is the
only reason to set `CRON_SECRET`, and it is not required for the scheduler
above. Both paths call the same `sweepFailedForwards()`, so they can't drift.

To check on it: `GET /api/admin/lead-forwards?status=failed` lists whatever
is still stuck.

---

## Scripts

```bash
npm run dev        # Start dev server (Express + Vite hot reload, port 5000)
npm run build      # Production build (Vite bundles client → dist/public)
npm run start      # Production server (serves built client + API)
npm run db:push    # Push Drizzle schema changes to PostgreSQL
npm test           # Vitest, the whole suite

node scripts/check-contrast.mjs   # Print every palette contrast pair; exits
                                  # non-zero if one is below the WCAG AA floor
```

---

## Remix Guide

This app is designed to be cloned for any local service business. Here's what to change:

### 1. Business Identity (5 minutes)
Edit `client/src/lib/company-info.ts` — update name, phone, email, SMS, socials, address.

### 2. Color Scheme (2 minutes)
Edit `client/src/index.css` — change `--primary` HSL value. The entire color system cascades from this one token. Atlantic blue is `210 58% 46%`. Try teal (`175 60% 40%`), forest green (`140 50% 35%`), or warm orange (`25 85% 50%`).

### 3. Services (10 minutes)
Edit `client/src/lib/services-data.ts` — update the 5 service objects (title, slug, icon, checklist items, FAQ, pricing hints). The `ServiceDetail.tsx` template auto-renders from this data.

### 4. Pricing (10 minutes)
Edit the `engine` `useMemo` in `client/src/components/ui/InstantEstimate.tsx`. The `RATE` constant (currently `60`) and the piecewise sqft tiers are the main knobs. Adjust `minJob` for your market.

### 5. Blog (5 minutes)
Edit `client/src/lib/blog-data.ts` — replace posts with your own content or clear the array to hide the Blog page.

### 5. Photography
Replace images in `client/public/images/` — used in Eco Products section and gallery. No photos are required; the About page and home page work without them.

### 6. Certifications
Edit `client/src/components/ui/Certifications.tsx` — swap badge text/icons for your industry certifications.

### 7. Domain & Deployment
Update meta tags in `client/index.html` (og:url, site name). Deploy via Replit Deployments — the build command is `npm run build`, serve command is `npm run start`.

### 8. Remove AI (optional)
If you don't want AI: remove `AIChatWidget` from `App.tsx`, remove `AICleaningTip` from `About.tsx`, and delete `/api/ai/chat` and `/api/ai/cleaning-tip` from `server/routes.ts`.

### 9. Remove Client Portal (optional)
If you only need the intake form: remove `/portal` routes from `App.tsx`, remove portal routes from `server/routes.ts`. The admin dashboard still works for managing leads.
