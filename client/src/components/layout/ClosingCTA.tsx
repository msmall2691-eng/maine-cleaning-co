import type { ReactNode } from "react";
import { Link } from "wouter";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/Section";
import { companyInfo } from "@/lib/company-info";
import { photos, srcSetFor, SIZES, type Photo } from "@/lib/photos";

/**
 * The band that closes a page.
 *
 * /about, /how-it-works and /service-areas each ended with a byte-identical
 * copy of this markup: a full-bleed `bg-primary` slab whose entire content
 * was capped at `max-w-lg` — a 512px postage stamp of text centred in a
 * 1536px block of colour. Three copies also meant three places to drift.
 *
 * It's one component now, it runs at the default measure so the content
 * actually occupies the colour it's painted on, and one of our own photos
 * sits behind it at low opacity so the band has some depth rather than
 * being a flat rectangle. Each page passes its own copy through verbatim.
 */

type ClosingCTAProps = {
  /** The band's heading. Page copy, passed through unchanged. */
  title: ReactNode;
  /** One sentence under the heading. */
  lead: ReactNode;
  /** Label on the filled button. */
  ctaLabel?: string;
  /** Where the filled button goes (a wouter route or hash link). */
  ctaHref?: string;
  /** data-testid for the filled button — pages keep their existing ids. */
  ctaTestId?: string;
  /** Background photo. Defaults to the guest-ready bathroom. */
  photo?: Photo;
};

export function ClosingCTA({
  title,
  lead,
  ctaLabel = "Get My Estimate",
  ctaHref = "/#get-estimate",
  ctaTestId,
  photo = photos.rentalBathroom,
}: ClosingCTAProps) {
  return (
    /* Was `bg-primary` with white ink. That is 7.53:1 on the light theme but
       2.92:1 on the dark one, because --primary is a *light* blue there — so
       the band that closes every page failed AA for every dark-theme visitor.
       The deep band is a fixed panel with contrast-checked ink (body 10.64,
       muted 7.32, accent 7.58) that reads the same in both themes, and it
       runs straight into the footer, which is now the same surface: the page
       ends in one confident dark region instead of two stacked navy slabs. */
    <Section
      rhythm="loose"
      measure="default"
      tone="deep"
      className="overflow-hidden"
    >
      {/* Texture, not content: the photo is scrimmed back into the brand
          colour so the type keeps its contrast in both themes. `.photo-ambient`
          can't be used here because it feathers to --background, which is the
          wrong colour over a primary band. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={photo.src}
          srcSet={srcSetFor(photo)}
          sizes={SIZES.full}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-luminosity"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 50% 50%, hsl(var(--deep) / 0.55) 0%, hsl(var(--deep) / 0.92) 70%, hsl(var(--deep)) 100%)",
          }}
        />
      </div>

      <div className="relative grid gap-9 lg:grid-cols-[minmax(0,1.15fr)_auto] lg:items-center lg:gap-14">
        <div className="text-center lg:text-left">
          <h2 className="type-h2 text-foreground mb-5">
            {title}
          </h2>
          <p className="type-lead max-w-[36rem] mx-auto lg:mx-0">
            {lead}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row justify-center gap-3 flex-shrink-0">
          <Link href={ctaHref}>
            <Button
              size="lg"
              /* bg-primary, not bg-background: inside .band-deep --background
                 IS the band, so the old classes painted a navy button on a
                 navy panel. --primary resolves to the band's light accent. */
              className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_20px_rgba(0,0,0,0.35)] font-semibold text-base"
              data-testid={ctaTestId}
            >
              {ctaLabel}
            </Button>
          </Link>
          <a href={companyInfo.contact.phoneHref}>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full border-2 border-foreground/25 hover:bg-foreground/10 text-foreground font-semibold text-base"
            >
              <Phone className="w-4 h-4 mr-2" /> Call {companyInfo.contact.phoneDisplay}
            </Button>
          </a>
        </div>
      </div>
    </Section>
  );
}
