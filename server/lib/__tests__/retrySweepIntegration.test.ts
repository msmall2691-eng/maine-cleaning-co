/**
 * The durable outbox, end to end over a real socket.
 *
 * retrySweep.test.ts covers the replay DECISION logic against a stubbed
 * postJson. This one runs the real fetch path against a real HTTP server that
 * is genuinely down and then genuinely up, because the thing being promised —
 * "a booking lost to a BrightBase outage is replayed later, intact" — spans
 * the ledger, the HTTP client and the delivery hook, and none of the unit
 * tests cross all three.
 *
 * It also closes a gap the integrity audit called out: brightbaseForward.test
 * asserts requestedDate and manageUrl on the forwarded body but never the
 * money fields, so nothing anywhere proved the price survives a replay.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import http from "http";
import type { AddressInfo } from "net";

const store = vi.hoisted(() => ({ rows: [] as any[] }));

vi.mock("../../db", () => {
  const selectBuilder: any = {
    from: () => selectBuilder,
    where: () => selectBuilder,
    limit: async () => store.rows.filter((r) => r.status === "failed"),
  };
  return {
    db: {
      select: () => selectBuilder,
      update: () => ({
        set: (patch: any) => ({
          where: async () => { Object.assign(store.rows[0], patch); },
        }),
      }),
    },
  };
});
vi.mock("../../email", () => ({ sendForwardFailureAlert: vi.fn(async () => {}) }));

import { retryFailedForwards } from "../leadForward";

let server: http.Server;
let url = "";
let up = false;
let received: any[] = [];

beforeEach(async () => {
  up = false;
  received = [];
  server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (!up) {
        res.writeHead(503, { "content-type": "application/json" }).end('{"message":"down"}');
        return;
      }
      received.push(JSON.parse(body || "{}"));
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ bookingId: 9001 }));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/booking/submit`;

  store.rows = [{
    id: 1, sourceType: "booking", sourceId: 77, destination: "brightbase",
    status: "failed", attempts: 3,
    // The exact shape brightbase.ts builds, money in whole dollars.
    payload: { name: "Test Client", serviceType: "residential", estimateMin: 450, estimateMax: 490, idempotencyKey: "k1" },
    targetUrl: url, lastStatusCode: 503, lastError: "HTTP 503",
  }];
});

afterEach(async () => {
  await new Promise<void>((r) => server.close(() => r()));
});

describe("failed-forward replay, over a real socket", () => {
  it("leaves the row failed while the peer is down, then delivers it intact when the peer returns", async () => {
    // ── peer down ──
    const whileDown = await retryFailedForwards({ limit: 100 });
    expect(whileDown.delivered).toBe(0);
    expect(whileDown.stillFailing).toBe(1);
    expect(store.rows[0].status).toBe("failed");
    expect(received).toHaveLength(0);

    // ── peer back ──
    up = true;
    const captured: Array<string | number> = [];
    const whileUp = await retryFailedForwards({
      limit: 100,
      onDelivered: async (_row, result) => {
        const id = JSON.parse(result.responseSnippet ?? "{}")?.bookingId;
        if (id != null) captured.push(id);
      },
    });

    expect(whileUp.delivered).toBe(1);
    expect(store.rows[0].status).toBe("delivered");
    expect(store.rows[0].deliveredAt).toBeInstanceOf(Date);

    // The whole point: the price the customer was shown is the price that
    // eventually reached the operator, unchanged by the round trip.
    expect(received).toHaveLength(1);
    expect(received[0].estimateMin).toBe(450);
    expect(received[0].estimateMax).toBe(490);
    expect(Number.isInteger(received[0].estimateMin)).toBe(true);
    expect(received[0].idempotencyKey).toBe("k1");

    // And the post-delivery hook still fires on the replay path, so a late
    // delivery is not a delivery that loses BrightBase's booking id.
    expect(captured).toEqual([9001]);
  });

  it("does not re-send a row that already delivered", async () => {
    up = true;
    await retryFailedForwards({ limit: 100 });
    expect(received).toHaveLength(1);
    // Row is now `delivered`; the ledger query only returns `failed`.
    await retryFailedForwards({ limit: 100 });
    expect(received).toHaveLength(1);
  });
});
