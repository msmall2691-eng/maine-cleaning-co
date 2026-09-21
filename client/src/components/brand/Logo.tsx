/**
 * The Maine Cleaning Co. brand marks.
 *
 * Two marks, drawn from the painted badge at /images/logo.webp rather than
 * invented alongside it. The badge's load-bearing details are: a WHITE tapered
 * tower against a DARK lantern room and domed cap with a ball finial, the
 * keeper's house at the base, chunky angular granite, and a spruce treeline.
 * The mark this file used to ship kept none of them — it was a solid navy
 * silhouette (the negative of the real tower) with four lonely triangles — and
 * the owner's read was simply "wish it was more like my actual logo".
 *
 *   <LighthouseBeacon>  the primary mark. A night scene on its own rounded
 *                       plate: lit lantern, beam, granite catching the light.
 *                       Carries its own ground, so it is identical in both
 *                       themes instead of needing a light and a dark cut.
 *   <LighthouseMark>    the same lighthouse in ONE ink, currentColor, no
 *                       plate. For the watermark, decorative uses, embroidery,
 *                       anywhere a single colour is all there is.
 *
 * Why both: the beacon is the brand, but it cannot be tinted or dropped to 3%
 * opacity — <LogoWatermark> renders the mark at 320px and 3.5% alpha in ten
 * places, and a dark plate there is a blob. The monoline mark is what survives
 * that treatment, and it is also the one that still works stamped on a shirt.
 *
 * The painted badge itself lives at /images/logo.webp and is rendered by
 * <LogoBadge>, at the sizes where its hatching actually survives.
 */
import { useId } from "react";

/**
 * The painted badge is ink on transparency, and that ink is near-black navy —
 * it reads beautifully on off-white and all but disappears on the dark theme.
 * So <LogoBadge> always sits it on a light plate. That is not a workaround:
 * the artwork is a painted sign, and a sign on a board is what it is.
 */
export const BRAND_PHOTO_LOGO = "/images/logo.webp";

type MarkProps = {
  className?: string;
  /** Drops the scenery — cleaner below ~28px. */
  minimal?: boolean;
  title?: string;
};

/**
 * The primary mark: the lighthouse at dusk, on its own night plate.
 *
 * Self-contained by design. Every colour is literal rather than inherited, so
 * it renders the same on cream, on navy, on a photo, and in an email client
 * that knows nothing about the theme — one asset instead of a light cut and a
 * dark cut that drift apart.
 *
 * Gradient ids are per-instance (useId): the navbar renders two lockups at
 * once for its responsive sizes, and duplicate ids in one document make the
 * second instance resolve against the first's defs.
 */
