/**
 * The site's photography, indexed by what is actually in the frame.
 *
 * Why this file exists: several filenames in client/public/images/ do not
 * describe their contents. `services-hero-clean-home.jpeg` is a supermarket
 * aisle with a mop bucket, not a home; it had been used as the "clean home"
 * hero on /services purely on the strength of its name. Picking a photo by
 * guessing at its filename is how that happens, so pick from here instead.
 *
 * Every entry carries real alt text. `alt` is what a screen reader announces
 * and what renders if the file 404s, so it describes the photo rather than
 * repeating the marketing line next to it.
 *
 * NOTE ON THE LIBRARY: it used to be six usable frames, four of them
 * equipment or product shots rather than finished rooms, which is why one
 * bathroom photo had ended up carrying nine files. Four real kitchens have
 * since been added and they are the strongest images here — finished,
 * daylit, recognisably the work. Lead with those; the equipment shots are
 * supporting detail, not heroes.
 */

export type Photo = {
  src: string;
  alt: string;
  /** Roughly w/h, so a caller can pick a frame that won't crop badly. */
  orientation: "portrait" | "landscape" | "square";
};

export const photos = {
  /** Bright white shaker kitchen with island and pendants. The best frame in
      the set: finished, daylit, and instantly legible as the work. */
  kitchenIsland: {
    src: "/images/kitchen-island-white-shaker.jpeg",
    alt: "Bright white shaker kitchen with a large island, pendant lighting and stainless appliances",
    orientation: "landscape",
  },
  /** Kitchen island with cooktop, looking through to the rest of the house. */
  kitchenCooktop: {
    src: "/images/kitchen-island-cooktop.jpeg",
    alt: "Kitchen island with a flush cooktop, looking through to the hallway",
    orientation: "landscape",
  },
  /** Corner sink under a window onto the lake. Lots of daylight. */
  kitchenLakeWindow: {
    src: "/images/kitchen-sink-lake-window.jpeg",
    alt: "Kitchen corner sink beneath a window looking out over the lake",
    orientation: "landscape",
  },
  /** Butcher block and granite, door out to the woods. Warmer, more lived-in. */
  kitchenButcherBlock: {
    src: "/images/kitchen-butcher-block-granite.jpeg",
    alt: "Kitchen with butcher-block counter and granite sink run, door opening onto the woods",
    orientation: "portrait",
  },
  /** The strongest image in the set: bright, finished, aspirational. */
  rentalBathroom: {
    src: "/images/vacation-rental-bathroom-clean.jpeg",
    alt: "Guest-ready vacation rental bathroom with rolled towels and a hex tile floor",
    orientation: "portrait",
  },
  /** Stainless event restroom trailer — the most striking commercial shot. */
  restroomTrailer: {
    src: "/images/restroom-trailer-commercial-clean.jpeg",
    alt: "Stainless steel restroom trailer interior, cleaned and restocked",
    orientation: "landscape",
  },
  /** Emptied fridge interior — reads instantly as "we clean inside things". */
  fridgeInterior: {
    src: "/images/fridge-interior-deep-clean.jpeg",
    alt: "Empty refrigerator interior with shelves and drawers cleaned",
    orientation: "portrait",
  },
  /** Retail aisle mid-clean. Despite the filename, this is NOT a home. */
  commercialFloor: {
    src: "/images/services-hero-clean-home.jpeg",
    alt: "Retail store aisle being floor-cleaned, mop and bucket in the foreground",
    orientation: "portrait",
  },
  /** Same subject, second frame. Use when you need two commercial shots. */
  commercialAisle: {
    src: "/images/commercial-floor-cleaning.jpeg",
    alt: "Commercial floor cleaning in progress in a retail space",
    orientation: "portrait",
  },
  vacuumFleet: {
    src: "/images/prolux-hepa-vacuum-fleet.jpeg",
    alt: "Our Prolux HEPA vacuum fleet lined up and ready",
    orientation: "landscape",
  },
  toolkit: {
    src: "/images/cleaning-toolkit-supplies.jpeg",
    alt: "Cleaning toolkit with a spin mop, microfibre pads and brushes",
    orientation: "portrait",
  },
  /** Before/after on toilet seat bolts. Honest detail shot, not a hero. */
  beforeAfter: {
    src: "/images/before-after-deep-clean.jpeg",
    alt: "Before and after comparison of a deep-cleaned bathroom fixture",
    orientation: "square",
  },
  ecoProducts: {
    src: "/images/ecosense-sol-u-mel-lavender.jpeg",
    alt: "EcoSense Sol-U-Mel and Tough & Tender cleaning bottles on a counter",
    orientation: "portrait",
  },
} as const satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;

/**
 * Photos that read well behind text at low opacity: even tone, no hard
 * subject in the middle, nothing that turns into a smudge when desaturated.
 */
export const ambientPhotos = [
  photos.kitchenIsland,
  photos.kitchenCooktop,
  photos.restroomTrailer,
  photos.commercialAisle,
] as const;
