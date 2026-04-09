/**
 * Twenty CRM Integration
 *
 * Creates a Client (Company) and a Quote Request in Twenty,
 * linked together, for every website form submission.
 *
 * Data model (from Twenty Settings > Data model):
 *   - "Clients" = Twenty Companies object (API: /rest/companies)
 *     Fields: name (Text), address (Address), clientType (Select)
 *   - "Quote Requests" = Custom object (API: /rest/quoteRequests)
 *     Fields: name, serviceType, frequency, estimatedPrice, requestDate,
 *             desiredStartDate, notes, source, stage, address, squareFootage,
 *             bathrooms, petHair, condition, photos
 *     Relations: companyId → Client, personId → Contact, propertyId → Property
 *
 * Requires env vars:
 *   TWENTY_API_URL  – e.g. https://21-production-0bd4.up.railway.app
 *   TWENTY_API_KEY  – API key from Twenty settings
 */

const TWENTY_API_URL = process.env.TWENTY_API_URL;
const TWENTY_API_KEY = process.env.TWENTY_API_KEY;

/** Base URL for Twenty REST API */
function restBase(): string {
  const base = (TWENTY_API_URL || "").replace(/\/+$/, "");
  return `${base}/rest`;
}

function twentyHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${TWENTY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

function isConfigured(): boolean {
  return Boolean(TWENTY_API_URL && TWENTY_API_KEY);
}

/**
 * Extract the record ID from a Twenty REST API response.
 * Twenty may return different shapes depending on version:
 *   { data: { id: "..." } }
 *   { data: { createCompanies: [{ id: "..." }] } }
 *   { id: "..." }
 *   or just the record object directly
 */
function extractId(json: any): string | null {
  if (!json) return null;
  // Direct id on root
  if (typeof json.id === "string") return json.id;
  // Nested under data
  if (json.data) {
    if (typeof json.data.id === "string") return json.data.id;
    // data might be an array
    if (Array.isArray(json.data) && json.data[0]?.id) return json.data[0].id;
    // data might contain a nested object with the record
    for (const key of Object.keys(json.data)) {
      const val = json.data[key];
      if (val && typeof val === "object" && typeof val.id === "string") return val.id;
      if (Array.isArray(val) && val[0]?.id) return val[0].id;
    }
  }
  return null;
}

interface QuoteRequestBody {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  zip?: string | null;
  serviceType?: string | null;
  frequency?: string | null;
  sqft?: number | null;
  bathrooms?: number | null;
  petHair?: string | null;
  condition?: string | null;
  estimateMin?: number | null;
  estimateMax?: number | null;
  notes?: string | null;
  requestedDate?: string | null;
  distanceMiles?: number | null;
  source?: string | null;
  photoUrls?: string[] | null;
}

// ---------------------------------------------------------------------------
// Address parsing
// ---------------------------------------------------------------------------

/**
 * Parse a free-text address string into Twenty's Address composite format.
 * Handles formats like:
 *   "155 Spiller Hill Road, Raymond, ME, 04071"
 *   "65 Alice Drive, Limerick, ME 04048"
 */
function parseAddress(
  raw?: string | null,
  zip?: string | null,
): { addressStreet1: string; addressCity: string; addressState: string; addressPostcode: string; addressCountry: string } {
  const result = { addressStreet1: "", addressCity: "", addressState: "", addressPostcode: zip || "", addressCountry: "US" };
  if (!raw) return result;

  const parts = raw.split(",").map((p) => p.trim());
  if (parts.length >= 3) {
    result.addressStreet1 = parts[0];
    result.addressCity = parts[1];
    // Third part might be "ME" or "ME 04071"
    const stateZip = parts[2].split(/\s+/);
    result.addressState = stateZip[0] || "";
    if (stateZip[1] && !result.addressPostcode) result.addressPostcode = stateZip[1];
    // Fourth part might be zip
    if (parts[3] && !result.addressPostcode) result.addressPostcode = parts[3].trim();
  } else if (parts.length === 2) {
    result.addressStreet1 = parts[0];
    result.addressCity = parts[1];
  } else {
    result.addressStreet1 = raw;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Select field mappings
// ---------------------------------------------------------------------------

const SERVICE_TYPE_MAP: Record<string, string> = {
  standard: "STANDARD",
  residential: "STANDARD",
  deep: "DEEP",
  "move-in-out": "MOVE_IN_OUT",
  "move-in/out": "MOVE_IN_OUT",
  str: "TURNOVER",
  "vacation-rental": "TURNOVER",
  commercial: "STANDARD",
};

const FREQUENCY_MAP: Record<string, string> = {
  weekly: "WEEKLY",
  biweekly: "BIWEEKLY",
  monthly: "MONTHLY",
  "one-time": "ONE_TIME",
  "one time": "ONE_TIME",
};

const SOURCE_MAP: Record<string, string> = {
  website: "WEBSITE",
  phone: "PHONE",
  email: "EMAIL",
  sms: "SMS",
  referral: "REFERRAL",
  "social media": "SOCIAL_MEDIA",
  other: "OTHER",
};

const PET_HAIR_MAP: Record<string, string> = {
  none: "NONE",
  light: "LIGHT",
  some: "LIGHT",
  heavy: "HEAVY",
};

const CONDITION_MAP: Record<string, string> = {
  maintenance: "MAINTENANCE",
  light: "LIGHT",
  moderate: "LIGHT",
  deep: "DEEP",
  trashed: "TRASHED",
};

/**
 * Map website service type to Twenty Client Type select values.
 * From the Clients list: Residential, Commercial, Short-Term Rental
 */
const CLIENT_TYPE_MAP: Record<string, string> = {
  standard: "RESIDENTIAL",
  residential: "RESIDENTIAL",
  deep: "RESIDENTIAL",
  "move-in-out": "RESIDENTIAL",
  "move-in/out": "RESIDENTIAL",
  commercial: "COMMERCIAL",
  str: "SHORT_TERM_RENTAL",
  "vacation-rental": "SHORT_TERM_RENTAL",
};

// ---------------------------------------------------------------------------
// Client (Company) operations
// ---------------------------------------------------------------------------

/**
 * Find an existing Client in Twenty by name.
 * GET /rest/companies?filter[name][eq]=<name>
 */
async function findClientByName(name: string): Promise<string | null> {
  const url = `${restBase()}/companies?filter[name][eq]=${encodeURIComponent(name)}`;
  const res = await fetch(url, { method: "GET", headers: twentyHeaders() });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    console.error(`[twenty] findClientByName failed: ${res.status} ${text.slice(0, 200)}`);
    return null;
  }
  const json = JSON.parse(text);
  console.log(`[twenty] findClientByName response keys:`, JSON.stringify(Object.keys(json)).slice(0, 200));
  const records = json?.data?.companies ?? json?.data ?? [];
  if (Array.isArray(records) && records.length > 0) {
    return records[0].id;
  }
  return null;
}

/**
 * Create a Client (Company) in Twenty and return their ID.
 * POST /rest/companies
 *
 * Client fields: name (Text), address (Address), clientType (Select)
 */
async function createClient(body: QuoteRequestBody): Promise<string | null> {
  const clientName = body.name || "Unknown Client";

  // Check if client already exists by name
  const existingId = await findClientByName(clientName);
  if (existingId) {
    console.log(`[twenty] Found existing client: ${existingId} for "${clientName}"`);
    return existingId;
  }

  const address = parseAddress(body.address, body.zip);

  const payload: Record<string, any> = {
    name: clientName,
    address,
  };

  // Set client type based on service type
  const clientType = CLIENT_TYPE_MAP[(body.serviceType || "").toLowerCase()];
  if (clientType) {
    payload.clientType = clientType;
  }

  console.log(`[twenty] Creating client with payload:`, JSON.stringify(payload).slice(0, 400));

  const res = await fetch(`${restBase()}/companies`, {
    method: "POST",
    headers: twentyHeaders(),
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");
  console.log(`[twenty] Create client response: ${res.status} ${text.slice(0, 500)}`);

  if (!res.ok) {
    console.error(`[twenty] Failed to create client: ${res.status}`);
    return null;
  }

  const json = JSON.parse(text);
  const id = extractId(json);
  console.log(`[twenty] Created client: ${id}`);
  return id;
}

// ---------------------------------------------------------------------------
// Contact (Person) operations
// ---------------------------------------------------------------------------

function splitName(name?: string | null): { firstName: string; lastName: string } {
  if (!name) return { firstName: "", lastName: "" };
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

/**
 * Create a Contact (Person) in Twenty linked to a Company, and return their ID.
 * POST /rest/people
 */
async function createContact(body: QuoteRequestBody, companyId: string | null): Promise<string | null> {
  const { firstName, lastName } = splitName(body.name);

  const payload: Record<string, any> = {
    name: { firstName, lastName },
    emails: { primaryEmail: body.email || "" },
    phones: {
      primaryPhoneNumber: body.phone
        ? (body.phone.startsWith("+") ? body.phone : `+1${body.phone.replace(/\D/g, "")}`)
        : "",
    },
    city: body.address || "",
  };

  // Link contact to company/client
  if (companyId) {
    payload.companyId = companyId;
  }

  console.log(`[twenty] Creating contact with payload:`, JSON.stringify(payload).slice(0, 400));

  const res = await fetch(`${restBase()}/people`, {
    method: "POST",
    headers: twentyHeaders(),
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");
  console.log(`[twenty] Create contact response: ${res.status} ${text.slice(0, 500)}`);

  if (!res.ok) {
    console.error(`[twenty] Failed to create contact: ${res.status}`);
    return null;
  }

  const json = JSON.parse(text);
  const id = extractId(json);
  console.log(`[twenty] Created contact: ${id}`);
  return id;
}

// ---------------------------------------------------------------------------
// Quote Request operations
// ---------------------------------------------------------------------------

/**
 * Create a Quote Request in Twenty, linked to a Client (Company).
 * POST /rest/quoteRequests
 */
async function createQuoteRequest(
  companyId: string | null,
  contactId: string | null,
  body: QuoteRequestBody,
): Promise<string | null> {
  const displayName = body.name
    ? `${body.name} — ${body.serviceType || "Cleaning"} Request`
    : `New Quote Request`;

  // Notes for any overflow info
  const notesParts: string[] = [];
  if (body.notes) notesParts.push(body.notes);
  if (body.distanceMiles) notesParts.push(`Distance: ${body.distanceMiles} mi`);
  if (body.email) notesParts.push(`Email: ${body.email}`);
  if (body.phone) notesParts.push(`Phone: ${body.phone}`);

  const payload: Record<string, any> = {
    name: displayName,
    serviceType: SERVICE_TYPE_MAP[(body.serviceType || "").toLowerCase()] || null,
    frequency: FREQUENCY_MAP[(body.frequency || "").toLowerCase()] || null,
    notes: notesParts.join("\n") || null,
    source: SOURCE_MAP[(body.source || "website").toLowerCase()] || "WEBSITE",
    requestDate: new Date().toISOString(),
  };

  // Address — Twenty custom Address field (API name: addressCustom, not address)
  const address = parseAddress(body.address, body.zip);
  if (address.addressStreet1) {
    payload.addressCustom = address;
  }

  // Custom fields
  if (body.sqft) payload.squareFootage = Number(body.sqft);
  if (body.bathrooms) payload.bathrooms = Number(body.bathrooms);

  const petHair = PET_HAIR_MAP[(body.petHair || "").toLowerCase()];
  if (petHair) payload.petHair = petHair;

  const condition = CONDITION_MAP[(body.condition || "").toLowerCase()];
  if (condition) payload.condition = condition;

  // Photos — append URLs to notes if present
  if (body.photoUrls && body.photoUrls.length > 0) {
    const photoLines = body.photoUrls.map((url, i) => `Photo ${i + 1}: ${url}`);
    const currentNotes = payload.notes || "";
    payload.notes = [currentNotes, ...photoLines].filter(Boolean).join("\n");
  }

  // Estimated Price — Twenty Currency field uses amountMicros
  if (body.estimateMin && body.estimateMax) {
    const avgCents = Math.round(((body.estimateMin + body.estimateMax) / 2) * 100);
    payload.estimatedPrice = {
      amountMicros: avgCents * 10000,
      currencyCode: "USD",
    };
  }

  // Desired Start Date
  if (body.requestedDate) {
    payload.desiredStartDate = new Date(body.requestedDate).toISOString();
  }

  // Link to Client (Company)
  if (companyId) {
    payload.companyId = companyId;
  }

  // Link to Contact (Person)
  if (contactId) {
    payload.personId = contactId;
  }

  console.log(`[twenty] Creating quote request with payload:`, JSON.stringify(payload).slice(0, 600));

  const res = await fetch(`${restBase()}/quoteRequests`, {
    method: "POST",
    headers: twentyHeaders(),
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");
  console.log(`[twenty] Create quote request response: ${res.status} ${text.slice(0, 800)}`);

  if (!res.ok) {
    console.error(`[twenty] Failed to create quote request: ${res.status}`);
    return null;
  }

  const json = JSON.parse(text);
  const id = extractId(json);
  console.log(`[twenty] Created quote request: ${id}`);
  return id;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Main entry point: creates a Client + Contact + Quote Request in Twenty.
 * Fire-and-forget — logs errors but never throws.
 * Tracks sync status in database if intakeSubmissionId is provided.
 */
export async function createQuoteRequestInTwenty(body: QuoteRequestBody, intakeSubmissionId?: number): Promise<void> {
  if (!isConfigured()) {
    console.log("[twenty] Skipping sync — TWENTY_API_URL / TWENTY_API_KEY not set");
    return;
  }

  try {
    // 1. Create or find Client (Company)
    const companyId = await createClient(body);

    // 2. Create Contact (Person) linked to the Client
    const contactId = await createContact(body, companyId);

    // 3. Create Quote Request linked to both
    const quoteRequestId = await createQuoteRequest(companyId, contactId, body);

    console.log(
      `[twenty] Synced: companyId=${companyId ?? "none"}, contactId=${contactId ?? "none"}, quoteRequestId=${quoteRequestId ?? "none"}`,
    );

    // Track sync status in database if we have submission ID
    if (intakeSubmissionId) {
      try {
        const { storage } = await import("../storage");
        await storage.updateIntakeSubmissionTwentySyncStatus(
          intakeSubmissionId,
          "synced",
          companyId || undefined,
          contactId || undefined,
          quoteRequestId || undefined
        );
      } catch (err) {
        console.error(`[twenty] Failed to update sync status for submission ${intakeSubmissionId}:`, err);
      }
    }
  } catch (err) {
    console.error("[twenty] Sync failed:", err);

    // Track sync failure in database
    if (intakeSubmissionId) {
      try {
        const { storage } = await import("../storage");
        await storage.updateIntakeSubmissionTwentySyncStatus(
          intakeSubmissionId,
          "failed",
          undefined,
          undefined,
          undefined,
          String(err)
        );
      } catch (dbErr) {
        console.error(`[twenty] Failed to update sync failure status for submission ${intakeSubmissionId}:`, dbErr);
      }
    }
  }
}
