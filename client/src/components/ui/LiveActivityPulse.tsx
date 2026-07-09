import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const cities = [
  "Portland",
  "Scarborough",
  "Windham",
  "Falmouth",
  "Naples",
  "Casco",
  "Old Orchard Beach",
  "Kennebunk",
  "Wells",
  "Gorham",
  "South Portland",
  "Cape Elizabeth",
];

const activities: { verb: string; subject: string }[] = [
  { verb: "Freshening", subject: "a home" },
  { verb: "Turning over", subject: "an Airbnb" },
  { verb: "Deep-cleaning", subject: "a kitchen" },
  { verb: "Wrapping up", subject: "a commercial job" },
  { verb: "Refreshing", subject: "a vacation rental" },
  { verb: "Kicking off", subject: "a move-in clean" },
  { verb: "Booked", subject: "a same-day flip" },
  { verb: "Currently serving", subject: "" },
];

const INTERVAL_MS = 5200;

export function LiveActivityPulse() {
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => setTick((n) => n + 1), INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [paused]);

  const activity = activities[tick % activities.length];
  const city = cities[(tick * 7 + 3) % cities.length];
  const message = activity.subject
    ? `${activity.verb} ${activity.subject} in ${city}`
    : `${activity.verb} ${city}`;

  return (
    <button
      type="button"
      onClick={() => setPaused((p) => !p)}
      className="group inline-flex items-center gap-2 text-[12px] sm:text-[13px] text-muted-foreground hover:text-foreground transition-colors rounded-full px-1.5 py-0.5"
      aria-label={paused ? "Resume live activity feed" : "Pause live activity feed"}
      data-testid="live-activity-pulse"
    >
      <span className="relative flex h-2 w-2 flex-shrink-0">
        {!paused && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
        )}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={tick}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="whitespace-nowrap"
        >
          {message}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
