import type { Express, Request, Response, NextFunction } from "express";

/**
 * Refuse writes that came from the demo.
 *
 * The cleaning company has wound down, but its whole system is kept online
 * under /demo as proof that this work is real. That creates one genuine
 * hazard: the booking flow and the enquiry form are fully wired, so a visitor
 * taking the demo at face value could submit a booking, get a confirmation
 * email, and wait for a crew that is never coming.
 *
 * The client already blocks this and says so (client/src/demo/demo-mode.tsx).
 * This is the layer that makes the promise true rather than merely intended:
 * a form someone forgot to guard, a replayed request, a stale tab left open
 * from before the pivot — all of them land here.
 *
 * How it decides: the Referer header. A browser sends it on a form fetch from
 * a page, and the demo's pages are exactly the ones whose path starts with
 * /demo. That is not an authentication boundary and is not meant to be — the
 * threat being defended against is an honest visitor clicking a button, not
 * an attacker, and an attacker gains nothing here but a row in a table for a
 * business that no longer operates.
 *
 * Reads are untouched. Pricing still computes, the portal still signs in, the
 * town pages still render. A demo where nothing responds is not a demo.
 */

/**
 * Write endpoints that would cause a real-world side effect — a record
 * someone acts on, an email to a customer, or money.
 *
 * Deliberately NOT a blanket block on every POST:
 *  - /api/auth/login and /api/portal/* keep working, so the portal can be
 *    demonstrated. They act on a session, not on the business.
 *  - /api/booking/validate-address is a lookup that happens to be a POST.
 *  - /api/ai/chat is left to its own rate limiting.
 */
const GUARDED = [
  "/api/intake/submit",
  "/api/booking/submit",
  "/api/auth/register",
] as const;

/** True when this request was made from a page under /demo. */
export function isFromDemo(referer: string | undefined): boolean {
  if (!referer) return false;
  try {
    // Absolute per the spec, but parse defensively: a relative Referer from
    // some embedded browser should not throw its way past the guard.
    const path = new URL(referer, "http://localhost").pathname;
    return path === "/demo" || path.startsWith("/demo/");
  } catch {
    return false;
  }
}

export function registerDemoGuard(app: Express) {
  app.use(GUARDED as unknown as string[], (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "POST") return next();
    if (!isFromDemo(req.get("referer"))) return next();

    // 403 and a plain reason, not a fake success. A demo that pretends to
    // accept a booking is the exact failure this exists to prevent, and a
    // silent no-op would leave the visitor believing it worked.
    res.status(403).json({
      message:
        "This is a demo — nothing was submitted. The Maine Cleaning Co. has wound down and is no longer taking bookings.",
      demo: true,
    });
  });
}
