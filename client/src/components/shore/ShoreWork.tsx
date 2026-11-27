import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { WorkGallery } from "@/components/ui/WorkGallery";
import { useTideFill } from "./useTideFill";

/**
 * The work: real photographs of real jobs, uncovered as the tide goes out.
 *
 * Why this band exists. The shoreline redesign replaced a homepage that had
 * a work grid on it, and did not put one back — so the front page of a
 * cleaning company showed coast footage, three Acadia landscapes, and not a
 * single picture of anything cleaned. Reviews say the work is good; photos
 * show it.
 *
 * It reuses <WorkGallery>, the same component /about renders, rather than
 * laying out a second grid. One source for the photos and captions
 * (lib/gallery-data.ts), one set of tiles to keep accessible. `compact`
 * drops its own heading so this section can supply the shoreline one, and
 * `limit={4}` is deliberate: the grid only comes out flush at 4 or 12
 * (see the note in WorkGallery about the lead tile and the follow tile).
 *
 * This is NOT a full-viewport section, unlike the five around it. The page
 * was six movements and is now seven; making this one 100svh too would add
 * a whole screen of scrolling to a page that already asks for a lot. The
 * same reasoning as the closing band.
 *
 * The reveal: a navy veil slides off each tile as it enters view, which is
 * the tide-pool motion in reverse — there the water rises to fill, here it
 * falls away to uncover. Shared trigger (useTideFill), opposite direction.
 * Under reduced motion the veil is simply not painted, so the photographs
 * are all visible at rest. A reveal animation that leaves content hidden
 * when motion is off is a reveal animation that hides content.
 */
export function ShoreWork() {
  const { ref, filled } = useTideFill<HTMLDivElement>(120);

  return (
    <section
      id="our-work"
      className="shore-band clip-x scroll-mt-20 bg-background"
      aria-labelledby="shore-work-heading"
    >
      <div className="shore-measure px-5 sm:px-8">
        <p className="type-eyebrow">Our work</p>
        <h2 id="shore-work-heading" className="type-h2 mt-4 max-w-2xl text-foreground">
          Recent jobs
        </h2>
        <p className="type-lead mt-5 max-w-xl">
          Real homes, rentals and commercial spaces across Southern Maine —
          photographed on the job, not staged in a studio.
        </p>

        <div
          ref={ref}
          className="tide-reveal still mt-12"
          data-revealed={filled ? "true" : "false"}
        >
          <WorkGallery compact limit={4} linkTo="book" />
        </div>

        <div className="mt-10">
          <Link
            href="/about"
            className="shore-focus inline-flex items-center gap-1.5 text-sm font-semibold text-foreground underline underline-offset-4"
            data-testid="link-all-work"
          >
            See all twelve
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
