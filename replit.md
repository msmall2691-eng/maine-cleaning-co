# The Maine Cleaning Co. — Website & Quoting Platform

## Overview

Full-stack production website and lead intake platform for The Maine Cleaning Co. (maine-clean.co), a residential and commercial cleaning company serving Southern Maine since 2018. Features an iOS-inspired futuristic dark UI with Atlantic blue branding, a live pricing calculator, client portal, AI features, and admin lead management.

## Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4 (CSS-first), Framer Motion, wouter routing, TanStack Query
- **Backend**: Express.js 5, Node.js, TypeScript
- **Database**: PostgreSQL (Neon / Replit managed) + Drizzle ORM
- **Auth**: express-session + connect-pg-simple + bcryptjs (client portal + admin)
- **Email**: Gmail API via Google OAuth (Replit integration — no manual env var needed)
- **AI**: OpenAI GPT-4o-mini (chat assistant + cleaning tip) — requires OPENAI_API_KEY secret
- **Fonts**: Playfair Display (serif headings) + Inter (body/sans)
- **Primary color**: Atlantic blue `210 58% 46%`
- **Background**: Deep dark navy `222 22% 10%`
- **Card surface**: Dark slate `222 20% 13%`

## Design System

- **Logo**: Text-only wordmark — "The Maine Cleaning Co." (serif, bold) + "Est. 2018 · Southern Maine" (small caps, muted). No icon or image logo.
- **Cards**: `.card-soft` — dark surface, border/20, ambient shadow, 2px hover lift. `.card-glass` — glassmorphism with backdrop-blur(20px), saturation(1.3), inset highlight.
- **Sections**: Alternating backgrounds — `hsl(222 22% 10%)` (default) and `hsl(222 20% 13%)` (alternate), applied via inline `style={{ background: "hsl(222 20% 13%)" }}` on alternating sections.
- **Navbar**: Frosted glass on scroll — `hsl(222 22% 15% / 0.88)` + blur(28px). Active link indicated by Framer Motion layoutId sliding dot.
- **Animations**: `.section-fade` (IntersectionObserver fade-in), `.hero-aurora` (dual-layer gradient mesh), `.hero-dot-grid` (drifting dot pattern), `.marquee-track` (continuous scroll strip)
- **Typography**: Hero h1 up to `text-[5.5rem]` with `-0.04em` tracking. Section h2 `text-4xl` with serif font. `.hero-gradient-text` shimmer accent on hero keywords.
- **Radius**: `--radius: 0.875rem`
- **Wave dividers**: `WaveDivider` SVG component with dual-path layered organic wave shapes between homepage sections

## Current Pages & Routes

| Route | Page | Notes |
|-------|------|-------|
| `/` | Home | 15 sections including hero, services, stats, estimate, reviews, gallery, FAQ |
| `/about` | About | Story + stats grid, values, eco products, testimonials, certifications, Instagram CTA |
| `/services` | Services | 5 service cards + CleaningQuiz |
| `/services/:slug` | ServiceDetail | Dynamic template for all 5 services |
| `/short-term-rentals` | ShortTermRentals | Dedicated STR/Airbnb landing page |
| `/how-it-works` | HowItWorks | 5-step visual timeline |
| `/service-areas` | ServiceAreas | Network graph map + 49+ communities |
| `/blog` | Blog | Static posts from blog-data.ts |
| `/blog/:slug` | BlogPost | Individual post view |
| `/portal` | Portal | Client portal dashboard (auth required) |
| `/portal/login` | PortalLogin | Login + register tabs |
| `/portal/reset-password` | ResetPassword | Password reset via token |
| `/admin` | Admin | Admin lead dashboard (admin auth required) |

## Navigation Structure

**Navbar links**: Home · Services · About · Service Areas · Airbnb & STR · Blog + "Get an Estimate" CTA button

**Not in nav** (hidden/admin-only): `/admin`, `/portal` — portal was intentionally removed from nav. Admin accessed directly by URL.

**Footer columns**: Brand (contact) · Services (5 links) · Company (4 links) · Connect (social + Google Review link)

**Sticky Mobile Bar**: Appears after 400px scroll — Get Estimate · Text · Call

## Instant Estimate / Pricing Engine

**File**: `client/src/components/ui/InstantEstimate.tsx`

Three-step wizard:
- Step 1: Service category (residential/deep-clean → calculator, str/commercial → custom quote form) + home details (sqft slider, bathrooms stepper in 0.5 steps, condition, pet hair)
- Step 2: Frequency (residential only) + live price display with pill badges + address input (Nominatim autocomplete)
- Step 3: Contact form + photo upload (max 3, 2MB each) + submission → success screen

