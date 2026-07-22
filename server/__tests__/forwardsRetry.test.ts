/**
 * POST /api/admin/forwards/retry — the durable-outbox retry sweep endpoint.
 *
 * The security gate is the point of this test: the sweep re-sends stored lead
 * payloads to BrightBase, so it must be reachable ONLY by an admin session or
 * a cron carrying the shared CRON_SECRET — never anonymously. We assert the
 * sweep function is invoked only when authorized.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";

// db must be truthy so runRetrySweep doesn't short-circuit to 503.
vi.mock("../db", () => ({ db: {} }));

const retryMock = vi.fn(async () => ({ scanned: 3, delivered: 2, stillFailing: 1, skipped: 0 }));
vi.mock("../lib/leadForward", () => ({
  runForward: vi.fn(async () => 1),
  recordSkipped: vi.fn(async () => {}),
  retryFailedForwards: (...args: any[]) => retryMock(...args),
}));

vi.mock("../storage", () => ({
  storage: {
    updateBookingRequestExternalIds: vi.fn(async () => {}),
    getUserByEmail: vi.fn(async () => null),
  },
}));
vi.mock("../lib/brightbase", () => ({
  forwardLeadToBrightBase: vi.fn(async () => {}),
  forwardBookingUpdateToBrightBase: vi.fn(async () => {}),
}));
vi.mock("../email", () => ({
  sendLeadNotification: vi.fn(async () => {}),
  sendCustomerConfirmation: vi.fn(async () => {}),
  sendPasswordResetEmail: vi.fn(async () => {}),
  sendIntakeNotification: vi.fn(async () => true),
  sendForwardFailureAlert: vi.fn(async () => {}),
  sendBookingNotification: vi.fn(async () => {}),
  sendBookingCustomerEmail: vi.fn(async () => {}),
}));
// requireAdmin denies (401) — so the ONLY way through in these tests is the
// cron secret, which is exactly the path we want to prove works/doesn't.
vi.mock("../auth", async () => {
  const session = await import("express-session");
  return {
    setupAuth: (app: Express) => {
      app.use(session.default({ secret: "test", resave: false, saveUninitialized: false }));
    },
    hashPassword: async (p: string) => p,
    comparePassword: async () => false,
    requireAuth: (_: any, res: any) => res.status(401).end(),
    requireAdmin: (_: any, res: any) => res.status(401).end(),
  };
});
vi.mock("../lib/normalize", () => ({ normalizeIntakePayload: (p: any) => p }));
vi.mock("openai", () => ({ default: class {} }));

import { registerRoutes } from "../routes";
import { createServer } from "http";

let app: Express;
beforeEach(async () => {
  retryMock.mockClear();
  process.env.CRON_SECRET = "s3cret";
  app = express();
  app.set("trust proxy", true);
  app.use(express.json());
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
});
afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("POST /api/admin/forwards/retry", () => {
  it("rejects an anonymous request (no admin, no cron secret) and does NOT run the sweep", async () => {
    const res = await request(app).post("/api/admin/forwards/retry").send({});
    expect(res.status).toBe(401);
    expect(retryMock).not.toHaveBeenCalled();
  });

  it("rejects a wrong cron secret", async () => {
    const res = await request(app).post("/api/admin/forwards/retry").set("x-cron-secret", "nope").send({});
    expect(res.status).toBe(401);
    expect(retryMock).not.toHaveBeenCalled();
  });

  it("runs the sweep and returns the summary with the correct cron secret", async () => {
    const res = await request(app).post("/api/admin/forwards/retry").set("x-cron-secret", "s3cret").send({ limit: 50 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, scanned: 3, delivered: 2, stillFailing: 1 });
    expect(retryMock).toHaveBeenCalledTimes(1);
    // The requested limit is forwarded to the sweep.
    expect(retryMock.mock.calls[0][0]).toMatchObject({ limit: 50 });
  });

  it("does not authorize via cron when CRON_SECRET is unset (even if a header is sent)", async () => {
    delete process.env.CRON_SECRET;
    const res = await request(app).post("/api/admin/forwards/retry").set("x-cron-secret", "").send({});
    expect(res.status).toBe(401);
    expect(retryMock).not.toHaveBeenCalled();
  });
});
