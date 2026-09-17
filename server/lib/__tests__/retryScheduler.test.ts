/**
 * startRetrySweepScheduler — the background trigger for the durable outbox.
 *
 * The sweep logic itself is covered by retrySweep.test.ts. What matters here
 * is the scheduling behaviour, and specifically the three things that would
 * be actively harmful if they were wrong:
 *
 *   • it must not overlap itself — two concurrent sweeps read the same
 *     `failed` rows and double-send;
 *   • it must not start when there's no database, or when explicitly
 *     disabled;
 *   • a throwing sweep must not escape and take the process down, and must
 *     not wedge the in-flight guard so all later ticks are skipped.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const state = vi.hoisted(() => ({
  available: true,
  calls: 0,
  /** Resolve manually so a sweep can be held open across ticks. */
  pending: [] as Array<(v: any) => void>,
  mode: "instant" as "instant" | "hold" | "throw",
}));

vi.mock("../retrySweep", () => ({
  retrySweepAvailable: () => state.available,
  sweepFailedForwards: vi.fn(async () => {
    state.calls += 1;
    if (state.mode === "throw") throw new Error("boom");
    if (state.mode === "hold") {
      return new Promise((resolve) => state.pending.push(resolve));
    }
    return { scanned: 0, delivered: 0, stillFailing: 0, skipped: 0 };
  }),
}));

import { startRetrySweepScheduler } from "../retryScheduler";

const FIRST_RUN_MS = 45_000;

beforeEach(() => {
  vi.useFakeTimers();
  state.available = true;
  state.calls = 0;
  state.pending = [];
  state.mode = "instant";
  delete process.env.RETRY_SWEEP_DISABLED;
  delete process.env.RETRY_SWEEP_INTERVAL_MINUTES;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("startRetrySweepScheduler", () => {
  it("does not sweep immediately — it waits out the boot delay", () => {
    const stop = startRetrySweepScheduler();
    expect(state.calls).toBe(0);
    vi.advanceTimersByTime(FIRST_RUN_MS - 1);
    expect(state.calls).toBe(0);
    vi.advanceTimersByTime(1);
    expect(state.calls).toBe(1);
    stop();
  });

  it("sweeps again on the configured interval", async () => {
    process.env.RETRY_SWEEP_INTERVAL_MINUTES = "2";
    const stop = startRetrySweepScheduler();
    await vi.advanceTimersByTimeAsync(FIRST_RUN_MS);
    expect(state.calls).toBe(1);
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(state.calls).toBe(2);
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(state.calls).toBe(3);
    stop();
  });

  it("clamps a sub-minute interval so a bad env var can't make a hot loop", async () => {
    process.env.RETRY_SWEEP_INTERVAL_MINUTES = "0.01"; // 0.6s — a typo, or "seconds" misread as minutes
    const stop = startRetrySweepScheduler();
    // Five minutes of wall clock. Clamped to the 1-minute floor that's the
    // boot sweep plus five interval ticks; at the requested 0.6s it would be
    // roughly five hundred, hammering BrightBase from a timer.
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(state.calls).toBeLessThan(20);
    expect(state.calls).toBeGreaterThan(0); // still running, just not hot
    stop();
  });

  it("falls back to the default interval for a non-numeric env var", async () => {
    process.env.RETRY_SWEEP_INTERVAL_MINUTES = "ten";
    const stop = startRetrySweepScheduler();
    await vi.advanceTimersByTimeAsync(FIRST_RUN_MS);
    expect(state.calls).toBe(1);
    // Default is 10 minutes: nothing more at 5.
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(state.calls).toBe(1);
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(state.calls).toBe(2);
    stop();
  });

  it("never runs two sweeps at once", async () => {
    state.mode = "hold";
    process.env.RETRY_SWEEP_INTERVAL_MINUTES = "1";
    const stop = startRetrySweepScheduler();

    await vi.advanceTimersByTimeAsync(FIRST_RUN_MS);
    expect(state.calls).toBe(1); // one sweep, still open

    // Three further ticks while it's held — every one must be a no-op.
    await vi.advanceTimersByTimeAsync(3 * 60_000);
    expect(state.calls).toBe(1);

    // Let it finish; the next tick may run.
    state.mode = "instant";
    state.pending.forEach((r) => r({ scanned: 0, delivered: 0, stillFailing: 0, skipped: 0 }));
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(state.calls).toBe(2);
    stop();
  });

  it("swallows a throwing sweep and keeps sweeping afterwards", async () => {
    state.mode = "throw";
    process.env.RETRY_SWEEP_INTERVAL_MINUTES = "1";
    const logged: string[] = [];
    const stop = startRetrySweepScheduler((m) => logged.push(m));

    // Must not reject — an unhandled rejection here would be a crash loop.
    await expect(vi.advanceTimersByTimeAsync(FIRST_RUN_MS)).resolves.not.toThrow();
    expect(state.calls).toBe(1);
    expect(logged.some((l) => /threw/.test(l))).toBe(true);

    // The in-flight guard must have been released in `finally`.
    state.mode = "instant";
    await vi.advanceTimersByTimeAsync(60_000);
    expect(state.calls).toBe(2);
    stop();
  });

  it("does not start without a database", async () => {
    state.available = false;
    const stop = startRetrySweepScheduler();
    await vi.advanceTimersByTimeAsync(FIRST_RUN_MS + 60_000);
    expect(state.calls).toBe(0);
    stop();
  });

  it("does not start when RETRY_SWEEP_DISABLED=1", async () => {
    process.env.RETRY_SWEEP_DISABLED = "1";
    const stop = startRetrySweepScheduler();
    await vi.advanceTimersByTimeAsync(FIRST_RUN_MS + 60_000);
    expect(state.calls).toBe(0);
    stop();
  });

  it("stops sweeping once stopped", async () => {
    process.env.RETRY_SWEEP_INTERVAL_MINUTES = "1";
    const stop = startRetrySweepScheduler();
    await vi.advanceTimersByTimeAsync(FIRST_RUN_MS);
    expect(state.calls).toBe(1);
    stop();
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(state.calls).toBe(1);
  });
});