export function LighthouseBeacon({ className = "w-9 h-9", minimal = false, title }: MarkProps) {
  const uid = useId().replace(/:/g, "");
  const plate = `${uid}-plate`;
  const glow = `${uid}-glow`;
  const tower = `${uid}-tower`;
  const beamL = `${uid}-beamL`;
  const beamR = `${uid}-beamR`;
  const clip = `${uid}-clip`;

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={plate} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1b2b4a" />
          <stop offset="100%" stopColor="#0c1424" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff0c9" stopOpacity="0.95" />
          <stop offset="32%" stopColor="#ffd98a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f6c667" stopOpacity="0" />
        </radialGradient>
        {/* The tower is lit from the lantern above it, so the gradient runs
            bright at the top edge into shadow at the bottom right. This is the
            whole reason it reads as dimensional rather than as a white shape. */}
        <linearGradient id={tower} x1="10%" y1="0%" x2="100%" y2="60%">
          <stop offset="0%" stopColor="#fbf8f0" />
          <stop offset="52%" stopColor="#ddd7c8" />
          <stop offset="100%" stopColor="#8d94a3" />
        </linearGradient>
        <linearGradient id={beamL} x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#ffd98a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={beamR} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#ffd98a" stopOpacity="0" />
        </linearGradient>
        {/* Keeps the beam and glow inside the plate's rounded corners. */}
        <clipPath id={clip}>
          <rect x="0" y="0" width="120" height="120" rx="27" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="120" height="120" fill={`url(#${plate})`} />

        <g transform="translate(11 13) scale(0.82)">
          {/* Beam and halo, behind everything. */}
          <path d="M58 31 L-14 12 L-14 52 Z" fill={`url(#${beamL})`} />
          <path d="M62 31 L134 12 L134 52 Z" fill={`url(#${beamR})`} />
          <circle cx="60" cy="31" r="31" fill={`url(#${glow})`} />

          {!minimal && (
            <>
              {/* Spruce treeline, silhouetted against the glow. */}
              <g fill="#14352a">
                <path d="M18 88 L12 88 L18 70 L24 88 Z" />
                <path d="M27 88 L22 88 L27 74 L32 88 Z" />
                <path d="M35 88 L31 88 L35 78 L39 88 Z" />
                <path d="M88 88 L82 88 L88 71 L94 88 Z" />
                <path d="M98 88 L93 88 L98 75 L103 88 Z" />
                <path d="M80 88 L76 88 L80 79 L84 88 Z" />
              </g>
              {/* Keeper's house, one window lit. */}
              <g>
                <path d="M70 78 L80 69 L90 78 Z" fill="#0a1120" />
                <rect x="72" y="78" width="16" height="12" fill="#1b2a44" />
                <rect x="78" y="83" width="4" height="5" fill="#ffd98a" opacity="0.85" />
              </g>
            </>
          )}

          {/* Tower. */}
          <path d="M46 90 L53 44 L67 44 L74 90 Z" fill={`url(#${tower})`} />
          {/* Gallery deck, then its railing. */}
          <path d="M49 44 L71 44 L73 39 L47 39 Z" fill="#0a1120" />
          {!minimal && (
            <g stroke="#0a1120" strokeWidth="1.3">
              <line x1="49" y1="39" x2="49" y2="34" />
              <line x1="55" y1="39" x2="55" y2="34" />
              <line x1="65" y1="39" x2="65" y2="34" />
              <line x1="71" y1="39" x2="71" y2="34" />
              <line x1="48" y1="34" x2="72" y2="34" />
            </g>
          )}
          {/* Lantern room, lit. */}
          <rect x="52" y="20" width="16" height="14" fill="#ffe9b4" />
          {!minimal && (
            <g stroke="#8a6a26" strokeWidth="1" opacity="0.65">
              <line x1="57" y1="21" x2="57" y2="33" />
              <line x1="63" y1="21" x2="63" y2="33" />
            </g>
          )}
          {/* Domed cap and finial. */}
          <path d="M50 20 Q60 8 70 20 Z" fill="#0a1120" />
          <circle cx="60" cy="8" r="2.4" fill="#0a1120" />
          <rect x="59.2" y="4" width="1.6" height="4" fill="#0a1120" />

          {/* Granite — the top faces catch the light, the sides stay in it. */}
          <g strokeLinejoin="round">
            <path d="M30 90 L40 84 L54 88 L58 96 L28 96 Z" fill="#4e5a6b" />
            <path d="M30 90 L40 84 L54 88 L48 90 L36 88 Z" fill="#949cab" />
            <path d="M58 88 L70 83 L86 88 L92 96 L56 96 Z" fill="#46525f" />
            <path d="M58 88 L70 83 L86 88 L76 90 L64 89 Z" fill="#878f9d" />
            {!minimal && (
              <>
                <path d="M14 96 L24 90 L36 94 L40 101 L10 101 Z" fill="#3c4653" />
                <path d="M84 96 L96 91 L108 96 L110 101 L80 101 Z" fill="#3c4653" />
              </>
            )}
          </g>
          {!minimal && (
            <g stroke="#ffd98a" opacity="0.26" strokeWidth="1.8" strokeLinecap="round">
              <line x1="6" y1="107" x2="34" y2="107" />
              <line x1="86" y1="107" x2="114" y2="107" />
              <line x1="42" y1="113" x2="78" y2="113" />
            </g>
          )}
        </g>
      </g>
      {/* A hairline so the plate still has an edge on a dark page. */}
      <rect
        x="0.6"
        y="0.6"
        width="118.8"
        height="118.8"
        rx="26.4"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.09"
        strokeWidth="1.2"
      />
    </svg>
  );
}

