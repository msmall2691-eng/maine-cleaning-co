/**
 * Twenty CRM Integration
 *
 * Creates a Person (contact) and a Quote Request in Twenty,
 * linked together, for every form submission.
 *
 * Requires env vars:
 *   TWENTY_API_URL  – e.g. https://21-production-0bd4.up.railway.app
 *   TWENTY_API_KEY  – API key from Twenty settings
 *
 * Twenty REST API base path: /rest/api/
 * Docs: https://docs.twenty.com/developers/extend/api
 */

const TWENTY_API_URL = process.env.TWENTY_API_URL;
const TWENTY_API_KEY = process.env.TWENTY_API_KEY;

/** Base URL for Twenty REST API (strips any trailing slash from env var) */
function restBase(): string {
  const base = (TWENTY_API_URL || "").replace(/\/+$/, "");
  return `${base}/rest/api`;
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

/**
 * Split a full name into first / last.
 */
function splitName(name?: string | null): { firstName: string; lastName: string } {
  if (!name) return { firstName: "", lastName: "" };
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

/**
 * Find an existing person in Twenty by email.
 * Twenty REST API: GET /rest/api/people?filter[emails][primaryEmail][eq]=<email>
 */
async function findPersonByEmail(email: string): Promise<string | null> {
  const url = `${restBase()}/people?filter={"emails":{"primaryEmail":{"eq":"${encodeURIComponent(email)}"}}}`;
  const res = await fetch(url, { method: "GET", headers: twentyHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[twenty] findPersonByEmail failed: ${res.status} ${text.slice(0, 200)}`);
    return null;
  }
  const json = await res.json();
  const records = json?.data?.people ?? json?.data ?? json?.people ?? [];
  if (Array.isArray(records) && records.length > 0) {
    return records[0].id;
  }
  return null;
}

/**
 * Create a Person in Twenty and return their ID.
 * POST /rest/api/people
 */
async function createPerson(body: QuoteRequestBody): Promise<string | null> {
  const { firstName, lastName } = splitName(body.name);

  // Check if person already exists by email
  if (body.email) {
    const existingId = await findPersonByEmail(body.email);
    if (existingId) return existingId;
  }

  const payload = {
    name: {
      firstName,
      lastName,
    },
    emails: {
      primaryEmail: body.email || "",
    },
    phones: {
      primaryPhoneNumber: body.phone || "",
    },
    city: body.address || "",
  };

  const res = await fetch(`${restBase()}/people`, {
    method: "POST",
    headers: twentyHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[twenty] Failed to create person: ${res.status} ${text.slice(0, 300)}`);
    return null;
  }

  const json = await res.json();
  return json?.data?.id ?? json?.data?.createPerson?.id ?? json?.id ?? null;
}

/**
 * Map website form service types to Twenty Select API values.
 *
 * Twenty quoteRequests.serviceType Select options:
 *   STANDARD  → "Standard Clean"
 *   DEEP      → "Deep Clean"
 *   MOVE_IN_OUT → "Move In/Out"
 *   TURNOVER  → "Turnover"
 */
const SERVICE_TYPE_MAP: Record<string, string> = {
  standard: "STANDARD",
  deep: "DEEP",
  "move-in-out": "MOVE_IN_OUT",
  "move-in/out": "MOVE_IN_OUT",
  str: "TURNOVER",
  "vacation-rental": "TURNOVER",
  commercial: "STANDARD", // fallback — no dedicated commercial option
};

/**
 * Map website form frequency values to Twenty Select API values.
 *
 * Twenty quoteRequests.frequency Select options:
 *   WEEKLY    → "Weekly"
 *   BIWEEKLY  → "Biweekly"
 *   MONTHLY   → "Monthly"
 *   ONE_TIME  → "One Time"
 */
const FREQUENCY_MAP: Record<string, string> = {
  weekly: "WEEKLY",
  biweekly: "BIWEEKLY",
  monthly: "MONTHLY",
  "one-time": "ONE_TIME",
  "one time": "ONE_TIME",
};

/**
 * Map source values to Twenty Select API values.
 *
 * Twenty quoteRequests.source Select options:
 *   WEBSITE, PHONE, EMAIL, SMS, REFERRAL, SOCIAL_MEDIA, OTHER
 */
const SOURCE_MAP: Record<string, string> = {
  website: "WEBSITE",
  phone: "PHONE",
  email: "EMAIL",
  sms: "SMS",
  referral: "REFERRAL",
  "social media": "SOCIAL_MEDIA",
  other: "OTHER",
};

/**
 * Map website form pet hair values to Twenty Select API values.
 *
 * Twenty quoteRequests.petHair Select options:
 *   NONE, LIGHT, HEAVY
 */
const PET_HAIR_MAP: Record<string, string> = {
  none: "NONE",
  light: "LIGHT",
  heavy: "HEAVY",
};

/**
 * Map website form condition values to Twenty Select API values.
 *
 * Twenty quoteRequests.condition Select options:
 *   MAINTENANCE, LIGHT, DEEP, TRASHED
 */
const CONDITION_MAP: Record<string, string> = {
  maintenance: "MAINTENANCE",
  light: "LIGHT",
  deep: "DEEP",
  trashed: "TRASHED",
};

/**
 * Create a Quote Request custom object in Twenty, linked to a Person.
 * POST /rest/api/quoteRequests
 *
 * Available fields on quoteRequests:
 *   - name (Text)
 *   - serviceType (Select: STANDARD | DEEP | MOVE_IN_OUT | TURNOVER)
 *   - frequency (Select: WEEKLY | BIWEEKLY | MONTHLY | ONE_TIME)
 *   - estimatedPrice (Currency: { amountMicros, currencyCode })
 *   - requestDate (DateTime)
 *   - desiredStartDate (DateTime)
 *   - notes (Text)
 *   - source (Select: WEBSITE | PHONE | EMAIL | SMS | REFERRAL | SOCIAL_MEDIA | OTHER)
 *   - stage (Select)
 *   - contactId (Relation to Contacts/People)
 *   - address (Address: { addressStreet1, addressCity, addressState, addressPostcode, addressCountry })
 *   - squareFootage (Number)
 *   - bathrooms (Number)
 *   - petHair (Select: NONE | LIGHT | HEAVY)
 *   - condition (Select: MAINTENANCE | LIGHT | DEEP | TRASHED)
 *   - photos (Links: { primaryLinkUrl, primaryLinkLabel })
 */
async function createQuoteRequest(
  personId: string | null,
  body: QuoteRequestBody,
): Promise<string | null> {
  // Build a descriptive name for the quote request
  const displayName = body.name
    ? `${body.name} — ${body.serviceType || "Cleaning"} Request`
    : `New Quote Request`;

  // Notes now only holds free-text notes + overflow info (distance, contact)
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

  // ── New dedicated fields ──

  // Address (Twenty Address composite field)
  if (body.address || body.zip) {
    payload.address = {
      addressStreet1: body.address || "",
      addressPostcode: body.zip || "",
      addressCountry: "US",
    };
  }

  // Square Footage (Number)
  if (body.sqft) {
    payload.squareFootage = body.sqft;
  }

  // Bathrooms (Number)
  if (body.bathrooms) {
    payload.bathrooms = body.bathrooms;
  }

  // Pet Hair (Select: NONE | LIGHT | HEAVY)
  if (body.petHair) {
    payload.petHair = PET_HAIR_MAP[(body.petHair || "").toLowerCase()] || null;
  }

  // Condition (Select: MAINTENANCE | LIGHT | DEEP | TRASHED)
  if (body.condition) {
    payload.condition = CONDITION_MAP[(body.condition || "").toLowerCase()] || null;
  }

  // Photos (Links field — store first photo URL as primary link)
  if (body.photoUrls && body.photoUrls.length > 0) {
    payload.photos = {
      primaryLinkUrl: body.photoUrls[0],
      primaryLinkLabel: "Photo 1",
    };
    // If more than one photo, add extra URLs to notes
    if (body.photoUrls.length > 1) {
      const extraPhotos = body.photoUrls.slice(1).map((url, i) => `Photo ${i + 2}: ${url}`);
      const currentNotes = payload.notes || "";
      payload.notes = [currentNotes, ...extraPhotos].filter(Boolean).join("\n");
    }
  }

  // Estimated Price — Twenty Currency field uses amountMicros (integer in millionths)
  if (body.estimateMin && body.estimateMax) {
    const avgCents = Math.round(((body.estimateMin + body.estimateMax) / 2) * 100);
    payload.estimatedPrice = {
      amountMicros: avgCents * 10000, // cents → micros
      currencyCode: "USD",
    };
  }

  // Desired Start Date
  if (body.requestedDate) {
    payload.desiredStartDate = new Date(body.requestedDate).toISOString();
  }

  // Link to person/contact if we have one
  if (personId) {
    payload.contactId = personId;
  }

  console.log(`[twenty] Creating quote request with payload:`, JSON.stringify(payload).slice(0, 500));

  const res = await fetch(`${restBase()}/quoteRequests`, {
    method: "POST",
    headers: twentyHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[twenty] Failed to create quote request: ${res.status} ${text.slice(0, 500)}`);
    return null;
  }

  const json = await res.json();
  return json?.data?.id ?? json?.id ?? null;
}

/**
 * Main entry point: creates a Person + Quote Request in Twenty.
 * Fire-and-forget — logs errors but never throws.
 */
export async function createQuoteRequestInTwenty(body: QuoteRequestBody): Promise<void> {
  if (!isConfigured()) {
    console.log("[twenty] Skipping sync — TWENTY_API_URL / TWENTY_API_KEY not set");
    return;
  }

  try {
    const personId = await createPerson(body);
    const quoteRequestId = await createQuoteRequest(personId, body);

    console.log(
      `[twenty] Synced: personId=${personId ?? "none"}, quoteRequestId=${quoteRequestId ?? "none"}`,
    );
  } catch (err) {
    console.error("[twenty] Sync failed:", err);
  }
}
