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
  sendIntakeNotification: vi.fn(async () => true),
  sendForwardFailureAlert: vi.fn(async () => {}),
  sendBookingNotification: vi.fn(async () => {}),
  sendBookingCustomerEmail: vi.fn(async () => {}),
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
  // Give each test its own rate-limit key so the sixth test in the file
  // doesn't 429 from prior tests' hits. Requests inject an X-Forwarded-For.
  app.set("trust proxy", true);
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

  it("prices a half-bath (2.5) on the TRUE count, and stores the true count", async () => {
    // Customer sees $165–175 in the browser for a 1500 sqft / 2½ bath /
    // biweekly standard clean. The estimate must be computed on 2.5, and —
    // now that booking_requests.bathrooms is `real` — the stored count is
    // the customer's actual 2.5, not a rounded 3.
    const res = await request(app)
      .post("/api/booking/submit")
      .set("X-Forwarded-For", "10.0.0.210")
      .send({
        ...basePayload,
        serviceType: "standard",
        sqft: 1500,
        bathrooms: 2.5,
        frequency: "biweekly",
        // A tampered browser range is ignored in favour of the recompute.
        estimateMin: 1,
        estimateMax: 5,
      });

    expect(res.status).toBe(201);
    expect(createdBookings).toHaveLength(1);
    expect(createdBookings[0].estimateMin).toBe(165);
    expect(createdBookings[0].estimateMax).toBe(175);
    // `real` column — the half-bath the customer entered survives verbatim.
    expect(createdBookings[0].bathrooms).toBe(2.5);
  });

  it("parses the requestedDate at LOCAL NOON — no previous-day drift", async () => {
    // `new Date("YYYY-MM-DD")` is UTC midnight, i.e. the prior evening in
    // Eastern time; the stored timestamp then rendered the day BEFORE the
    // one the customer picked.
    const res = await request(app)
      .post("/api/booking/submit")
      .set("X-Forwarded-For", "10.0.0.212")
      .send(basePayload);

    expect(res.status).toBe(201);
    const stored: Date = createdBookings[0].requestedDate;
    expect(stored.getHours()).toBe(12);
    const y = stored.getFullYear();
    const m = String(stored.getMonth() + 1).padStart(2, "0");
    const d = String(stored.getDate()).padStart(2, "0");
    expect(`${y}-${m}-${d}`).toBe(basePayload.requestedDate);
  });

  it("persists the /book essentials + idempotencyKey and returns a manage URL", async () => {
    // These fields were previously forwarded to BrightBase and DROPPED
    // locally; the manageToken/manageUrl are the new self-service handle.
    const res = await request(app)
      .post("/api/booking/submit")
      .set("X-Forwarded-For", "10.0.0.213")
      .send({
        ...basePayload,
        bedrooms: 3,
        entryMethod: "lockbox",
        parkingNotes: "Driveway on the left",
        petsDetail: "Friendly golden retriever",
        focusAreas: ["kitchen", "floors"],
        specialInstructions: "Alarm code 1234",
        idempotencyKey: "visit-uuid-1",
      });

    expect(res.status).toBe(201);
    const row = createdBookings[0];
    expect(row.bedrooms).toBe(3);
    expect(row.entryMethod).toBe("lockbox");
    expect(row.parkingNotes).toBe("Driveway on the left");
    expect(row.petsDetail).toBe("Friendly golden retriever");
    expect(row.focusAreas).toBe("kitchen, floors");
    expect(row.specialInstructions).toBe("Alarm code 1234");
    expect(row.idempotencyKey).toBe("visit-uuid-1");
    // Server-minted capability token, echoed back as a full URL.
    expect(row.manageToken).toBeTruthy();
    expect(res.body.manageToken).toBe(row.manageToken);
    expect(res.body.manageUrl).toContain(`/booking/manage/${row.manageToken}`);
  });

  it("sends the owner + customer booking emails (fire-and-forget)", async () => {
    const email = await import("../email");
    const ownerMock = email.sendBookingNotification as unknown as ReturnType<typeof vi.fn>;
    const customerMock = email.sendBookingCustomerEmail as unknown as ReturnType<typeof vi.fn>;
    ownerMock.mockClear();
    customerMock.mockClear();

    const res = await request(app)
      .post("/api/booking/submit")
      .set("X-Forwarded-For", "10.0.0.214")
      .send(basePayload);

    expect(res.status).toBe(201);
    expect(ownerMock).toHaveBeenCalledTimes(1);
    expect(ownerMock.mock.calls[0][1]).toBe("new");
    expect(ownerMock.mock.calls[0][0]).toMatchObject({
      name: basePayload.name,
      requestedDate: basePayload.requestedDate,
      serviceType: basePayload.serviceType,
    });
    expect(customerMock).toHaveBeenCalledTimes(1);
    expect(customerMock.mock.calls[0][0].email).toBe(basePayload.email);
    expect(customerMock.mock.calls[0][0].manageUrl).toContain("/booking/manage/");
  });

  it("rejects an unknown serviceType (was an open string)", async () => {
    const res = await request(app)
      .post("/api/booking/submit")
      .set("X-Forwarded-For", "10.0.0.211")
      .send({ ...basePayload, serviceType: "gold-plated-mansion-scrub" });

    expect(res.status).toBe(422);
    expect(Object.keys(res.body.errors)).toContain("serviceType");
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

  it("persists arrivalWindow and forwards it to Bright-Space", async () => {
    const { forwardLeadToBrightBase } = await import("../lib/brightbase");
    const mock = forwardLeadToBrightBase as unknown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const res = await request(app)
      .post("/api/booking/submit")
      .set("X-Forwarded-For", "10.0.0.220")
      .send({ ...basePayload, arrivalWindow: "morning" });

    expect(res.status).toBe(201);
    // Persisted on the booking row…
    expect(createdBookings[0].arrivalWindow).toBe("morning");
    // …and forwarded to Bright-Space under the canonical key.
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock.mock.calls[0][0].arrivalWindow).toBe("morning");
  });

  it("rejects an unknown arrivalWindow value", async () => {
    const res = await request(app)
      .post("/api/booking/submit")
      .set("X-Forwarded-For", "10.0.0.221")
      .send({ ...basePayload, arrivalWindow: "midnight" });

    expect(res.status).toBe(422);
    expect(Object.keys(res.body.errors)).toContain("arrivalWindow");
  });

  it("defaults arrivalWindow to null when omitted", async () => {
    const res = await request(app)
      .post("/api/booking/submit")
      .set("X-Forwarded-For", "10.0.0.222")
      .send(basePayload);

    expect(res.status).toBe(201);
    expect(createdBookings[0].arrivalWindow).toBeNull();
  });

  it("forwards the client-supplied idempotencyKey to Bright-Space", async () => {
    // Bright-Space PR #507 relies on this to collapse retries + the dual-
    // forward pattern into one Lead. Without it, the audit's M2 duplicate-
    // lead bug is not actually fixed in production.
    const { forwardLeadToBrightBase } = await import("../lib/brightbase");
    const mock = forwardLeadToBrightBase as unknown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const key = "test-uuid-01HW7XYZ-booking";
    const res = await request(app)
      .post("/api/booking/submit")
      // Distinct IP so this test doesn't share the earlier tests'
      // rate-limit bucket.
      .set("X-Forwarded-For", "10.0.0.201")
      .send({ ...basePayload, idempotencyKey: key });

    expect(res.status).toBe(201);
    expect(mock).toHaveBeenCalledTimes(1);
    const forwardedBody = mock.mock.calls[0][0];
    expect(forwardedBody.idempotencyKey).toBe(key);
  });
});
