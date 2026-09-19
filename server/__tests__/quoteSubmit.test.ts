/**
 * POST /api/quotes — the legacy public quote form.
 *
 * Nothing on the site posts here any more (the calculator posts to
 * /api/intake/submit), but the route is public, unauthenticated and still
 * writes a real quote_leads row, creates a portal account and emails the
 * customer. Until now it forwarded nowhere: PR #63 removed its send to the
 * retired maine-cleaning-admin Railway intake and left the route writing to
 * the database and nothing else, so anything still posting here would be
 * invisible in BrightBase.
 *
 * These pin the two things that matter if it IS still live:
 *   • the lead reaches BrightBase, tagged sourceType "quote";
 *   • the estimate is recomputed server-side, so a tampered client price
 *     can't be stored or handed to the operator.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";

let created: any[] = [];

vi.mock("../storage", () => ({
  storage: {
    // Echo the row back the way the real insert does, so the handler
    // forwards the PERSISTED values rather than the request body.
    createQuoteLead: vi.fn(async (lead: any) => {
      const row = { id: 77, ...lead };
      created.push(row);
      return row;
    }),
    getUserByEmail: vi.fn(async () => null),
    createUser: vi.fn(async () => ({ id: "user-1" })),
    updateQuoteLeadClient: vi.fn(async () => {}),
    createIntakeSubmission: vi.fn(async () => ({ id: 1 })),
    updateIntakeSubmissionEmail: vi.fn(async () => {}),
    createBookingRequest: vi.fn(async () => ({ id: 1 })),
    updateBookingRequestExternalIds: vi.fn(async () => {}),
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
  sendIntakeNotification: vi.fn(async () => true),
  sendForwardFailureAlert: vi.fn(async () => {}),
  sendBookingNotification: vi.fn(async () => {}),
  sendBookingCustomerEmail: vi.fn(async () => {}),
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
import { forwardLeadToBrightBase } from "../lib/brightbase";

const forwardMock = forwardLeadToBrightBase as unknown as ReturnType<typeof vi.fn>;

let app: Express;
beforeEach(async () => {
  created = [];
  forwardMock.mockClear();
  app = express();
  app.set("trust proxy", true);
  app.use(express.json());
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
});

// 1200 sqft / 2 bath / biweekly standard, no pet hair, maintenance condition
// prices at $125–$135 server-side (same figures pinned in intakeSubmit.test.ts).
const goodPayload = {
  name: "Test",
  email: "quote-test@example.com",
  phone: "2075551234",
  serviceType: "standard",
  sqft: 1200,
  frequency: "biweekly",
  petHair: "none",
  condition: "maintenance",
  bathrooms: 2,
  estimateMin: 125,
  estimateMax: 135,
};

describe("POST /api/quotes", () => {
  it("forwards the lead to BrightBase tagged as a quote", async () => {
    const res = await request(app)
      .post("/api/quotes")
      .set("X-Forwarded-For", "10.0.1.10")
      .send(goodPayload);

    expect(res.status).toBe(201);
    expect(forwardMock).toHaveBeenCalledTimes(1);

    const [body, ctx] = forwardMock.mock.calls[0];
    expect(ctx).toMatchObject({ sourceType: "quote", sourceId: 77 });
    expect(body).toMatchObject({
      email: "quote-test@example.com",
      phone: "2075551234",
      serviceType: "standard",
      sqft: 1200,
      bathrooms: 2,
      frequency: "biweekly",
    });
    // Provenance so the operator can tell this came from the legacy form and
    // not the calculator — the two land on the same Requests page.
    expect(body.notes).toMatch(/Quote form submission/);
  });

  it("passes the client-supplied idempotencyKey through", async () => {
    const key = "test-uuid-01HW7XYZ-quote";
    const res = await request(app)
      .post("/api/quotes")
      .set("X-Forwarded-For", "10.0.1.11")
      .send({ ...goodPayload, idempotencyKey: key });

    expect(res.status).toBe(201);
    expect(forwardMock.mock.calls[0][0].idempotencyKey).toBe(key);
  });

  it("recomputes the estimate server-side, ignoring a tampered client range", async () => {
    // Attacker claims $5–9 for a job the engine prices at $125–135. Before the
    // recompute, this route stored the tampered range verbatim — and once it
    // forwards, the operator would have been quoted $5 on the Requests page.
    const res = await request(app)
      .post("/api/quotes")
      .set("X-Forwarded-For", "10.0.1.12")
      .send({ ...goodPayload, estimateMin: 5, estimateMax: 9 });

    expect(res.status).toBe(201);
    // Stored…
    expect(created[0]).toMatchObject({ estimateMin: 125, estimateMax: 135 });
    // …and forwarded.
    const body = forwardMock.mock.calls[0][0];
    expect(body.estimateMin).toBe(125);
    expect(body.estimateMax).toBe(135);
  });

  it("keeps the client's figure for a custom-quoted service the engine won't price", async () => {
    // STR / commercial / move-in-out come back null from calculateQuote and
    // quote_leads.estimate_min is NOT NULL, so the client's number is all
    // there is. Guards the fallback against becoming a crash or a zero.
    const res = await request(app)
      .post("/api/quotes")
      .set("X-Forwarded-For", "10.0.1.13")
      .send({ ...goodPayload, serviceType: "commercial", estimateMin: 400, estimateMax: 600 });

    expect(res.status).toBe(201);
    expect(created[0]).toMatchObject({ estimateMin: 400, estimateMax: 600 });
  });

  it("forwards nothing when the payload fails validation", async () => {
    const res = await request(app)
      .post("/api/quotes")
      .set("X-Forwarded-For", "10.0.1.14")
      .send({ name: "No service type" });

    expect(res.status).toBe(400);
    expect(forwardMock).not.toHaveBeenCalled();
  });
});
