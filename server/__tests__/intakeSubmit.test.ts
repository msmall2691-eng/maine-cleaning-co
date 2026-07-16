import { describe, it, expect, beforeEach, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";

vi.mock("../storage", () => ({
  storage: {
    createIntakeSubmission: vi.fn(async () => ({ id: 1 })),
    updateIntakeSubmissionEmail: vi.fn(async () => {}),
    updateIntakeSubmissionQuoteLead: vi.fn(async () => {}),
    createBookingRequest: vi.fn(async () => ({ id: 1 })),
    updateBookingRequestExternalIds: vi.fn(async () => {}),
    getUserByEmail: vi.fn(async () => null),
  },
}));

vi.mock("../lib/brightbase", () => ({ forwardLeadToBrightBase: vi.fn(async () => {}) }));
vi.mock("../lib/leadForward", () => ({
  runForward: vi.fn(async () => 1),
  recordSkipped: vi.fn(async () => {}),
}));
vi.mock("../email", () => ({
  sendLeadNotification: vi.fn(async () => {}),
  sendCustomerConfirmation: vi.fn(async () => {}),
  sendPasswordResetEmail: vi.fn(async () => {}),
  sendIntakeNotification: vi.fn(async () => {}),
  sendForwardFailureAlert: vi.fn(async () => {}),
}));
vi.mock("../lib/normalize", () => ({
  normalizeIntakePayload: (p: any) => p,
}));
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
vi.mock("openai", () => ({ default: class {} }));

import { registerRoutes } from "../routes";
import { createServer } from "http";

let app: Express;
beforeEach(async () => {
  app = express();
  // Mirror server/index.ts so req.ip honours the X-Forwarded-For header that
  // the test client injects — without this, every request looks like it came
  // from the loopback socket and the rate-limit key becomes shared.
  app.set("trust proxy", true);
  app.use(express.json());
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
});

describe("POST /api/intake/submit rate limiting", () => {
  const goodPayload = {
    name: "Test",
    email: "t@x.co",
    phone: "2075551234",
    serviceType: "standard",
    sqft: 1200,
    frequency: "biweekly",
    petHair: "none",
    condition: "maintenance",
    bathrooms: 2,
    estimateMin: 150,
    estimateMax: 200,
  };

  it("accepts a burst under the limit (5 requests/minute)", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/api/intake/submit")
        .set("X-Forwarded-For", "10.0.0.99")
        .send(goodPayload);
      expect(res.status).toBe(201);
    }
  });

  it("forwards the client-supplied idempotencyKey to Bright-Space", async () => {
    // Same pin as bookingSubmit.test.ts: without this forward, Bright-Space
    // PR #507's M2 fix is dormant and the audit's duplicate-lead bug remains.
    const { forwardLeadToBrightBase } = await import("../lib/brightbase");
    const mock = forwardLeadToBrightBase as unknown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const key = "test-uuid-01HW7XYZ-intake";
    const res = await request(app)
      .post("/api/intake/submit")
      .set("X-Forwarded-For", "10.0.0.98")
      .send({ ...goodPayload, idempotencyKey: key });

    expect(res.status).toBe(201);
    expect(mock).toHaveBeenCalledTimes(1);
    const forwardedBody = mock.mock.calls[0][0];
    expect(forwardedBody.idempotencyKey).toBe(key);
  });

  it("recomputes the estimate server-side, ignoring a tampered client range", async () => {
    // Attacker claims $5–9 for a 1200 sqft / 2 bath / biweekly standard clean.
    // The server recomputes $125–135 and forwards THAT to Bright-Space — the
    // intake path used to trust the browser's number verbatim.
    const { forwardLeadToBrightBase } = await import("../lib/brightbase");
    const mock = forwardLeadToBrightBase as unknown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const res = await request(app)
      .post("/api/intake/submit")
      .set("X-Forwarded-For", "10.0.0.111")
      .send({ ...goodPayload, estimateMin: 5, estimateMax: 9 });

    expect(res.status).toBe(201);
    expect(res.body.estimateMin).toBe(125);
    expect(res.body.estimateMax).toBe(135);
    // The forward to Bright-Space carries the trusted range, not the tamper.
    expect(mock).toHaveBeenCalledTimes(1);
    const forwarded = mock.mock.calls[0][0];
    expect(forwarded.estimateMin).toBe(125);
    expect(forwarded.estimateMax).toBe(135);
  });

  it("returns 429 on the 6th request from the same IP within the window", async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/intake/submit")
        .set("X-Forwarded-For", "10.0.0.100")
        .send(goodPayload);
    }
    const res = await request(app)
      .post("/api/intake/submit")
      .set("X-Forwarded-For", "10.0.0.100")
      .send(goodPayload);
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/too many/i);
  });

  it("scopes the limit per IP — a different IP still gets through", async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/intake/submit")
        .set("X-Forwarded-For", "10.0.0.101")
        .send(goodPayload);
    }
    const res = await request(app)
      .post("/api/intake/submit")
      .set("X-Forwarded-For", "10.0.0.102")
      .send(goodPayload);
    expect(res.status).toBe(201);
  });
});
