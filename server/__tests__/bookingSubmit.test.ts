import { describe, it, expect, beforeEach, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";

// Mock the storage layer, forwards, and geocoder BEFORE importing routes so
// the mocks are in place when the module evaluates.
const createdBookings: any[] = [];
vi.mock("../storage", () => ({
  storage: {
    createBookingRequest: vi.fn(async (data: any) => {
      const row = { id: createdBookings.length + 1, ...data };
      createdBookings.push(row);
      return row;
    }),
    updateBookingRequestExternalIds: vi.fn(async () => {}),
    createIntakeSubmission: vi.fn(async () => ({ id: 1 })),
    updateIntakeSubmissionEmail: vi.fn(async () => {}),
    updateIntakeSubmissionQuoteLead: vi.fn(async () => {}),
    getUserByEmail: vi.fn(async () => null),
    getBookingRequests: vi.fn(async () => ({ bookings: [], total: 0 })),
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

// Bypass PG session store — auth setup only touches session middleware.
vi.mock("../auth", async () => {
  const session = await import("express-session");
  return {
    setupAuth: (app: Express) => {
      app.use(session.default({
        secret: "test-secret",
        resave: false,
        saveUninitialized: false,
      }));
    },
    hashPassword: async (p: string) => p,
    comparePassword: async () => false,
    requireAuth: (_req: any, res: any) => res.status(401).json({ message: "unauth" }),
    requireAdmin: (_req: any, res: any) => res.status(401).json({ message: "unauth" }),
  };
});

vi.mock("../lib/normalize", () => ({
  normalizeIntakePayload: (p: any) => p,
}));

vi.mock("openai", () => ({ default: class {} }));

import { registerRoutes } from "../routes";
import { createServer } from "http";

let app: Express;
beforeEach(async () => {
  createdBookings.length = 0;
  app = express();
  app.use(express.json());
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
});

describe("POST /api/booking/submit", () => {
  const basePayload = {
    name: "Test",
    email: "t@x.co",
    phone: "2075551234",
    address: "100 Congress St, Portland, ME",
    zip: "04101",
    serviceType: "deep",
    frequency: "biweekly",
    sqft: 1500,
    bathrooms: 2,
    petHair: "none",
    condition: "maintenance",
    // In the near-future so it clears MIN_LEAD_DAYS.
    requestedDate: new Date(Date.now() + 30 * 24 * 3600_000).toISOString().slice(0, 10),
    distanceMiles: 5,
  };

  it("persists the SERVER-computed estimate, not the browser's tampered one", async () => {
    // Attacker claim: 1-5. Server computes 250-270 (see quoteEngine tests).
    const res = await request(app)
      .post("/api/booking/submit")
      .send({ ...basePayload, estimateMin: 1, estimateMax: 5 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(createdBookings).toHaveLength(1);
    expect(createdBookings[0].estimateMin).toBe(250);
    expect(createdBookings[0].estimateMax).toBe(270);
  });

  it("keeps the client's estimate for STR (custom-quote — server can't compute)", async () => {
    const res = await request(app)
      .post("/api/booking/submit")
      .send({
        ...basePayload,
        serviceType: "vacation-rental",
        estimateMin: 175,
        estimateMax: 225,
      });

    expect(res.status).toBe(201);
    expect(createdBookings[0].estimateMin).toBe(175);
    expect(createdBookings[0].estimateMax).toBe(225);
  });

  it("returns 422 with field-level errors on bad input (no name)", async () => {
    const { name, ...rest } = basePayload;
    const res = await request(app).post("/api/booking/submit").send(rest);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
    expect(Object.keys(res.body.errors)).toContain("name");
  });

  it("rejects a requestedDate that's inside the MIN_LEAD_DAYS window", async () => {
    const res = await request(app)
      .post("/api/booking/submit")
      .send({ ...basePayload, requestedDate: new Date().toISOString().slice(0, 10) });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least/i);
  });

  it("rejects a booking outside the service radius", async () => {
    const res = await request(app)
      .post("/api/booking/submit")
      .send({ ...basePayload, distanceMiles: 500 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/service area/i);
  });
});
