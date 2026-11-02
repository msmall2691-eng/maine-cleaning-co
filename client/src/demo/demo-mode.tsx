import { createContext, useContext, type ReactNode } from "react";
import { useRouter } from "wouter";

/**
 * Demo mode.
 *
 * The cleaning company has wound down, but its system is kept online as the
 * proof that any of this works. That creates a hazard the moment a visitor
 * takes it at face value: the booking flow and the enquiry form are fully
 * wired, so without this a stranger could request — and believe they had
 * booked — a clean that nobody is going to turn up for.
 *
 * So every write path inside /demo is blocked, and said to be blocked, rather
 * than quietly succeeding. There are two layers on purpose:
 *
 *   1. This context, which the forms check before they fetch. It is what
 *      produces an honest message instead of a silent no-op.
 *   2. A server-side guard (server/middleware/demoGuard.ts) that refuses the
 *      same writes by Referer. Layer 1 is the UX; layer 2 is what makes the
 *      promise true even if a form is missed or someone replays the request.
 *
 * Reads are deliberately untouched. Pricing still computes, the portal still
 * signs in, the town pages still render — a demo where nothing responds is
 * not a demo.
 */
const DemoContext = createContext(false);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  return <DemoContext.Provider value={true}>{children}</DemoContext.Provider>;
}

/** True inside the /demo subtree, false on the real business site. */
export function useIsDemo(): boolean {
  return useContext(DemoContext);
}

/** The message every blocked write shows. One wording, used everywhere. */
export const DEMO_BLOCKED_MESSAGE =
  "This is a demo — nothing was sent. The Maine Cleaning Co. has wound down and is no longer taking bookings.";

/**
 * The current router base ("" on the business site, "/demo" inside the demo).
 *
 * wouter rewrites `<Link href>` against the base automatically, but a raw
 * `<a href="/book">` and a `window.location.href = "/#x"` both escape it —
 * they'd jump a demo visitor out to the business site. Anything that has to
 * build a URL by hand goes through here.
 */
export function useBasePath(): string {
  return useRouter().base || "";
}

/** `withBase("/demo", "/book")` → `"/demo/book"`. Safe with an empty base. */
export function withBase(base: string, path: string): string {
  if (!base) return path;
  return `${base}${path === "/" ? "" : path}` || "/";
}
