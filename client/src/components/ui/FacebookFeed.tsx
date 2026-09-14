import { useEffect, useRef, useState } from "react";
import { Facebook, ExternalLink } from "lucide-react";
import { companyInfo } from "@/lib/company-info";

/**
 * Live Facebook Page timeline.
 *
 * Uses the Page Plugin's IFRAME form, not Meta's JS SDK. Same rendered
 * timeline, but it doesn't pull ~200KB of SDK onto every page that mounts
 * this, and it keeps Meta's script out of the booking flow. No access token
 * and no App Review either — this is a public-Page embed, not an API read.
 *
 * Two things the plugin can't do, handled here:
 *
 *  1. It needs a PIXEL width (it ignores percentages) and only honours
 *     180–500. We measure the container and clamp, then re-measure on
 *     resize so it isn't stuck at whatever the width was on first paint.
 *
 *  2. It renders light-only — there is no dark parameter — so in dark mode
 *     a bare iframe is a glaring white slab. It sits on a light card here so
 *     it reads as a deliberately embedded panel in both themes.
 *
 * Ad/tracker blockers block facebook.com outright for a lot of people, and a
 * blocked iframe paints nothing. The placeholder underneath it is always
 * rendered, so a blocked embed degrades to a real message and a working link
 * instead of an empty hole.
 */

const FB_MIN = 180;
const FB_MAX = 500;

export function FacebookFeed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(FB_MAX);
  const [visible, setVisible] = useState(false);

  // Don't fetch the embed until it's near the viewport. This section lives
  // well below the fold; loading it eagerly costs every visitor a third-party
  // request they may never scroll to.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setWidth(Math.max(FB_MIN, Math.min(FB_MAX, w)));
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const src =
    "https://www.facebook.com/plugins/page.php?" +
    new URLSearchParams({
      href: companyInfo.socials.facebook,
      tabs: "timeline",
      width: String(width),
      height: "640",
      small_header: "true",
      adapt_container_width: "true",
      hide_cover: "false",
      show_facepile: "true",
    }).toString();

  return (
    <div ref={containerRef} className="w-full max-w-[500px] mx-auto">
      <div className="relative rounded-2xl overflow-hidden border border-border bg-white shadow-sm min-h-[640px]">
        {/* Always rendered, always behind the iframe. If the embed is blocked
            or slow this is what the visitor sees, so the panel is never a
            blank rectangle. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <Facebook className="w-8 h-8 text-[#1877F2]/70" />
          <p className="text-sm font-medium text-neutral-700">
            Our latest updates live on Facebook.
          </p>
          <p className="text-xs text-neutral-500 max-w-[280px]">
            If nothing loads here, a privacy or ad blocker is blocking the embed — the
            link below always works.
          </p>
          <a
            href={companyInfo.socials.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1877F2] hover:underline"
            data-testid="link-fb-feed-fallback"
          >
            Open our Facebook page <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {visible && (
          <iframe
            key={width}
            src={src}
            title="The Maine Cleaning Co. on Facebook"
            className="relative w-full h-[640px] border-0"
            style={{ colorScheme: "light" }}
            scrolling="no"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            loading="lazy"
            data-testid="facebook-page-embed"
          />
        )}
      </div>
    </div>
  );
}
