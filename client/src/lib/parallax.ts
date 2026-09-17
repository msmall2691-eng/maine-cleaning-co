import { useEffect, useRef } from "react";

/**
 * Scroll-linked parallax, on one listener for the whole page.
 *
 * Two things this deliberately does NOT do:
 *
 *  1. It never reads layout during a scroll frame. Each subscriber measures
 *     its document-relative top and height once, then again only when the
 *     element actually resizes (ResizeObserver). Per-frame work is arithmetic
 *     on window.scrollY and one CSS custom property write — no
 *     getBoundingClientRect, so no forced reflow, so no jank with a dozen of
 *     these on a page.
 *
 *  2. It never animates anything but `transform` (see .parallax-layer in
 *     index.css). Moving `top` or `background-position` repaints; a
 *     translate3d stays on the compositor.
 *
 * Honours prefers-reduced-motion by simply not subscribing: the custom
 * property stays unset, the CSS falls back to 0, and the image sits still.
 */

type Subscriber = () => void;

const subscribers = new Set<Subscriber>();
let frame = 0;

function flush() {
  frame = 0;
  subscribers.forEach((fn) => fn());
}

function onScroll() {
  if (frame) return;
  frame = requestAnimationFrame(flush);
}

function subscribe(fn: Subscriber): () => void {
  if (subscribers.size === 0) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }
  subscribers.add(fn);
  fn();
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }
  };
}

/**
 * Attach to the element that CONTAINS the moving layer (usually the band or
 * frame), not to the image itself — the image is what gets transformed, and
 * it's oversized so the travel never exposes an edge.
 *
 * `strength` is the peak shift as a fraction of the image's own height, so it
 * must stay under the overhang that .parallax-layer gives the image (20%).
 * 0.12 is the default and 0.18 is about the most that still reads as depth
 * rather than as a slide.
 */
export function useParallax<T extends HTMLElement>(strength = 0.12) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let top = 0;
    let height = 0;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      top = rect.top + window.scrollY;
      height = rect.height;
    };

    const update = () => {
      const viewport = window.innerHeight;
      // 0 as the band's bottom edge enters the viewport, 1 as its top edge
      // leaves. Guarded because a band taller than the page can't span 0..1.
      const span = viewport + height;
      if (span <= 0) return;
      const progress = Math.min(1, Math.max(0, (window.scrollY + viewport - top) / span));
      el.style.setProperty("--parallax", ((progress - 0.5) * 2 * strength * 100).toFixed(2));
    };

    measure();
    const ro = new ResizeObserver(() => {
      measure();
      update();
    });
    ro.observe(el);

    const unsubscribe = subscribe(update);
    return () => {
      unsubscribe();
      ro.disconnect();
      el.style.removeProperty("--parallax");
    };
  }, [strength]);

  return ref;
}
