import type { IntakeSubmitPayload } from "./validators";

export interface NormalizedIntakePayload {
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  zip: string | null;
  serviceType: string | null;
  frequency: string | null;
  sqft: number | null;
  bathrooms: number | null;
  petHair: string | null;
  condition: string | null;
  estimateMin: number | null;
  estimateMax: number | null;
  estimateRange: string | null;
  notes: string | null;
  source: string;
}

export function normalizeIntakePayload(raw: IntakeSubmitPayload): NormalizedIntakePayload {
  const phone = raw.phone
    ? raw.phone.replace(/[^\d+\-().x\s]/g, "").trim() || null
    : null;

  const email = raw.email?.trim().toLowerCase() || null;
  const name = raw.name?.trim() || null;
  const address = raw.address?.trim() || null;
  const zip = raw.zip?.trim() || null;
  const notes = raw.notes?.trim() || null;

  const estimateMin = raw.estimateMin ?? null;
  const estimateMax = raw.estimateMax ?? null;
  const estimateRange =
    estimateMin != null && estimateMax != null
      ? `$${estimateMin}–$${estimateMax}`
      : null;

  return {
    name,
    email,
    phone,
    address,
    zip,
    serviceType: raw.serviceType ?? null,
    frequency: raw.frequency ?? null,
    sqft: raw.sqft ?? null,
    bathrooms: raw.bathrooms ?? null,
    petHair: raw.petHair ?? null,
    condition: raw.condition ?? null,
    estimateMin,
    estimateMax,
    estimateRange,
    notes,
    source: raw.source ?? "website_form",
  };
}
