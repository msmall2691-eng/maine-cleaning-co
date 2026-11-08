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
 * (see the cache notes below) and the route sets a day of browser caching, so
 * a customer working through the form pays for at most one image.
 *
 * PRIVACY. The address is a customer's home. It is sent to Google — that is
 * the whole mechanism — but it is never written to our logs, not even on the
 * error paths. The log lines below carry a status, never a location.
 *
 * Returns null for everything: no key, no imagery, a refused key, a timeout.
 * The estimator renders nothing on null, the same way CoastalConditions does
 * when the weather API is unreachable. Nobody's quote should fail because
 * Google had a bad afternoon.
 */

export type PropertyShot = {
  body: Buffer;
  contentType: string;
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
 * short enough that a fix shows up while you are still looking at the page.
 */
const HIT_TTL_MS = 24 * 60 * 60 * 1000;
const NO_IMAGERY_TTL_MS = 24 * 60 * 60 * 1000;
const TRANSIENT_TTL_MS = 60 * 1000;

/**
 * The cache is bounded by BYTES, not by entry count, because the entries are
 * JPEGs and vary by a factor of ten. Four megabytes is a couple of dozen
 * houses — far more than the one address a single customer looks at, which is
 * the access pattern this actually serves. Oldest out first.
 */
const MAX_CACHE_BYTES = 4 * 1024 * 1024;

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
  while (cachedBytes > MAX_CACHE_BYTES) {
    const oldest = cache.keys().next();
    if (oldest.done || oldest.value === key) break;
    const evicted = cache.get(oldest.value);
    if (evicted?.shot) cachedBytes -= evicted.shot.body.length;
    cache.delete(oldest.value);
  }
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** For the test suite and for a key rotated at runtime. */
export function _clearPropertyShotCache() {
  cache.clear();
  cachedBytes = 0;
}

/**
 * The photo for `address`, or null.
 *
 * `log` is injected rather than imported so this module stays free of the
 * route layer, and so a test can assert on what gets logged without reading
 * stdout. Nothing passed to it ever contains the address.
 */
export async function getPropertyShot(
  address: string,
  log: (level: "INFO" | "WARN", message: string, data?: Record<string, unknown>) => void = () => {},
): Promise<PropertyShot | null> {
  // Read at call time, not at module load: Railway sets this, and a test
  // needs to be able to set and unset it between cases.
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const ck = cacheKey(address);
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < hit.ttl) return hit.shot;

  const location = encodeURIComponent(address);

  // Free. Tells us whether there is a panorama before we pay for one.
  // `source=outdoor` keeps us to street-level panoramas rather than the
  // indoor business tours Google also serves from this endpoint.
  const metaRes = await fetchWithTimeout(
    `${META_URL}?location=${location}&source=outdoor&key=${encodeURIComponent(key)}`,
    META_TIMEOUT_MS,
  );
  if (!metaRes) {
    remember(ck, null, TRANSIENT_TTL_MS);
    return null;
  }

  let status: string;
  try {
    status = ((await metaRes.json()) as { status?: string }).status ?? "UNKNOWN";
  } catch {
    remember(ck, null, TRANSIENT_TTL_MS);
    return null;
  }

  if (status !== "OK") {
    // ZERO_RESULTS / NOT_FOUND are ordinary — plenty of Maine camp roads have
    // no coverage at all, and that is not an error worth a log line.
    // REQUEST_DENIED and OVER_QUERY_LIMIT are ours to fix, so they get one.
    const ours = status === "REQUEST_DENIED" || status === "OVER_QUERY_LIMIT";
    if (ours) log("WARN", "Street View refused the request", { status });
    remember(ck, null, ours ? TRANSIENT_TTL_MS : NO_IMAGERY_TTL_MS);
    return null;
  }

  // Billable from here. `return_error_code=true` makes a failure a 404 rather
  // than the grey "Sorry, we have no imagery here" placeholder, which would
  // otherwise sail through as a perfectly valid JPEG of nothing.
  const imgRes = await fetchWithTimeout(
    `${IMAGE_URL}?size=${SIZE}&fov=${FOV}&source=outdoor&return_error_code=true` +
      `&location=${location}&key=${encodeURIComponent(key)}`,
    IMAGE_TIMEOUT_MS,
  );
  if (!imgRes || !imgRes.ok) {
    if (imgRes) log("WARN", "Street View image request failed", { httpStatus: imgRes.status });
    remember(ck, null, TRANSIENT_TTL_MS);
    return null;
  }

  const contentType = imgRes.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    remember(ck, null, TRANSIENT_TTL_MS);
    return null;
  }

  const body = Buffer.from(await imgRes.arrayBuffer());
  const shot: PropertyShot = { body, contentType };
  remember(ck, shot, HIT_TTL_MS);
  return shot;
}
