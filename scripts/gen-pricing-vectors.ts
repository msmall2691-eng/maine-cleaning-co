/**
 * Generates shared/pricing-vectors.json — the cross-repo pricing contract.
 *
 * Run: `npm run gen:pricing-vectors`
 *
 * The output is the SINGLE source of expected estimate outputs, checked into
 * BOTH maineclean.co and Bright-Space. Each repo's pricing test asserts its
 * engine reproduces every row here. Regenerate this ONLY when you have
 * deliberately changed the rate card in @shared/pricing (and mirrored it in
 * Bright-Space's backend/modules/booking/pricing.py) — a diff here in a PR is
 * a red flag that pricing moved and both engines + this file must agree.
 *
 * The file has three sections, because pinning the MATH turned out not to be
 * enough:
 *
 *   vectors    — every field spelled out. Pins the arithmetic.
 *   defaults   — fields deliberately OMITTED. Pins what an absent input means.
 *   refusals   — inputs that must produce NO price at all.
 *
 * Only `vectors` existed at first, and every one of its rows names all six
 * inputs. That left the defaults untested in both directions, and they had
 * silently diverged: an absent frequency means one-time (1.5x) here and meant
 * biweekly (1.0x) in the Python port, so every lead that reached Bright-Space
 * without a cadence — the contact form collects none — was quoted 33% under
 * the customer-facing engine. The absent sqft was worse: this repo refuses to
 * price it, the port invented a 2000 sqft home and quoted $155–$165 off it.
 * Both engines agreed on all 156 vectors the whole time.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { computeEstimate, type EstimateInputs } from "../shared/pricing";
import { calculateQuote } from "../server/lib/quoteEngine";

const SQFTS = [500, 800, 1200, 1500, 1800, 2400, 3000, 3600, 5000, 6000];
const BATHS = [1, 1.5, 2, 2.5, 3, 4.5];
const CLEAN_TYPES = ["standard", "deep"] as const;
const FREQS = ["weekly", "biweekly", "monthly", "one-time"] as const;
const CONDS = ["maintenance", "moderate", "heavy"] as const;
const PETS = ["none", "some", "heavy"] as const;

type Vector = { input: EstimateInputs; expected: { min: number; max: number; mid: number } };

// The ORIGINAL inline formula, verbatim from the pre-refactor client engine.
// Kept ONLY to prove computeEstimate is behavior-identical before we bake its
// output into the contract — a refactor of the live pricing path must not
// change a single quote. Delete once you trust the shared module.
function oldEstimate(i: EstimateInputs): { min: number; max: number } {
  const RATE = 60;
  const minJob = i.cleanType === "standard" ? 130 : 225;
  const sf = i.sqft;
  const sqftUnits = sf <= 1500 ? sf / 680 : sf <= 3000 ? 1500 / 680 + (sf - 1500) / 1050 : 1500 / 680 + 1500 / 1050 + (sf - 3000) / 1400;
  const bathAdj = Math.max(0, (i.bathrooms - 1) * 0.40);
  const condUnits: Record<string, number> = { maintenance: 0, moderate: 0.50, heavy: 1.00 };
  const petUnits: Record<string, number> = { none: 0, some: 0.30, heavy: 0.60 };
  const deepMult = i.cleanType === "deep" ? (sf <= 1200 ? 1.60 : sf <= 2000 ? 1.65 : sf <= 3000 ? 1.75 : 1.80) : 1.0;
  const labor = (sqftUnits + bathAdj + condUnits[i.condition ?? "maintenance"] + petUnits[i.petHair ?? "none"]) * deepMult;
  const freqMap: Record<string, number> = { weekly: 0.85, biweekly: 1.0, monthly: 1.15, "one-time": 1.50 };
  const raw = labor * freqMap[i.frequency ?? "one-time"] * RATE;
  const final = Math.max(minJob, Math.round(raw / 5) * 5);
  return { min: Math.round((final * 0.96) / 5) * 5, max: Math.round((final * 1.04) / 5) * 5 };
}

const vectors: Vector[] = [];
// Full grid on the levers that interact non-linearly (sqft × baths × cleanType),
// then sweep freq/condition/pet at a representative mid-size home so the file
// covers every discrete factor without exploding to tens of thousands of rows.
for (const sqft of SQFTS) {
  for (const bathrooms of BATHS) {
    for (const cleanType of CLEAN_TYPES) {
      const input: EstimateInputs = { sqft, bathrooms, cleanType, frequency: "one-time", condition: "maintenance", petHair: "none" };
      const e = computeEstimate(input);
      assertEquiv(input, e);
      vectors.push({ input, expected: { min: e.min, max: e.max, mid: e.mid } });
    }
  }
}
// The freq/condition/pet sweep runs for BOTH clean types, not just standard.
//
// This matters more than it looks. In computeEstimate the condition and pet
// ADDENDS are multiplied by deepMult *before* the frequency multiply:
//
//     labor = (sqftUnits + bathAdj + condU + petU) * deepMult
//     raw   = labor * freqU * RATE
//
// A port that applies deepMult after the addends — the natural mistake, and
// the one an independent implementation is most likely to make — produces
// different money for exactly one combination: a deep clean that also has a
// condition, pet or frequency factor. Every vector in this file used to pin
// `deep` at one-time/maintenance/none, so that port would have matched all
// 156 rows and still quoted differently in production. These 36 extra rows
// are the ones that catch it.
for (const cleanType of CLEAN_TYPES) {
  for (const frequency of FREQS) {
    for (const condition of CONDS) {
      for (const petHair of PETS) {
        // The standard rows here duplicate nothing: the grid above only
        // covers one-time/maintenance/none.
        const input: EstimateInputs = { sqft: 1800, bathrooms: 2, cleanType, frequency, condition, petHair };
        const e = computeEstimate(input);
        assertEquiv(input, e);
        vectors.push({ input, expected: { min: e.min, max: e.max, mid: e.mid } });
      }
    }
  }
}

function assertEquiv(input: EstimateInputs, e: { min: number; max: number }) {
  const o = oldEstimate(input);
  if (o.min !== e.min || o.max !== e.max) {
    throw new Error(
      `PRICING DRIFT: computeEstimate diverged from the original formula for ` +
      `${JSON.stringify(input)} — old $${o.min}-$${o.max} vs new $${e.min}-$${e.max}. ` +
      `Refactor must preserve every quote.`,
    );
  }
}

// ── defaults: what an OMITTED field means ─────────────────────────────
// Each row leaves one or more of frequency/condition/petHair out of the input
// object entirely, so the engine's own fallback supplies it. A port that picks
// a different fallback quotes differently on every real lead that didn't
// answer that question — which is most of them — while still matching all 192
// fully-specified vectors above.
type PartialInput = Omit<EstimateInputs, "frequency" | "condition" | "petHair"> &
  Partial<Pick<EstimateInputs, "frequency" | "condition" | "petHair">>;
const DEFAULT_SHAPES: PartialInput[] = [
  // Nothing but size + clean type — the shape a hand-keyed or forwarded lead
  // arrives in when the customer never saw the calculator.
  { sqft: 1200, bathrooms: 1, cleanType: "standard" },
  { sqft: 2000, bathrooms: 2, cleanType: "standard" },
  { sqft: 3600, bathrooms: 3, cleanType: "standard" },
  { sqft: 2000, bathrooms: 2, cleanType: "deep" },
  { sqft: 3600, bathrooms: 4.5, cleanType: "deep" },
  // One field omitted at a time, so a wrong fallback can be attributed.
  { sqft: 2000, bathrooms: 2, cleanType: "standard", condition: "heavy", petHair: "some" },
  { sqft: 2000, bathrooms: 2, cleanType: "standard", frequency: "weekly", petHair: "some" },
  { sqft: 2000, bathrooms: 2, cleanType: "standard", frequency: "weekly", condition: "heavy" },
  // Bathrooms at the stepper's floor: bathAdj must be 0, never negative.
  { sqft: 1500, bathrooms: 1, cleanType: "deep" },
];
const defaults = DEFAULT_SHAPES.map((input) => {
  const e = computeEstimate(input as EstimateInputs);
  return { input, expected: { min: e.min, max: e.max, mid: e.mid } };
});

// ── refusals: inputs that must produce NO number ──────────────────────
// calculateQuote — not computeEstimate, which has no refusal mode because its
// callers own validation — is the authority on when we decline to price.
// Square footage is the dominant term and the one input with no honest
// default, so without it there is nothing to quote; STR and commercial are
// priced by hand. (move-in-out is NOT hand-priced — it is a deep clean, and
// all three engines price it as one.) Both engines must return null here. A
// port that fills the gap with a default home quotes money off data nobody
// supplied, and it reaches the operator looking exactly like a real estimate.
const REFUSAL_SHAPES: Array<{ label: string; input: Record<string, unknown> }> = [
  { label: "no sqft at all",     input: { serviceType: "standard", bathrooms: 2 } },
  { label: "sqft null",          input: { serviceType: "standard", sqft: null, bathrooms: 2 } },
  { label: "sqft zero",          input: { serviceType: "standard", sqft: 0, bathrooms: 2 } },
  { label: "sqft negative",      input: { serviceType: "standard", sqft: -500, bathrooms: 2 } },
  { label: "deep, no sqft",      input: { serviceType: "deep", bathrooms: 3 } },
  { label: "str is hand-priced", input: { serviceType: "str", sqft: 2400, bathrooms: 2 } },
  { label: "vacation-rental",    input: { serviceType: "vacation-rental", sqft: 2400, bathrooms: 2 } },
  { label: "commercial",         input: { serviceType: "commercial", sqft: 5000, bathrooms: 4 } },
];
const refusals = REFUSAL_SHAPES.map(({ label, input }) => {
  const q = calculateQuote(input as Parameters<typeof calculateQuote>[0]);
  if (q.estimateMin !== null || q.estimateMax !== null) {
    throw new Error(
      `REFUSAL CONTRACT BROKEN: "${label}" ${JSON.stringify(input)} priced ` +
      `$${q.estimateMin}-$${q.estimateMax}; it must return null/null.`,
    );
  }
  return { label, input, expected: { min: null, max: null } };
});

// ── serviceRouting: which service gets priced, and as what ─────────────
// The sections above pin the arithmetic and the defaults, both of which assume
// the engines already agree on WHICH formula a given service takes. They did
// not. "move-in-out" was priced three different ways at once: the browser
// calculator as a deep clean (ServiceDetail.tsx routes it to the "deep-clean"
// category), Bright-Space on a flat 1.65 multiplier, and this repo's recompute
// not at all — it was in isCustomService, so it returned null, and a null here
// falls through to `?? parsed.estimateMin`, making "move-in-out" a serviceType
// that got the client's own number stored unchecked.
//
// So the contract now names the routing too: every service the site accepts,
// on one fixed home, with the price it must produce or the null it must not
// produce. A port that routes a service differently fails here even though
// every vector, default and refusal still passes.
const ROUTING_HOME = { sqft: 2400, bathrooms: 2, frequency: "one-time" as const };
const ROUTED_SERVICES = [
  "standard", "deep", "move-in-out", "str", "vacation-rental", "commercial",
];
const serviceRouting = ROUTED_SERVICES.map((serviceType) => {
  const q = calculateQuote({ ...ROUTING_HOME, serviceType });
  return {
    serviceType,
    input: { ...ROUTING_HOME },
    expected: { min: q.estimateMin, max: q.estimateMax, custom: q.confidence === "custom" },
  };
});
// A deep clean and a move-out of the same house are the same job and the same
// money. Assert it at generation time so the contract can never be regenerated
// into a state where they disagree.
{
  const deep = serviceRouting.find((r) => r.serviceType === "deep")!;
  const move = serviceRouting.find((r) => r.serviceType === "move-in-out")!;
  if (deep.expected.min !== move.expected.min || deep.expected.max !== move.expected.max) {
    throw new Error(
      `ROUTING CONTRACT BROKEN: move-in-out ($${move.expected.min}-$${move.expected.max}) ` +
      `must price as a deep clean ($${deep.expected.min}-$${deep.expected.max}).`,
    );
  }
  if (move.expected.min === null) {
    throw new Error("ROUTING CONTRACT BROKEN: move-in-out must be priced, not hand-quoted.");
  }
}

const out = {
  _comment: "Cross-repo pricing contract — generated by scripts/gen-pricing-vectors.ts. Do not hand-edit.",
  vectors,
  defaults,
  refusals,
  serviceRouting,
};
const dest = join(dirname(fileURLToPath(import.meta.url)), "..", "shared", "pricing-vectors.json");
writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
console.log(
  `Wrote ${vectors.length} vectors, ${defaults.length} defaults, ` +
  `${refusals.length} refusals, ${serviceRouting.length} routed services to ${dest}`,
);
