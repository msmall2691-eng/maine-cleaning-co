/**
 * A Street View photo of the address a customer typed into the estimator.
 *
 * WHY THIS IS A SERVER MODULE AND NOT A CLIENT ONE: the Street View Static
 * API authenticates with `key=` in the QUERY STRING. It has no header form —
 * `X-Goog-Api-Key` is ignored, and a request with an empty `key=` and that
 * header set is refused with "This functionality is only available if an API
 * key or a client ID is provided" (checked against the live API, Nov 2026).
 * So a key used from the browser would sit in the page source for anyone to
 * lift and spend. Everything here runs server-side and the browser only ever
 * sees /api/property-photo.
 *
 * THE OTHER THING THE LIVE API TAUGHT US: it answers HTTP 200 even when it is
 * refusing. A missing key comes back as 200 with `{"status":"REQUEST_DENIED"}`
 * in the body. Branching on `res.ok` would therefore treat a misconfigured
 * key as a valid panorama. Branch on `status`.
 *
 * COST. The metadata endpoint is free; the image endpoint is billed per
 * request. So every lookup asks metadata first and only pays for an image
 * once there is confirmed imagery to pay for. Results are cached in-process
 * (see the cache notes below) and the route caches in the browser for however
 * long this module says, so a customer working through the form pays for at
 * most one image.
 *
 * PRIVACY. The address is a customer's home. It is sent to Google — that is
 * the whole mechanism — but it is never written to our logs, not even on the
 * error paths. The log lines below carry a status, never a location.
 *
 * Never throws. Every kind of nothing — no key, no imagery, a refused key, a
 * timeout, a connection that dies mid-image — comes back as a null shot. The
 * estimator renders nothing on null, the same way CoastalConditions does when
 * the weather API is unreachable. Nobody's quote should fail because Google
 * had a bad afternoon.
 */

export type PropertyShot = {
  body: Buffer;
  contentType: string;
};

/**
 * What the route needs: the photo if there is one, and how long this answer
 * is good for. The lifetime is returned rather than assumed because the two
 * kinds of "no" expire at very different rates, and the route caches in the
 * browser — where getting that wrong outlives the server's own mistake. See
 * the TTLs below.
 */
export type PropertyShotResult = {
  shot: PropertyShot | null;
  maxAgeSeconds: number;
};

/** Google's free tier caps a Street View Static image at 640px. */
const SIZE = "640x400";
/** Slightly tighter than the 90° default — a house fills the frame better. */
const FOV = 75;

const META_URL = "https://maps.googleapis.com/maps/api/streetview/metadata";
const IMAGE_URL = "https://maps.googleapis.com/maps/api/streetview";

const META_TIMEOUT_MS = 4000;
const IMAGE_TIMEOUT_MS = 8000;

/**
 * Two TTLs, because the two kinds of "no" are not the same kind of no.
 *
 * A confirmed absence of imagery is a fact about the world and keeps for a
 * day. A refused key or a timed-out socket is a fact about our afternoon, and
 * caching it for a day would mean fixing the key in Railway and still seeing
 * nothing until tomorrow. One minute is long enough to stop a retry storm and
 * short enough that a fix shows up while you are still looking at the page —
 * which is only true if the BROWSER cache agrees, hence PropertyShotResult.
 */
const HIT_TTL_MS = 24 * 60 * 60 * 1000;
const NO_IMAGERY_TTL_MS = 24 * 60 * 60 * 1000;
const TRANSIENT_TTL_MS = 60 * 1000;

/**
 * The cache is bounded two ways, because its entries come in two sizes.
 *
 * A hit is a JPEG and they vary by a factor of ten, so those are bounded by
 * BYTES — four megabytes is a couple of dozen houses, far more than the one
 * address a single customer looks at, which is the access pattern this
 * actually serves.
 *
 * A miss is a few hundred bytes of key and metadata and weighs nothing
 * against that limit, which is exactly why it needs its own. Misses are the
 * common case on rural roads, they are ALL that gets cached during an
 * upstream outage, and the route's rate limit still allows ~29,000 distinct
 * addresses a day from one IP. Bounded by bytes alone this map would grow
 * until the process died, while reporting itself comfortably under 4MB.
 *
 * Expiry is not deletion: an expired entry is skipped on read but stays in
 * the map, so it has to be evicted like any other. Oldest out first, on
 * either bound.
 */
const MAX_CACHE_BYTES = 4 * 1024 * 1024;
const MAX_CACHE_ENTRIES = 256;

type Entry = { shot: PropertyShot | null; at: number; ttl: number };

const cache = new Map<string, Entry>();
let cachedBytes = 0;

/** Same address, different spacing or case, is the same address. */
function cacheKey(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, " ");
}

