/**
 * Lead-forward outbox
 *
 * A tiny per-destination ledger that gives every fire-and-forget forward
 * (BrightBase Ops — the sole lead destination) three things it was missing:
 *
 *   1. persisted delivery status per destination — so a silent failure
 *      shows up in a query instead of only in a log line;
 *   2. bounded exponential-backoff retries — so a transient 502 no
 *      longer drops the lead;
 *   3. an admin lookup path via GET /api/admin/lead-forwards.
 *
 * Not a full outbox worker: writes happen inline on the request thread
 * (still fire-and-forget from the customer's perspective), retries
 * happen in the same tick. Enough to catch the most common failure
 * modes without adding a background queue. If cross-restart durability
 * is wanted later, this schema is ready to be picked up by a poller.
 *
 * The retry loop is inlined (three attempts with exponential backoff)
 * instead of leaning on p-retry, because p-retry v7 is ESM-only and
 * doesn't survive esbuild's ESM→CJS minified bundling cleanly.
 */

import { db } from "../db";
import { leadForwards } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendForwardFailureAlert } from "../email";

export type ForwardSourceType = "booking" | "intake" | "quote";

/**
 * Destinations we still forward to. A VALUE, not just a type, because the
 * retry sweep has to make this decision at runtime against whatever string is
 * in the database — and the DB column is plain text, so it can hold names we
 * retired (the old "crm_intake" / "crm_booking" rows from the connecteam
 * proxy). The type is derived from the array so the two can never drift.
 *
 * Retiring a destination means deleting it from here, and the sweep then
 * stops replaying its rows on its own — see retryFailedForwards.
 */
export const LIVE_DESTINATIONS = ["brightbase", "brightbase-update"] as const;
export type ForwardDestination = (typeof LIVE_DESTINATIONS)[number];

function isLiveDestination(destination: string): destination is ForwardDestination {
  return (LIVE_DESTINATIONS as readonly string[]).includes(destination);
}

export interface ForwardAttemptResult {
  ok: boolean;
  statusCode?: number;
  responseSnippet?: string;
  error?: string;
  /** When true, do not retry (e.g. 4xx client error, misconfigured URL). */
  fatal?: boolean;
}

interface RunForwardOpts {
  sourceType: ForwardSourceType;
  sourceId: number | null;   // null when the source row isn't ours (external webhook)
  destination: ForwardDestination;
  /** One attempt. Return {ok:false} to trigger retry; throw AbortError to stop. */
  attempt: () => Promise<ForwardAttemptResult>;
  /** Number of attempts total including the first. Default 3. */
  retries?: number;
  /** Exact request body + URL — persisted so the retry sweep can re-POST a
   *  failed delivery verbatim. Omit for forwards that aren't retryable. */
  payload?: Record<string, any>;
  targetUrl?: string;
  /** Called once when the forward is delivered (initial run OR a later retry),
   *  with the successful attempt result — used to capture the returned BrightBase id.
   *  Best-effort: throwing here is logged, never surfaced. */
  onSuccess?: (result: ForwardAttemptResult) => Promise<void>;
}

async function createRow(sourceType: ForwardSourceType, sourceId: number | null,
                        destination: ForwardDestination,
                        payload?: Record<string, any>, targetUrl?: string): Promise<number | null> {
  if (!db) return null;
  try {
    const [row] = await db.insert(leadForwards).values({
      sourceType,
      sourceId: sourceId ?? 0,
      destination,
      status: "pending",
      payload: payload ?? null,
      targetUrl: targetUrl ?? null,
    }).returning({ id: leadForwards.id });
    return row?.id ?? null;
  } catch (err) {
    console.error("[leadForward] create row failed", err);
    return null;
  }
}

