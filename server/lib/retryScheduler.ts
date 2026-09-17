import { sweepFailedForwards, retrySweepAvailable } from "./retrySweep";

/**
 * Runs the failed-forward retry sweep on a schedule, in-process.
 *
 * WHY IN-PROCESS RATHER THAN A PLATFORM CRON
 *
 * The gap being closed: a booking can be accepted, the customer emailed
 * "Booking Request Received!", and the BrightBase forward lost — the inline
 * retries in leadForward.ts last about three seconds in total, and anything
 * longer than that becomes a `failed` row in the lead_forwards ledger that
 * nothing ever replays. The sweep that replays them already existed and was
 * reachable only by hand-crafting an authenticated HTTP request.
 *
 * Three options were on the table:
 *
 *  - **Railway cron.** Railway runs a cron by executing a service's start
 *    command on a schedule, so this would mean booting a second copy of the
 *    whole Express app every ten minutes to make one HTTP call to the first
 *    one. It also needs CRON_SECRET set correctly in two places to work, and
 *    fails silently if it isn't.
 *  - **A scheduled GitHub Action.** Needs the production URL and CRON_SECRET
 *    as repo secrets, and GitHub's scheduled workflows are explicitly
 *    best-effort — routinely tens of minutes late and dropped entirely under
 *    load. Poor fit for a durability mechanism.
 *  - **This.** No new service, no secret, no URL, no external dependency, and
 *    it works identically on Railway, locally, and anywhere else the app runs.
 *    The function is already in this process; making an HTTP request to
 *    ourselves to call it would be ceremony.
 *
 * POST /api/admin/forwards/retry stays exactly as it was — for a human
 * triggering a sweep on demand, and for an external cron if one is ever
 * wanted as a belt-and-braces second trigger. Both paths call the same
 * sweepFailedForwards(), so they cannot drift.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 *  - It doesn't overlap itself. A sweep of 100 rows against a slow or hanging
 *    BrightBase can exceed the interval (each attempt has a 15s timeout), and
 *    two concurrent sweeps would read the same `failed` rows and double-send.
 *    The in-flight guard makes a tick a no-op while one is running.
 *  - It doesn't log when there is nothing to say. A sweep that scans nothing
 *    is silent, because a line every ten minutes forever trains everyone to
 *    ignore this log exactly when it finally matters.
 *  - It doesn't hold the process open. unref() means a pending timer never
 *    keeps Node alive during a shutdown.
 *
 * MULTIPLE INSTANCES: if this app is ever scaled past one instance, each will
 * sweep. The rows are collapsed per (source, destination) and every forward
 * carries an idempotencyKey, so a double-send is absorbed downstream rather
 * than duplicating a booking — but if horizontal scaling ever happens, move
 * to a single external trigger against the HTTP endpoint instead of running
 * this on every instance.
 */

/** Default cadence. Override with RETRY_SWEEP_INTERVAL_MINUTES. */
const DEFAULT_INTERVAL_MIN = 10;

/** Floor, so a typo in the env var can't turn this into a hot loop. */
const MIN_INTERVAL_MIN = 1;

/**
 * Delay before the first sweep. Deliberately short but not zero: a restart is
 * one of the likelier reasons a forward was lost in the first place, so we
 * want an early sweep — but not while the process is still opening its
 * database pool and binding its port.
 */
const FIRST_RUN_DELAY_MS = 45_000;

let inFlight = false;

function readIntervalMinutes(): number {
  const raw = process.env.RETRY_SWEEP_INTERVAL_MINUTES;
  if (!raw) return DEFAULT_INTERVAL_MIN;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_INTERVAL_MIN;
  return Math.max(MIN_INTERVAL_MIN, parsed);
}

async function tick(log: (msg: string, data?: Record<string, any>) => void): Promise<void> {
  if (inFlight) {
    // Previous sweep is still going; skipping is correct, not an error.
    return;
  }
  inFlight = true;
  try {
    const summary = await sweepFailedForwards(100);
    // Silent when there was nothing to do — see the note above.
    if (summary.scanned > 0) {
      log("retry sweep complete", summary as unknown as Record<string, any>);
    }
  } catch (err) {
    // Never let a sweep failure take the process down. The ledger rows stay
    // `failed` and the next tick will try again.
    log("retry sweep threw", { error: String(err) });
  } finally {
    inFlight = false;
  }
}

/**
 * Starts the sweep loop. Returns a stop function (used by tests; the server
 * itself runs it for the life of the process).
 *
 * No-ops when there is no database — with no ledger there is nothing to
 * replay, and a timer that can only ever find nothing is just noise.
 */
export function startRetrySweepScheduler(
  log: (msg: string, data?: Record<string, any>) => void = () => {},
): () => void {
  if (process.env.RETRY_SWEEP_DISABLED === "1") {
    log("retry sweep scheduler disabled by RETRY_SWEEP_DISABLED=1");
    return () => {};
  }
  if (!retrySweepAvailable()) {
    log("retry sweep scheduler not started — no database configured");
    return () => {};
  }

  const intervalMin = readIntervalMinutes();
  const intervalMs = intervalMin * 60_000;

  const first = setTimeout(() => void tick(log), FIRST_RUN_DELAY_MS);
  const repeating = setInterval(() => void tick(log), intervalMs);
  // Neither timer should keep the process alive on shutdown.
  first.unref?.();
  repeating.unref?.();

  log(`retry sweep scheduler started — every ${intervalMin} min`);

  return () => {
    clearTimeout(first);
    clearInterval(repeating);
  };
}
