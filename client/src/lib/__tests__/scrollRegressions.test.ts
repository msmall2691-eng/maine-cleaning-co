import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The page wrappers must not become scroll containers.
 *
 * `overflow-x: hidden` on a page wrapper is the bug this guards. CSS computes
 * the other axis from `visible` to `auto` when one axis is not `visible`, so
 * `overflow-x: hidden` silently also means `overflow-y: auto` — and the
 * wrapper becomes a scroller nested inside the document's own.
 *
 * Measured with a real browser on the live site before the fix: ~20px of
 * internal scroll travel on every public page, on both a 390px phone and a
 * 1440px desktop. The first part of every scroll gesture moved that inner box
 * rather than the page, which is what "the scroll gets stuck" was.
 *
 * Nothing about that is visible in a diff, in a screenshot, or in a test that
 * does not render in a browser — the pages look and behave fine until you try
 * to scroll one. So the invariant is asserted on the source instead: a page
 * wrapper uses `.clip-x`, which clips without creating a scroller.
 */
const PAGES_DIR = join(__dirname, "..", "..", "pages");
const INDEX_CSS = join(__dirname, "..", "..", "index.css");

/** Every page component. */
function pageFiles(): string[] {
  return readdirSync(PAGES_DIR).filter((f) => f.endsWith(".tsx"));
}

describe("page wrappers are not scroll containers", () => {
  it("no page uses overflow-x-hidden", () => {
    const offenders = pageFiles().filter((f) =>
      readFileSync(join(PAGES_DIR, f), "utf8").includes("overflow-x-hidden"),
    );
    // Use `clip-x` instead — see the note on that class in index.css. The
    // Radix primitives under components/ui keep overflow-x-hidden on purpose:
    // those popovers are meant to scroll, so overflow-y: auto is wanted there.
    expect(offenders).toEqual([]);
  });

  it("the pages that wrap their content clip it with clip-x", () => {
    // Quote-agnostic on purpose: ServiceDetail builds its wrapper class with a
    // template literal (`w-full clip-x ${service.patternClass}`), so matching
    // on a double quote would miss it — which it did on the first run here.
    // Not every page needs a clipping wrapper (the portal and policy pages
    // don't), so this checks that the ones with a `w-full` wrapper clip it
    // correctly rather than demanding every page have one.
    const wrapper = /w-full (clip-x|overflow-x-hidden)/;
    const withWrapper = pageFiles().filter((f) =>
      wrapper.test(readFileSync(join(PAGES_DIR, f), "utf8")),
    );
    expect(withWrapper.length, "expected the 8 public content pages").toBeGreaterThanOrEqual(8);
    for (const f of withWrapper) {
      expect(readFileSync(join(PAGES_DIR, f), "utf8"), f).toMatch(/w-full clip-x/);
    }
  });
});

describe(".clip-x", () => {
  const css = readFileSync(INDEX_CSS, "utf8");

  it("is defined", () => {
    expect(css).toMatch(/\.clip-x\s*\{/);
  });

  /**
   * Both declarations, in this order. `overflow-x: clip` reached Safari only
   * in version 16; a browser that does not know the value drops that
   * declaration and keeps the `hidden` above it, so older iOS still clips
   * instead of suddenly scrolling sideways. Reversing them would mean modern
   * browsers take `hidden` and the scroll bug comes straight back.
   */
  it("keeps the hidden fallback BEFORE clip, so old Safari still clips", () => {
    const block = css.match(/\.clip-x\s*\{([^}]*)\}/)?.[1] ?? "";
    const hidden = block.indexOf("overflow-x: hidden");
    const clip = block.indexOf("overflow-x: clip");
    expect(hidden, "overflow-x: hidden fallback missing").toBeGreaterThanOrEqual(0);
    expect(clip, "overflow-x: clip missing").toBeGreaterThanOrEqual(0);
    expect(clip).toBeGreaterThan(hidden);
  });

  it("never sets overflow-y, which is what created the scroller", () => {
    const block = css.match(/\.clip-x\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(block).not.toMatch(/overflow-y/);
    expect(block).not.toMatch(/overflow\s*:/);
  });
});
