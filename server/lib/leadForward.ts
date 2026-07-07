/**
 * Lead-forward outbox
 *
 * A tiny per-destination ledger that gives every fire-and-forget forward
 * (BrightBase Ops + the legacy CRM webhook) three things it was missing:
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
export type ForwardDestination = "brightbase" | "crm_intake" | "crm_booking";

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
}

async function createRow(sourceType: ForwardSourceType, sourceId: number | null,
                        destination: ForwardDestination): Promise<number | null> {
  if (!db) return null;
  try {
    const [row] = await db.insert(leadForwards).values({
      sourceType,
      sourceId: sourceId ?? 0,
      destination,
      status: "pending",
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
  const { sourceType, sourceId, destination, attempt, retries = 3 } = opts;
  const id = await createRow(sourceType, sourceId, destination);
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
