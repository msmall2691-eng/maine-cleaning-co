import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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
import { _clearPropertyShotCache } from "../lib/streetView";
import { createServer } from "http";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

function stubGoogle(metaStatus: string) {
  vi.stubGlobal("fetch", vi.fn(async (url: string | URL) => {
    const u = String(url);
    if (u.includes("/streetview/metadata")) {
      return { ok: true, status: 200, json: async () => ({ status: metaStatus }) } as unknown as Response;
    }
    return {
      ok: true,
      status: 200,
      headers: { get: (h: string) => (h.toLowerCase() === "content-type" ? "image/jpeg" : null) },
      arrayBuffer: async () => JPEG.buffer.slice(0),
    } as unknown as Response;
  }));
}

let app: Express;
let ipCounter = 0;

beforeEach(async () => {
  _clearPropertyShotCache();
  app = express();
  app.set("trust proxy", true);
  app.use(express.json());
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  // A fresh source IP per test, so one test's requests never eat another's
  // rate-limit budget (the limiter is module-level and outlives the app).
  ipCounter += 1;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GOOGLE_MAPS_API_KEY;
});

const ip = () => `203.0.113.${ipCounter}`;
const ADDRESS = "155 Keystone Dr, Saco, ME, 04072";

describe("GET /api/property-photo", () => {
  it("404s quietly when no key is configured, rather than erroring", async () => {
    // This is the state of every deployment that hasn't set the key yet, and
    // of every local dev server. The estimator hides the frame on a 404, so
    // the feature is simply absent instead of broken.
    stubGoogle("OK");
    const res = await request(app)
      .get("/api/property-photo")
      .query({ address: ADDRESS })
      .set("X-Forwarded-For", ip());

    expect(res.status).toBe(404);
    expect(res.body).toEqual({});
  });

  it("serves the image with the content type Google gave it", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "test-key";
    stubGoogle("OK");

    const res = await request(app)
      .get("/api/property-photo")
      .query({ address: ADDRESS })
      .set("X-Forwarded-For", ip());

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/jpeg");
    expect(Array.from(res.body as Buffer)).toEqual(Array.from(JPEG));
  });

  it("marks the response private and non-indexable", async () => {
    // The URL carries a customer's home address: a shared cache must not hold
    // it, and a crawler must not file it.
    process.env.GOOGLE_MAPS_API_KEY = "test-key";
    stubGoogle("OK");

    const res = await request(app)
      .get("/api/property-photo")
      .query({ address: ADDRESS })
      .set("X-Forwarded-For", ip());

    expect(res.headers["cache-control"]).toContain("private");
    expect(res.headers["cache-control"]).not.toContain("public");
    expect(res.headers["x-robots-tag"]).toBe("noindex");
  });

  it("lets the browser cache the miss too, so a failed <img> isn't re-fetched on every keystroke", async () => {
    stubGoogle("ZERO_RESULTS");
    const res = await request(app)
      .get("/api/property-photo")
      .query({ address: ADDRESS })
      .set("X-Forwarded-For", ip());

    expect(res.status).toBe(404);
    expect(res.headers["cache-control"]).toContain("private");
    expect(res.headers["cache-control"]).toContain("max-age=86400");
  });

  it("rejects a missing or implausibly short address without calling Google", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "test-key";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    expect((await request(app).get("/api/property-photo").set("X-Forwarded-For", ip())).status).toBe(400);
    expect(
      (await request(app).get("/api/property-photo").query({ address: "ME" }).set("X-Forwarded-For", ip())).status,
    ).toBe(400);
    expect(
      (await request(app)
        .get("/api/property-photo")
        .query({ address: "x".repeat(301) })
        .set("X-Forwarded-For", ip())).status,
    ).toBe(400);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rate limits at 20 a minute from one address", async () => {
    // The image leg is billed per request, so an unauthenticated endpoint
    // that proxies it has to have a ceiling.
    process.env.GOOGLE_MAPS_API_KEY = "test-key";
    stubGoogle("OK");
    const from = ip();

    for (let i = 0; i < 20; i++) {
      const res = await request(app)
        .get("/api/property-photo")
        // A distinct address each time, so the in-process cache can't absorb
        // the burst and hide the limiter.
        .query({ address: `${i} Main St, Saco, ME, 04072` })
        .set("X-Forwarded-For", from);
      expect(res.status).toBe(200);
    }

    const over = await request(app)
      .get("/api/property-photo")
      .query({ address: "21 Main St, Saco, ME, 04072" })
      .set("X-Forwarded-For", from);
    expect(over.status).toBe(429);
  });
});
