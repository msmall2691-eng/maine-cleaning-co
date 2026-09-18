import type { Sky } from "./weather-types";

/**
 * The weather, as a decorative accent colour.
 *
 * Tints a few deliberately small surfaces — the scroll progress bar and the
 * short rule under each section heading — so the site carries a trace of the
 * day outside. That is the entire scope. It is NOT allowed to grow into
 * anything that carries meaning.
 *
 * Three rules this has to keep, and they are not negotiable:
 *
 *  1. **It can never be the only signal for anything.** Nobody should have to
 *     see the colour to use the site. It tints a 3px rule and a 2px progress
 *     bar; it never touches text, borders, focus rings, form state or any
 *     control. A visitor with colour blindness, with the weather API down, or
 *     on a cached page gets an identical, complete site.
 *  2. **It degrades to the brand.** Every value below falls back to
 *     --primary, so "no weather" is not a broken state — it's Tuesday.
 *  3. **It stays inside the brand's range.** These are shifts along the
 *     coast's own palette — Atlantic blue, fog grey, storm indigo, low sun —
 *     not a rainbow. A cleaning company's website should not change colour
 *     dramatically because it started drizzling.
 *
 * Values are bare HSL triples (matching how --primary and friends are
 * declared in index.css) so they compose with alpha: `hsl(var(--x) / 0.6)`.
 * Light and dark are tuned separately — a tint that reads on off-white is
 * muddy on navy, and vice versa.
 */
export interface Accent {
  /** HSL triple for the light theme, e.g. "38 80% 46%". */
  light: string;
  /** HSL triple for the dark theme. */
  dark: string;
}

export const SKY_ACCENTS: Record<Sky, Accent> = {
  // Low coastal sun. The one genuinely warm value in the set.
  clear: { light: "38 78% 44%", dark: "42 85% 58%" },
  // Deliberately the brand colour unchanged. Overcast is the default state of
  // a Maine sky, and the default state of the site should be the brand.
  // These two values MUST track --primary in index.css — the whole point of
  // this bucket is that it is indistinguishable from no tint at all.
  cloudy: { light: "214 55% 36%", dark: "212 58% 62%" },
  // Fog off the water: desaturated, still blue, never grey enough to read as
  // "disabled".
  fog: { light: "205 26% 46%", dark: "205 24% 64%" },
  // Deeper Atlantic.
  rain: { light: "198 64% 36%", dark: "196 62% 52%" },
  // Ice. Kept dark enough in light mode that a 3px rule doesn't disappear
  // against an off-white background.
  snow: { light: "195 56% 42%", dark: "192 60% 66%" },
  storm: { light: "250 44% 47%", dark: "252 55% 66%" },
};

/**
 * Writes the accent onto the document root as two custom properties. CSS
 * picks between them by theme (see --weather-accent in index.css), which is
 * why this can't just set one value: an inline style on <html> would win
 * over both the :root and .dark rules.
 *
 * Passing null clears them, and everything falls back to --primary.
 */
export function applyWeatherAccent(sky: Sky | null): void {
  const root = document.documentElement;
  if (!sky) {
    root.style.removeProperty("--weather-accent-light");
    root.style.removeProperty("--weather-accent-dark");
    return;
  }
  const accent = SKY_ACCENTS[sky] ?? SKY_ACCENTS.cloudy;
  root.style.setProperty("--weather-accent-light", accent.light);
  root.style.setProperty("--weather-accent-dark", accent.dark);
}
