/**
 * Canonical labor-hour pricing engine — the SINGLE source of truth for the
 * estimate the customer sees.
 *
 * Before this module, the exact same formula lived copy-pasted in three
 * places: the browser calculator (client/src/components/ui/InstantEstimate.tsx),
 * the server recompute (server/lib/quoteEngine.ts), and a Python port in
 * Bright-Space (backend/modules/booking/pricing.py). Any edit to one copy that
 * missed the others meant the customer saw one price and the operator quoted
 * another. The two TypeScript copies now both import THIS module, so they can
 * no longer drift from each other.
 *
 * The Python port necessarily remains a separate implementation, but it is
 * pinned to this one by a shared vector file: shared/pricing-vectors.json is
 * generated from `computeEstimate` here and checked into BOTH repos, and each
 * repo has a test asserting its engine reproduces every vector. Change a
 * constant here and the vectors must be regenerated (or maineclean's test
 * fails); regenerating them then fails Bright-Space's test until its Python
 * port is updated to match. Drift is caught at the next test run.
 *
 * ANY change to a constant or formula below MUST be mirrored in
 * backend/modules/booking/pricing.py AND reflected in a regenerated
 * shared/pricing-vectors.json (run: `npm run gen:pricing-vectors`).
 */

export type Frequency = "weekly" | "biweekly" | "monthly" | "one-time";
export type PetHair = "none" | "some" | "heavy";
export type HomeCondition = "maintenance" | "moderate" | "heavy";

/** $ per labor-unit. */
export const RATE = 60;
/** Job-size floor: standard vs deep clean. */
export const MIN_JOB = { standard: 130, deep: 225 } as const;
/** Bathroom units added per bath beyond the first (half-baths supported). */
export const BATH_UNIT = 0.4;
/** ±band applied to the midpoint to form the shown range. */
export const RANGE_BAND = 0.04;

export const CONDITION_UNITS: Record<HomeCondition, number> = {
  maintenance: 0,
  moderate: 0.5,
  heavy: 1.0,
};
export const PET_UNITS: Record<PetHair, number> = {
  none: 0,
  some: 0.3,
  heavy: 0.6,
};
export const FREQUENCY_FACTOR: Record<Frequency, number> = {
  weekly: 0.85,
  biweekly: 1.0,
  monthly: 1.15,
  "one-time": 1.5,
};

/** Piecewise sqft → labor units (three-tier, decreasing marginal rate). */
export function sqftLaborUnits(sf: number): number {
  if (sf <= 1500) return sf / 680;
  if (sf <= 3000) return 1500 / 680 + (sf - 1500) / 1050;
  return 1500 / 680 + 1500 / 1050 + (sf - 3000) / 1400;
}

/** Deep-clean multiplier — scales up with home size. */
export function deepMultiplier(sf: number): number {
  if (sf <= 1200) return 1.6;
  if (sf <= 2000) return 1.65;
  if (sf <= 3000) return 1.75;
  return 1.8;
}

const round5 = (n: number): number => Math.round(n / 5) * 5;

export interface EstimateInputs {
  sqft: number;
  bathrooms: number;
  cleanType: "standard" | "deep";
  frequency?: Frequency;
  condition?: HomeCondition;
  petHair?: PetHair;
}

export interface EstimateResult {
  min: number;
  max: number;
  /** Labor units before the frequency/rate multiply — surfaced for display. */
  labor: number;
  /** Deep multiplier applied (1.0 for standard) — surfaced for display. */
  deepMult: number;
  /** $5-rounded midpoint the range is centered on. */
  mid: number;
}

/**
 * The one true estimate calculation. Assumes valid, in-range inputs — callers
 * (client widget, server recompute) own their own validation and custom-quote
 * short-circuits; this function only does the math so all three engines agree
 * by construction.
 */
export function computeEstimate(inputs: EstimateInputs): EstimateResult {
  const sf = inputs.sqft;
  const deep = inputs.cleanType === "deep";
  const minJob = deep ? MIN_JOB.deep : MIN_JOB.standard;

  const sqftUnits = sqftLaborUnits(sf);
  const bathAdj = Math.max(0, (inputs.bathrooms - 1) * BATH_UNIT);
  const condU = CONDITION_UNITS[inputs.condition ?? "maintenance"] ?? 0;
  const petU = PET_UNITS[inputs.petHair ?? "none"] ?? 0;
  const freqU = FREQUENCY_FACTOR[inputs.frequency ?? "one-time"] ?? 1.0;
  const deepMult = deep ? deepMultiplier(sf) : 1.0;

  const labor = (sqftUnits + bathAdj + condU + petU) * deepMult;
  const raw = labor * freqU * RATE;
  const mid = Math.max(minJob, round5(raw));

  return {
    min: round5(mid * (1 - RANGE_BAND)),
    max: round5(mid * (1 + RANGE_BAND)),
    labor,
    deepMult,
    mid,
  };
}
