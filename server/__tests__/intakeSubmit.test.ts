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
  // Resolves `true` = handed to SMTP transport (the new boolean contract).
  sendIntakeNotification: vi.fn(async () => true),
  sendForwardFailureAlert: vi.fn(async () => {}),
  sendBookingNotification: vi.fn(async () => {}),
  sendBookingCustomerEmail: vi.fn(async () => {}),
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

describe("POST /api/intake/submit contact requirement", () => {
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
  };

  it("rejects a submission with neither phone nor email (uncontactable lead)", async () => {
    const { email, phone, ...rest } = goodPayload;
    const res = await request(app)
      .post("/api/intake/submit")
      .set("X-Forwarded-For", "10.0.0.120")
      .send(rest);

    expect(res.status).toBe(422);
    expect(res.body.errors.email).toBeDefined();
    expect(String(res.body.errors.email)).toMatch(/phone number or email/i);
  });

  it("treats empty-string contact fields as missing", async () => {
    const res = await request(app)
      .post("/api/intake/submit")
      .set("X-Forwarded-For", "10.0.0.121")
      .send({ ...goodPayload, email: "", phone: "  " });

    expect(res.status).toBe(422);
  });

  it("accepts email-only submissions", async () => {
    const { phone, ...rest } = goodPayload;
    const res = await request(app)
      .post("/api/intake/submit")
      .set("X-Forwarded-For", "10.0.0.122")
      .send(rest);

    expect(res.status).toBe(201);
  });

  it("accepts phone-only submissions", async () => {
    const { email, ...rest } = goodPayload;
    const res = await request(app)
      .post("/api/intake/submit")
      .set("X-Forwarded-For", "10.0.0.123")
      .send(rest);

    expect(res.status).toBe(201);
  });
});

describe("POST /api/intake/submit email notification status", () => {
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
  };

  it("records 'skipped' when SMTP is unconfigured (sendEmail returned false)", async () => {
    // Regression: this used to record "sent" even though sendEmail silently
    // returned without sending anything.
    const { sendIntakeNotification } = await import("../email");
    const { storage } = await import("../storage");
    const emailMock = sendIntakeNotification as unknown as ReturnType<typeof vi.fn>;
    const statusMock = storage.updateIntakeSubmissionEmail as unknown as ReturnType<typeof vi.fn>;
    emailMock.mockResolvedValueOnce(false);
    statusMock.mockClear();

    const res = await request(app)
      .post("/api/intake/submit")
      .set("X-Forwarded-For", "10.0.0.130")
      .send(goodPayload);
    expect(res.status).toBe(201);

    // The notification is fire-and-forget — wait for the chained update.
    await vi.waitFor(() => expect(statusMock).toHaveBeenCalledWith(1, "skipped"));
  });

  it("records 'sent' when the transport actually accepted the message", async () => {
    const { storage } = await import("../storage");
    const statusMock = storage.updateIntakeSubmissionEmail as unknown as ReturnType<typeof vi.fn>;
    statusMock.mockClear();

    const res = await request(app)
      .post("/api/intake/submit")
      .set("X-Forwarded-For", "10.0.0.131")
      .send(goodPayload);
    expect(res.status).toBe(201);

    await vi.waitFor(() => expect(statusMock).toHaveBeenCalledWith(1, "sent"));
  });

  it("records 'failed' when the send throws", async () => {
    const { sendIntakeNotification } = await import("../email");
    const { storage } = await import("../storage");
    const emailMock = sendIntakeNotification as unknown as ReturnType<typeof vi.fn>;
    const statusMock = storage.updateIntakeSubmissionEmail as unknown as ReturnType<typeof vi.fn>;
    emailMock.mockRejectedValueOnce(new Error("SMTP down"));
    statusMock.mockClear();

    const res = await request(app)
      .post("/api/intake/submit")
      .set("X-Forwarded-For", "10.0.0.132")
      .send(goodPayload);
    expect(res.status).toBe(201);

    await vi.waitFor(() => expect(statusMock).toHaveBeenCalledWith(1, "failed"));
  });
});

describe("POST /api/intake/submit contact-form forwarding", () => {
  it("prefixes contact-form notes and omits requestedDate in the BrightBase forward", async () => {
    // A homepage contact-form question used to land in BrightBase as a
    // "residential" job dated TODAY. The general-inquiry prefix and the
    // dropped requestedDate keep it recognizable as a question.
    const { forwardLeadToBrightBase } = await import("../lib/brightbase");
    const mock = forwardLeadToBrightBase as unknown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const res = await request(app)
      .post("/api/intake/submit")
      .set("X-Forwarded-For", "10.0.0.140")
      .send({
        name: "Curious Customer",
        email: "curious@x.co",
        notes: "Do you clean ovens?",
        source: "contact_form",
      });

    expect(res.status).toBe(201);
    expect(mock).toHaveBeenCalledTimes(1);
    const forwarded = mock.mock.calls[0][0];
    expect(forwarded.notes).toBe("General inquiry (contact form): Do you clean ovens?");
    expect(forwarded.requestedDate ?? null).toBeNull();
  });
});
