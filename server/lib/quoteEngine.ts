import type { NormalizedIntakePayload } from "./normalize";

export interface QuoteResult {
  estimateMin: number | null;
  estimateMax: number | null;
  confidence: "low" | "medium" | "high";
  breakdown: Record<string, number>;
}

export async function calculateQuote(
  normalized: NormalizedIntakePayload
): Promise<QuoteResult> {
  // TODO: Move quote engine logic here from the frontend
  // The frontend (InstantEstimate.tsx) calculates the estimate client-side.
  // This stub allows a future server-side recalculation / audit of the estimate.
  //
  // When implementing:
  // - Accept sqft, serviceType, frequency, bathrooms, petHair, condition
  // - Apply the same multiplier logic as the frontend engine
  // - Return min/max range with a confidence level
  // - Log the breakdown for transparency

  if (normalized.estimateMin != null && normalized.estimateMax != null) {
    return {
      estimateMin: normalized.estimateMin,
      estimateMax: normalized.estimateMax,
      confidence: "medium",
      breakdown: {
        clientProvided: normalized.estimateMin,
      },
    };
  }

  return {
    estimateMin: null,
    estimateMax: null,
    confidence: "low",
    breakdown: {},
  };
}
