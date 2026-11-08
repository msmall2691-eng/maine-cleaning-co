import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getPropertyShot, _clearPropertyShotCache } from "../streetView";

/**
 * The image leg of this lookup is billed per request, and the API answers
 * HTTP 200 even when it is refusing — both of which are easy to get wrong in
 * a way nothing else would catch. These tests pin the two behaviours that
 * follow from that: never pay for an image without confirming there is one,
 * and never read a refusal as a photo.
 */

const ADDRESS = "155 Keystone Dr, Saco, ME, 04072";

function metaResponse(status: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ status }),
    headers: { get: () => "application/json" },
  } as unknown as Response;
}

function imageResponse(contentType = "image/jpeg", bytes = new Uint8Array([0xff, 0xd8, 0xff])) {
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    headers: { get: (h: string) => (h.toLowerCase() === "content-type" ? contentType : null) },
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as Response;
}

let calls: string[];

function stubFetch(
  handler: (url: string, signal?: AbortSignal) => Response | Promise<Response> | null,
) {
  vi.stubGlobal("fetch", vi.fn(async (url: string | URL, init?: { signal?: AbortSignal }) => {
    const u = String(url);
    calls.push(u);
    const r = await handler(u, init?.signal);
    if (!r) throw new Error("network");
    return r;
  }));
}

beforeEach(() => {
  calls = [];
  _clearPropertyShotCache();
  process.env.GOOGLE_MAPS_API_KEY = "test-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete process.env.GOOGLE_MAPS_API_KEY;
});

const isMeta = (u: string) => u.includes("/streetview/metadata");
const isImage = (u: string) => u.includes("/streetview?") && !isMeta(u);

