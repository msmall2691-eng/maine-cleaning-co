import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The site's layout rhythm, in one place.
 *
 * Before this existed, every page invented its own spacing and its own
 * content width — a homepage that ran `max-w-md` for a heading, `max-w-2xl`
 * for a grid, `max-w-4xl` for reviews and `max-w-5xl` for the estimator, all
 * inside the same `container`. That's what made the site read as "empty" on
 * a laptop (a 1152px container wrapping a 448px column of text) and "choppy"
 * scrolling down it (the measure jumping on every section).
 *
 * Use <Section> for a band of page, <SectionHeading> for its header. Don't
 * hand-roll `container mx-auto px-4 max-w-*` in a page again.
 */

/** Content measures. One of these, not an ad-hoc max-w-* per section. */
export const MEASURES = {
  /** Body copy, forms, single-column reading. ~44rem. */
  prose: "max-w-[44rem]",
  /** The default band: two-column splits, most content. ~68rem. */
  default: "max-w-[68rem]",
  /** Grids, galleries, anything that benefits from breathing wide. ~78rem. */
  wide: "max-w-[78rem]",
  /** Full container width — edge-to-edge carousels and maps. */
  full: "max-w-none",
} as const;

export type Measure = keyof typeof MEASURES;

/** Vertical rhythm. `flush` is for bands that butt against a neighbour. */
export const RHYTHM = {
  none: "",
  tight: "py-[clamp(2rem,3.5vw,3rem)]",
  default: "py-[clamp(3.25rem,6vw,5.5rem)]",
  loose: "py-[clamp(4.5rem,8vw,7.5rem)]",
} as const;

export type Rhythm = keyof typeof RHYTHM;

/**
 * Reveal-on-scroll. Kept on an IntersectionObserver rather than Framer's
 * whileInView so a page full of sections costs one observer each and no
 * per-frame work. Honours prefers-reduced-motion via .section-fade in CSS.
 */
function useReveal<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      // threshold 0, not a fraction: a fractional threshold can never be met
      // by an element taller than the viewport/threshold ratio, and is never
      // met at all by a zero-height one — either of which would leave a
      // section stuck at opacity 0 with its content unreachable. The negative
      // bottom margin is what delays the reveal until the section is properly
      // on screen, so nothing is lost by dropping the ratio.
      { threshold: 0, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled]);

  return { ref, shown };
}

type SectionProps = {
  children: ReactNode;
  id?: string;
  /** Vertical padding. Default `default`. */
  rhythm?: Rhythm;
  /** Content width. Default `default`. */
  measure?: Measure;
  /**
   * Background band. `plain` inherits the page background — which is the
   * right answer most of the time. `tint` and `sink` are *soft* steps, not
   * the hard white/cream stripes the site used to alternate between.
   */
  tone?: "plain" | "tint" | "sink";
  /** Fades and lifts the band in as it enters the viewport. */
  reveal?: boolean;
  /** Extra classes on the <section> element itself. */
  className?: string;
  /** Extra classes on the inner measure wrapper. */
  innerClassName?: string;
  "data-testid"?: string;
};

export function Section({
  children,
  id,
  rhythm = "default",
  measure = "default",
  tone = "plain",
  reveal = true,
  className = "",
  innerClassName = "",
  ...rest
}: SectionProps) {
  const { ref, shown } = useReveal<HTMLElement>(reveal);

  const toneClass =
    tone === "tint" ? "band-tint" : tone === "sink" ? "band-sink" : "";

  return (
    <section
      ref={ref}
      id={id}
      className={`relative ${RHYTHM[rhythm]} ${toneClass} ${
        reveal ? `section-fade ${shown ? "visible" : ""}` : ""
      } ${className}`}
      {...rest}
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className={`${MEASURES[measure]} mx-auto ${innerClassName}`}>{children}</div>
      </div>
    </section>
  );
}

type HeadingProps = {
  /** Small uppercase label above the title. */
  eyebrow?: string;
  title: ReactNode;
  /** One or two sentences under the title. */
  lead?: ReactNode;
  align?: "center" | "left";
  /** `h2` everywhere except a page's own opening heading. */
  as?: "h1" | "h2" | "h3";
  /** Content that sits opposite the heading on a left-aligned row. */
  aside?: ReactNode;
  className?: string;
};

/**
 * One heading treatment for the whole site. Every h2 was previously written
 * out longhand with a slightly different size, weight and margin on each
 * page; this is that treatment, once.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
  as: Tag = "h2",
  aside,
  className = "",
}: HeadingProps) {
  const isCenter = align === "center";
  const size =
    Tag === "h1"
      ? "text-[2.25rem] sm:text-5xl md:text-[3.5rem] leading-[1.05]"
      : "text-[1.75rem] sm:text-4xl md:text-[2.5rem] leading-[1.1]";

  const block = (
    <div className={isCenter ? "max-w-[38rem] mx-auto text-center" : "max-w-[34rem]"}>
      {eyebrow && (
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-primary/80 mb-3">
          {eyebrow}
        </p>
      )}
      <Tag
        className={`${size} font-serif font-bold text-foreground tracking-[-0.02em] ${
          isCenter ? "section-heading-accent" : "heading-rule-left"
        }`}
      >
        {title}
      </Tag>
      {lead && (
        <p className="text-[15px] sm:text-base text-muted-foreground leading-relaxed mt-6">
          {lead}
        </p>
      )}
    </div>
  );

  // mb here is the one gap between a section header and its body.
  const spacing = "mb-10 sm:mb-14";

  if (aside) {
    return (
      <div
        className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 ${spacing} ${className}`}
      >
        {block}
        <div className="flex-shrink-0">{aside}</div>
      </div>
    );
  }

  return <div className={`${spacing} ${className}`}>{block}</div>;
}
