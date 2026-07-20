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
 */
const { vectors } = vectorsFile as {
  vectors: Array<{
    input: { sqft: number; bathrooms: number; cleanType: "standard" | "deep"; frequency: any; condition: any; petHair: any };
    expected: { min: number; max: number; mid: number };
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
