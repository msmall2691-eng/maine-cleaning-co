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

```css
--background:   60 6% 98%     /* warm off-white — page background */
--foreground:   30 6% 20%     /* near-black warm grey — text */
--card:         0 0% 100%     /* pure white card surface */
--primary:      214 55% 36%   /* Atlantic navy — CTAs, links, accents */
--primary-foreground: 0 0% 100%
--muted-foreground: 30 4% 42%
--border:       30 6% 88%
--radius:       0.875rem      /* default card / button border radius */
```

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

- **Headings**: `font-serif` — **Space Grotesk** (Google Fonts), bold/extrabold, tight tracking (-0.02em to -0.04em). (An earlier version of this file said Playfair Display; `--font-serif` in `index.css` has been Space Grotesk.)
- **Body**: `font-sans` — Inter (system stack fallback)
- **Headings are set by `<SectionHeading>`** (`client/src/components/layout/Section.tsx`), not written out per page. Hand-rolling one is how the site ended up with nine distinct h1 scales and six h2 scales.
- **Hero h1**: `text-[2.25rem] sm:text-5xl md:text-[3.5rem]`, `tracking-[-0.02em]`
- **Section h2**: `text-[1.75rem] sm:text-4xl md:text-[2.5rem]`, `tracking-[-0.02em]`
- **Gradient accent**: `.hero-gradient-text` — CSS linear-gradient from primary through cyan, animated shimmer
- **Section heading accent**: `.section-heading-accent` — pseudo-element underline in primary color

### Card Styles

```css
.card-soft   — subtle bg, border/20, box-shadow with ambient glow, 2px hover lift
.card-glass  — glassmorphism: backdrop-blur(20px), saturation 1.3, inset highlight
.kpi-card    — stat/metric card: glassmorphic, slightly more opaque
.card-gradient-border — gradient border via CSS mask compositing on the estimate widget
```

### Section Backgrounds

Alternating rhythm using two patterns:
- **Default** (white sections): `background: hsl(var(--background))` — `222 22% 10%`
- **Alternate** (card sections): `background: hsl(222 20% 13%)` — applied via inline style or Tailwind `bg-card/30`
- Wave dividers (`WaveDivider` component) between major sections on Home

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

### Navigation Bar (`/src/components/layout/Navbar.tsx`)

**Desktop**: Fixed top, transparent → frosted glass on scroll (12px threshold). Left: text wordmark. Center: nav links. Right: phone number + "Get an Estimate" pill CTA.

**Mobile**: Hamburger (rotates to X with Framer Motion). Tap opens animated full-width dropdown with staggered link animations, backdrop blur overlay, and body scroll lock. Bottom of drawer: Phone button + "Get an Estimate" button.

**Active link**: Framer Motion `layoutId="nav-active-dot"` — animated blue dot slides between active links.

**Nav links**: Home `/` · Services `/services` · About `/about` · Service Areas `/service-areas` · Airbnb & STR `/short-term-rentals` · Blog `/blog`

---

### Home Page (`/`)

**1. Scroll progress bar** — 2px primary-color bar fixed at top-0, tracks `window.scrollY / scrollHeight`.

**2. Hero section**
- Background: `hero-aurora` (animated gradient) + `hero-dot-grid`
- Marquee strip behind hero: "Residential · Deep Cleaning · Vacation Rentals · Commercial · Eco-Friendly · Southern Maine ·"
- Heading: "The Way Cleaning **Should Be.**" (gradient accent on "Should Be.")
- Subtitle: 1-line value prop
- CTAs: "Get My Estimate" (primary pill, scrolls to `#get-estimate`) + "View Services" (outline pill → `/services`)
- Trust bar: Since 2018 · Fully Insured · Local Team · Eco-Conscious (icon + label pills)
- Live indicator: animated ping dot + "Currently serving York & Cumberland County"
- 5-day weather widget: fetches `/api/weather` → shows current temp + 5-day forecast. Skeleton shown during load.

**3. Quick Action Strip**
- Full-width card bar below hero: Call Now (phone) · Text Us (SMS) · Get Estimate (scroll) · Service Areas (link)
- Each action has a colored icon badge, title, and subtitle

**4. Services Grid** (id: `#services`)
- 4 `card-glass` cards: Residential · Deep Cleaning · Vacation Rental Turnovers · Commercial & Janitorial
- Each links to `/services/{slug}`, icon with colored badge, title, desc, "Learn more →" animated link

**5. Stats Counter**
- 6 animated number cards: 7+ Years · 5,000+ Cleans · 30+ Yrs Experience · 4.9★ Rating · 1,500+ FB · 1,900+ IG
- `AnimatedNumber` component: counts up on scroll-into-view using `useInView` + `requestAnimationFrame`

**6. Why Choose Us / Value Props**
- 4 `card-soft` cards: Consistent Teams · Eco Products · Bonded & Insured · Flexible Scheduling

**7. How It Works (5-step timeline)**
- Numbered list: Request Quote → Review & Confirm → Schedule → Day of Clean → Follow-Up

**8. Wave Dividers** — `WaveDivider` and `WaveDividerCream` SVG components with dual-path layered wave shapes

**9. Instant Estimate** (id: `#get-estimate`)
- Full `InstantEstimate` component — see [Pricing Engine](#pricing-engine) section below

**10. Reviews Carousel**
- 6 real Google reviews in horizontally scrollable snap-carousel
- Prev/Next arrow buttons, dot indicator synced to scroll position
- "See all reviews on Google" link

**11. Service Area Map** 
- `ServiceAreaMap` component — 49+ communities across York & Cumberland County
- KPI strip: 93% Recurring · 7% One-Time · 49+ Communities · 7+ Years

**12. Certifications**
- `Certifications` component — 5 badges: ISSA CIMS · OSHA · Green Seal · AHCA COVID-19 · AHCA House Cleaner

**13. Instagram Gallery**
- 6-item photo grid, each links to Instagram, hover-reveal caption with `ExternalLink` icon

**14. FAQ Accordion**
- Radix Accordion, 8 Q&A pairs, smooth cubic-bezier expand/collapse

**15. Final CTA Band**
- Primary-colored full-width section, "Ready for a cleaner home?" heading + Estimate + Call buttons

---

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
| `client/index.html` | SEO meta, Open Graph, JSON-LD LocalBusiness structured data |

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

# Webhook (optional)
WEBHOOK_URL=...                  # Fire-and-forget webhook on new leads
WEBHOOK_SECRET=...               # Bearer token for webhook auth

# Failed-forward retry sweep (all optional — sensible defaults)
RETRY_SWEEP_INTERVAL_MINUTES=10  # Cadence. Floored at 1 min; bad values fall back to 10
RETRY_SWEEP_DISABLED=1           # Set to switch the background sweep off entirely
CRON_SECRET=...                  # Only needed for an EXTERNAL cron; see below
```

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