async function updateRow(id: number | null, patch: Partial<typeof leadForwards.$inferInsert>) {
  if (!db || id == null) return;
  try {
    await db.update(leadForwards).set(patch).where(eq(leadForwards.id, id));
  } catch (err) {
    console.error("[leadForward] update row failed", err);
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Runs a fire-and-forget forward with retries + persisted status.
 * Never throws — errors are logged and recorded. Returns the delivery id
 * (null if the row couldn't be persisted).
 *
 * Retry policy: `retries` total attempts (default 3), exponential backoff
 * starting at 1s, doubling to a cap of 8s. A ForwardAttemptResult with
 * `fatal:true` stops the retry loop immediately — used for HTTP 4xx where
 * a retry won't fix anything.
 */
export async function runForward(opts: RunForwardOpts): Promise<number | null> {
  const { sourceType, sourceId, destination, attempt, retries = 3, payload, targetUrl, onSuccess } = opts;
  const id = await createRow(sourceType, sourceId, destination, payload, targetUrl);
  let attempts = 0;
  let lastResult: ForwardAttemptResult | null = null;
  const maxAttempts = Math.max(1, retries);

  while (attempts < maxAttempts) {
    attempts += 1;
    const result = await attempt();
    lastResult = result;
    if (result.ok) {
      await updateRow(id, {
        status: "delivered",
        attempts,
        lastError: null,
        lastStatusCode: result.statusCode ?? null,
        lastAttemptedAt: new Date(),
        deliveredAt: new Date(),
      });
      console.log(`[leadForward] delivered ${destination} for ${sourceType}#${sourceId} after ${attempts} attempt(s)`);
      if (onSuccess) {
        try { await onSuccess(result); }
        catch (err) { console.error(`[leadForward] onSuccess hook failed for ${destination} ${sourceType}#${sourceId}`, err); }
      }
      return id;
    }

    const errorMsg = result.error || (result.statusCode ? `HTTP ${result.statusCode}` : "unknown error");
    await updateRow(id, {
      attempts,
      lastError: errorMsg,
      lastStatusCode: result.statusCode ?? null,
      lastAttemptedAt: new Date(),
    });

    if (result.fatal || attempts >= maxAttempts) {
      break;
    }
    const backoff = Math.min(8000, 1000 * Math.pow(2, attempts - 1));
    await delay(backoff);
  }

  const msg = lastResult?.error || (lastResult?.statusCode ? `HTTP ${lastResult.statusCode}` : "unknown error");
  await updateRow(id, {
    status: "failed",
    attempts,
    lastError: msg,
    lastStatusCode: lastResult?.statusCode ?? null,
    lastAttemptedAt: new Date(),
  });
  console.error(
    `[leadForward] FAILED ${destination} for ${sourceType}#${sourceId} after ${attempts} attempt(s): ${msg}`,
  );
  // Best-effort admin alert — never blocks and never bubbles up.
  sendForwardFailureAlert({
    destination,
    sourceType,
    sourceId,
    attempts,
    lastStatusCode: lastResult?.statusCode ?? null,
    lastError: msg,
  }).catch(() => {});
  return id;
}

/**
 * Record a skipped forward — e.g. when BRIGHTBASE_API_URL isn't set.
 * Keeps every lead visible in the ledger so admins don't confuse
 * "not configured" with "delivered".
 */
export async function recordSkipped(
  sourceType: ForwardSourceType,
  sourceId: number | null,
  destination: ForwardDestination,
  reason: string,
): Promise<void> {
  const id = await createRow(sourceType, sourceId, destination);
  await updateRow(id, { status: "skipped", lastError: reason });
}

export interface RetrySweepResult {
  scanned: number;
  delivered: number;
  stillFailing: number;
  skipped: number;   // rows with no stored payload (legacy) or a fatal 4xx — not retried
}

/** Called when a retried forward finally lands, so late deliveries still
 *  capture the BrightBase id / any post-delivery side effect. Keyed by destination. */
type RetryDeliveredHook = (row: typeof leadForwards.$inferSelect, result: ForwardAttemptResult) => Promise<void>;

/**
 * Re-send forwards that previously FAILED, using the exact payload + URL
 * persisted on the ledger row. This is the durability layer the inline
 * retries lack: an in-request backoff loop dies with the process, but a
 * failed row sits in the ledger until this sweep (admin button or cron)
 * picks it up. Never throws — returns a summary.
 *
 * Skips rows with no stored payload (written before the column existed) and
 * rows whose last failure was a 4xx (a client error won't fix on retry —
 * BrightBase rejected the body, so re-sending it is pointless). Only the most
 * recent failed attempt per (source, destination) is retried, so a row that
 * already succeeded on a later attempt isn't re-sent.
 *
 * Rows for a retired destination are marked skipped instead of retried, so
 * the ledger cleans itself up rather than replaying dead URLs forever.
 */
export async function retryFailedForwards(
  opts: { limit?: number; onDelivered?: RetryDeliveredHook } = {},
): Promise<RetrySweepResult> {
  const summary: RetrySweepResult = { scanned: 0, delivered: 0, stillFailing: 0, skipped: 0 };
  if (!db) return summary;
  const limit = Math.min(500, Math.max(1, opts.limit ?? 100));

  let rows: Array<typeof leadForwards.$inferSelect>;
  try {
    rows = await db.select().from(leadForwards)
      .where(eq(leadForwards.status, "failed"))
      .limit(limit);
  } catch (err) {
    console.error("[leadForward] retry sweep query failed", err);
    return summary;
  }

  // Collapse to the latest failed row per (sourceType, sourceId, destination)
  // so we don't re-send the same lead multiple times when it failed in more
  // than one batch.
  const latest = new Map<string, typeof leadForwards.$inferSelect>();
  for (const r of rows) {
    const key = `${r.sourceType}|${r.sourceId}|${r.destination}`;
    const ex = latest.get(key);
    if (!ex || (r.id ?? 0) > (ex.id ?? 0)) latest.set(key, r);
  }

  for (const row of Array.from(latest.values())) {
    summary.scanned += 1;

    // A destination we no longer forward to. The sweep replays whatever
    // targetUrl the row stored, so a leftover "crm_intake" / "crm_booking"
    // row would be POSTed to the retired connecteam proxy on every sweep,
    // forever — it can never succeed, so it sat in `failed` inflating
    // stillFailing and burning a request each time.
    //
    // Mark it skipped rather than leaving it: that's the same one-off UPDATE
    // someone would otherwise run by hand, applied lazily and exactly once
    // per row. Costs no network call, so a sweep full of these is cheap, and
    // they drain permanently instead of crowding out real failures.
    if (!isLiveDestination(row.destination)) {
      await updateRow(row.id, {
        status: "skipped",
        lastError: `destination "${row.destination}" is retired — not retried`,
        lastAttemptedAt: new Date(),
      });
      summary.skipped += 1;
      console.log(
        `[leadForward] retired destination ${row.destination} for ${row.sourceType}#${row.sourceId} — marked skipped, will not retry`,
      );
      continue;
    }

    // Not retryable: no body to replay, or a 4xx the peer already rejected.
    if (!row.payload || !row.targetUrl || (row.lastStatusCode != null && row.lastStatusCode >= 400 && row.lastStatusCode < 500)) {
      summary.skipped += 1;
      continue;
    }
    const result = await postJson(row.targetUrl, row.payload);
    const attempts = (row.attempts ?? 0) + 1;
    if (result.ok) {
      await updateRow(row.id, {
        status: "delivered", attempts, lastError: null,
        lastStatusCode: result.statusCode ?? null, lastAttemptedAt: new Date(), deliveredAt: new Date(),
      });
      summary.delivered += 1;
      console.log(`[leadForward] retry delivered ${row.destination} for ${row.sourceType}#${row.sourceId}`);
      if (opts.onDelivered) {
        try { await opts.onDelivered(row, result); }
        catch (err) { console.error(`[leadForward] retry onDelivered hook failed for row ${row.id}`, err); }
      }
    } else {
      await updateRow(row.id, {
        attempts, lastError: result.error || `HTTP ${result.statusCode}`,
        lastStatusCode: result.statusCode ?? null, lastAttemptedAt: new Date(),
      });
      summary.stillFailing += 1;
    }
  }
  return summary;
}

/** One POST attempt with the same 15s timeout + fatal-4xx semantics the
 *  forwards use, factored so the retry sweep and future callers share it. */
export async function postJson(url: string, payload: Record<string, any>): Promise<ForwardAttemptResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      const fatal = res.status >= 400 && res.status < 500;
      return { ok: false, statusCode: res.status, responseSnippet: text.slice(0, 300), error: `HTTP ${res.status}: ${text.slice(0, 200)}`, fatal };
    }
    return { ok: true, statusCode: res.status, responseSnippet: text.slice(0, 300) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