describe("getPropertyShot", () => {
  it("makes no request at all when no key is configured", async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    stubFetch(() => imageResponse());

    expect((await getPropertyShot(ADDRESS)).shot).toBeNull();
    expect(calls).toEqual([]);
  });

  it("asks the free metadata endpoint before the billed image endpoint", async () => {
    stubFetch((u) => (isMeta(u) ? metaResponse("OK") : imageResponse()));

    const { shot } = await getPropertyShot(ADDRESS);

    expect(shot).not.toBeNull();
    expect(calls).toHaveLength(2);
    expect(isMeta(calls[0])).toBe(true);
    expect(isImage(calls[1])).toBe(true);
  });

  it("never requests an image when there is no imagery to request", async () => {
    stubFetch((u) => (isMeta(u) ? metaResponse("ZERO_RESULTS") : imageResponse()));

    expect((await getPropertyShot(ADDRESS)).shot).toBeNull();
    // The whole point: one free call, and nothing billable behind it.
    expect(calls).toHaveLength(1);
    expect(calls.every(isMeta)).toBe(true);
  });

  it("reads a refusal as a refusal, even though it arrives as HTTP 200", async () => {
    // A missing or unauthorised key comes back 200 with a REQUEST_DENIED body
    // (verified against the live API). Code that branched on res.ok would
    // treat this as a valid panorama and go on to buy an image.
    stubFetch((u) => (isMeta(u) ? metaResponse("REQUEST_DENIED") : imageResponse()));
    const log = vi.fn();

    expect((await getPropertyShot(ADDRESS, log)).shot).toBeNull();
    expect(calls).toHaveLength(1);
    expect(log).toHaveBeenCalledWith("WARN", expect.stringMatching(/refused/i), { status: "REQUEST_DENIED" });
  });

  it("says nothing about ordinary missing coverage", async () => {
    stubFetch((u) => (isMeta(u) ? metaResponse("ZERO_RESULTS") : imageResponse()));
    const log = vi.fn();

    await getPropertyShot(ADDRESS, log);
    expect(log).not.toHaveBeenCalled();
  });

  it("keeps the customer's address out of everything it logs", async () => {
    stubFetch((u) => (isMeta(u) ? metaResponse("OVER_QUERY_LIMIT") : imageResponse()));
    const log = vi.fn();

    await getPropertyShot(ADDRESS, log);

    for (const call of log.mock.calls) {
      expect(JSON.stringify(call)).not.toContain("Keystone");
      expect(JSON.stringify(call)).not.toContain("04072");
    }
  });

  it("asks for an error code rather than Google's grey placeholder", async () => {
    // Without return_error_code the image endpoint answers a "no imagery
    // here" JPEG with HTTP 200, which is a perfectly valid picture of
    // nothing and would sail straight through to the customer.
    stubFetch((u) => (isMeta(u) ? metaResponse("OK") : imageResponse()));

    await getPropertyShot(ADDRESS);
    expect(calls[1]).toContain("return_error_code=true");
  });

  it("returns the bytes and the content type it was given", async () => {
    stubFetch((u) =>
      isMeta(u) ? metaResponse("OK") : imageResponse("image/jpeg", new Uint8Array([1, 2, 3, 4])),
    );

    const { shot } = await getPropertyShot(ADDRESS);
    expect(shot?.contentType).toBe("image/jpeg");
    expect(Array.from(shot!.body)).toEqual([1, 2, 3, 4]);
  });

  it("refuses a response that isn't an image", async () => {
    stubFetch((u) => (isMeta(u) ? metaResponse("OK") : imageResponse("text/html")));
    expect((await getPropertyShot(ADDRESS)).shot).toBeNull();
  });

  it("refuses a non-2xx image response", async () => {
    stubFetch((u) =>
      isMeta(u)
        ? metaResponse("OK")
        : ({ ok: false, status: 404, headers: { get: () => null } } as unknown as Response),
    );
    expect((await getPropertyShot(ADDRESS)).shot).toBeNull();
  });

  it("serves a repeat lookup from cache without paying twice", async () => {
    stubFetch((u) => (isMeta(u) ? metaResponse("OK") : imageResponse()));

    const first = await getPropertyShot(ADDRESS);
    const second = await getPropertyShot(ADDRESS);

    expect(second.shot).toEqual(first.shot);
    expect(calls).toHaveLength(2); // the first lookup's two, and no more
  });

  it("caches a confirmed absence too, so a camp road costs one call and not one per render", async () => {
    stubFetch((u) => (isMeta(u) ? metaResponse("ZERO_RESULTS") : imageResponse()));

    await getPropertyShot(ADDRESS);
    await getPropertyShot(ADDRESS);
    await getPropertyShot(ADDRESS);

    expect(calls).toHaveLength(1);
  });

  it("treats spacing and case as the same address", async () => {
    stubFetch((u) => (isMeta(u) ? metaResponse("OK") : imageResponse()));

    await getPropertyShot(ADDRESS);
    await getPropertyShot("  155 KEYSTONE DR,   Saco, ME, 04072 ");

    expect(calls).toHaveLength(2);
  });

  it("retries a refused key within the minute, instead of hiding it until tomorrow", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));

    let status = "REQUEST_DENIED";
    stubFetch((u) => (isMeta(u) ? metaResponse(status) : imageResponse()));

    expect((await getPropertyShot(ADDRESS)).shot).toBeNull();
    expect(calls).toHaveLength(1);

    // Still inside the short transient window: no second ask.
    vi.setSystemTime(new Date("2026-11-08T12:00:30Z"));
    expect((await getPropertyShot(ADDRESS)).shot).toBeNull();
    expect(calls).toHaveLength(1);

    // Past it — and the key has been fixed in Railway in the meantime.
    vi.setSystemTime(new Date("2026-11-08T12:02:00Z"));
    status = "OK";
    expect((await getPropertyShot(ADDRESS)).shot).not.toBeNull();
    expect(calls).toHaveLength(3);
  });

  it("holds a confirmed absence for the day, not for the minute", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
    stubFetch((u) => (isMeta(u) ? metaResponse("ZERO_RESULTS") : imageResponse()));

    await getPropertyShot(ADDRESS);
    vi.setSystemTime(new Date("2026-11-08T13:00:00Z"));
    await getPropertyShot(ADDRESS);

    expect(calls).toHaveLength(1);
  });

  it("survives a network failure without throwing", async () => {
    stubFetch(() => null);
    expect((await getPropertyShot(ADDRESS)).shot).toBeNull();
  });

  it("evicts oldest-first rather than growing without bound", async () => {
    // 1MB a shot, 4MB cap: the fifth insert must push the first out.
    const big = new Uint8Array(1024 * 1024);
    stubFetch((u) => (isMeta(u) ? metaResponse("OK") : imageResponse("image/jpeg", big)));

    for (let i = 1; i <= 5; i++) await getPropertyShot(`${i} Main St, Saco, ME, 04072`);
    expect(calls).toHaveLength(10);

    // The newest is still cached; the oldest has been evicted and costs again.
    await getPropertyShot("5 Main St, Saco, ME, 04072");
    expect(calls).toHaveLength(10);

    await getPropertyShot("1 Main St, Saco, ME, 04072");
    expect(calls).toHaveLength(12);
  });

  it("bounds the misses too, which weigh nothing against the byte limit", async () => {
    // A miss is a few hundred bytes of key and metadata, so the byte bound
    // never sees it. Left unbounded this map grows for every distinct address
    // — the common case on rural roads, the ONLY case during an outage, and
    // ~29,000 addresses a day from one IP at the route's rate limit — while
    // reporting itself comfortably under 4MB the whole way down.
    stubFetch((u) => (isMeta(u) ? metaResponse("ZERO_RESULTS") : imageResponse()));

    for (let i = 1; i <= 300; i++) await getPropertyShot(`${i} Main St, Saco, ME, 04072`);
    expect(calls).toHaveLength(300);

    // The newest is still cached...
    await getPropertyShot("300 Main St, Saco, ME, 04072");
    expect(calls).toHaveLength(300);

    // ...and the oldest was evicted rather than kept for ever.
    await getPropertyShot("1 Main St, Saco, ME, 04072");
    expect(calls).toHaveLength(301);
  });

  it("aborts a response whose body stalls after the headers arrive", async () => {
    // fetch() resolves on HEADERS. A timer cleared at that moment leaves the
    // body transfer with no deadline at all, so a server that flushes headers
    // and then stalls holds the socket open for ever.
    vi.useFakeTimers();
    stubFetch((u, signal) => {
      if (isMeta(u)) return metaResponse("OK");
      return {
        ok: true,
        status: 200,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: () =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      } as unknown as Response;
    });

    const pending = getPropertyShot(ADDRESS);
    await vi.advanceTimersByTimeAsync(10_000);

    expect((await pending).shot).toBeNull();
  });

  it("returns null when the connection dies mid-image instead of throwing", async () => {
    stubFetch((u) =>
      isMeta(u)
        ? metaResponse("OK")
        : ({
            ok: true,
            status: 200,
            headers: { get: () => "image/jpeg" },
            arrayBuffer: async () => {
              throw new Error("socket hang up");
            },
          } as unknown as Response),
    );

    // The module's contract is that every kind of nothing is a null shot.
    await expect(getPropertyShot(ADDRESS)).resolves.toEqual({
      shot: null,
      maxAgeSeconds: 60,
    });
  });

  it("returns null when the metadata body is unreadable", async () => {
    stubFetch((u) =>
      isMeta(u)
        ? ({
            ok: true,
            status: 200,
            json: async () => {
              throw new Error("socket hang up");
            },
          } as unknown as Response)
        : imageResponse(),
    );

    expect((await getPropertyShot(ADDRESS)).shot).toBeNull();
    expect(calls).toHaveLength(1);
  });
});

