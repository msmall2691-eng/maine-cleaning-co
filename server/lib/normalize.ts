import type { IntakeSubmitPayload } from "./validators";
import { normalizePhoneToE164 } from "./phone";

export interface NormalizedIntakePayload {
  name: string | null;
  email: string | null;
  phone: string | null; // E.164 format: +1234567890
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
  estimatePrice: number | null; // cents
  estimateRange: string | null;
  notes: string | null;
  source: string;
  preferredContactMethod: string | null;
}

export function normalizeIntakePayload(raw: IntakeSubmitPayload): NormalizedIntakePayload {
  const email = raw.email?.trim().toLowerCase() || null;
  const name = raw.name?.trim() || null;
  const address = raw.address?.trim() || null;
  const zip = raw.zip?.trim() || null;
  const notes = raw.notes?.trim() || null;
  const phone = normalizePhoneToE164(raw.phone);

  const estimateMin = raw.estimateMin ?? null;
  const estimateMax = raw.estimateMax ?? null;

  // Calculate price in cents (average of min/max)
  let estimatePrice: number | null = null;
  if (estimateMin != null && estimateMax != null) {
    estimatePrice = Math.round(((estimateMin + estimateMax) / 2) * 100);
  } else if (estimateMin != null) {
    estimatePrice = estimateMin * 100;
  } else if (estimateMax != null) {
    estimatePrice = estimateMax * 100;
  }

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
    estimatePrice,
    estimateRange,
    notes,
    source: raw.source ?? "website_form",
    preferredContactMethod: raw.preferredContactMethod ?? null,
  };
}
