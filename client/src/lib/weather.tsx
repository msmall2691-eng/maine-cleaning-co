import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Conditions } from "./weather-types";
import { applyWeatherAccent } from "./weather-accent";

/**
 * One weather fetch for the whole app.
 *
 * Two consumers now want the same data — the CoastalConditions card and the
 * accent tint on the scroll bar and heading rules — and they must never
 * disagree or fetch twice. This provider owns the single request and pushes
 * the accent onto the document root as a side effect.
 *
 * `conditions` is null until the request lands, and stays null forever if it
 * fails. Every consumer is expected to render a complete, correct UI in that
 * state; see weather-accent.ts for why that's a hard rule rather than a
 * nice-to-have.
 */

const WeatherContext = createContext<Conditions | null>(null);

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [conditions, setConditions] = useState<Conditions | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!alive) return;
        setConditions(body?.conditions ?? null);
      })
      .catch(() => {
        /* Decorative. A failed fetch is a no-op, not an error state. */
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    applyWeatherAccent(conditions?.sky ?? null);
    return () => applyWeatherAccent(null);
  }, [conditions?.sky]);

  return <WeatherContext.Provider value={conditions}>{children}</WeatherContext.Provider>;
}

/** Current conditions, or null when unknown. Never throws, never suspends. */
export function useWeather(): Conditions | null {
  return useContext(WeatherContext);
}
