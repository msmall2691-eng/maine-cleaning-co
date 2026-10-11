import { describe, it, expect } from "vitest";
import vectorsFile from "@shared/pricing-vectors.json";
import { computeEstimate } from "@shared/pricing";
import { calculateQuote } from "../lib/quoteEngine";

/**
 * Pricing parity contract.
 *
 * shared/pricing-vectors.json is the SINGLE source of expected estimate
 * outputs, checked into both this repo and Bright-Space. This test asserts
 * both TypeScript entry points — the shared computeEstimate the browser widget
 * calls, and the server-side calculateQuote recompute — reproduce every vector.
 * Bright-Space has the twin of this test over its Python engine.
 *
 * If someone edits a rate/constant in @shared/pricing without regenerating the
 * vectors, this fails. If they regenerate the vectors, Bright-Space's test
 * fails until its Python port is brought back in line. Either way, silent
 * three-way drift — the customer seeing one price and the operator quoting
 * another — can't ship.
 *
 * `vectors` pins the arithmetic, and for a while it was all there was. Every
 * one of its rows spells out all six inputs, so it says nothing about what an
 * ABSENT input means — and that is where the engines actually drifted. An
 * omitted frequency means one-time (1.5x) here and meant biweekly (1.0x) in
 * the Python port; an omitted sqft is unpriceable here and became a 2000 sqft
 * home there. Both engines matched all 156 vectors throughout. The `defaults`
 * and `refusals` sections close that hole.
 */
const { vectors, defaults, refusals, serviceRouting } = vectorsFile as {
  vectors: Array<{
    input: { sqft: number; bathrooms: number; cleanType: "standard" | "deep"; frequency: any; condition: any; petHair: any };
    expected: { min: number; max: number; mid: number };
  }>;
  defaults: Array<{
    input: { sqft: number; bathrooms: number; cleanType: "standard" | "deep"; frequency?: any; condition?: any; petHair?: any };
    expected: { min: number; max: number; mid: number };
  }>;
  refusals: Array<{
    label: string;
    input: Record<string, any>;
    expected: { min: null; max: null };
  }>;
  serviceRouting: Array<{
    serviceType: string;
    input: { sqft: number; bathrooms: number; frequency: string };
    expected: { min: number | null; max: number | null; custom: boolean };
  }>;
};

describe("pricing parity — shared vectors", () => {
  it("has a non-trivial vector set (guards against an empty/broken contract file)", () => {
    expect(vectors.length).toBeGreaterThan(100);
  });

  it("computeEstimate (the customer-facing math) reproduces every vector", () => {
    for (const { input, expected } of vectors) {
      const e = computeEstimate(input);
      expect({ min: e.min, max: e.max, mid: e.mid }, `input=${JSON.stringify(input)}`).toEqual(expected);
    }
  });

  it("calculateQuote (the server recompute) matches the customer-facing range", () => {
    for (const { input, expected } of vectors) {
      // calculateQuote takes a service-type string; map the vector's cleanType.
      const q = calculateQuote({
        serviceType: input.cleanType === "deep" ? "deep" : "standard",
        sqft: input.sqft,
        bathrooms: input.bathrooms,
        frequency: input.frequency,
        condition: input.condition,
        petHair: input.petHair,
      });
      expect({ min: q.estimateMin, max: q.estimateMax }, `input=${JSON.stringify(input)}`)
        .toEqual({ min: expected.min, max: expected.max });
    }
  });
});

