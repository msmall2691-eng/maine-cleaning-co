/**
 * BrightBase Lead Forward
 *
 * Posts website leads to BrightBase's /api/booking/submit endpoint.
 * BrightBase is The Maine Cleaning Co.'s operations system — the
 * schedule, job assignment, invoicing, and CRM the operator uses
 * every day. We forward every website lead so it lands in the
 * Requests page in BrightBase automatically.
 *
 * /api/booking/submit is on BrightBase's public-path allowlist (see
 * backend/auth.py), so no API key or JWT is needed for this call.
 *
 * Reliability: the actual HTTP call is wrapped by runForward
 * (server/lib/leadForward.ts) — retries with backoff on 5xx / network
 * errors, records per-attempt outcome in the lead_forwards ledger,
 * exits without retry on 4xx. Still returns void to the caller so the
 * request thread doesn't wait on it.
 *
 * Required env var:
 *   BRIGHTBASE_API_URL — e.g. https://brightbase-production.up.railway.app
 *
 * To disable temporarily, unset BRIGHTBASE_API_URL — the forward is
 * marked "skipped" in the ledger and returns immediately.
 */

import { runForward, recordSkipped, type ForwardSourceType } from "./leadForward";

const BRIGHTBASE_API_URL = process.env.BRIGHTBASE_API_URL;

interface BrightBaseLead {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  zip?: string | null;
  serviceType?: string | null;
  frequency?: string | null;
  sqft?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  petHair?: string | null;
  condition?: string | null;
  estimateMin?: number | null;
  estimateMax?: number | null;
  notes?: string | null;
  requestedDate?: string | Date | null;
  source?: string | null;
  // /book flow "essentials" — the six fields cleaners need on-site.
  // BrightBase's BookingSubmit has native columns for these five.
  entryMethod?: string | null;
  parkingNotes?: string | null;
  petsDetail?: string | null;
  focusAreas?: string[] | null;
  specialInstructions?: string | null;
  // Per-submission UUID for Bright-Space's dedup short-circuit (see
  // Bright-Space PR #507). Same key on retries, dual-forwards, or a
  // double-click collapses to ONE Lead row instead of racing the 5-minute
  // recency SELECT.
  idempotencyKey?: string | null;
}

interface ForwardContext {
  sourceType: ForwardSourceType;
  sourceId: number | null;
}

function isConfigured(): boolean {
  return Boolean(BRIGHTBASE_API_URL);
}

/**
 * Fire-and-forget lead forward to BrightBase with retry + delivery
 * ledger. Maps the website's intake/booking payload to BrightBase's
 * /api/booking/submit BookingSubmit schema. Field renames:
 *   sqft       → squareFeet
 * Other optional fields (bedrooms, notes, frequency, petHair, condition,
 * estimateMin/Max, and the five /book essentials) are all first-class
 * columns on BrightBase's BookingSubmit schema now that it's set to
 * extra="ignore" — no reliance on schema laxity.
 *
 * If requestedDate is missing (intake form may not collect it),
 * defaults to today's ISO string. BrightBase requires the field.
 *
 * ctx describes the source row so a failure lands in lead_forwards
 * with enough info for the admin to look it up.
 */
export async function forwardLeadToBrightBase(
  body: BrightBaseLead,
  ctx: ForwardContext,
): Promise<void> {
  if (!isConfigured()) {
    console.log("[brightbase] Skipping forward — BRIGHTBASE_API_URL not set");
    await recordSkipped(ctx.sourceType, ctx.sourceId, "brightbase", "BRIGHTBASE_API_URL not set");
    return;
  }

  const requestedDate =
    body.requestedDate instanceof Date
      ? body.requestedDate.toISOString()
      : (body.requestedDate || new Date().toISOString());

  const payload: Record<string, any> = {
    name: body.name || "Unknown",
    email: body.email || "",
    phone: body.phone || "",
    address: body.address || "",
    serviceType: body.serviceType || "residential",
    requestedDate,
  };

  if (body.bathrooms != null) payload.bathrooms = Number(body.bathrooms);
  if (body.bedrooms != null) payload.bedrooms = Number(body.bedrooms);
  if (body.sqft != null) payload.squareFeet = Number(body.sqft);
  if (body.notes) payload.notes = body.notes;
  if (body.frequency) payload.frequency = body.frequency;
  if (body.petHair) payload.petHair = body.petHair;
  if (body.condition) payload.condition = body.condition;
  if (body.estimateMin != null) payload.estimateMin = body.estimateMin;
  if (body.estimateMax != null) payload.estimateMax = body.estimateMax;
  if (body.entryMethod) payload.entryMethod = body.entryMethod;
  if (body.parkingNotes) payload.parkingNotes = body.parkingNotes;
  if (body.petsDetail) payload.petsDetail = body.petsDetail;
  if (body.focusAreas && body.focusAreas.length) payload.focusAreas = body.focusAreas;
  if (body.specialInstructions) payload.specialInstructions = body.specialInstructions;
  if (body.idempotencyKey) payload.idempotencyKey = body.idempotencyKey;
  payload.source = body.source || "Website";

  const base = (BRIGHTBASE_API_URL || "").replace(/\/+$/, "");
  const url = `${base}/api/booking/submit`;
  console.log(`[brightbase] Forwarding lead to ${url}`, JSON.stringify(payload).slice(0, 400));

  await runForward({
    sourceType: ctx.sourceType,
    sourceId: ctx.sourceId,
    destination: "brightbase",
    attempt: async () => {
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
          // 4xx = fatal (won't fix by retrying), 5xx = retryable.
          const fatal = res.status >= 400 && res.status < 500;
          return {
            ok: false,
            statusCode: res.status,
            responseSnippet: text.slice(0, 300),
            error: `HTTP ${res.status}: ${text.slice(0, 200)}`,
            fatal,
          };
        }
        return { ok: true, statusCode: res.status, responseSnippet: text.slice(0, 300) };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}
