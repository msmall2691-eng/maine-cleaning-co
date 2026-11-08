import { describe, it, expect } from "vitest";
import { render, PRERENDER_PATHS } from "../prerender-entry";

/**
 * Server-render every public route.
 *
 * This is the test that was missing when the pre-render was extended past the
 * three policy pages: two components reached for context during render rather
 * than at mount — InstantEstimate calls useMutation, the homepage's
 * CoastalConditions card reads the weather context — and each one failed the
 * production build, one build at a time. The same class of break is cheap to
 * reintroduce: add a `window.matchMedia` call to a shared UI component, or a
 * `useQuery` to a card used on a service page, and `npm run build` starts
 * failing at the prerender step with a stack trace into node_modules.
 *
 * Running the real render here means that lands in CI as a named route
 * failing a test, in a second, instead of a red deploy.
 */
describe("prerender render", () => {
  it.each(PRERENDER_PATHS)("renders %s to static HTML", (routePath) => {
    const html = render(routePath);

    // Real text, not a shell. The SPA shell was 74 characters — the homepage
    // <title> — which is what crawlers and the A2P reviewer used to get.
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    expect(text.length, `${routePath} rendered only ${text.length} chars of text`).toBeGreaterThan(900);
  });

  it("gives every page exactly one <h1>", () => {
    // More than one competes for the page's own topic; none leaves a crawler
    // inferring it from the <title> alone.
    for (const routePath of PRERENDER_PATHS) {
      const h1s = render(routePath).match(/<h1[\s>]/g) ?? [];
      expect(h1s.length, `${routePath} has ${h1s.length} h1 elements`).toBe(1);
    }
  });

  /**
   * Without the Footer a crawler that lands on one pre-rendered page finds no
   * route to any other, and the sitemap becomes the only way in.
   *
   * Asserted on the extracted href list rather than the raw HTML so a failure
   * prints the links, not the whole document.
   */
  it("includes the footer's internal links, so a crawler can reach other pages", () => {
    const html = render("/blog/spring-cleaning-checklist");
    const hrefs = [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
    // The footer links the service detail pages directly; /services itself is
    // reachable from the Navbar, which is not pre-rendered.
    for (const expected of ["/about", "/how-it-works", "/service-areas", "/blog", "/services/residential", "/privacy"]) {
      expect(hrefs, `footer should link ${expected}`).toContain(expected);
    }
  });

  it("refuses a path it has no metadata for, rather than rendering a blank page", () => {
    expect(() => render("/not-a-route")).toThrow(/No prerender metadata/);
  });
});
