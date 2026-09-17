/**
 * Current conditions on the Southern Maine coast, from Open-Meteo.
 *
 * HISTORY, so this isn't mistaken for a revert: an earlier version of this
 * repo had a /api/weather route feeding a full-screen WeatherAtmosphere layer
 * — animated rain, snow, fog and storm-dimming over every page — plus a hero
 * forecast strip. Both were removed (077f3d4, bd31967, 58e486a) because the
 * atmosphere was visual noise on top of the whole site, not because the data
 * or the provider were a problem. This serves one small, contained widget.
 * Don't grow it back into a page-wide effect.
 *
 * Open-Meteo needs no API key and no attribution for non-commercial volume,
 * which is why it was chosen originally and why it's still right here.
 *
 * Cached in-process for 30 minutes. The widget is on the home page, so
 * without a cache every visitor would cost an upstream call for data that
 * changes four times an hour at best.
 */

/** Portland, ME — the centre of the service area. */
const LAT = 43.66;
const LON = -70.26;

const TTL_MS = 30 * 60 * 1000;

// Sky/Conditions are declared once, in the client-importable module, so the
// widget and this route can never drift apart on the wire format.
import type { Sky, Conditions } from "../../client/src/lib/weather-types";
export type { Sky, Conditions };

/**
 * WMO code → label + scene bucket. Codes absent here (the hail/ice variants
 * Open-Meteo rarely returns for this latitude) fall through to `cloudy`,
 * which is the one bucket that is never wrong enough to matter.
 */
const CODES: Record<number, { label: string; sky: Sky }> = {
  0: { label: "Clear", sky: "clear" },
  1: { label: "Mostly Clear", sky: "clear" },
  2: { label: "Partly Cloudy", sky: "cloudy" },
  3: { label: "Overcast", sky: "cloudy" },
  45: { label: "Foggy", sky: "fog" },
  48: { label: "Icy Fog", sky: "fog" },
  51: { label: "Light Drizzle", sky: "rain" },
  53: { label: "Drizzle", sky: "rain" },
  55: { label: "Heavy Drizzle", sky: "rain" },
  61: { label: "Light Rain", sky: "rain" },
  63: { label: "Rain", sky: "rain" },
  65: { label: "Heavy Rain", sky: "rain" },
  71: { label: "Light Snow", sky: "snow" },
  73: { label: "Snow", sky: "snow" },
  75: { label: "Heavy Snow", sky: "snow" },
  77: { label: "Snow Grains", sky: "snow" },
  80: { label: "Light Showers", sky: "rain" },
  81: { label: "Showers", sky: "rain" },
  82: { label: "Heavy Showers", sky: "rain" },
  85: { label: "Snow Showers", sky: "snow" },
  86: { label: "Heavy Snow Showers", sky: "snow" },
  95: { label: "Thunderstorm", sky: "storm" },
  96: { label: "Thunderstorm w/ Hail", sky: "storm" },
  99: { label: "Severe Thunderstorm", sky: "storm" },
};

let cache: { data: Conditions; at: number } | null = null;

const URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
  "&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,is_day" +
  "&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/New_York";

/**
 * Returns null rather than throwing when the upstream is unreachable or
 * misshapen. The widget is decorative — it hides itself on null. Nothing on
 * this site should ever fail to render because a weather API had a bad day.
 */
export async function getConditions(): Promise<Conditions | null> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.data;

  try {
    // Open-Meteo is normally fast; a hung socket must not hold a request open.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(URL, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return cache?.data ?? null;

    const raw = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        relative_humidity_2m?: number;
        wind_speed_10m?: number;
        is_day?: number;
      };
    };
    const c = raw.current;
    if (!c || typeof c.temperature_2m !== "number" || typeof c.weather_code !== "number") {
      return cache?.data ?? null;
    }

    const info = CODES[c.weather_code] ?? { label: "Cloudy", sky: "cloudy" as Sky };
    const data: Conditions = {
      temp: Math.round(c.temperature_2m),
      label: info.label,
      sky: info.sky,
      windSpeed: Math.round(c.wind_speed_10m ?? 0),
      humidity: Math.round(c.relative_humidity_2m ?? 0),
      isDay: c.is_day !== 0,
      location: "Portland, ME",
    };
    cache = { data, at: now };
    return data;
  } catch {
    // Serve stale over nothing — half-hour-old Maine weather is still true
    // enough for a decorative widget.
    return cache?.data ?? null;
  }
}
