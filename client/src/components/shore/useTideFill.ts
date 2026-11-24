import { useEffect, useRef, useState } from "react";

/**
 * "The tide comes in once, as this scrolls into view."
 *
 * Returns a ref to attach and a boolean that flips true the first time the
 * element is far enough into the viewport, after an optional stagger. Pair it
 * with a `--tide` custom property and let CSS do the animating — nothing here
 * runs per frame.
 *
 * Rises once and stays risen. A pool that drains again on scroll-up reads as
 * a bug rather than as a tide, and re-triggering on every pass is how a
 * scroll-reveal becomes nausea.
 *
 * Extracted from TidePools when the work gallery wanted the same behaviour.
 * The two use it in opposite directions — the pools fill, the gallery's veil
 * recedes to uncover a photo — but the trigger is identical, and two copies
 * of an IntersectionObserver are two chances to fix a bug in only one.
 */
export function useTideFill<T extends HTMLElement>(delayMs = 0) {
  const ref = useRef<T>(null);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || filled) return;

    // No observer (an old browser, or a static render that somehow ran an
    // effect) — show the end state rather than leaving it stuck at the start.
    if (typeof IntersectionObserver === "undefined") {
      setFilled(true);
      return;
    }

    let timer = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          timer = window.setTimeout(() => setFilled(true), delayMs);
          observer.disconnect();
        }
      },
      // Fire a little before the element is centred, so the motion is already
      // under way by the time it is the thing being looked at.
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [delayMs, filled]);

  return { ref, filled };
}
