import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Source-level invariants for the shoreline homepage.
 *
 * These are asserted on the source rather than on a rendered tree because
 * each one is a promise about the page that no rendering test would catch:
 * where a lead goes, whether sound can start by itself, whether a landmark
 * has a name. Getting any of them wrong is invisible in a screenshot and
 * expensive in production.
 */

const SHORE_DIR = join(__dirname, "..", "..", "components", "shore");
const files = readdirSync(SHORE_DIR).filter((f) => f.endsWith(".tsx"));
const read = (f: string) => readFileSync(join(SHORE_DIR, f), "utf8");
const all = files.map((f) => [f, read(f)] as const);

/**
 * Source with comments removed.
 *
 * Needed because these files EXPLAIN the rules they follow — ShoreControls
 * has a paragraph on why nothing autoplays — and a naive search for the word
 * flags the explanation as the violation. The prose is the reason the code is
 * right; it should not be able to fail the test.
 */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("the lead pipeline", () => {
  /**
   * The brief originally asked for submissions to go to Supabase. They go to
   * the existing intake endpoint instead, deliberately: that is what emails
   * the office, forwards to BrightBase through the retry ledger, and feeds
   * the admin dashboard. A form that posted somewhere else would look
   * identical and quietly strand real customers.
   */
  it("sends the bottle form to the endpoint that actually reaches the office", () => {
    const bottle = read("Bottle.tsx");
    expect(bottle).toContain('"/api/intake/submit"');
  });

  it("asks for a phone or an email before it posts, as the server requires", () => {
    const bottle = read("Bottle.tsx");
    // Mirrors intakeSubmitSchema's refine. Without this the visitor writes a
    // paragraph and is answered with a 422.
    expect(bottle).toMatch(/if \(!email && !phone\)/);
  });

  it("confirms in words, not only in animation", () => {
    const bottle = read("Bottle.tsx");
    expect(bottle).toMatch(/aria-live="polite"/);
    expect(bottle).toMatch(/role="status"/);
  });
});

describe("sound never starts by itself", () => {
  /**
   * WCAG 2.1 SC 1.4.2: anything audible for more than three seconds needs a
   * control. Every browser also blocks unprompted audio, so an autoPlay here
   * would be both a failure and a no-op — the worst combination, because it
   * would look fine in review and fail an audit.
   */
  it("has no autoPlay anywhere in the shoreline", () => {
    for (const [name, src] of all) {
      // The JSX prop, not the word: `autoPlay` is how React spells it.
      expect(code(src), `${name} must not autoplay media`).not.toMatch(/\bautoPlay\b/);
    }
  });

  it("exposes the sound control as a labelled switch", () => {
    const controls = read("ShoreControls.tsx");
    expect(controls).toMatch(/role="switch"/);
    expect(controls).toMatch(/aria-checked=\{playing\}/);
  });

  it("does not download the audio until it is asked for", () => {
    expect(read("ShoreControls.tsx")).toMatch(/preload="none"/);
  });
});

describe("landmarks and media", () => {
  it("names every section by its own heading", () => {
    for (const [name, src] of all) {
      const sections = src.match(/<section\b[\s\S]*?>/g) ?? [];
      for (const tag of sections) {
        expect(tag, `${name}: a <section> landmark with no accessible name`).toMatch(
          /aria-labelledby=/,
        );
      }
    }
  });

  it("gives every image an alt attribute", () => {
    for (const [name, src] of all) {
      const imgs = src.match(/<img\b[\s\S]*?\/>/g) ?? [];
      for (const tag of imgs) {
        expect(tag, `${name}: <img> with no alt`).toMatch(/alt=/);
      }
    }
  });

  it("keeps the hero video decorative and silent", () => {
    const hero = read("ShoreHero.tsx");
    // Muted, because it is wallpaper; aria-hidden and out of the tab order,
    // because the meaning is in the heading beside it.
    expect(hero).toMatch(/muted/);
    expect(hero).toMatch(/aria-hidden="true"/);
    expect(hero).toMatch(/tabIndex=\{-1\}/);
  });

  it("declares the hero tone so the transparent navbar can stay legible", () => {
    // The bar is transparent until you scroll and its light-theme ink is
    // navy; over this footage that measured ~1.6:1.
    expect(read("ShoreHero.tsx")).toMatch(/dataset\.heroTone = "dark"/);
  });
});

describe("the page survives a static render", () => {
  /**
   * The real guarantee here — that every component renders under
   * `renderToString` with no window, document or IntersectionObserver — is
   * already enforced end-to-end by `client/src/__tests__/prerenderRender.ts`,
   * which renders EVERY public route, "/" included, in a plain node
   * environment. An earlier version of this file tried to re-prove it by
   * regex-stripping effect bodies out of the source and looking for browser
   * globals in what was left. That produced false positives the moment a
   * handler was formatted differently, which is a worse failure than the one
   * it was guarding: a test that cries wolf gets deleted, and then nothing
   * is checking.
   *
   * What IS worth asserting here is the fallback behaviour a static render
   * cannot exercise — what the components do when the browser API they want
   * is simply missing.
   */
  it("reveals scroll-triggered content when there is no IntersectionObserver", () => {
    // The behaviour lives in the shared hook now (the tide pools and the work
    // gallery both use it). Without this fallback, anything gated on the
    // observer stays at its START state forever on a browser that lacks one —
    // empty pools, and a gallery still under its veil.
    const hook = readFileSync(join(SHORE_DIR, "useTideFill.ts"), "utf8");
    expect(hook).toMatch(/typeof IntersectionObserver === "undefined"/);
    expect(hook).toMatch(/setFilled\(true\)/);
  });

  it("has exactly one implementation of the scroll trigger", () => {
    // Two copies of an IntersectionObserver are two chances to fix a bug in
    // only one of them.
    const owners = files.filter((f) => read(f).includes("new IntersectionObserver("));
    expect(owners, `expected only useTideFill to construct one, got ${owners}`).toEqual([]);
  });

  it("falls back to the OS query when no motion attribute has been written", () => {
    const parallax = readFileSync(join(__dirname, "..", "parallax.ts"), "utf8");
    // Pre-render and provider-less tests write no data-motion at all, so the
    // old OS-only behaviour has to remain the floor.
    expect(parallax).toMatch(/prefers-reduced-motion: reduce/);
  });

  it("degrades to the poster when the video cannot or should not load", () => {
    const hero = read("ShoreHero.tsx");
    expect(hero).toMatch(/saveData/);
    expect(hero).toMatch(/min-width: 768px/);
    // play() rejection must not throw — the poster is a perfectly good hero.
    expect(hero).toMatch(/\.play\(\)\.catch/);
  });
});
