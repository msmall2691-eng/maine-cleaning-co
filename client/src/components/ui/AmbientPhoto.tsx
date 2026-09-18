import { useParallax } from "@/lib/parallax";
import { srcSetFor, SIZES, type Photo } from "@/lib/photos";

/**
 * One of our photos used as the texture behind a band, drifting slightly
 * against the scroll.
 *
 * Replaces the hand-rolled `<div className="photo-ambient"><img …/></div>`
 * each page had grown its own copy of. Two things that were getting lost in
 * those copies and are now structural:
 *
 *  - **The parent must establish a stacking context.** `.photo-ambient` is
 *    z-index -1, which is what keeps it under the band's text without needing
 *    a z-index on every sibling — but without a context on the parent it
 *    slides behind the page background instead and vanishes. `<Section>`
 *    takes `className="isolate"` for this; pass it, or nothing renders.
 *
 *  - **Landscape photos only, ideally.** A band is wide and short; a portrait
 *    photo under `object-fit: cover` gets cropped to a narrow horizontal slice
 *    of its own middle, which is unrecognisable however bright you make it.
 *    Every ambient band on the site used to use a portrait shot, which is most
 *    of why you couldn't tell what any of them were. `Photo.orientation`
 *    records this — prefer `landscape`, accept `square`, and reach for
 *    `portrait` only when the subject survives the crop (a receding corridor
 *    or aisle does; a room does not).
 *
 * Decorative by definition: `alt=""` and aria-hidden, never announced, never
 * in the tab order, and always lazy — it is never the LCP element.
 */
export function AmbientPhoto({
  photo,
  strength = 0.12,
  className = "",
}: {
  photo: Photo;
  /** Peak drift as a fraction of the image's height. Keep at or under 0.18. */
  strength?: number;
  className?: string;
}) {
  const ref = useParallax<HTMLDivElement>(strength);

  return (
    <div ref={ref} className={`photo-ambient parallax-layer ${className}`}>
      <img
        src={photo.src}
        srcSet={srcSetFor(photo)}
        sizes={SIZES.ambient}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
