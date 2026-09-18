/**
 * The Maine Cleaning Co. brand marks.
 *
 * The site previously shipped no logo at all — the header was a text-only
 * wordmark and /favicon.png was still the stock orange Replit glyph. These
 * are the real marks, drawn as vectors so they stay crisp at 20px in the
 * navbar and at 600px as a background watermark, in both themes, with no
 * extra network request.
 *
 * `LighthouseMark` is a simplified, monoline reading of the painted badge:
 * tower, lantern room, gallery deck, spruce line and ledge. The full badge
 * illustration (fine hatching, "EST. 2018" banner) is beautiful at business
 * card size and turns to mud at 24px, which is where this mark actually has
 * to work — so it keeps the silhouette and drops the detail.
 *
 * The painted badge now lives at /images/logo.png and is rendered by
 * <LogoBadge> below, at the sizes where its detail actually survives.
 * `LogoLockup` still draws the vector, on purpose: the badge's hatching,
 * spruce line and "EST. 2018" banner turn to mud at the 28px the navbar
 * gives it, which is the whole reason the vector exists.
 */

/**
 * The painted badge is ink on transparency, and that ink is near-black navy —
 * it reads beautifully on off-white and all but disappears on the dark theme.
 * So <LogoBadge> always sits it on a light plate. That is not a workaround:
 * the artwork is a painted sign, and a sign on a board is what it is.
 */
export const BRAND_PHOTO_LOGO = "/images/logo.webp";

type MarkProps = {
  className?: string;
  /** Hides the spruce/ledge scenery — cleaner below ~24px. */
  minimal?: boolean;
  title?: string;
};

/**
 * The lighthouse mark. Inherits `currentColor` for the tower and structure so
 * it sits correctly on any background; the spruce keeps its own forest green
 * (the one non-navy colour in the painted badge) unless `minimal` drops it.
 */
export function LighthouseMark({ className = "w-8 h-8", minimal = false, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}

      {/* Spruce in the brand pine, sampled from the painted badge's own trees —
          not a stock emerald. The token carries both light and dark. */}
      {!minimal && (
        <g className="text-brand-pine" fill="currentColor" opacity="0.9">
          {/* Spruce line behind the ledge — left pair, right trio. */}
          <path d="M9.4 34.6 5.9 34.6 9.4 25.2 12.9 34.6Z" />
          <path d="M15.1 34.6 12.1 34.6 15.1 27.4 18.1 34.6Z" opacity="0.75" />
          <path d="M33.2 34.6 30.2 34.6 33.2 27 36.2 34.6Z" opacity="0.75" />
          <path d="M39.1 34.6 35.4 34.6 39.1 24.6 42.8 34.6Z" />
        </g>
      )}

      <g fill="currentColor">
        {/* Tower — tapered, with the two painted bands knocked out. */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M21.3 16.6h5.4l2.3 18.4H19L21.3 16.6Zm-0.05 4.9-.44 3.5h6.38l-.44-3.5h-5.5Zm-1.06 8.4-.42 3.4h8.46l-.42-3.4h-7.62Z"
        />
        {/* Gallery deck under the lantern. */}
        <rect x="18.9" y="14.2" width="10.2" height="2.4" rx="0.7" />
        {/* Lantern room. */}
        <rect x="21.4" y="9.1" width="5.2" height="5.1" rx="0.6" />
        {/* Cap and finial. */}
        <path d="M24 4.9 27.9 9.1h-7.8L24 4.9Z" />
        <rect x="23.4" y="2.3" width="1.2" height="2.9" rx="0.6" />
      </g>

      {!minimal && (
        <g fill="currentColor" opacity="0.5">
          {/* Ledge the light stands on, then two lines of water either side. */}
          <path d="M13.6 34.6h20.8c1.5 0 2.6.8 3.4 1.7H10.2c.8-.9 1.9-1.7 3.4-1.7Z" />
          <rect x="3" y="39.1" width="13" height="1.3" rx="0.65" opacity="0.65" />
          <rect x="32" y="39.1" width="13" height="1.3" rx="0.65" opacity="0.65" />
          <rect x="18.5" y="42.4" width="11" height="1.3" rx="0.65" opacity="0.45" />
        </g>
      )}
    </svg>
  );
}

