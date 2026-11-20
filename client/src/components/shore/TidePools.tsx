import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { servicesData } from "@/lib/services-data";

/**
 * Services, as tide pools.
 *
 * The conceit: each service is a pool in the rock, and the tide fills it as
 * you scroll it into view. Mechanically that is one IntersectionObserver
 * setting `--tide` from 0 to 1 and a CSS transform doing the rest — the
 * animation itself never touches JavaScript after the switch is flipped.
 *
 * Three things keep the conceit from costing anything:
 *
 *   - The water is a background pseudo-element at z-index -1. If the CSS
 *     never loads, or the observer never fires, the card is still a card
 *     with a heading, a sentence and a link.
 *   - `--tide` stays at 1 under reduced motion (see index.css), so a still
 *     page shows FULL pools, not empty ones. Stopping the animation must not
 *     make the design look broken.
 *   - Each pool is a real link to the real `/services/<id>` page, so the
 *     section is also the internal-linking the SEO plan needs.
 */

const POOL_IDS = ["residential", "deep-cleaning", "vacation-rentals", "commercial"] as const;

/** Rise as it enters, and stay risen. A pool that drains on scroll-up reads
 *  as a bug rather than as a tide. */
function useTideFill<T extends HTMLElement>(delayMs: number) {
  const ref = useRef<T>(null);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || filled) return;

    // No observer (old browser, jsdom) — fill immediately rather than never.
    if (typeof IntersectionObserver === "undefined") {
      setFilled(true);
      return;
    }

    let timer = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          // Stagger, so four pools fill as a tide coming in rather than as
          // four cards animating at once.
          timer = window.setTimeout(() => setFilled(true), delayMs);
          observer.disconnect();
        }
      },
      // Fire a little before the card is centred, so the fill is already
      // under way by the time it is the thing you are looking at.
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [delayMs, filled]);

  return { ref, filled };
}

function TidePool({ id, index }: { id: (typeof POOL_IDS)[number]; index: number }) {
  const service = servicesData[id];
  const { ref, filled } = useTideFill<HTMLLIElement>(index * 140);

  return (
    <li
      ref={ref}
      className="tide-pool still group flex min-h-[15rem] flex-col p-6 sm:p-7"
      style={{ ["--tide" as string]: filled ? 1 : 0 }}
    >
      <service.icon
        className="h-7 w-7 text-seafoam"
        aria-hidden="true"
        strokeWidth={1.5}
      />
      <h3 className="type-h3 mt-5 text-foreground">{service.title}</h3>
      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
        {service.shortDesc}
      </p>
      <Link
        href={`/services/${service.id}`}
        className="shore-focus mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
        data-testid={`link-pool-${service.id}`}
      >
        {/* The whole card is not a link: a 15rem block that is one link is a
            nightmare to skim with a screen reader, and it swallows the text
            selection. The link is the link, and the card lifts with it via
            :focus-within. */}
        What&apos;s included
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

export function TidePools() {
  return (
    <section
      id="services"
      className="shore-section scroll-mt-20 bg-background py-24"
      aria-labelledby="shore-services-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="type-eyebrow">What we do</p>
        <h2 id="shore-services-heading" className="type-h2 mt-4 max-w-2xl text-foreground">
          Four pools, filled on every visit.
        </h2>
        <p className="type-lead mt-5 max-w-xl">
          Every clean follows the same checklist, whoever is on the crew. Pick the
          one that sounds like your place.
        </p>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {POOL_IDS.map((id, i) => (
            <TidePool key={id} id={id} index={i} />
          ))}
        </ul>

        <div className="mt-10">
          <Link
            href="/services"
            className="shore-focus inline-flex items-center gap-1.5 text-sm font-semibold text-foreground underline underline-offset-4"
            data-testid="link-all-services"
          >
            All six services
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