describe("pricing parity — defaults (what an omitted field means)", () => {
  it("has default rows that actually omit something", () => {
    expect(defaults.length).toBeGreaterThan(0);
    // A row with all six keys spelled out tests nothing the vectors don't.
    const omitsSomething = defaults.filter(
      (d) => !("frequency" in d.input) || !("condition" in d.input) || !("petHair" in d.input),
    );
    expect(omitsSomething.length).toBe(defaults.length);
  });

  it("computeEstimate fills omitted fields the way the contract says", () => {
    for (const { input, expected } of defaults) {
      const e = computeEstimate(input as any);
      expect({ min: e.min, max: e.max, mid: e.mid }, `input=${JSON.stringify(input)}`).toEqual(expected);
    }
  });

  it("an omitted frequency prices as one-time, not as a recurring customer", () => {
    // Spelled out rather than left to the generated rows: this exact default
    // is what diverged, and the 33% gap it opened is the whole reason these
    // sections exist. A lead that never named a cadence has not committed to
    // one, so it is quoted at the one-off rate until it does.
    const base = { sqft: 2000, bathrooms: 2, cleanType: "standard" } as const;
    const omitted = computeEstimate(base);
    const oneTime = computeEstimate({ ...base, frequency: "one-time" });
    const biweekly = computeEstimate({ ...base, frequency: "biweekly" });
    expect(omitted.mid).toBe(oneTime.mid);
    expect(omitted.mid).toBeGreaterThan(biweekly.mid);
  });
});

describe("pricing parity — refusals (inputs that must produce no number)", () => {
  it("has refusal rows", () => {
    expect(refusals.length).toBeGreaterThan(0);
  });

  it("calculateQuote returns null rather than inventing a price", () => {
    for (const { label, input, expected } of refusals) {
      const q = calculateQuote(input as any);
      expect({ min: q.estimateMin, max: q.estimateMax }, `${label}: ${JSON.stringify(input)}`)
        .toEqual(expected);
    }
  });

  it("a missing square footage is never backfilled with a default home", () => {
    // The failure this guards: quoting a 2000 sqft house to a customer who
    // told us nothing about their house. The number looks real all the way
    // down the line — owner SMS, Requests row, quote composer — and isn't.
    const sized = calculateQuote({ serviceType: "standard", sqft: 2000, bathrooms: 2 });
    const unsized = calculateQuote({ serviceType: "standard", bathrooms: 2 });
    expect(sized.estimateMin).not.toBeNull();
    expect(unsized.estimateMin).toBeNull();
    expect(unsized.confidence).toBe("low");
  });
});


describe("pricing parity — service routing (which formula a service takes)", () => {
  it("covers every service the site accepts", () => {
    const covered = serviceRouting.map((r) => r.serviceType);
    for (const s of ["standard", "deep", "move-in-out", "str", "vacation-rental", "commercial"]) {
      expect(covered, `routing contract is missing ${s}`).toContain(s);
    }
  });

  it("calculateQuote routes every service as the contract says", () => {
    for (const { serviceType, input, expected } of serviceRouting) {
      const q = calculateQuote({ ...input, serviceType } as any);
      expect(
        { min: q.estimateMin, max: q.estimateMax, custom: q.confidence === "custom" },
        `serviceType=${serviceType}`,
      ).toEqual(expected);
    }
  });

  it("a move-out is a deep clean — same house, same money", () => {
    // These were three different numbers across three engines. The browser
    // calculator priced move-in-out as a deep clean, Bright-Space on a flat
    // 1.65, and this recompute refused to price it at all.
    const home = { sqft: 2400, bathrooms: 2, frequency: "one-time" as const };
    const deep = calculateQuote({ ...home, serviceType: "deep" });
    const move = calculateQuote({ ...home, serviceType: "move-in-out" });
    expect(move.estimateMin).toBe(deep.estimateMin);
    expect(move.estimateMax).toBe(deep.estimateMax);
    expect(move.confidence).toBe("high");
  });

  it("move-in-out no longer falls through to the client's own number", () => {
    // The routes handler stores `serverQuote.estimateMin ?? client.estimateMin`.
    // While move-in-out was custom, that null made it the one serviceType a
    // tampered client could use to get its own price persisted unchecked.
    const q = calculateQuote({ serviceType: "move-in-out", sqft: 2400, bathrooms: 2 });
    expect(q.estimateMin).not.toBeNull();
    expect(q.estimateMax).not.toBeNull();
  });

  it("STR and commercial stay hand-priced", () => {
    for (const serviceType of ["str", "vacation-rental", "commercial"]) {
      const q = calculateQuote({ serviceType, sqft: 2400, bathrooms: 2 });
      expect(q.estimateMin, serviceType).toBeNull();
      expect(q.confidence, serviceType).toBe("custom");
    }
  });
});
