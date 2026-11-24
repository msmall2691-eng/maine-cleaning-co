import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * One control for every moving thing on the site.
 *
 * The brief for the shoreline page asked for a reduced-motion toggle. The site
 * already honoured `prefers-reduced-motion` in `useParallax` and in a handful
 * of CSS media queries, but a visitor who wants the parallax to stop and has
 * not set an OS preference had no way to say so — and a visitor who HAS set
 * one had no way to opt back in on a page built around motion.
 *
 * Three states, not two:
 *
 *   auto     follow the OS. The default, and what everyone gets on a first
 *            visit, so the OS preference is still respected out of the box.
 *   full     all motion, even if the OS asks for less. An explicit,
 *            per-site override — the visitor is the authority on their own
 *            setting, so we let them say it.
 *   reduced  no motion, even if the OS asks for none in particular.
 *
 * The resolved answer is written to <html data-motion="full|reduced"> so that
 * CSS and JS read the SAME source. That matters: before this, CSS asked
 * `@media (prefers-reduced-motion)` and the parallax hook asked `matchMedia`,
 * which agreed only by coincidence and could not be overridden by either.
 *
 * SSR: `script/prerender.ts` renders these components with no `window`, so
 * every browser lookup is guarded and the pre-rendered HTML carries no
 * data-motion at all. CSS treats "no attribute" as "follow the media query",
 * so the static HTML is correct before React ever boots.
 */

export type MotionPreference = "auto" | "full" | "reduced";
export type ResolvedMotion = "full" | "reduced";

type MotionContextValue = {
  /** What the visitor chose. */
  preference: MotionPreference;
  /** What that resolves to right now, OS preference included. */
  motion: ResolvedMotion;
  /** True when animation should be suppressed. The one to branch on. */
  reduced: boolean;
  setPreference: (p: MotionPreference) => void;
  /** auto/full -> reduced -> full. What the switch in the page calls. */
  toggle: () => void;
};

const STORAGE_KEY = "mcc-motion";
const QUERY = "(prefers-reduced-motion: reduce)";

const MotionContext = createContext<MotionContextValue | null>(null);

function readStoredPreference(): MotionPreference {
  if (typeof window === "undefined") return "auto";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "auto" || stored === "full" || stored === "reduced") return stored;
  } catch {
    // private mode / storage disabled — fall through to the default
  }
  return "auto";
}

function systemPrefersReduced(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}

export function resolveMotion(preference: MotionPreference, systemReduced: boolean): ResolvedMotion {
  if (preference === "reduced") return "reduced";
  if (preference === "full") return "full";
  return systemReduced ? "reduced" : "full";
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<MotionPreference>(() => readStoredPreference());
  const [systemReduced, setSystemReduced] = useState<boolean>(() => systemPrefersReduced());

  // The OS setting can change while the page is open (macOS and Windows both
  // allow it without a reload), and on "auto" that must take effect live.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setSystemReduced(e.matches);
    setSystemReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const motion = resolveMotion(preference, systemReduced);

  useEffect(() => {
    document.documentElement.setAttribute("data-motion", motion);
    return () => {
      // Only meaningful in tests, where providers mount and unmount.
      document.documentElement.removeAttribute("data-motion");
    };
  }, [motion]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // ignore
    }
  }, [preference]);

  const setPreference = useCallback((p: MotionPreference) => setPreferenceState(p), []);

  // The switch is a two-state control to the visitor even though the model has
  // three: "auto" presents as whatever it currently resolves to, and touching
  // the switch commits to the opposite explicitly. Leaving it on "auto" after
  // a deliberate toggle would mean the OS could silently change it back.
  const toggle = useCallback(
    () => setPreferenceState(() => (motion === "reduced" ? "full" : "reduced")),
    [motion],
  );

  const value = useMemo<MotionContextValue>(
    () => ({ preference, motion, reduced: motion === "reduced", setPreference, toggle }),
    [preference, motion, setPreference, toggle],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

/**
 * Outside a provider — which is every pre-render, and any test that mounts a
 * component on its own — this reports full motion rather than throwing. The
 * components that use it then render their end state, which is what the
 * static HTML should contain anyway.
 */
export function useMotion(): MotionContextValue {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    return {
      preference: "auto",
      motion: "full",
      reduced: false,
      setPreference: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
