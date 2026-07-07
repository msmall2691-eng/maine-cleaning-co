import { describe, it, expect } from "vitest";
import { calculateQuote, estimatesDiverge } from "../quoteEngine";

describe("calculateQuote", () => {
  // Anchor values match the client-side estimator in InstantEstimate.tsx
  // exactly. If the client math changes without updating both files, one of
  // these numbers will drift and the test will red-flag it.
  it("prices a standard 1500sf/2ba biweekly clean the same as the client engine", () => {
    // Client: sqftUnits=1500/680=2.206, bathAdj=0.4, condU=0, petU=0, deep=1,
    //         labor=2.606, raw=2.606*1.0*60=156.4, round(156.4/5)*5=155,
    //         floor=max(130,155)=155, min=round(155*.96/5)*5=150, max=round(155*1.04/5)*5=160.
    const q = calculateQuote({
      serviceType: "standard",
      sqft: 1500,
      bathrooms: 2,
      frequency: "biweekly",
      petHair: "none",
      condition: "maintenance",
    });
    expect(q.confidence).toBe("high");
    expect(q.estimateMin).toBe(150);
    expect(q.estimateMax).toBe(160);
  });

  it("applies the deep-clean multiplier at the 1500sf tier", () => {
    // deep with sqft<=2000 → multiplier 1.65. Same inputs as above:
    //   labor=(2.206+0.4)*1.65=4.30, raw=4.30*60=258.24, round(258.24/5)*5=260,
    //   floor=max(225,260)=260, min=250, max=270.
    const q = calculateQuote({
      serviceType: "deep",
      sqft: 1500,
      bathrooms: 2,
      frequency: "biweekly",
      petHair: "none",
      condition: "maintenance",
    });
    expect(q.estimateMin).toBe(250);
    expect(q.estimateMax).toBe(270);
  });

  it("enforces the minJob floor for tiny standard cleans", () => {
    // 500 sqft, 1 bath, one-time. Raw is well below the $130 standard floor;
    // final must snap up to 130 → min=125, max=135.
    const q = calculateQuote({
      serviceType: "standard",
      sqft: 500,
      bathrooms: 1,
      frequency: "one-time",
      petHair: "none",
      condition: "maintenance",
    });
    expect(q.estimateMin).toBe(125);
    expect(q.estimateMax).toBe(135);
  });

  it("stacks condition + pet + deep multipliers", () => {
    // Deep, 2000sf/3ba, monthly, heavy condition, heavy pets.
    // sqftUnits=1500/680+500/1050=2.206+0.476=2.683
    // bathAdj=2*0.40=0.80, condU=1.00, petU=0.60, deepMult=1.65 (sqft<=2000)
    // labor=(2.683+0.80+1.00+0.60)*1.65=8.386, freq=1.15
    // raw=8.386*1.15*60=578.6, round(578.6/5)*5=580, floor=max(225,580)=580
    // min=round(580*.96/5)*5=555, max=round(580*1.04/5)*5=605
    const q = calculateQuote({
      serviceType: "deep",
      sqft: 2000,
      bathrooms: 3,
      frequency: "monthly",
      petHair: "heavy",
      condition: "heavy",
    });
    expect(q.estimateMin).toBe(555);
    expect(q.estimateMax).toBe(605);
  });

  it("returns custom-quote (nulls) for STR / vacation-rental / commercial / move-in-out", () => {
    for (const t of ["vacation-rental", "str", "commercial", "move-in-out"]) {
      const q = calculateQuote({ serviceType: t, sqft: 1500, bathrooms: 2 });
      expect(q.estimateMin).toBeNull();
      expect(q.estimateMax).toBeNull();
      expect(q.confidence).toBe("custom");
    }
  });

  it("returns low-confidence nulls when required inputs are missing", () => {
    const q = calculateQuote({ serviceType: "deep", sqft: null, bathrooms: null });
    expect(q.estimateMin).toBeNull();
    expect(q.estimateMax).toBeNull();
    expect(q.confidence).toBe("low");
  });

  it("treats a zero or negative sqft as missing (no negative-price attack)", () => {
    const q = calculateQuote({ serviceType: "deep", sqft: 0, bathrooms: 2 });
    expect(q.estimateMin).toBeNull();
    const q2 = calculateQuote({ serviceType: "deep", sqft: -1000, bathrooms: 2 });
    expect(q2.estimateMin).toBeNull();
  });
});

describe("estimatesDiverge", () => {
  it("stays quiet when client and server agree within tolerance", () => {
    // Mid=240 vs 260 → 7.7% off, under the 10% default.
    expect(estimatesDiverge(220, 260, 250, 270)).toBe(false);
  });

  it("fires when a tampered client sends 1-5 against a real 250-270", () => {
    expect(estimatesDiverge(1, 5, 250, 270)).toBe(true);
  });

  it("stays quiet when either side has null (custom-quote case)", () => {
    expect(estimatesDiverge(220, 260, null, null)).toBe(false);
    expect(estimatesDiverge(null, null, 250, 270)).toBe(false);
  });

  it("stays quiet when a server value is exactly zero (avoid divide-by-zero)", () => {
    expect(estimatesDiverge(50, 100, 0, 0)).toBe(false);
  });
});
