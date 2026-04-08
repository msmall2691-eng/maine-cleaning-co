/**
 * Twenty CRM Integration
 *
 * Creates a Person (contact) and a Quote Request in Twenty,
 * linked together, for every form submission.
 *
 * Requires env vars:
 *   TWENTY_API_URL  – e.g. https://21-production-0bd4.up.railway.app
 *   TWENTY_API_KEY  – API key from Twenty settings
 */

const TWENTY_API_URL = process.env.TWENTY_API_URL;
const TWENTY_API_KEY = process.env.TWENTY_API_KEY;

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
 */
async function findPersonByEmail(email: string): Promise<string | null> {
  const url = `${TWENTY_API_URL}/api/objects/people?filter={"emails":{"primaryEmail":{"eq":"${email}"}}}`;
  const res = await fetch(url, { method: "GET", headers: twentyHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  const records = json?.data?.people ?? json?.data ?? [];
  if (Array.isArray(records) && records.length > 0) {
    return records[0].id;
  }
  return null;
}

/**
 * Create a Person in Twenty and return their ID.
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

  const res = await fetch(`${TWENTY_API_URL}/api/objects/people`, {
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
  return json?.data?.id ?? json?.data?.people?.[0]?.id ?? null;
}

/**
 * Create a Quote Request custom object in Twenty, linked to a Person.
 */
async function createQuoteRequest(
  personId: string | null,
  body: QuoteRequestBody,
): Promise<string | null> {
  const freqMap: Record<string, string> = {
    weekly: "Weekly",
    biweekly: "Biweekly",
    monthly: "Monthly",
    "one-time": "One-Time",
  };

  const serviceMap: Record<string, string> = {
    standard: "Standard Clean",
    deep: "Deep Clean",
    str: "Vacation Rental",
    "vacation-rental": "Vacation Rental",
    commercial: "Commercial",
    "move-in-out": "Move In/Out",
  };

  const payload: Record<string, any> = {
    serviceType: serviceMap[body.serviceType || ""] || body.serviceType || "",
    frequency: freqMap[body.frequency || ""] || body.frequency || "",
    estimatedPrice:
      body.estimateMin && body.estimateMax
        ? `$${body.estimateMin}–$${body.estimateMax}`
        : null,
    address: body.address || "",
    squareFeet: body.sqft ?? null,
    bathrooms: body.bathrooms ?? null,
    petHair: body.petHair || null,
    condition: body.condition || null,
    notes: body.notes || null,
    source: body.source || "Website",
  };

  if (body.requestedDate) {
    payload.requestedDate = body.requestedDate;
  }

  if (personId) {
    payload.personId = personId;
  }

  const res = await fetch(`${TWENTY_API_URL}/api/objects/quoteRequests`, {
    method: "POST",
    headers: twentyHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[twenty] Failed to create quote request: ${res.status} ${text.slice(0, 300)}`);
    return null;
  }

  const json = await res.json();
  return json?.data?.id ?? null;
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