/**
 * The same lighthouse in one ink.
 *
 * Inherits `currentColor` and carries no plate, so it tints, dims and prints.
 * Drawn as monoline rather than filled: a filled silhouette at 3.5% opacity
 * (what <LogoWatermark> asks for) collapses into a shapeless smudge, and an
 * outline keeps its structure all the way down.
 */
export function LighthouseMark({ className = "w-8 h-8", minimal = false, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <g
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Light rays. Without them this is a tapered box on a rock — the rays
            are what make it read as a LIGHThouse at a glance, and they echo the
            beam in <LighthouseBeacon> so the two marks are visibly a pair.
            The painted badge's tower bands are deliberately NOT drawn: at one
            line weight they read as ladder rungs, and a rung-laddered taper
            is a radio mast, not a lighthouse. */}
        {!minimal && (
          <g opacity="0.75">
            <path d="M44 24 L37 21" />
            <path d="M76 24 L83 21" />
            <path d="M45 33 L38 35" />
            <path d="M75 33 L82 35" />
          </g>
        )}

        {/* Tower — a masonry taper, wide enough at the base to read as stone. */}
        <path d="M45 91 L52.5 46 L67.5 46 L75 91" />
        {/* Gallery deck and its overhang. */}
        <path d="M49 46 L71 46" />
        <path d="M47 41 L73 41" />
        {/* Lantern room, domed cap, finial. */}
        <path d="M54 41 L54 22 L66 22 L66 41" />
        <path d="M51 22 Q60 11 69 22" />
        <line x1="60" y1="11" x2="60" y2="6" />

        {!minimal && (
          <>
            {/* Keeper's house, standing clear of the ledge so it stays a
                building rather than another lump of granite. */}
            <path d="M78 91 L78 80 L87 73 L96 80 L96 91" />
            {/* Spruce — tall enough to be trees rather than carets. */}
            <path d="M8 91 L16 71 L24 91" />
            <path d="M99 91 L106 74 L113 91" />
          </>
        )}

        {/* Granite ledge, under the tower's foot. */}
        <path
          d={
            minimal
              ? "M36 97 L48 92 L60 95 L72 92 L84 97"
              : "M24 97 L36 92 L50 95 L62 92 L76 95 L90 91 L102 97"
          }
        />
        {!minimal && (
          <g opacity="0.45">
            <path d="M10 106 L36 106" />
            <path d="M84 106 L110 106" />
            <path d="M44 113 L76 113" />
          </g>
        )}
      </g>
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
  sm: { mark: "w-8 h-8", name: "text-[15px]", tag: "text-[9px]" },
  md: { mark: "w-10 h-10", name: "text-[17px] md:text-[18px]", tag: "text-[10px]" },
  lg: { mark: "w-12 h-12", name: "text-xl", tag: "text-[11px]" },
} as const;

/**
 * Mark + wordmark, as used in the navbar and footer.
 *
 * The beacon brings its own colour, so only the wordmark takes the hover
 * treatment — tinting the mark on hover would fight its own palette.
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
      <LighthouseBeacon
        minimal={size === "sm"}
        className={`${s.mark} flex-shrink-0 rounded-[22%] transition-transform duration-200 group-hover:scale-105`}
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
 *
 * Uses the monoline mark on purpose — see the note on <LighthouseMark>.
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
      <LighthouseMark className="w-64 h-64 lg:w-80 lg:h-80 text-foreground opacity-[0.045] dark:opacity-[0.06]" />
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