function remember(key: string, shot: PropertyShot | null, ttl: number) {
  const existing = cache.get(key);
  if (existing?.shot) cachedBytes -= existing.shot.body.length;
  cache.delete(key);

  cache.set(key, { shot, at: Date.now(), ttl });
  if (shot) cachedBytes += shot.body.length;

  // Map iterates in insertion order, so the first key is the oldest.
  while (cachedBytes > MAX_CACHE_BYTES || cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next();
    if (oldest.done || oldest.value === key) break;
    const evicted = cache.get(oldest.value);
    if (evicted?.shot) cachedBytes -= evicted.shot.body.length;
    cache.delete(oldest.value);
  }
}

type Fetched<T> =
  | { ok: true; value: T }
  | { ok: false; httpStatus: number | null };

/**
 * Fetch `url` and read its body, both inside one timeout.
 *
 * The body read is the point. `fetch()` resolves as soon as the response
 * HEADERS arrive, so a timer cleared at that moment leaves the body transfer
 * running with no deadline at all: a server that flushes headers promptly and
 * then stalls would hold this socket open indefinitely, and neither timeout
 * above would bound the lookup. The timer stays armed until `read` has
 * finished, and `read` runs inside the same try, so a connection that dies
 * mid-image comes back as a failure rather than throwing out of the module.
 */
async function fetchWithin<T>(
  url: string,
  ms: number,
  read: (res: Response) => Promise<T>,
): Promise<Fetched<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return { ok: false, httpStatus: res.status };
    return { ok: true, value: await read(res) };
  } catch {
    return { ok: false, httpStatus: null };
  } finally {
    clearTimeout(timer);
  }
}

const ms = (x: number) => Math.round(x / 1000);

/** For the test suite and for a key rotated at runtime. */
export function _clearPropertyShotCache() {
  cache.clear();
  cachedBytes = 0;
}

/**
 * The photo for `address`, and how long the answer keeps.
 *
 * `log` is injected rather than imported so this module stays free of the
 * route layer, and so a test can assert on what gets logged without reading
 * stdout. Nothing passed to it ever contains the address.
 */
export async function getPropertyShot(
  address: string,
  log: (level: "INFO" | "WARN", message: string, data?: Record<string, unknown>) => void = () => {},
): Promise<PropertyShotResult> {
  // Read at call time, not at module load: Railway sets this, and a test
  // needs to be able to set and unset it between cases.
  const key = process.env.GOOGLE_MAPS_API_KEY;
  // Transient, not permanent: an unconfigured key is a thing someone is
  // about to fix, and the browser must not hold a day-long "no" over it.
  if (!key) return { shot: null, maxAgeSeconds: ms(TRANSIENT_TTL_MS) };

  const ck = cacheKey(address);
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < hit.ttl) {
    return { shot: hit.shot, maxAgeSeconds: ms(hit.ttl) };
  }

  const miss = (ttl: number): PropertyShotResult => {
    remember(ck, null, ttl);
    return { shot: null, maxAgeSeconds: ms(ttl) };
  };

  const location = encodeURIComponent(address);

  // Free. Tells us whether there is a panorama before we pay for one.
  // `source=outdoor` keeps us to street-level panoramas rather than the
  // indoor business tours Google also serves from this endpoint.
  const meta = await fetchWithin(
    `${META_URL}?location=${location}&source=outdoor&key=${encodeURIComponent(key)}`,
    META_TIMEOUT_MS,
    async (res) => ((await res.json()) as { status?: string }).status ?? "UNKNOWN",
  );
  if (!meta.ok) return miss(TRANSIENT_TTL_MS);

  const status = meta.value;
  if (status !== "OK") {
    // ZERO_RESULTS / NOT_FOUND are ordinary — plenty of Maine camp roads have
    // no coverage at all, and that is not an error worth a log line.
    // REQUEST_DENIED and OVER_QUERY_LIMIT are ours to fix, so they get one.
    const ours = status === "REQUEST_DENIED" || status === "OVER_QUERY_LIMIT";
    if (ours) log("WARN", "Street View refused the request", { status });
    return miss(ours ? TRANSIENT_TTL_MS : NO_IMAGERY_TTL_MS);
  }

  // Billable from here. `return_error_code=true` makes a failure a 404 rather
  // than the grey "Sorry, we have no imagery here" placeholder, which would
  // otherwise sail through as a perfectly valid JPEG of nothing.
  const image = await fetchWithin(
    `${IMAGE_URL}?size=${SIZE}&fov=${FOV}&source=outdoor&return_error_code=true` +
      `&location=${location}&key=${encodeURIComponent(key)}`,
    IMAGE_TIMEOUT_MS,
    async (res) => ({
      contentType: res.headers.get("content-type") ?? "",
      body: Buffer.from(await res.arrayBuffer()),
    }),
  );
  if (!image.ok) {
    if (image.httpStatus !== null) {
      log("WARN", "Street View image request failed", { httpStatus: image.httpStatus });
    }
    return miss(TRANSIENT_TTL_MS);
  }

  if (!image.value.contentType.startsWith("image/")) return miss(TRANSIENT_TTL_MS);

  const shot: PropertyShot = image.value;
  remember(ck, shot, HIT_TTL_MS);
  return { shot, maxAgeSeconds: ms(HIT_TTL_MS) };
}
