/**
 * retryFailedForwards — the durable-outbox sweep.
 *
 * Asserts the replay decision logic against a fake ledger:
 *   • a failed row WITH a stored payload + URL and a retryable status is
 *     re-POSTed and marked delivered (+ the onDelivered hook fires);
 *   • a row with NO stored payload (legacy) is skipped, not re-sent;
 *   • a row whose last failure was a 4xx is skipped (the peer rejected the
 *     body — re-sending won't fix it).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ── fake ledger + drizzle-ish query builder ───────────────────────────────
// vi.hoisted so the shared mutable state exists before the hoisted vi.mock
// factory runs (a plain top-level const would be a TDZ error inside it).
const store = vi.hoisted(() => ({ failedRows: [] as any[], updates: [] as Array<{ patch: any }> }));

vi.mock("../../db", () => {
  const selectBuilder: any = {
    from: () => selectBuilder,
    where: () => selectBuilder,
    limit: async () => store.failedRows,
  };
  return {
    db: {
      select: () => selectBuilder,
      update: () => ({ set: (patch: any) => ({ where: async () => { store.updates.push({ patch }); } }) }),
    },
  };
});
vi.mock("../../email", () => ({ sendForwardFailureAlert: vi.fn(async () => {}) }));

import { retryFailedForwards } from "../leadForward";

const okFetch = () => Promise.resolve({ ok: true, status: 200, text: async () => JSON.stringify({ success: true, bookingId: 42 }) });

beforeEach(() => {
  store.failedRows = [];
  store.updates.length = 0;
  vi.restoreAllMocks();
});

describe("retryFailedForwards", () => {
  it("re-sends a failed row with a stored payload and marks it delivered", async () => {
    store.failedRows = [{
      id: 1, sourceType: "booking", sourceId: 7, destination: "brightbase",
      status: "failed", attempts: 3, lastStatusCode: 502,
      payload: { name: "Meg" }, targetUrl: "https://crm.example/api/booking/submit",
    }];
    const fetchSpy = vi.spyOn(globalThis, "fetch" as any).mockImplementation(okFetch as any);
    const onDelivered = vi.fn(async () => {});

    const summary = await retryFailedForwards({ onDelivered });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(summary).toMatchObject({ scanned: 1, delivered: 1, stillFailing: 0, skipped: 0 });
    expect(store.updates.at(-1)?.patch).toMatchObject({ status: "delivered", attempts: 4 });
    expect(onDelivered).toHaveBeenCalledTimes(1);
  });

  it("skips a row with no stored payload (legacy) — never re-sends it", async () => {
    store.failedRows = [{
      id: 2, sourceType: "booking", sourceId: 8, destination: "brightbase",
      status: "failed", attempts: 3, lastStatusCode: 500, payload: null, targetUrl: null,
    }];
    const fetchSpy = vi.spyOn(globalThis, "fetch" as any).mockImplementation(okFetch as any);

    const summary = await retryFailedForwards();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ scanned: 1, delivered: 0, skipped: 1 });
  });

  it("skips a row whose last failure was a 4xx (peer rejected the body)", async () => {
    store.failedRows = [{
      id: 3, sourceType: "booking", sourceId: 9, destination: "brightbase",
      status: "failed", attempts: 3, lastStatusCode: 422,
      payload: { name: "Bad" }, targetUrl: "https://crm.example/api/booking/submit",
    }];
    const fetchSpy = vi.spyOn(globalThis, "fetch" as any).mockImplementation(okFetch as any);

    const summary = await retryFailedForwards();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ scanned: 1, delivered: 0, skipped: 1 });
  });
});
