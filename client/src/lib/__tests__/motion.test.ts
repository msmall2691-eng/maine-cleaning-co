import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveMotion } from "../motion";

/**
 * The motion preference is the page's accessibility contract, and it has one
 * property that is easy to break by "simplifying" it later: THREE states, not
 * two. Collapsing "auto" into a boolean is what makes the OS preference stop
 * being honoured on a first visit.
 */
describe("resolveMotion", () => {
  it("follows the OS on auto — in both directions", () => {
    expect(resolveMotion("auto", true)).toBe("reduced");
    expect(resolveMotion("auto", false)).toBe("full");
  });

  it("lets an explicit choice override the OS, both ways", () => {
    // The case that matters most: someone whose OS asks for reduced motion
    // but who wants to see this page move. Without this they never could.
    expect(resolveMotion("full", true)).toBe("full");
    // And the mirror: no OS preference set, but they want stillness anyway.
    expect(resolveMotion("reduced", false)).toBe("reduced");
  });
});

describe("the shoreline honours the preference", () => {
  const css = readFileSync(join(__dirname, "..", "..", "index.css"), "utf8");

  it("suppresses motion for an explicit reduced choice", () => {
    expect(css).toMatch(/:root\[data-motion="reduced"\][\s\S]{0,400}animation: none/);
  });

  /**
   * The subtle half. Every OTHER reduced-motion block in this file is a bare
   * `@media (prefers-reduced-motion: reduce)`, which no in-page control can
   * override — so without the `:not([data-motion="full"])` guard, a visitor
   * whose OS asks for less motion could flip the switch to "full" and nothing
   * would happen.
   */
  it("still lets an explicit 'full' opt back in under an OS reduce", () => {
    const block = css.match(
      /@media \(prefers-reduced-motion: reduce\) \{\s*:root:not\(\[data-motion="full"\]\)/,
    );
    expect(block, 'the OS-level block must exempt :root[data-motion="full"]').not.toBeNull();
  });

  /**
   * Stillness, not absence. If a stopped tide pool rendered empty, the
   * reduced-motion page would look broken rather than calm.
   */
  it("holds the tide pools FULL when motion is off", () => {
    expect(css).toMatch(/:root\[data-motion="reduced"\] \.tide-pool \{\s*--tide: 1/);
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*:root:not\(\[data-motion="full"\]\) \.tide-pool \{\s*--tide: 1/,
    );
  });

  it("gives the parallax layers a zero fallback rather than nothing", () => {
    expect(css).toMatch(/--parallax, 0/);
  });
});
