import { Link } from "wouter";
import { ArrowRight, Leaf, MapPin, ShieldCheck } from "lucide-react";
import { useParallax } from "@/lib/parallax";
import { COMMUNITIES_SERVED, CLEANS_SINCE_2018_PLAIN } from "@/lib/company-stats";

/**
 * About, lit by a lighthouse.
 *
 * The beam is a blurred gradient wedge that rotates from -16° to +14° across
 * the copy. It answers `:hover` and `:focus-within` in equal measure (see
 * .beacon-stage in index.css) — the stage contains a real link, so a keyboard
 * visitor tabbing to it triggers the same sweep a mouse does. A hover effect
 * that only a mouse can reach is a feature built for half the audience.
 *
 * It is also pure decoration over copy that is fully legible unlit: the beam
 * adds warm light to text that already clears AA against the band beneath it.
 */

const marks = [
  { icon: ShieldCheck, label: "Insured & bonded", detail: "Every crew, every visit." },
  { icon: Leaf, label: "Eco-friendly products", detail: "Melaleuca EcoSense & Sal Suds." },
  { icon: MapPin, label: `${COMMUNITIES_SERVED} communities`, detail: "York & Cumberland County." },
];

export function Beacon() {
  const photoRef = useParallax<HTMLDivElement>(0.1);

  return (
    <section
      id="about"
      className="shore-section band-deep scroll-mt-20 clip-x py-24"
      aria-labelledby="shore-about-heading"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div className="beacon-stage">
          <div className="beacon-beam still" aria-hidden="true" />
          <p className="type-eyebrow !text-deep-accent">Who you are letting in</p>
          <h2 id="shore-about-heading" className="type-h2 mt-4 text-deep-foreground">
            A local crew who know the coast.
          </h2>
          <p className="type-lead mt-6 !text-deep-muted">
            The Maine Cleaning Co. has been cleaning homes and businesses across
            Southern Maine since 2018 — more than {CLEANS_SINCE_2018_PLAIN} cleans,
            with over thirty years of combined experience behind them. The same
            people come back each visit, so nobody has to be shown where the
            spare key lives twice.
          </p>

          <ul className="mt-9 space-y-5">
            {marks.map(({ icon: Icon, label, detail }) => (
              <li key={label} className="flex gap-3.5">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-deep-accent" aria-hidden="true" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-semibold text-deep-foreground">{label}</p>
                  <p className="mt-0.5 text-sm text-deep-muted">{detail}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/about"
            className="shore-focus mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-deep-accent underline underline-offset-4"
            data-testid="link-about-more"
          >
            More about the company
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div ref={photoRef} className="shore-layer">
          <figure className="overflow-hidden rounded-3xl border border-deep-muted/25">
            <img
              src="/media/shore-boulders.webp"
              alt="Granite boulders on the shoreline at Isle au Haut, Acadia National Park, with the open Atlantic and a spruce treeline behind them."
              loading="lazy"
              decoding="async"
              width={1600}
              height={900}
              className="h-full w-full object-cover"
            />
            <figcaption className="bg-deep/80 px-4 py-2.5 text-[0.7rem] text-deep-muted">
              Isle au Haut, Acadia National Park · U.S. National Park Service, public domain
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
