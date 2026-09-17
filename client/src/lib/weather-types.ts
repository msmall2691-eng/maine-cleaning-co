/**
 * The shape GET /api/weather returns. Kept in its own module so the client
 * can import the type without pulling in server code (server/lib/weather.ts
 * declares the same shape and owns the fetching).
 */
export type Sky = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

export interface Conditions {
  temp: number;
  label: string;
  sky: Sky;
  windSpeed: number;
  humidity: number;
  isDay: boolean;
  location: string;
}
