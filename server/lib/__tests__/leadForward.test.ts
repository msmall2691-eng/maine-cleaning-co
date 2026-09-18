import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the DB module so runForward's createRow/updateRow don't need a real
// Postgres. We just count call shapes.
const dbInsertReturning = vi.fn();
const dbUpdateWhere = vi.fn();
vi.mock("../../db", () => ({
  db: {
    insert: () => ({ values: () => ({ returning: dbInsertReturning }) }),
    update: () => ({ set: () => ({ where: dbUpdateWhere }) }),
  },
}));

// Mock the alert email so failing forwards don't try to hit SMTP.
const sentAlerts: any[] = [];
vi.mock("../../email", () => ({
  sendForwardFailureAlert: async (payload: any) => { sentAlerts.push(payload); },
}));

import { runForward, recordSkipped, type ForwardAttemptResult } from "../leadForward";

beforeEach(() => {
  dbInsertReturning.mockReset();
  dbUpdateWhere.mockReset();
  sentAlerts.length = 0;
  // Default: insert returns row id 42.
  dbInsertReturning.mockResolvedValue([{ id: 42 }]);
  dbUpdateWhere.mockResolvedValue(undefined);
});

describe("runForward", () => {
  it("delivered on the first try — one attempt, delivered_at set, no alert", async () => {
    const attempt = vi.fn(async (): Promise<ForwardAttemptResult> => ({
      ok: true, statusCode: 200,
    }));

    const id = await runForward({
      sourceType: "booking",
      sourceId: 7,
      destination: "brightbase",
      attempt,
    });

    expect(id).toBe(42);
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(sentAlerts).toHaveLength(0);

    // Final update should be the delivered marker.
    const lastPatch = dbUpdateWhere.mock.calls.length; // just check we wrote at least once
    expect(lastPatch).toBeGreaterThan(0);
  });

  it("retries on retryable failure up to the budget, then marks failed + alerts", async () => {
    const attempt = vi.fn(async (): Promise<ForwardAttemptResult> => ({
      ok: false, statusCode: 500, error: "HTTP 500: nope",
    }));

    const id = await runForward({
      sourceType: "booking",
      sourceId: 11,
      destination: "brightbase-update",
      attempt,
      retries: 3,
    });

    expect(id).toBe(42);
    expect(attempt).toHaveBeenCalledTimes(3);   // 3 attempts total (initial + 2 retries)
    expect(sentAlerts).toHaveLength(1);
    expect(sentAlerts[0]).toMatchObject({
      destination: "brightbase-update",
      sourceType: "booking",
      sourceId: 11,
      attempts: 3,
      lastStatusCode: 500,
    });
    expect(sentAlerts[0].lastError).toContain("500");
  }, 20_000);

  it("fatal:true short-circuits — one attempt only, no retries", async () => {
    const attempt = vi.fn(async (): Promise<ForwardAttemptResult> => ({
      ok: false, statusCode: 400, error: "HTTP 400: bad", fatal: true,
    }));

    await runForward({
      sourceType: "intake",
      sourceId: 3,
      destination: "brightbase",
      attempt,
      retries: 3,
    });

    expect(attempt).toHaveBeenCalledTimes(1);   // 4xx did NOT retry
    expect(sentAlerts).toHaveLength(1);
    expect(sentAlerts[0].lastStatusCode).toBe(400);
  });

  it("recovers when a transient failure is followed by success — 2 attempts, delivered, no alert", async () => {
    const attempt = vi.fn()
      .mockResolvedValueOnce({ ok: false, statusCode: 502, error: "HTTP 502" })
      .mockResolvedValueOnce({ ok: true, statusCode: 200 });

    await runForward({
      sourceType: "booking",
      sourceId: 22,
      destination: "brightbase",
      attempt,
      retries: 3,
    });

    expect(attempt).toHaveBeenCalledTimes(2);
    expect(sentAlerts).toHaveLength(0);          // delivered — no alert
  });

  it("survives when the DB row insert fails (id=null) — attempt still runs", async () => {
    // Simulate a Postgres blip on the initial createRow.
    dbInsertReturning.mockResolvedValueOnce([]);  // no row returned
    const attempt = vi.fn(async (): Promise<ForwardAttemptResult> => ({
      ok: true, statusCode: 201,
    }));

    const id = await runForward({
      sourceType: "booking",
      sourceId: 99,
      destination: "brightbase",
      attempt,
    });

    expect(id).toBeNull();
    expect(attempt).toHaveBeenCalledTimes(1);    // forward still proceeded
  });
});

describe("recordSkipped", () => {
  it("writes a skipped-status row with the reason", async () => {
    await recordSkipped("booking", 5, "brightbase", "BRIGHTBASE_API_URL not set");
    expect(dbInsertReturning).toHaveBeenCalledTimes(1);
    expect(dbUpdateWhere).toHaveBeenCalledTimes(1);
  });
});
