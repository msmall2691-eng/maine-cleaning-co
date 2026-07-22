/**
 * Payload-contract tests for the BrightBase forwards.
 *
 *   1. forwardLeadToBrightBase must OMIT requestedDate when the source has
 *      none (contact-form questions used to get a fabricated "today" and
 *      show up on the Requests page as jobs dated today);
 *   2. forwardBookingUpdateToBrightBase posts the documented change-set
 *      contract to /api/booking/update under the "brightbase-update"
 *      ledger destination.
 *
 * runForward is mocked to immediately run the attempt so the fetch stub
 * captures the exact HTTP payload each forward builds.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const runForwardMock = vi.fn(async (opts: any) => {
  await opts.attempt();
  return 1;
});
vi.mock("../leadForward", () => ({
  runForward: (opts: any) => runForwardMock(opts),
  recordSkipped: vi.fn(async () => {}),
}));

const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
vi.stubGlobal("fetch", fetchMock);

async function loadModule() {
  vi.resetModules();
  process.env.BRIGHTBASE_API_URL = "https://brightbase.example";
  return await import("../brightbase");
}

beforeEach(() => {
  runForwardMock.mockClear();
  fetchMock.mockClear();
});

function sentBody(callIndex = 0): Record<string, any> {
  const [, init] = fetchMock.mock.calls[callIndex] as unknown as [string, RequestInit];
  return JSON.parse(String(init.body));
}

describe("forwardLeadToBrightBase requestedDate handling", () => {
  it("omits requestedDate entirely when the source has none", async () => {
    const { forwardLeadToBrightBase } = await loadModule();
    await forwardLeadToBrightBase(
      { name: "Curious", email: "c@x.co", notes: "General inquiry (contact form): hours?" },
      { sourceType: "intake", sourceId: 1 },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = sentBody();
    expect(body).not.toHaveProperty("requestedDate");
    expect(body.notes).toContain("General inquiry");
  });

  it("still passes an explicit requestedDate through", async () => {
    const { forwardLeadToBrightBase } = await loadModule();
    await forwardLeadToBrightBase(
      { name: "Booker", phone: "207", requestedDate: "2027-09-10" },
      { sourceType: "booking", sourceId: 2 },
    );

    expect(sentBody().requestedDate).toBe("2027-09-10");
  });

  it("forwards manageUrl on the booking path when set", async () => {
    const { forwardLeadToBrightBase } = await loadModule();
    const manageUrl = "https://maineclean.co/booking/manage/abc-123";
    await forwardLeadToBrightBase(
      { name: "Booker", phone: "207", requestedDate: "2027-09-10", manageUrl },
      { sourceType: "booking", sourceId: 3 },
    );

    expect(sentBody().manageUrl).toBe(manageUrl);
  });

  it("omits manageUrl when not provided", async () => {
    const { forwardLeadToBrightBase } = await loadModule();
    await forwardLeadToBrightBase(
      { name: "Booker", phone: "207", requestedDate: "2027-09-10" },
      { sourceType: "booking", sourceId: 4 },
    );

    expect(sentBody()).not.toHaveProperty("manageUrl");
  });
});

describe("forwardBookingUpdateToBrightBase", () => {
  it("posts the change-set contract to /api/booking/update", async () => {
    const { forwardBookingUpdateToBrightBase } = await loadModule();
    await forwardBookingUpdateToBrightBase(
      {
        idempotencyKey: "idem-9",
        requestedDate: "2027-10-01",
        entryMethod: "gate-code",
        bedrooms: 4,
      },
      { sourceType: "booking", sourceId: 9 },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    expect(url).toBe("https://brightbase.example/api/booking/update");
    expect(sentBody()).toEqual({
      idempotencyKey: "idem-9",
      requestedDate: "2027-10-01",
      entryMethod: "gate-code",
      bedrooms: 4,
    });
    // Its own ledger destination — distinguishes "lead never arrived" from
    // "lead arrived but a later edit didn't".
    expect(runForwardMock.mock.calls[0][0].destination).toBe("brightbase-update");
  });

  it("sends {cancel:true} for cancellations", async () => {
    const { forwardBookingUpdateToBrightBase } = await loadModule();
    await forwardBookingUpdateToBrightBase(
      { idempotencyKey: "idem-9", cancel: true },
      { sourceType: "booking", sourceId: 9 },
    );

    expect(sentBody()).toEqual({ idempotencyKey: "idem-9", cancel: true });
  });
});
