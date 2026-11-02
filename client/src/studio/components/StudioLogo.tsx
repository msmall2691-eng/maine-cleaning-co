import { useId } from "react";
import { brand } from "@/lib/brand";

/**
 * The new business's mark.
 *
 * Deliberately NOT the lighthouse. That mark belongs to the cleaning company
 * and is drawn from its painted sign — it means something there, and nothing
 * here. This is its own thing: four blocks on a grid, three settled and one
 * being placed, which is as close to "systems, assembled" as a 24px square
 * gets without becoming a picture of a cog.
 *
 * One ink (currentColor) on purpose. The cleaning beacon carries its own
 * night plate so it survives any background, which cost it the ability to be
 * tinted; this one inherits, so it works in the navbar, inverted in the
 * footer, at 3% alpha as a watermark, and stamped on anything.
 */
export function StudioMark({ className = "w-8 h-8" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" role="presentation">
      <defs>
        <linearGradient id={`${uid}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.72" />
        </linearGradient>
      </defs>
      {/* three placed */}
      <rect x="2" y="17" width="13" height="13" rx="3.5" fill={`url(#${uid}-g)`} />
      <rect x="17" y="17" width="13" height="13" rx="3.5" fill="currentColor" opacity="0.55" />
      <rect x="2" y="2" width="13" height="13" rx="3.5" fill="currentColor" opacity="0.78" />
      {/* one still coming in — the gap is the point */}
      <rect
        x="17.75"
        y="2.75"
        width="11.5"
        height="11.5"
        rx="2.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.5"
      />
    </svg>
  );
}

type LockupProps = {
  /** Wordmark scale. The mark follows it. */
  size?: "sm" | "md" | "lg";
  /** Drops the tagline line under the name. */
  showTagline?: boolean;
  className?: string;
};

const SIZES = {
  sm: { mark: "w-7 h-7", name: "text-[15px]", tag: "text-[9px]" },
  md: { mark: "w-8 h-8", name: "text-[17px]", tag: "text-[10px]" },
  lg: { mark: "w-10 h-10", name: "text-[21px]", tag: "text-[11px]" },
} as const;

export function StudioLockup({ size = "md", showTagline = false, className = "" }: LockupProps) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <StudioMark className={`${s.mark} flex-shrink-0 text-primary transition-transform duration-200 group-hover:scale-105`} />
      <span className="flex flex-col leading-none min-w-0">
        <span
          className={`${s.name} font-bold tracking-[-0.02em] text-foreground transition-colors duration-200 group-hover:text-primary whitespace-nowrap`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {brand.name}
        </span>
        {showTagline && (
          <span
            className={`${s.tag} tracking-[0.14em] text-muted-foreground uppercase font-medium mt-1 whitespace-nowrap`}
          >
            {brand.tagline}
          </span>
        )}
      </span>
    </span>
  );
}