**Pricing formula (v2)**:
- `RATE = $60/unit`
- Sqft tiers: ≤1500 ÷680, 1500–3000 ÷1050, 3000+ ÷1400
- BathAdj: `(baths − 1) × 0.40`
- DeepMultiplier: 1.60× (≤1200), 1.65× (≤2000), 1.75× (≤3000), 1.80× (>3000)
- FreqMap: weekly 0.85×, biweekly 1.0×, monthly 1.15×, one-time 1.50×
- Band: ±4%, rounded to nearest $5
- Minimums: Standard $130, Deep $225
- Half-baths displayed as "1½" etc., submitted as `Math.round(bathrooms)` (integer) for DB compatibility

## Intake Pipeline

`POST /api/intake/submit` → validates with Zod → saves to `intakeSubmissions` table → `sendIntakeNotification()` (Gmail HTML email to business + customer) → creates/finds portal account if email provided → response includes `portalCreated` flag → frontend shows success screen with portal CTA if applicable.

STR/commercial submissions skip price calculation and route through custom quote form fields.

## API Routes

**Auth**: POST `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, GET `/api/auth/me`, POST `/api/auth/forgot-password`, `/api/auth/reset-password`

**Intake**: POST `/api/intake/submit` (main lead intake, rate: 5/min)

**Quotes (admin)**: POST `/api/quotes` (legacy), GET `/api/quotes` (paginated+filtered), GET `/api/quotes/:id`, PATCH `/api/quotes/:id/status`, DELETE `/api/quotes/:id`

**Portal** (requireAuth): GET/POST/PATCH/DELETE for quotes, onboarding, contracts, schedule, payments

**Utility**: GET `/api/weather` (30-min cache, Open-Meteo), GET `/api/ai/cleaning-tip` (24-hr cache), POST `/api/ai/chat` (rate: 10/min)

## Key Files

| Path | Purpose |
|------|---------|
| `shared/schema.ts` | All Drizzle table definitions + Zod schemas |
| `server/db.ts` | PostgreSQL connection |
| `server/storage.ts` | `DatabaseStorage` — all CRUD operations |
| `server/routes.ts` | All Express API routes |
| `server/auth.ts` | Session config, requireAuth/requireAdmin middleware |
| `server/email.ts` | Gmail integration — branded HTML notifications |
| `client/src/index.css` | All design tokens, card styles, aurora, animations |
| `client/src/lib/company-info.ts` | Single source of truth for business data |
| `client/src/lib/services-data.ts` | 5 service definitions (title, slug, icon, checklist, FAQ) |
| `client/src/lib/auth.tsx` | AuthContext — login, register, logout, refresh |
| `client/src/App.tsx` | Route definitions + provider wrappers |
| `client/src/pages/Home.tsx` | Homepage (all 15 sections) |
| `client/src/pages/About.tsx` | About page (no photos in story; stat grid + testimonials) |
| `client/src/components/ui/InstantEstimate.tsx` | Full pricing engine + lead capture |
| `client/src/components/ui/AIChatWidget.tsx` | Floating AI chat bubble |
| `client/src/components/ui/StickyMobileBar.tsx` | Mobile bottom bar |
| `client/src/components/layout/Navbar.tsx` | Responsive navbar |
| `client/src/components/layout/Footer.tsx` | Footer (no back-to-top button; no useState/useEffect) |
| `client/index.html` | SEO meta, Open Graph, JSON-LD LocalBusiness |

## Business Info

- **Phone**: 207-572-0502 (href: `tel:+12075720502`, sms: `sms:+12075720502`)
- **Email**: info@maine-clean.co
- **Facebook**: facebook.com/mainecleaningco
- **Instagram**: instagram.com/mainecleaningco
- **Google Reviews**: g.page/r/CYnY6ulFfvDtEAE/review
- **Service area**: York & Cumberland County, Southern Maine — 49+ communities
- **Founded**: 2018
- **Products**: Melaleuca EcoSense & Sal Suds (eco-friendly, non-toxic)
- **Built by**: msmall.org (credited in footer)

## Security

- Admin endpoints protected by `requireAdmin` middleware — admin user auto-seeded on startup (email: admin@maine-clean.co, password from `ADMIN_PASSWORD` env var)
- Portal endpoints protected by `requireAuth` with client-scoped data
- Rate limiting: 5/min quotes, 10/min AI chat, 5/min auth, 3/15min password reset
- Passwords: bcryptjs 10 rounds
- Sessions: PostgreSQL-backed, 30-day expiry, `secure: true` in production
- Response logging: sensitive fields redacted, bodies truncated at 500 chars

## Scripts

```bash
npm run dev      # Full-stack dev server (port 5000)
npm run build    # Production build
npm run start    # Production server
npm run db:push  # Push Drizzle schema to PostgreSQL
```

## Environment Variables

```
DATABASE_URL        PostgreSQL connection string (Neon / Replit managed)
SESSION_SECRET      Express session secret
ADMIN_PASSWORD      Admin dashboard password
OPENAI_API_KEY      GPT-4o-mini (AI chat + tip — optional)
WEBHOOK_URL         Fire-and-forget webhook on new leads (optional)
WEBHOOK_SECRET      Bearer token for webhook (optional)
```

Gmail credentials are managed via Replit Google Mail integration — no manual env var required.
