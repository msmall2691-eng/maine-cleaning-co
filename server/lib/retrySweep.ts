import { retryFailedForwards, type RetrySweepResult } from "./leadForward";
import { storage } from "../storage";
import { db } from "../db";

/**
 * One failed-forward retry sweep, with its post-delivery side effect attached.
 *
 * This exists so the HTTP endpoint and the background scheduler cannot drift.
 * The onDelivered hook below used to be written inline in the
 * POST /api/admin/forwards/retry handler, which meant a scheduled sweep would
 * have re-delivered the lead and then silently failed to capture BrightBase's
 * booking id onto our row — the exact class of bug where "it works when I
 * click the button but not on the schedule".
 */
export async function sweepFailedForwards(limit = 100): Promise<RetrySweepResult> {
  return retryFailedForwards({
    limit,
    // A forward that lands on retry still needs its post-delivery side
    // effect — capture BrightBase's returned booking id onto our row.
    onDelivered: async (row, result) => {
      if (row.destination !== "brightbase" || row.sourceType !== "booking" || !row.sourceId || !result.responseSnippet) return;
      try {
        const bookingId = JSON.parse(result.responseSnippet)?.bookingId;
        if (bookingId != null) await storage.updateBookingRequestExternalIds(row.sourceId, { crmBookingId: String(bookingId) });
      } catch { /* non-JSON response — nothing to capture */ }
    },
  });
}

/** True when a sweep could do anything at all. */
export function retrySweepAvailable(): boolean {
  return Boolean(db);
}