describe("getPropertyShot lifetimes", () => {
  // The route puts maxAgeSeconds straight into Cache-Control, so these are
  // what a BROWSER will hold the answer for. Getting the transient ones wrong
  // outlives the server's own mistake: a visitor who loaded the page while
  // the key was misconfigured would keep being shown nothing long after the
  // server recovered.
  it("keeps a photo, and a confirmed absence, for a day", async () => {
    stubFetch((u) => (isMeta(u) ? metaResponse("OK") : imageResponse()));
    expect((await getPropertyShot(ADDRESS)).maxAgeSeconds).toBe(86400);

    _clearPropertyShotCache();
    stubFetch((u) => (isMeta(u) ? metaResponse("ZERO_RESULTS") : imageResponse()));
    expect((await getPropertyShot("9 Other Rd, Saco, ME, 04072")).maxAgeSeconds).toBe(86400);
  });

  it("keeps a refused key, a network failure and an unset key for a minute", async () => {
    stubFetch((u) => (isMeta(u) ? metaResponse("REQUEST_DENIED") : imageResponse()));
    expect((await getPropertyShot(ADDRESS)).maxAgeSeconds).toBe(60);

    _clearPropertyShotCache();
    stubFetch(() => null);
    expect((await getPropertyShot("9 Other Rd, Saco, ME, 04072")).maxAgeSeconds).toBe(60);

    // An unset key is a thing someone is about to fix in Railway, not a fact
    // about the address — so it must not earn a day of browser caching.
    delete process.env.GOOGLE_MAPS_API_KEY;
    expect((await getPropertyShot("11 Third St, Saco, ME, 04072")).maxAgeSeconds).toBe(60);
  });
});
