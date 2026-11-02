import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { photos as photoLib, srcSetFor, SIZES, type Photo } from "@/lib/photos";

/**
 * The opening band of a page.
 *
 * /about, /how-it-works, /service-areas and /short-term-rentals each carried
 * their own near-identical copy of this markup, and they had drifted: three
 * different h1 recipes between them, and photo columns set to `lg:aspect-[5/4]`
 * on one page and `lg:aspect-[4/5]` on the next. That second difference is why
 * the heroes measured 685px, 936px, 936px and 946px tall — and why two of them
 * had roughly 250px of empty column under the copy, because the picture beside
 * it was taller than anything there was to say.
 *
 * So the photo no longer sets the height from its own proportions. It gets a
 * fluid height band that every page shares, which both caps the hero and keeps
 * the two columns the same length. Pages that need something other than a
 * single photograph (the homepage collage, /book's pair) pass `media` instead.
 */

type PageHeroProps = {
  /** Small uppercase line above the title. */
  eyebrow?: ReactNode;
  /**
   * The headline. Wrap the emphasised words in
   * `<span className="heading-accent">` — one word or phrase, not the lot.
   */
  title: ReactNode;
  /** One or two sentences under the title. */
  lead?: ReactNode;
  /** Buttons. Laid out by the caller; this only positions the row. */
  actions?: ReactNode;
  /** An optional row under the actions — trust signals, stats, a badge. */
  meta?: ReactNode;
  /** The photograph for the right-hand column. */
  photo?: Photo;
  /** Anything other than a single photo. Takes precedence over `photo`. */
  media?: ReactNode;
  /** Narrower copy column, for pages whose picture is the point. */
  mediaBias?: boolean;
  className?: string;
  "data-testid"?: string;
};

/**
 * The shared height band for hero media. Everything about a hero's size comes
 * from this one value, so the site's openings line up with each other.
 */
const MEDIA_HEIGHT = "lg:h-[clamp(25rem,34vw,31rem)]";

export function PageHero({
  eyebrow,
  title,
  lead,
  actions,
  meta,
  photo,
  media,
  mediaBias = false,
  className = "",
  ...rest
}: PageHeroProps) {
  const hasMedia = Boolean(media || photo);

  return (
    <section
      className={`relative pt-28 sm:pt-36 lg:pt-40 pb-14 sm:pb-20 overflow-hidden ${className}`}
      {...rest}
    >
      <div className="hero-aurora" aria-hidden="true" />
      <div className="hero-dot-grid" aria-hidden="true" />

      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div
          className={`max-w-[78rem] mx-auto ${
            hasMedia
              ? `grid items-center gap-10 lg:gap-14 xl:gap-20 ${
                  mediaBias
                    ? "lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]"
                    : "lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)]"
                }`
              : ""
          }`}
        >
          <div className={`text-center lg:text-left ${hasMedia ? "" : "max-w-[46rem]"}`}>
            {eyebrow && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="type-eyebrow mb-4 inline-flex items-center gap-2"
              >
                {eyebrow}
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="type-display text-foreground mb-5"
            >
              {title}
            </motion.h1>

            {lead && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="type-lead max-w-xl mx-auto lg:mx-0 mb-8"
              >
                {lead}
              </motion.p>
            )}

            {actions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 flex-wrap"
              >
                {actions}
              </motion.div>
            )}

            {meta && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="mt-8"
              >
                {meta}
              </motion.div>
            )}
          </div>

          {media ? (
            media
          ) : photo ? (
            <motion.figure
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={`photo-frame aspect-[4/3] lg:aspect-auto ${MEDIA_HEIGHT} max-w-md mx-auto lg:max-w-none w-full`}
            >
              <img
                src={photo.src}
                srcSet={srcSetFor(photo)}
                sizes={SIZES.half}
                alt={photo.alt}
                /* The LCP candidate on desktop — deferring it only moves the
                   empty space from "always" to "for the first second". */
                fetchPriority="high"
                decoding="async"
              />
            </motion.figure>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Re-exported so pages don't each need their own photos import for a hero. */
export { photoLib as heroPhotos };

/** The media height band, for the rare page that builds its own media column. */
export const HERO_MEDIA_HEIGHT = MEDIA_HEIGHT;
