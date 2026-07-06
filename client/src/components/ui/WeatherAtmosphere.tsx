import { useEffect, useState } from "react";

type WeatherResponse = {
  current: {
    temp: number;
    label: string;
    icon: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{ date: string; high: number; low: number; label: string; icon: string }>;
  location: string;
};

type Condition =
  | "sun"
  | "partly-cloudy"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm";

function iconToCondition(icon: string): Condition {
  switch (icon) {
    case "sun":
      return "sun";
    case "cloud-sun":
      return "partly-cloudy";
    case "cloud":
      return "cloud";
    case "cloud-fog":
      return "fog";
    case "cloud-drizzle":
      return "drizzle";
    case "cloud-rain":
      return "rain";
    case "cloud-snow":
      return "snow";
    case "cloud-lightning":
      return "storm";
    default:
      return "cloud";
  }
}

export function WeatherAtmosphere() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && data.current) setWeather(data);
      })
      .catch(() => {
        /* silent — atmosphere is decorative */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!weather) return null;

  const condition = iconToCondition(weather.current.icon);

  return (
    <>
      {/* Back layer — subtle ambient tint behind content */}
      <div className="weather-atmosphere" aria-hidden="true" data-condition={condition}>
        {condition === "sun" && <div className="weather-sun-glow" />}
        {condition === "partly-cloudy" && (
          <>
            <div className="weather-sun-glow" style={{ opacity: 0.6 }} />
            <div className="weather-cloud-drift" />
          </>
        )}
        {condition === "cloud" && <div className="weather-cloud-drift" />}
        {condition === "fog" && (
          <>
            <div className="weather-cloud-drift" style={{ opacity: 0.5 }} />
            <div className="weather-fog" />
          </>
        )}
        {condition === "drizzle" && <div className="weather-cloud-drift" style={{ opacity: 0.4 }} />}
        {condition === "rain" && <div className="weather-cloud-drift" style={{ opacity: 0.5 }} />}
        {condition === "snow" && <div className="weather-cloud-drift" style={{ opacity: 0.35 }} />}
        {condition === "storm" && <div className="weather-storm-dim" />}
      </div>

      {/* Front layer — precipitation drifts over the whole page */}
      {(condition === "drizzle" ||
        condition === "rain" ||
        condition === "snow" ||
        condition === "storm") && (
        <div
          className="weather-atmosphere"
          aria-hidden="true"
          style={{ zIndex: 30 }}
          data-condition={`${condition}-front`}
        >
          {condition === "drizzle" && <div className="weather-rain" style={{ opacity: 0.28 }} />}
          {condition === "rain" && <div className="weather-rain" style={{ opacity: 0.4 }} />}
          {condition === "snow" && <div className="weather-snow" style={{ opacity: 0.55 }} />}
          {condition === "storm" && (
            <>
              <div className="weather-rain" style={{ opacity: 0.42 }} />
              <div className="weather-storm-flash" />
            </>
          )}
        </div>
      )}
    </>
  );
}
