/**
 * Our Work gallery — real photos of real jobs.
 *
 * This file is the single source of truth for the grid on /about. It used to
 * exist alongside a second, hardcoded copy of the same list inside About.tsx,
 * which meant editing one did nothing. About.tsx now reads this.
 *
 * These are OUR photos, not Instagram posts. The section used to be headed
 * "See Our Work on Instagram" over exactly these local files, with every tile
 * linking to the profile root rather than to any post — which implied the grid
 * was a feed. It isn't, so it no longer says it is.
 *
 * `postUrl` is how a tile becomes genuinely social: set it to the permalink of
 * the matching Instagram or Facebook post and that tile deep-links to the real
 * post instead of the profile. Leave it undefined and the tile falls back to
 * the profile link. Fill these in as the posts go up — no code change needed.
 */

export type GalleryItem = {
  id: number;
  image: string;
  /** Describes the photo for screen readers and when the image fails to load. */
  alt: string;
  caption: string;
  /** Permalink to the real post, when there is one. Falls back to the profile. */
  postUrl?: string;
};

export const galleryItems: GalleryItem[] = [
  {
    id: 1,
    image: "/images/vacation-rental-bathroom-clean.jpeg",
    alt: "Guest-ready vacation rental bathroom with rolled towels and hex tile floor",
    caption: "Guest-ready rental bathroom — fixtures polished, towels restocked",
  },
  {
    id: 2,
    image: "/images/fridge-interior-deep-clean.jpeg",
    alt: "Empty refrigerator interior, shelves and drawers cleaned",
    caption: "Inside the fridge — shelves and drawers, not just the door front",
  },
  {
    id: 3,
    image: "/images/commercial-floor-cleaning.jpeg",
    alt: "Commercial floor cleaning in a retail space",
    caption: "Commercial floor care — retail store maintenance",
  },
  {
    id: 4,
    image: "/images/restroom-trailer-commercial-clean.jpeg",
    alt: "Stainless steel restroom trailer interior, cleaned and restocked",
    caption: "Event restroom trailer — sanitised, restocked, ready for guests",
  },
  {
    id: 5,
    image: "/images/prolux-hepa-vacuum-fleet.jpeg",
    alt: "Prolux HEPA vacuum fleet lined up and ready",
    caption: "Our Prolux HEPA vacuum fleet — ready to go",
  },
  {
    id: 6,
    image: "/images/ecosense-sol-u-mel-lavender.jpeg",
    alt: "EcoSense Sol-U-Mel and Tough & Tender cleaning bottles on a counter",
    caption: "The EcoSense line we actually use — no bleach, ammonia or phthalates",
  },
  {
    id: 7,
    image: "/images/before-after-deep-clean.jpeg",
    alt: "Before and after comparison of a deep clean",
    caption: "Before & after deep clean — the difference is in the details",
  },
  {
    id: 8,
    image: "/images/cleaning-toolkit-supplies.jpeg",
    alt: "Cleaning toolkit with spin mop, microfibre pads and brushes",
    caption: "Our kit — spin mop, microfibre pads and brushes",
  },
];
