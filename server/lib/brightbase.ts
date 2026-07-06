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
 * Fire-and-forget — logs errors, never throws, never blocks the
 * customer-facing response.
 *
 * Required env var:
 *   BRIGHTBASE_API_URL — e.g. https://brightbase-production.up.railway.app
 *
 * To disable temporarily, unset BRIGHTBASE_API_URL — the function logs
 * "Skipping forward" and returns immediately.
 */

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
  // Bright-Space's BookingSubmit accepts extras (extra="allow"), so these
  // ride through and land in LeadIntake.custom_fields.
  entryMethod?: string | null;
  parkingNotes?: string | null;
  petsDetail?: string | null;
  focusAreas?: string[] | null;
  specialInstructions?: string | null;
}

function isConfigured(): boolean {
  return Boolean(BRIGHTBASE_API_URL);
}

/**
 * Fire-and-forget lead forward to BrightBase.
 *
 * Maps the website's intake/booking payload to BrightBase's
 * /api/booking/submit BookingSubmit schema. Field renames:
 *   sqft       → squareFeet
 *   (zip / frequency / petHair / condition / estimateMin / estimateMax)
 *   are passed through as extras — BrightBase accepts them via
 *   `class Config: extra = "allow"` even though they aren't stored
 *   on the LeadIntake row.
 *
 * If requestedDate is missing (intake form may not collect it),
 * defaults to today's ISO string. BrightBase requires the field.
 */
export async function forwardLeadToBrightBase(body: BrightBaseLead): Promise<void> {
  if (!isConfigured()) {
    console.log("[brightbase] Skipping forward — BRIGHTBASE_API_URL not set");
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

  // Optional / extra fields — only include if we have a value, to keep
  // the payload tidy in logs.
  if (body.bathrooms != null) payload.bathrooms = Number(body.bathrooms);
  if (body.bedrooms != null) payload.bedrooms = Number(body.bedrooms);
  if (body.sqft != null) payload.squareFeet = Number(body.sqft);
  if (body.notes) payload.notes = body.notes;
  if (body.zip) payload.zip = body.zip;
  if (body.frequency) payload.frequency = body.frequency;
  if (body.petHair) payload.petHair = body.petHair;
  if (body.condition) payload.condition = body.condition;
  if (body.estimateMin != null) payload.estimateMin = body.estimateMin;
  if (body.estimateMax != null) payload.estimateMax = body.estimateMax;
  // /book essentials — forwarded as-is; Bright-Space's BookingSubmit
  // accepts extras via extra="allow" and its intake normalizer will
  // stash any un-columned fields into LeadIntake.custom_fields.
  if (body.entryMethod) payload.entryMethod = body.entryMethod;
  if (body.parkingNotes) payload.parkingNotes = body.parkingNotes;
  if (body.petsDetail) payload.petsDetail = body.petsDetail;
  if (body.focusAreas && body.focusAreas.length) payload.focusAreas = body.focusAreas;
  if (body.specialInstructions) payload.specialInstructions = body.specialInstructions;
  payload.source = body.source || "Website";

  const base = (BRIGHTBASE_API_URL || "").replace(/\/+$/, "");
  const url = `${base}/api/booking/submit`;
  console.log(`[brightbase] Forwarding lead to ${url}`, JSON.stringify(payload).slice(0, 400));

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(`[brightbase] Forward failed: ${res.status} ${text.slice(0, 300)}`);
      return;
    }
    console.log(`[brightbase] Forward succeeded: ${res.status} ${text.slice(0, 300)}`);
  } catch (err) {
    console.error("[brightbase] Forward failed:", err);
  }
}
