import { useEffect, useState } from "react";
import { Wind, Droplets, MapPin } from "lucide-react";
import { LighthouseMark } from "@/components/brand/Logo";
import { tipFor } from "@/lib/coastal-tips";
import type { Conditions, Sky } from "@/lib/weather-types";

/**
 * "On the coast right now" — the real weather in Portland, ME, with our own
 * lighthouse standing in it.
 *
 * The buddy is the brand mark, not a mascot bought in: the logo is already a
 * lighthouse, so giving it live weather and a beam that turns after dark
 * costs nothing in brand terms and makes the one piece of motion on the page
 * unmistakably ours.
 *
 * WHAT IT IS NOT: the removed WeatherAtmosphere (bd31967) painted animated
 * rain and snow over the entire site on every page. This is one card, mounted
 * once. If it ever starts wanting to be a background layer again, read that
 * commit first.
 *
 * Failure is silent by design. `/api/weather` answers 200 with
 * `{ conditions: null }` when Open-Meteo is unreachable, and this renders
 * nothing at all rather than a broken card or an error state — a decorative
 * widget has no business interrupting a page about booking a cleaner.
 */
export function CoastalConditions({ className = "" }: { className?: string }) {
  const [data, setData] = useState<Conditions | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!alive) return;
        setData(body?.conditions ?? null);
        setReady(true);
      })
      .catch(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Render nothing until we know, and nothing at all if there's no data —
  // never a skeleton that might sit there forever.
  if (!ready || !data) return null;

  const night = !data.isDay;

  return (
    <aside
      className={`relative overflow-hidden rounded-2xl border border-border/60 ${SKY_BG[data.sky]} ${className}`}
      aria-label={`Current conditions in ${data.location}: ${data.label}, ${data.temp} degrees`}
      data-testid="coastal-conditions"
    >
      <WeatherScene sky={data.sky} night={night} />

      <div className="relative flex h-full items-center gap-4 p-4 sm:p-5">
        {/* The buddy. Not announced — the aside's label already says the
            conditions, and a screen reader does not need the drawing. */}
        <div className="relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16" aria-hidden="true">
          <LighthouseMark className="w-full h-full text-foreground/85" />
          {night && <span className="lighthouse-beam" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold text-foreground tabular-nums" data-testid="coastal-temp">
              {data.temp}°
            </span>
            <span className="text-sm font-semibold text-foreground/90">{data.label}</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              {data.location}
            </span>
          </div>

          <p className="text-[13px] text-muted-foreground leading-snug mt-1" data-testid="coastal-tip">
            {tipFor(data.sky, data.isDay)}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Wind className="w-3 h-3" aria-hidden="true" /> {data.windSpeed} mph
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Droplets className="w-3 h-3" aria-hidden="true" /> {data.humidity}% humidity
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** A quiet tint per bucket, so the card feels like the day it's describing. */
const SKY_BG: Record<Sky, string> = {
  clear: "bg-gradient-to-br from-sky-400/10 via-amber-300/5 to-transparent",
  cloudy: "bg-gradient-to-br from-slate-400/10 via-slate-300/5 to-transparent",
  fog: "bg-gradient-to-br from-slate-300/12 via-slate-200/6 to-transparent",
  rain: "bg-gradient-to-br from-sky-600/12 via-slate-400/6 to-transparent",
  snow: "bg-gradient-to-br from-sky-200/14 via-slate-200/6 to-transparent",
  storm: "bg-gradient-to-br from-indigo-600/14 via-slate-500/6 to-transparent",
};

/**
 * The weather itself: a handful of absolutely-positioned elements animated
 * purely with transform and opacity, so the whole thing stays on the
 * compositor. Counts are deliberately small — this is a 4rem-tall card, not a
 * particle system, and it is the second animated thing on the page.
 *
 * Every animation here is disabled by prefers-reduced-motion in index.css.
 */
function WeatherScene({ sky, night }: { sky: Sky; night: boolean }) {
  if (sky === "clear") {
    return (
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -top-6 -right-4 w-24 h-24 rounded-full blur-2xl ${
          night ? "bg-indigo-300/20" : "bg-amber-300/40"
        }`}
      />
    );
  }

  if (sky === "fog") {
    return (
      <span aria-hidden="true" className="pointer-events-none absolute inset-0">
        {[0, 1, 2].map((i) => (
          <span key={i} className="fog-bank" style={{ top: `${25 + i * 22}%`, animationDelay: `${i * -5}s` }} />
        ))}
      </span>
    );
  }

  if (sky === "rain" || sky === "storm") {
    return (
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="rain-drop"
            style={{
              left: `${(i * 7 + 3) % 100}%`,
              animationDelay: `${(i % 7) * -0.22}s`,
              animationDuration: `${sky === "storm" ? 0.5 : 0.75}s`,
            }}
          />
        ))}
        {sky === "storm" && <span className="storm-flash" />}
      </span>
    );
  }

  if (sky === "snow") {
    return (
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="snow-flake"
            style={{
              left: `${(i * 8 + 4) % 100}%`,
              animationDelay: `${(i % 6) * -1.3}s`,
              animationDuration: `${5 + (i % 4)}s`,
            }}
          />
        ))}
      </span>
    );
  }

  // cloudy
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      {[0, 1].map((i) => (
        <span key={i} className="cloud-puff" style={{ top: `${15 + i * 38}%`, animationDelay: `${i * -9}s` }} />
      ))}
    </span>
  );
}
