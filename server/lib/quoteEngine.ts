/**
 * Server-side quote engine.
 *
 * Mirror of the client-side estimator in
 * client/src/components/ui/InstantEstimate.tsx (search for `const engine =`).
 * Kept in sync manually — if you touch RATE, minJob, sqftUnits, bathAdj,
 * condUnits, petUnits, deepMult, or freqMap in one file, update the other
 * in the same commit or the price the operator sees will differ from the
 * price shown to the customer.
 *
 * Why a server-side copy exists at all: /api/booking/submit used to trust
 * whatever `estimateMin`/`estimateMax` the browser POSTed, so a tampered
 * client could book at $0. This module recomputes the price server-side
 * and the booking handler uses THIS result as the source of truth. The
 * client's number is kept only for a divergence log so we notice drift.
 */

export type ServiceType =
  | "standard"
  | "deep"
  | "vacation-rental"
  | "str"
  | "commercial"
  | "move-in-out";

export type Frequency = "weekly" | "biweekly" | "monthly" | "one-time";
export type PetHair = "none" | "some" | "heavy";
export type HomeCondition = "maintenance" | "moderate" | "heavy";

export interface QuoteInputs {
  serviceType: ServiceType | string;
  sqft?: number | null;
  bathrooms?: number | null;
  frequency?: Frequency | string | null;
  petHair?: PetHair | string | null;
  condition?: HomeCondition | string | null;
}

export interface QuoteResult {
  estimateMin: number | null;
  estimateMax: number | null;
  /** "custom" = STR / commercial / move-in-out — no auto estimate; operator quotes. */
  confidence: "custom" | "low" | "medium" | "high";
  breakdown: Record<string, number>;
}

const RATE = 60;

const isCustomService = (s: string): boolean =>
  s === "vacation-rental" || s === "str" || s === "commercial" || s === "move-in-out";

const isDeep = (s: string): boolean => s === "deep";

function sqftLaborUnits(sf: number): number {
  if (sf <= 1500) return sf / 680;
  if (sf <= 3000) return 1500 / 680 + (sf - 1500) / 1050;
  return 1500 / 680 + 1500 / 1050 + (sf - 3000) / 1400;
}

function deepMultiplier(sf: number): number {
  if (sf <= 1200) return 1.60;
  if (sf <= 2000) return 1.65;
  if (sf <= 3000) return 1.75;
  return 1.80;
}

/**
 * Compute the estimate range. Returns nulls when the inputs are incomplete
 * or the service type is quoted manually — the caller falls back to a
 * "we'll call you" flow, never to the client's number.
 */
export function calculateQuote(inputs: QuoteInputs): QuoteResult {
  const service = String(inputs.serviceType || "").toLowerCase();

  if (isCustomService(service)) {
    return {
      estimateMin: null,
      estimateMax: null,
      confidence: "custom",
      breakdown: { customQuote: 1 },
    };
  }

  const sqft = Number(inputs.sqft);
  const bathrooms = Number(inputs.bathrooms);
  if (!sqft || sqft <= 0 || !Number.isFinite(sqft)
      || !Number.isFinite(bathrooms) || bathrooms < 0) {
    return { estimateMin: null, estimateMax: null, confidence: "low", breakdown: {} };
  }

  const deep = isDeep(service);
  const minJob = deep ? 225 : 130;

  const condUnits: Record<HomeCondition, number> = { maintenance: 0, moderate: 0.50, heavy: 1.00 };
  const petUnits: Record<PetHair, number>        = { none: 0, some: 0.30, heavy: 0.60 };
  const freqMap: Record<Frequency, number>       = { weekly: 0.85, biweekly: 1.0, monthly: 1.15, "one-time": 1.50 };

  const cond = (String(inputs.condition || "maintenance") as HomeCondition);
  const pet  = (String(inputs.petHair || "none") as PetHair);
  const freq = (String(inputs.frequency || "one-time") as Frequency);
  const condU = condUnits[cond] ?? 0;
  const petU  = petUnits[pet]   ?? 0;
  const freqU = freqMap[freq]   ?? 1.0;

  const sqftUnits = sqftLaborUnits(sqft);
  const bathAdj = Math.max(0, (bathrooms - 1) * 0.40);
  const deepMult = deep ? deepMultiplier(sqft) : 1.0;

  const labor = (sqftUnits + bathAdj + condU + petU) * deepMult;
  const raw = labor * freqU * RATE;
  const rounded = Math.round(raw / 5) * 5;
  const final = Math.max(minJob, rounded);

  return {
    estimateMin: Math.round((final * 0.96) / 5) * 5,
    estimateMax: Math.round((final * 1.04) / 5) * 5,
    confidence: "high",
    breakdown: {
      sqftUnits: Math.round(sqftUnits * 100) / 100,
      bathAdj: Math.round(bathAdj * 100) / 100,
      condUnits: condU,
      petUnits: petU,
      freqMultiplier: freqU,
      deepMultiplier: deepMult,
      finalBeforeRange: final,
    },
  };
}

/**
 * True when the client-supplied range disagrees with the server-computed
 * range by more than tolerance (default 10%). Used to log tamper attempts
 * without falsely alarming on rounding drift.
 */
export function estimatesDiverge(
  clientMin: number | null | undefined,
  clientMax: number | null | undefined,
  serverMin: number | null,
  serverMax: number | null,
  toleranceRatio = 0.10,
): boolean {
  if (clientMin == null || clientMax == null || serverMin == null || serverMax == null) return false;
  const clientMid = (clientMin + clientMax) / 2;
  const serverMid = (serverMin + serverMax) / 2;
  if (!Number.isFinite(clientMid) || !Number.isFinite(serverMid) || serverMid === 0) return false;
  return Math.abs(clientMid - serverMid) / serverMid > toleranceRatio;
}
