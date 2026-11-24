# The Maine Shoreline redesign — design

**Date:** 2026-11-20 · **Branch:** `claude/focused-hamilton-rlqqwl`

## Intent

Replace the homepage with a single-page experience that evokes the Maine
shoreline — layered parallax, tide-driven animation, real coastal footage and
optional ambient surf — and carry its palette and typography across the rest
of the site so the whole thing reads as one brand.

The business reason this matters: the current homepage is a competent but
generic service-company landing page. The company's whole identity is *Maine*.
The shoreline is the differentiator, and nothing on the page uses it.

## Goals

- `/` becomes a full-viewport, scroll-driven shoreline page with six movements:
  hero, services-as-tide-pools, about-with-lighthouse-beam, testimonials-as-
  drifting-buoys, contact-as-message-in-a-bottle, and a closing tide line.
- One palette (deep navy, seafoam, sand beige, driftwood grey) and one type
  system (Playfair Display display / Inter UI) across every page.
- Accessibility is a feature, not a retrofit: WCAG AA contrast, a visible
  reduced-motion toggle, keyboard focus on every interactive element, alt text
  on all media, semantic landmarks.

## Non-goals

- Rebuilding the booking flow, customer portal, admin dashboard or pricing
  engine. They keep working and inherit the new tokens.
- Moving any data to Supabase. See Approaches.
- Changing the lead pipeline. The new form posts to the existing endpoint.

## Anti-goals (things that would make this a failure even if it shipped)

- **Losing the SEO surface.** ~20 pre-rendered routes, a sitemap and a content
  plan exist. A literal single-page site would delete them. The shoreline page
  *replaces the homepage*; everything else stays reachable.
- **A lead that goes nowhere.** Any form on this page must reach the same
  inbox, ledger and admin dashboard as today's forms.
- **Motion that traps people.** Scroll-jacking, autoplaying sound, or animation
  that cannot be switched off.
- **Beauty that fails contrast.** A seafoam-on-sand palette is easy to get
  wrong; every pair is checked by script.

## Constraints

- React 19 + Vite + Tailwind v4 (CSS-first tokens) + wouter; Express 5 +
  Drizzle + Postgres on Railway.
- Routes are **pre-rendered to static HTML** at build time
  (`script/prerender.ts`). Every component on `/` must render without
  `window`, `document`, `IntersectionObserver` or `matchMedia`.
- `client/src/index.css` is the single token layer; `--deep` is a fixed dark
  band in both themes. Light and dark themes are both shipped.
- Existing tests must keep passing, including `scrollRegressions`,
  `prerenderRender`, `seo` and the server suites.

## Approaches considered

**1. New page, new token layer, rest of site inherits — chosen.**
Rewrite `client/src/pages/Home.tsx` as a composition of shoreline sections,
retune the tokens in `index.css`, swap the display font. Every other page
reads from the same tokens, so it re-skins for free. SEO, booking, portal and
admin are untouched.
*Trades off:* the other pages get a new palette without a bespoke layout pass,
so they look consistent but not re-designed.

**2. Parallel route (`/coast`) promoted later.**
Safer to review side by side, but leaves two homepages to maintain and defers
the decision. Rejected: the user asked for the site to be updated, not for a
prototype.

**3. True single page, retire the other routes.**
Matches the brief most literally and is the cleanest information architecture
for a shoreline narrative. Rejected: it deletes the service-area and blog
pages the SEO plan is built around, and strands the booking and portal flows.

### Form storage

The brief said "store only form submissions in Supabase". Investigation found
the site already has a Postgres database (Railway, same project as the app)
which receives every submission today, emails the operator, forwards the lead
to BrightBase Ops, and backs the admin dashboard. All three Supabase projects
on the account are paused, and a paused Supabase project refuses connections —
a contact form pointed at one would silently drop enquiries.

