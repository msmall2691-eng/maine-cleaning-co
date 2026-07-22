/**
 * Server-side quote engine.
 *
 * The pricing MATH is no longer duplicated here — it lives in @shared/pricing
 * (computeEstimate), which the browser calculator imports too, so the customer-
 * facing number and this recompute are literally the same code and cannot drift.
 * This module adds the server-only concerns on top: service-type routing,
 * input validation, confidence, and the breakdown shape.
 *
 * Why a server-side recompute exists at all: /api/booking/submit used to trust
 * whatever `estimateMin`/`estimateMax` the browser POSTed, so a tampered
 * client could book at $0. This module recomputes the price server-side
 * and the booking handler uses THIS result as the source of truth. The
 * client's number is kept only for a divergence log so we notice drift.
 */

import {
  computeEstimate,
  sqftLaborUnits,
  CONDITION_UNITS,
  PET_UNITS,
  FREQUENCY_FACTOR,
  BATH_UNIT,
} from "@shared/pricing";

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

const isCustomService = (s: string): boolean =>
  s === "vacation-rental" || s === "str" || s === "commercial" || s === "move-in-out";

const isDeep = (s: string): boolean => s === "deep";

/**
 * Compute the estimate range. Returns nulls when the inputs are incomplete
 * or the service type is quoted manually — the caller falls back to a
 * "we'll call you" flow, never to the client's number.
 *
 * The math itself lives in @shared/pricing (computeEstimate), which the
 * browser calculator imports too — so the number the customer sees and the
 * number this recompute produces are the same code, not two copies that can
 * drift. This function only adds the server-side concerns: service-type
 * routing, input validation, confidence, and the breakdown shape.
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
  const cond = (String(inputs.condition || "maintenance") as HomeCondition);
  const pet  = (String(inputs.petHair || "none") as PetHair);
  const freq = (String(inputs.frequency || "one-time") as Frequency);

  const est = computeEstimate({
    sqft,
    bathrooms,
    cleanType: deep ? "deep" : "standard",
    frequency: FREQUENCY_FACTOR[freq] != null ? freq : "one-time",
    condition: CONDITION_UNITS[cond] != null ? cond : "maintenance",
    petHair: PET_UNITS[pet] != null ? pet : "none",
  });

  return {
    estimateMin: est.min,
    estimateMax: est.max,
    confidence: "high",
    breakdown: {
      sqftUnits: Math.round(sqftLaborUnits(sqft) * 100) / 100,
      bathAdj: Math.round(Math.max(0, (bathrooms - 1) * BATH_UNIT) * 100) / 100,
      condUnits: CONDITION_UNITS[cond] ?? 0,
      petUnits: PET_UNITS[pet] ?? 0,
      freqMultiplier: FREQUENCY_FACTOR[freq] ?? 1.0,
      deepMultiplier: est.deepMult,
      finalBeforeRange: est.mid,
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
