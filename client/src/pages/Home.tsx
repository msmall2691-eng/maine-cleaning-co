import { useSEO } from "@/hooks/use-seo";
import { STATIC_PAGE_SEO } from "@/lib/seo";
import { ShoreHero } from "@/components/shore/ShoreHero";
import { TidePools } from "@/components/shore/TidePools";
import { ShoreWork } from "@/components/shore/ShoreWork";
import { Beacon } from "@/components/shore/Beacon";
import { Buoys } from "@/components/shore/Buoys";
import { Bottle } from "@/components/shore/Bottle";
import { TideLine } from "@/components/shore/TideLine";

/**
 * The homepage: the Maine shoreline, in seven movements.
 *
 *   1. ShoreHero   the plate — coast footage, the name, the promise
 *   2. TidePools   the services, filling as the tide comes in
 *   3. ShoreWork   photographs of real jobs, uncovered as the tide goes out
 *   4. Beacon      who we are, lit by a lighthouse
 *   5. Buoys       what customers said, bobbing at their moorings
 *   6. Bottle      the contact form
 *   7. TideLine    the close
 *
 * Why this page is a composition of seven files rather than one 675-line
 * component, which is what it replaced: each movement has its own motion
 * behaviour, its own accessibility obligations, and in two cases its own
 * network call. Keeping them apart is what lets each one be read — and
 * tested — on its own.
 *
 * Every section here is a landmark `<section>` labelled by its own heading,
 * inside the single `<main>` that App.tsx provides. One h1 (the hero), h2 per
 * movement, h3 inside. That ordering is the page's table of contents for
 * anyone navigating by heading, which is how most screen-reader users move
 * through a long page.
 *
 * It renders under `renderToString` at build time (script/prerender.ts), with
 * no window, no document and no IntersectionObserver, so every browser API
 * below lives inside an effect. The static HTML this produces carries all the
 * copy and every internal link — which is the whole point, since Bing, the
 * social unfurlers and the AI crawlers never run the JavaScript.
 */
export default function Home() {
  useSEO(STATIC_PAGE_SEO["/"]);

  return (
    // `clip-x`, never the hidden-overflow utility. The hero's parallax
    // layers and the beacon's beam both reach past the viewport edge and must
    // be clipped — but clipping the x axis with `hidden` computes the OTHER
    // axis to `auto`, which turns this wrapper into a scroll container nested
    // inside the document's own, and is what "the scroll gets stuck" was last
    // time. `clip` has no such side effect. See .clip-x in index.css and
    // scrollRegressions.test.ts, which greps this directory for the literal
    // utility name — so it must not appear here even in a comment.
    <div className="w-full clip-x">
      <ShoreHero />
      <TidePools />
      <ShoreWork />
      <Beacon />
      <Buoys />
      <Bottle />
      <TideLine />
    </div>
  );
}