**Decision (user's, after being shown this): no Supabase.** The bottle form
posts to the existing `POST /api/intake/submit`, so a shoreline enquiry lands
in exactly the same place as a booking enquiry.

### Media

No video or audio existed in the repo. **Decision (user's): source licensed
footage now.** Chosen source is the U.S. National Park Service's Acadia
National Park collection — the Maine rocky coast itself, and public domain:
*"No U.S. copyright. Federal NPS staff work (17 U.S.C. sec. 105)."*

| Asset | Source clip | Treatment |
|---|---|---|
| Hero loop | *Enjoying the views on Isle au Haut* (Acadia NP) | surf-on-cobble shot cut at 15.9–22.7s, end cross-faded into the head for a seamless 5.7s loop, 24fps, muted, 1.9 MB |
| Ambient surf | *Frenchman Bay Views* (Acadia NP) | 33s cross-faded loop, normalised to −26 LUFS, 0.45 MB |
| Section stills | Isle au Haut, Frenchman Bay, *Periwinkles* (Acadia NP) | WebP, ≤165 KB each |

Credit is not legally required for a §105 work; the page carries it anyway.

## The design

### Palette

Four colours, declared as HSL channels in `index.css` under `:root` and
`.dark`, verified by `scripts/check-contrast.mjs` (30/30 pairs pass AA, lowest
ratio 5.44:1).

| Role | Light | Dark |
|---|---|---|
| Page | sand beige `40 30% 96%` | deep navy `212 38% 11%` |
| Ink | deep navy `212 44% 15%` | sand `40 28% 92%` |
| Muted | driftwood `209 14% 36%` | driftwood `205 16% 68%` |
| Primary | deep navy `209 54% 26%` | seafoam `172 44% 62%` |
| Seafoam accent | `174 46% 25%` | `172 44% 62%` |

The shoreline band (`--deep`) stays a fixed dark navy panel in both themes, as
the existing `--deep` does, because the hero text sits on it.

### Typography

`--font-display` becomes **Playfair Display**; Inter keeps body and UI. The
four type classes (`.type-display`, `.type-display-sm`, `.type-h2`,
`.type-h3`) are unchanged in structure, so every page re-skins at once.
Playfair is a high-contrast serif, so tracking is loosened slightly at display
sizes where Space Grotesk's negative tracking would have pinched it.

### The six movements of `/`

1. **Hero** — full viewport. Poster image paints first; the video loop fades in
   over it once it can play. Navy scrim + grain over the footage carries the
   headline. Three parallax layers (video, horizon haze, foreground text).
2. **Services as tide pools** — four pools. Each fills with water and its
   caption surfaces as it enters the viewport. Links to the existing
   `/services/{slug}` pages, so the SEO surface stays connected.
3. **About, with a lighthouse beam** — a conic-gradient beam sweeps from the
   lighthouse on hover *and on keyboard focus*, lighting the copy beneath.
4. **Testimonials as drifting buoys** — real Google reviews. Buoys bob on
   independent sine offsets; the carousel is a real scroll container with
   arrow keys, snap points and visible focus.
5. **Contact as a message in a bottle** — the form. Posts to
   `/api/intake/submit`. On success the bottle seals and drifts out.
6. **Tide line close** — the closing CTA on the shoreline band, into the
   footer.

### Motion and the reduced-motion toggle

Three states, persisted to `localStorage` and exposed as a switch in the page:

- **auto** (default) — follows the OS `prefers-reduced-motion`.
- **full** — all motion.
- **reduced** — parallax, bobbing, tide fills and the beam sweep all resolve to
  their end state immediately. Nothing is hidden, nothing moves.

The existing `useParallax` already bails out on `prefers-reduced-motion` and
below 1024px; the toggle writes a `data-motion` attribute on `<html>` that the
hook and the CSS both read, so one control governs both.

### Sound

Off on every load — it is never autoplayed, which is both WCAG 1.4.2 and the
only thing browsers permit. A labelled button starts and stops it, and the
CHOICE is remembered while the playback is not: a returning visitor still
arrives to silence, with the button primed.

**Changed during implementation.** This section first said the sound would
stop when the hero scrolled out of view. It does not. Someone who asks for
waves and then scrolls down to read has not withdrawn the request, and cutting
the ambience under them is worse than leaving it. It pauses when the *tab* is
hidden instead, which is the case people actually complain about. Reduced
motion does not imply reduced sound; they stay separate controls.

### Accessibility specifics

- Landmarks: one `<header>` (navbar), one `<main>`, `<section>` per movement
  each labelled by its heading via `aria-labelledby`, one `<footer>`.
- Every interactive element keeps a visible focus ring that clears 3:1 against
  both the sand and the navy surfaces.
- All media carry alt text; the hero video is decorative *and* captioned by the
  heading beside it, so it is `aria-hidden` with the meaning in the text.
- The tide-pool reveal and buoy carousel are operable by keyboard alone.

## Left to the builder

- Exact easing curves and travel distances for each parallax layer.
- Whether the tide-pool fill is an SVG clip path or a CSS mask (whichever
  profiles cleaner at 60fps with four on screen).
- Copy for the new sections may reuse the existing homepage copy verbatim where
  it already says the right thing.
