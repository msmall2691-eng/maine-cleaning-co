import { ArrowUpRight, Instagram } from "lucide-react";
import { galleryItems } from "@/lib/gallery-data";
import { companyInfo } from "@/lib/company-info";
import { srcSetForSrc, SIZES } from "@/lib/photos";
import { SectionHeading } from "@/components/layout/Section";

/**
 * "See Our Work" — our own photos of real jobs.
 *
 * Shared by the home page and /about so there is one grid to maintain, not
 * two. It reads client/src/lib/gallery-data.ts, which is the single source
 * for the photos and captions.
 *
 * These are OUR photos, not an Instagram feed, and the copy says so. Each
 * tile deep-links to the real post when GalleryItem.postUrl is set and
 * otherwise opens the profile.
 *
 * `compact` drops the heading block for callers that supply their own.
 *
 * LAYOUT: this was eight identical squares in a flat 4-column grid, which
 * gave every photo the same weight and read as a contact sheet. The first
 * tile now spans 2x2 so the set has a lead image and an actual composition.
 * Captions were hover-only, which meant they did not exist on a phone at
 * all; they are now always legible over a scrim that is only painted where
 * the caption sits.
 *
 * The follow tile at the end is not decoration: eight photos plus a 2x2 lead
 * needs 11 cells, and a 4-column grid only comes in multiples of 4, so
 * without it the last row ends in a hole. It fills the twelfth cell and is
 * the one place in the grid that asks for something.
 */
export function WorkGallery({ compact = false }: { compact?: boolean }) {
  return (
    <>
      {!compact && (
        <SectionHeading
          eyebrow="Our work"
          title="See our work"
          lead="Real homes, rentals and commercial spaces across Southern Maine — photographed on the job, not staged in a studio."
        />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[9rem] sm:auto-rows-[11rem] lg:auto-rows-[12.5rem] gap-2.5 sm:gap-3">
        {galleryItems.map((item, i) => {
          // One lead tile. Two cells wide and tall on anything but a phone,
          // where a 2x2 tile would swallow the whole first screen.
          const isLead = i === 0;
          return (
            <a
              key={item.id}
              href={item.postUrl ?? companyInfo.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={`photo-frame group ${isLead ? "sm:col-span-2 sm:row-span-2" : ""}`}
              data-testid={`work-gallery-${item.id}`}
              title={item.caption}
            >
              {/* Eleven tiles paint at once here. At full resolution that is
                  most of the library decoded in one go, which is what made
                  this grid the slowest thing on a phone. */}
              <img
                src={item.image}
                srcSet={srcSetForSrc(item.image)}
                sizes={isLead ? SIZES.half : SIZES.tile}
                alt={item.alt}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />

              {/* Always readable, not hover-only — hover doesn't exist on a
                  phone, which is where most of this traffic is. */}
              <span
                className={`photo-caption flex items-end justify-between gap-2 ${
                  isLead ? "sm:text-sm" : ""
                }`}
              >
                <span className="min-w-0">{item.caption}</span>
                <ArrowUpRight
                  className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
                  aria-hidden="true"
                />
              </span>
            </a>
          );
        })}

        {/* Fills the grid's last cell (see the note above). Spans the full
            width on a phone, where the lead tile isn't 2x2 and the maths
            works out differently. */}
        <a
          href={companyInfo.socials.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-2 sm:col-span-1 group flex flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-dashed border-border bg-muted/30 px-4 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
          data-testid="work-gallery-follow"
        >
          <Instagram className="w-5 h-5 text-primary" aria-hidden="true" />
          <span className="text-[13px] font-semibold text-foreground leading-tight">
            More on Instagram
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            @mainecleaningco <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
          </span>
        </a>
      </div>
    </>
  );
}
