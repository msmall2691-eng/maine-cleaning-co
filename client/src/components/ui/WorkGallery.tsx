import { galleryItems } from "@/lib/gallery-data";
import { companyInfo } from "@/lib/company-info";

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
 */
export function WorkGallery({ compact = false }: { compact?: boolean }) {
  return (
    <>
      {!compact && (
        <div className="text-center mb-10">
          <h2 className="text-[1.75rem] sm:text-3xl font-serif font-bold text-foreground tracking-[-0.01em] mb-4">
            See Our Work
          </h2>
          <p className="text-muted-foreground text-[15px] leading-relaxed max-w-md mx-auto">
            Real homes, rentals and commercial spaces across Southern Maine — photographed
            on the job, not staged in a studio.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {galleryItems.map((item) => (
          <a
            key={item.id}
            href={item.postUrl ?? companyInfo.socials.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square rounded-xl overflow-hidden border border-border/60"
            data-testid={`work-gallery-${item.id}`}
            title={item.caption}
          >
            <img
              src={item.image}
              alt={item.alt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="p-3 text-[11px] sm:text-xs font-medium text-white leading-snug">
                {item.caption}
              </span>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
