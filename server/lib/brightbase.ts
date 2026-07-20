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

import { runForward, recordSkipped, type ForwardSourceType, type ForwardAttemptResult } from "./leadForward";

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
  // STR / vacation-rental turnover details. guests rides the native column;
  // listingUrl/turnoverDay/petsAllowed land in Bright-Space's custom_fields.
  guests?: number | null;
  listingUrl?: string | null;
  turnoverDay?: string | null;
  petsAllowed?: string | null;
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
 * If requestedDate is missing (intake form may not collect it), it's
 * OMITTED — BrightBase's BookingSubmit treats it as optional. We used to
 * default it to "today", which made every contact-form question show up
 * on the Requests page as a job dated today.
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
      : (body.requestedDate || null);

  const payload: Record<string, any> = {
    name: body.name || "Unknown",
    email: body.email || "",
    phone: body.phone || "",
    address: body.address || "",
    // Last-resort label only — BrightBase wants some serviceType string;
    // general inquiries keep their real nature via the notes prefix the
    // intake handler adds for contact_form submissions.
    serviceType: body.serviceType || "residential",
  };
  if (requestedDate) payload.requestedDate = requestedDate;

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
  if (body.guests != null) payload.guests = Number(body.guests);
  if (body.listingUrl) payload.listingUrl = body.listingUrl;
  if (body.turnoverDay) payload.turnoverDay = body.turnoverDay;
  if (body.petsAllowed) payload.petsAllowed = body.petsAllowed;
  if (body.idempotencyKey) payload.idempotencyKey = body.idempotencyKey;
  payload.source = body.source || "Website";

  const base = (BRIGHTBASE_API_URL || "").replace(/\/+$/, "");
  const url = `${base}/api/booking/submit`;
  // Log a PII-safe summary — never the customer's name/email/phone/address.
  // Enough to trace a forward without spilling contact details into logs.
  const logSafe = {
    serviceType: payload.serviceType,
    frequency: payload.frequency,
    squareFeet: payload.squareFeet,
    bedrooms: payload.bedrooms,
    bathrooms: payload.bathrooms,
    estimateMin: payload.estimateMin,
    estimateMax: payload.estimateMax,
    source: payload.source,
    hasEmail: Boolean(payload.email),
    hasPhone: Boolean(payload.phone),
    hasAddress: Boolean(payload.address),
  };
  console.log(`[brightbase] Forwarding lead to ${url}`, JSON.stringify(logSafe));

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
    // Persist the exact body + URL so the retry sweep can re-send this verbatim
    // if it fails now and the process dies before the inline retries finish.
    payload,
    targetUrl: url,
    onSuccess: (result) => captureBrightbaseId(ctx, result),
  });
}

/**
 * When BrightBase accepts a booking forward it returns its created lead id as
 * `bookingId`. Store it on our booking row (crmBookingId) so the two systems
 * are linked both directions — we can jump from our record to theirs, and a
 * delivered forward is provably delivered (not just "no error"). Best-effort:
 * a parse/store failure never affects the forward result.
 */
async function captureBrightbaseId(ctx: ForwardContext, result: ForwardAttemptResult): Promise<void> {
  if (ctx.sourceType !== "booking" || !ctx.sourceId || !result.responseSnippet) return;
  let bookingId: unknown;
  try {
    bookingId = JSON.parse(result.responseSnippet)?.bookingId;
  } catch {
    return; // response wasn't JSON (or was truncated) — nothing to capture
  }
  if (bookingId == null) return;
  const { storage } = await import("../storage");
  await storage.updateBookingRequestExternalIds(ctx.sourceId, { crmBookingId: String(bookingId) });
}

// Change-set for a customer's manage-page edit. idempotencyKey addresses the
// original Lead in BrightBase (the same key the submit forwards carried);
// cancel:true marks the whole booking cancelled.
export interface BrightBaseBookingUpdate {
  idempotencyKey: string;
  requestedDate?: string | null;
  specialInstructions?: string | null;
  entryMethod?: string | null;
  parkingNotes?: string | null;
  petsDetail?: string | null;
  focusAreas?: string[] | null;
  bedrooms?: number | null;
  cancel?: boolean;
}

/**
 * Fire-and-forget forward of a customer self-service edit/cancel to
 * BrightBase's POST /api/booking/update. Same retry + ledger treatment as
 * the submit forward, under its own destination ("brightbase-update") so
 * the admin ledger distinguishes "the lead never arrived" from "the lead
 * arrived but a later edit didn't".
 */
export async function forwardBookingUpdateToBrightBase(
  update: BrightBaseBookingUpdate,
  ctx: ForwardContext,
): Promise<void> {
  if (!isConfigured()) {
    console.log("[brightbase] Skipping update forward — BRIGHTBASE_API_URL not set");
    await recordSkipped(ctx.sourceType, ctx.sourceId, "brightbase-update", "BRIGHTBASE_API_URL not set");
    return;
  }

  const payload: Record<string, any> = { idempotencyKey: update.idempotencyKey };
  if (update.requestedDate != null) payload.requestedDate = update.requestedDate;
  if (update.specialInstructions != null) payload.specialInstructions = update.specialInstructions;
  if (update.entryMethod != null) payload.entryMethod = update.entryMethod;
  if (update.parkingNotes != null) payload.parkingNotes = update.parkingNotes;
  if (update.petsDetail != null) payload.petsDetail = update.petsDetail;
  if (update.focusAreas != null) payload.focusAreas = update.focusAreas;
  if (update.bedrooms != null) payload.bedrooms = update.bedrooms;
  if (update.cancel) payload.cancel = true;

  const base = (BRIGHTBASE_API_URL || "").replace(/\/+$/, "");
  const url = `${base}/api/booking/update`;
  // PII-safe: the change-set carries no name/email/phone/address anyway,
  // but log only the field NAMES being changed, not their values.
  console.log(`[brightbase] Forwarding booking update to ${url}`, JSON.stringify({
    fields: Object.keys(payload).filter((k) => k !== "idempotencyKey"),
    cancel: Boolean(update.cancel),
  }));

  await runForward({
    sourceType: ctx.sourceType,
    sourceId: ctx.sourceId,
    destination: "brightbase-update",
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
