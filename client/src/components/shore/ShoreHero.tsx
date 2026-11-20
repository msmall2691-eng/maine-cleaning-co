import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronDown, Phone } from "lucide-react";
import { companyInfo } from "@/lib/company-info";
import { useMotion } from "@/lib/motion";
import { useParallax } from "@/lib/parallax";
import { ShoreControls } from "./ShoreControls";
import { AVAILABILITY_NOTE } from "@/lib/response-time";

/**
 * The hero plate: the Maine shoreline, and one sentence about why you are
 * looking at it.
 *
 * Load order is deliberate, and it is the whole performance story of this
 * page:
 *
 *   1. The poster (125KB WebP) is in the markup, eager, as the LCP element.
 *      It paints with the first frame.
 *   2. The video element carries NO src until an effect decides it should.
 *      Not `preload="none"` — no source at all — because Safari has
 *      historically started buffering a `<source>` regardless.
 *   3. The effect declines entirely on reduced motion, on a narrow viewport,
 *      and on a connection that says it is slow or metered. Those visitors
 *      keep the poster, which is a photograph of the same water.
 *   4. When it does load, the video fades up over the poster, so the swap is
 *      never a pop.
 *
 * The footage is decorative: every word of meaning is in the heading and the
 * copy beside it, so the video is aria-hidden and the poster's alt is empty.
 * A screen reader that announced "video of waves" would be reading out the
 * wallpaper.
 */
export function ShoreHero() {
  const { reduced } = useMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  // Three layers at three rates is what reads as depth. The water moves
  // least (it is furthest away and already moving on its own), the headline
  // most.
  const waterRef = useParallax<HTMLDivElement>(0.06);
  const copyRef = useParallax<HTMLDivElement>(0.13);

  // Tell the chrome that the top of this page is dark. The navbar is
  // transparent until you scroll, and its light-theme ink is deep navy —
  // which over this footage is about 1.6:1 and effectively invisible. Set on
  // <html> rather than passed as a prop because the navbar lives in App.tsx,
  // outside the page, and cleared on unmount so navigating away restores it.
  useEffect(() => {
    document.documentElement.dataset.heroTone = "dark";
    return () => {
      delete document.documentElement.dataset.heroTone;
    };
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (reduced) {
      // Mid-session switch to reduced: stop and shed the frames we were
      // holding. The poster is underneath and unchanged.
      el.pause();
      el.removeAttribute("src");
      el.load();
      setVideoReady(false);
      return;
    }

    // A 1.9MB background decoration is not worth a phone's data plan, and at
    // 390px wide the shot is a texture anyway.
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    // Save-Data and the effective-connection estimate are advisory and only
    // Chromium implements them — but when a browser does say "this person is
    // on a metered 3G connection", taking it at its word costs nothing.
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /^(slow-)?2g$/.test(conn.effectiveType)) return;

    el.src = "/media/coast-hero.mp4";
    el.load();
    const onPlaying = () => setVideoReady(true);
    el.addEventListener("playing", onPlaying);
    // play() rejects if the browser declines; the poster stays, which is a
    // perfectly good hero, so there is nothing to handle but the noise.
    el.play().catch(() => {});
    return () => el.removeEventListener("playing", onPlaying);
  }, [reduced]);

  return (
    <section
      className="shore-section shore-grain band-deep relative clip-x"
      aria-labelledby="shore-hero-heading"
    >
      <div ref={waterRef} className="shore-hero-media shore-layer" aria-hidden="true">
        <picture>
          <source srcSet="/media/coast-hero-poster.webp" type="image/webp" />
          <img
            src="/media/coast-hero-poster.jpg"
            alt=""
            fetchPriority="high"
            decoding="async"
            width={1280}
            height={720}
          />
        </picture>
        <video
          ref={videoRef}
          className="shore-hero-video"
          data-ready={videoReady ? "true" : "false"}
          muted
          loop
          playsInline
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
      <div className="shore-scrim" aria-hidden="true" />

      <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-28 sm:px-8 lg:pt-32">
        <div className="mb-10 flex justify-start lg:justify-end">
          <ShoreControls />
        </div>

        <div ref={copyRef} className="shore-layer max-w-3xl">
          <p className="type-eyebrow !text-deep-accent">
            Southern Maine · Since 2018
          </p>
          <h1
            id="shore-hero-heading"
            className="type-display mt-5 text-deep-foreground"
          >
            Clean comes in
            <span className="block italic text-deep-accent">with the tide.</span>
          </h1>
          <p className="type-lead mt-6 max-w-xl !text-deep-muted">
            Residential, commercial and vacation-rental cleaning across York and
            Cumberland County — the same insured local crew, eco-friendly products,
            and a price you are told before we start.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/book"
              className="shore-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-deep-accent px-8 text-sm font-semibold text-deep transition-transform hover:scale-[1.02]"
              data-testid="link-hero-estimate"
            >
              Get my estimate
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={companyInfo.contact.phoneHref}
              className="shore-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-deep-muted/50 px-8 text-sm font-semibold text-deep-foreground transition-colors hover:border-deep-accent"
              data-testid="link-hero-call"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {companyInfo.contact.phoneDisplay}
            </a>
          </div>

          <p className="mt-6 text-xs text-deep-muted">{AVAILABILITY_NOTE}</p>
        </div>
      </div>

      {/* A cue, not a control: the page scrolls normally and this is an
          anchor to the next section, so it works on click, on Enter, and for
          anyone who simply scrolls past it. */}
      <a
        href="#services"
        className="shore-focus absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.2em] text-deep-muted transition-colors hover:text-deep-foreground"
        data-testid="link-hero-scroll"
      >
        <span>What we do</span>
        <ChevronDown className="still shore-cue h-4 w-4" aria-hidden="true" />
      </a>
    </section>
  );
}
