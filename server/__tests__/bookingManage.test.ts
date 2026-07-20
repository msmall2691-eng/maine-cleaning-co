/**
 * Customer self-service booking management — the capability-URL endpoints
 * (GET/PATCH /api/booking/manage/:token, POST .../cancel).
 *
 * Coverage priorities:
 *   1. token is the credential: unknown token → 404, and the summary never
 *      echoes email/phone (limit what a leaked link exposes);
 *   2. edits respect the same MIN_LEAD_DAYS gate as submit;
 *   3. terminal statuses lock the booking (409), cancel is idempotent;
 *   4. changes fan out: BrightBase update forward + owner email.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";

// In-memory booking rows keyed by manage token — mirrors the storage mock
// pattern in bookingSubmit.test.ts.
const bookings = new Map<string, any>();

function seedBooking(overrides: Record<string, any> = {}) {
  const row = {
    id: 7,
    intakeId: null,
    name: "Meg Small",
    email: "meg@example.com",
    phone: "2075551234",
    address: "100 Congress St, Portland, ME",
    zip: "04101",
    serviceType: "deep",
    frequency: "one-time",
    sqft: 1500,
    bathrooms: 2.5,
    bedrooms: 3,
    petHair: "some",
    condition: "maintenance",
    estimateMin: 250,
    estimateMax: 270,
    requestedDate: new Date("2027-09-10T12:00:00"),
    distanceMiles: 5,
    status: "pending",
    entryMethod: "lockbox",
    parkingNotes: "Driveway",
    petsDetail: "Friendly dog",
    focusAreas: "kitchen, floors",
    specialInstructions: null,
    manageToken: "tok-valid",
    idempotencyKey: "idem-1",
    ...overrides,
  };
  bookings.set(row.manageToken, row);
  return row;
}

vi.mock("../storage", () => ({
  storage: {
    getBookingRequestByManageToken: vi.fn(async (token: string) => bookings.get(token)),
    updateBookingRequestFields: vi.fn(async (id: number, patch: any) => {
      const row = [...bookings.values()].find((b) => b.id === id);
      if (!row) return undefined;
      Object.assign(row, patch, { updatedAt: new Date() });
      return row;
    }),
    updateBookingRequestStatus: vi.fn(async (id: number, status: string) => {
      const row = [...bookings.values()].find((b) => b.id === id);
      if (!row) return undefined;
      row.status = status;
      row.updatedAt = new Date();
      return row;
    }),
    createBookingRequest: vi.fn(async (data: any) => ({ id: 1, ...data })),
    updateBookingRequestExternalIds: vi.fn(async () => {}),
    createIntakeSubmission: vi.fn(async () => ({ id: 1 })),
    updateIntakeSubmissionEmail: vi.fn(async () => {}),
    updateIntakeSubmissionQuoteLead: vi.fn(async () => {}),
    getUserByEmail: vi.fn(async () => null),
    getBookingRequests: vi.fn(async () => ({ bookings: [], total: 0 })),
  },
}));

vi.mock("../lib/brightbase", () => ({
  forwardLeadToBrightBase: vi.fn(async () => {}),
  forwardBookingUpdateToBrightBase: vi.fn(async () => {}),
}));
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

vi.mock("../lib/normalize", () => ({
  normalizeIntakePayload: (p: any) => p,
}));

vi.mock("openai", () => ({ default: class {} }));

import { registerRoutes } from "../routes";
import { createServer } from "http";
import { forwardBookingUpdateToBrightBase } from "../lib/brightbase";
import { sendBookingNotification } from "../email";

const forwardMock = forwardBookingUpdateToBrightBase as unknown as ReturnType<typeof vi.fn>;
const ownerEmailMock = sendBookingNotification as unknown as ReturnType<typeof vi.fn>;

// A reschedule target far enough out to always clear MIN_LEAD_DAYS.
const futureDate = new Date(Date.now() + 30 * 24 * 3600_000).toISOString().slice(0, 10);

let app: Express;
beforeEach(async () => {
  bookings.clear();
  forwardMock.mockClear();
  ownerEmailMock.mockClear();
  app = express();
  app.set("trust proxy", true);
  app.use(express.json());
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
});

describe("GET /api/booking/manage/:token", () => {
  it("returns the booking summary WITHOUT email/phone", async () => {
    seedBooking();
    const res = await request(app).get("/api/booking/manage/tok-valid");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 7,
      name: "Meg Small",
      serviceType: "deep",
      requestedDate: "2027-09-10",
      address: "100 Congress St, Portland, ME",
      status: "pending",
      bedrooms: 3,
      entryMethod: "lockbox",
      parkingNotes: "Driveway",
      petsDetail: "Friendly dog",
      focusAreas: "kitchen, floors",
      estimateMin: 250,
      estimateMax: 270,
    });
    // Capability links get forwarded/leaked — never echo contact channels.
    expect(res.body).not.toHaveProperty("email");
    expect(res.body).not.toHaveProperty("phone");
  });

  it("404s on an unknown token", async () => {
    const res = await request(app).get("/api/booking/manage/tok-nope");
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/booking/manage/:token", () => {
  it("updates the editable fields, forwards to BrightBase, and emails the owner", async () => {
    seedBooking();
    const res = await request(app)
      .patch("/api/booking/manage/tok-valid")
      .set("X-Forwarded-For", "10.1.0.1")
      .send({
        requestedDate: futureDate,
        entryMethod: "gate-code",
        parkingNotes: "Use visitor spot 4",
        specialInstructions: "Please skip the office",
        bedrooms: 4,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.booking).toMatchObject({
      requestedDate: futureDate,
      entryMethod: "gate-code",
      parkingNotes: "Use visitor spot 4",
      specialInstructions: "Please skip the office",
      bedrooms: 4,
    });

    // The stored timestamp is the local-noon parse of the new date.
    const stored = bookings.get("tok-valid").requestedDate as Date;
    expect(stored.getHours()).toBe(12);

    // Change mirrored into BrightBase, addressed by the original submit's key.
    expect(forwardMock).toHaveBeenCalledTimes(1);
    expect(forwardMock.mock.calls[0][0]).toMatchObject({
      idempotencyKey: "idem-1",
      requestedDate: futureDate,
      entryMethod: "gate-code",
    });
    expect(forwardMock.mock.calls[0][1]).toMatchObject({ sourceType: "booking", sourceId: 7 });

    // Office hears about customer-driven changes.
    expect(ownerEmailMock).toHaveBeenCalledTimes(1);
    expect(ownerEmailMock.mock.calls[0][1]).toBe("updated");
  });

  it("rejects a requestedDate inside the MIN_LEAD_DAYS window", async () => {
    seedBooking();
    const today = new Date().toISOString().slice(0, 10);
    const res = await request(app)
      .patch("/api/booking/manage/tok-valid")
      .set("X-Forwarded-For", "10.1.0.2")
      .send({ requestedDate: today });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least/i);
    expect(forwardMock).not.toHaveBeenCalled();
  });

  it("409s when the booking is cancelled (terminal)", async () => {
    seedBooking({ status: "cancelled" });
    const res = await request(app)
      .patch("/api/booking/manage/tok-valid")
      .set("X-Forwarded-For", "10.1.0.3")
      .send({ requestedDate: futureDate });

    expect(res.status).toBe(409);
    expect(forwardMock).not.toHaveBeenCalled();
  });

  it("404s on an unknown token", async () => {
    const res = await request(app)
      .patch("/api/booking/manage/tok-nope")
      .set("X-Forwarded-For", "10.1.0.4")
      .send({ requestedDate: futureDate });
    expect(res.status).toBe(404);
  });

  it("skips the BrightBase forward when the row has no idempotencyKey", async () => {
    // Pre-manage-page rows have no key — there is nothing to address the
    // BrightBase lead by, so no update forward should fire.
    seedBooking({ idempotencyKey: null });
    const res = await request(app)
      .patch("/api/booking/manage/tok-valid")
      .set("X-Forwarded-For", "10.1.0.5")
      .send({ entryMethod: "other" });

    expect(res.status).toBe(200);
    expect(forwardMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/booking/manage/:token/cancel", () => {
  it("cancels the booking, forwards {cancel:true}, and emails the owner", async () => {
    seedBooking();
    const res = await request(app)
      .post("/api/booking/manage/tok-valid/cancel")
      .set("X-Forwarded-For", "10.1.0.6");

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe("cancelled");
    expect(bookings.get("tok-valid").status).toBe("cancelled");

    expect(forwardMock).toHaveBeenCalledTimes(1);
    expect(forwardMock.mock.calls[0][0]).toEqual({ idempotencyKey: "idem-1", cancel: true });

    expect(ownerEmailMock).toHaveBeenCalledTimes(1);
    expect(ownerEmailMock.mock.calls[0][1]).toBe("cancelled");
  });

  it("is idempotent — cancelling an already-cancelled booking is a 200 no-op", async () => {
    seedBooking({ status: "cancelled" });
    const res = await request(app)
      .post("/api/booking/manage/tok-valid/cancel")
      .set("X-Forwarded-For", "10.1.0.7");

    expect(res.status).toBe(200);
    expect(forwardMock).not.toHaveBeenCalled();
    expect(ownerEmailMock).not.toHaveBeenCalled();
  });

  it("404s on an unknown token", async () => {
    const res = await request(app)
      .post("/api/booking/manage/tok-nope/cancel")
      .set("X-Forwarded-For", "10.1.0.8");
    expect(res.status).toBe(404);
  });
});