type LockupProps = {
  /** Controls the wordmark type scale; the mark scales with it. */
  size?: "sm" | "md" | "lg";
  /** Drops the "Est. 2018 · Southern Maine" line. */
  showTagline?: boolean;
  className?: string;
};

const SIZES = {
  sm: { mark: "w-7 h-7", name: "text-[15px]", tag: "text-[9px]" },
  md: { mark: "w-9 h-9", name: "text-[17px] md:text-[18px]", tag: "text-[10px]" },
  lg: { mark: "w-11 h-11", name: "text-xl", tag: "text-[11px]" },
} as const;

/**
 * Mark + wordmark, as used in the navbar and footer.
 *
 * NOTE: this sets its own `display` (inline-flex). Don't pass a display
 * utility in `className` to show/hide it responsively — Tailwind resolves
 * competing display utilities by CSS source order, not by the order they
 * appear in the attribute, so `hidden` passed here loses to the `inline-flex`
 * below and the element stays visible. Wrap it in an element that carries the
 * responsive display instead.
 */
export function LogoLockup({ size = "md", showTagline = true, className = "" }: LockupProps) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LighthouseMark
        minimal={size === "sm"}
        className={`${s.mark} flex-shrink-0 text-foreground transition-colors duration-200 group-hover:text-primary`}
      />
      <span className="flex flex-col leading-none min-w-0">
        <span
          className={`font-serif font-bold ${s.name} tracking-[-0.01em] text-foreground transition-colors duration-200 group-hover:text-primary whitespace-nowrap`}
        >
          The Maine Cleaning Co.
        </span>
        {showTagline && (
          <span
            className={`${s.tag} tracking-[0.14em] text-muted-foreground/70 uppercase font-medium mt-1 transition-colors group-hover:text-muted-foreground whitespace-nowrap`}
          >
            Est. 2018 · Southern Maine
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * Oversized, very low-contrast mark used as section texture. Purely
 * decorative: never announced, never clickable, never in the layout flow.
 */
export function LogoWatermark({
  className = "",
  position = "right",
}: {
  className?: string;
  position?: "left" | "right";
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -bottom-10 ${
        position === "right" ? "-right-10" : "-left-10"
      } hidden md:block select-none ${className}`}
    >
      <LighthouseMark className="w-64 h-64 lg:w-80 lg:h-80 text-foreground opacity-[0.035] dark:opacity-[0.05]" />
    </div>
  );
}


/**
 * The real painted badge, at a size where its detail is legible.
 *
 * Always on a light plate — see the note on BRAND_PHOTO_LOGO. In light mode
 * the plate is nearly invisible against the page; in dark mode it reads as a
 * cream sign board, which is what the artwork is drawn as.
 *
 * Decorative by default: the company name is written beside it in every place
 * this is used, so repeating it to a screen reader is noise. Pass a `title`
 * where the badge stands alone and IS the naming.
 */
export function LogoBadge({
  className = "w-44",
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl bg-[#fbfbfa] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.10)] ring-1 ring-black/5 ${className}`}
    >
      {/* Served at the size it renders, with retina steps, because the
          hatching is what makes this file expensive and none of it is visible
          below about 400px. The full-resolution original is 846KB; the base
          file is 109KB and indistinguishable at the sizes used.

          The middle 660w step exists for phones specifically. The badge
          renders at 11rem there, so a 3x screen asks for ~528px — with only
          440 and 880 to choose from the browser had to take the 880, and
          320KB of painted hatching was the single largest download on the
          page for a badge the width of two thumbs. `sizes` used to claim
          60vw, which overstated it further; 11rem is what the element is. */}
      <img
        src={BRAND_PHOTO_LOGO}
        srcSet="/images/logo.webp 440w, /images/logo@1.5x.webp 660w, /images/logo@2x.webp 880w"
        sizes="(max-width: 640px) 11rem, 22rem"
        alt={title ?? ""}
        aria-hidden={title ? undefined : true}
        className="w-full h-auto"
        width={440}
        height={400}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
