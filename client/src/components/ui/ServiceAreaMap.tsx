import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin } from "lucide-react";

/**
 * Serving-Southern-Maine section. Rewritten from a rotating multi-hub
 * network graph — labels stomped on each other on mobile, dots drifted
 * off their true geography, and the section swallowed ~1300px of scroll.
 *
 * Current design is a static "signal map": every dot sits at its real
 * coordinate, concentric rings communicate the 60-mile service radius
 * out of North Waterboro, and a slow radar sweep keeps it alive without
 * disturbing the geography. The canvas takes touch-action: none out of
 * the equation entirely (pointer-events: none) so vertical scroll on
 * mobile is bulletproof.
 */

const CENTER = { lat: 43.5712, lng: -70.7287, name: "North Waterboro" };
const MAX_MILES = 60;
const RING_MILES = [30, 60];

const cities: { name: string; lat: number; lng: number; visits: number }[] = [
  { name: "Portland", lat: 43.6591, lng: -70.2568, visits: 848 },
  { name: "Scarborough", lat: 43.5781, lng: -70.3222, visits: 826 },
  { name: "Windham", lat: 43.7985, lng: -70.4039, visits: 656 },
  { name: "Naples", lat: 43.9781, lng: -70.6075, visits: 641 },
  { name: "Casco", lat: 43.9580, lng: -70.5175, visits: 335 },
  { name: "Falmouth", lat: 43.7298, lng: -70.2378, visits: 235 },
  { name: "Old Orchard Beach", lat: 43.5168, lng: -70.3773, visits: 218 },
  { name: "South Portland", lat: 43.6415, lng: -70.2580, visits: 122 },
  { name: "Kennebunk", lat: 43.3884, lng: -70.5449, visits: 86 },
  { name: "Wells", lat: 43.3222, lng: -70.5800, visits: 80 },
  { name: "Limerick", lat: 43.6880, lng: -70.7930, visits: 79 },
  { name: "Gorham", lat: 43.6795, lng: -70.4434, visits: 72 },
  { name: "Baldwin", lat: 43.8386, lng: -70.7700, visits: 63 },
  { name: "Frye Island", lat: 43.8600, lng: -70.5500, visits: 57 },
  { name: "Kennebunkport", lat: 43.3612, lng: -70.4767, visits: 49 },
  { name: "Denmark", lat: 43.9700, lng: -70.7900, visits: 42 },
  { name: "Waterboro", lat: 43.5368, lng: -70.7192, visits: 34 },
  { name: "Standish", lat: 43.7570, lng: -70.5594, visits: 32 },
  { name: "Raymond", lat: 43.8945, lng: -70.4700, visits: 29 },
  { name: "Cape Elizabeth", lat: 43.5636, lng: -70.2000, visits: 28 },
];

const TOTAL_COMMUNITIES = 49;
const maxVisits = Math.max(...cities.map((c) => c.visits));

const stats = [
  { value: "4,715+", label: "Cleans since 2018" },
  { value: "93%", label: "Repeat clients" },
  { value: `${TOTAL_COMMUNITIES}`, label: "Communities" },
];

function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3959;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function SignalMap({ animate }: { animate: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0, ppm: 1, cx: 0, cy: 0 });
  const startRef = useRef(0);
  const visibleRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const project = (lat: number, lng: number) => {
      const { ppm, cx, cy } = sizeRef.current;
      const dyMi = (lat - CENTER.lat) * 69;
      const dxMi =
        (lng - CENTER.lng) * 69 * Math.cos((CENTER.lat * Math.PI) / 180);
      return { x: cx + dxMi * ppm, y: cy - dyMi * ppm };
    };

    const draw = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const t = (now - startRef.current) / 1000;
      const { w, h, ppm, cx, cy } = sizeRef.current;
      // Off-screen: skip the paint but keep the loop alive so the
      // sweep resumes seamlessly when the section scrolls back into
      // view. Cheaper than a fresh RAF start-up per intersection.
      if (!w || !h || !visibleRef.current) {
        if (animate) rafRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      // Static reference rings — subtle.
      RING_MILES.forEach((mi, i) => {
        const r = mi * ppm;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(192, 60%, 65%, ${i === RING_MILES.length - 1 ? 0.28 : 0.14})`;
        ctx.lineWidth = 1;
        ctx.setLineDash(i === RING_MILES.length - 1 ? [] : [3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ring label — mileage on the eastern edge.
        ctx.fillStyle = `hsla(192, 55%, 75%, 0.5)`;
        ctx.font = "500 9px Inter, system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`${mi} mi`, cx + r + 4, cy);
      });

      // Radar-sweep pulse — one ring expanding from 0 → MAX_MILES over 4s.
      if (animate) {
        const period = 4;
        const phase = (t % period) / period;
        const pulseR = phase * MAX_MILES * ppm;
        const alpha = (1 - phase) * 0.35;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(190, 85%, 68%, ${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // City dots — geographic, one color, size by visit count.
      cities.forEach((city) => {
        const { x, y } = project(city.lat, city.lng);
        const intensity = 0.4 + (city.visits / maxVisits) * 0.6;
        const r = 2.5 + (city.visits / maxVisits) * 6.5;

        if (city.visits >= 200) {
          const glowR = r * 3;
          const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
          g.addColorStop(0, `hsla(190, 90%, 70%, 0.22)`);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(190, 78%, 68%, ${intensity})`;
        ctx.fill();
      });

      // Center beacon — North Waterboro.
      const beaconPulse = animate ? 0.7 + Math.sin(t * 2.5) * 0.3 : 1;
      const beaconR = 4;
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, beaconR * 5);
      bg.addColorStop(0, `hsla(45, 100%, 75%, ${0.35 * beaconPulse})`);
      bg.addColorStop(1, "transparent");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(cx, cy, beaconR * 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, beaconR, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(45, 100%, 78%)`;
      ctx.fill();
      ctx.strokeStyle = `hsla(45, 100%, 90%, 0.7)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (animate) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width;
      const h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      // Scale so the outer ring sits at ~42% of the shorter dimension.
      const ppm = (Math.min(w, h) * 0.42) / MAX_MILES;
      sizeRef.current = { w, h, ppm, cx: w / 2, cy: h * 0.52 };
      // Setting canvas.width/height above wipes the bitmap. Always kick
      // a fresh paint — without this, Reduce Motion users see a blank
      // map after a phone rotation because the RAF loop already exited.
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    io.observe(container);
    window.addEventListener("resize", resize);

    resize();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      io.disconnect();
    };
  }, [animate]);

  return (
    <div
      ref={containerRef}
      className="service-area-ocean relative w-full h-52 sm:h-64 md:h-72 rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
      style={{ touchAction: "pan-y" }}
      data-testid="signal-map"
    >
      <div className="ocean-glow" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />
      <div className="absolute top-3 left-3 flex items-center gap-1.5 text-white/60 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(253,224,71,0.7)]" />
        <span className="text-[10px] font-medium tracking-wide">North Waterboro · HQ</span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 text-white/50">
          <MapPin className="w-3 h-3" />
          <span className="text-[10px] font-medium">
            {TOTAL_COMMUNITIES} communities · 60-mile radius
          </span>
        </div>
      </div>
    </div>
  );
}

export function ServiceAreaMap() {
  const reduce = useReducedMotion();

  // Sanity check: filter out any city that somehow lives outside the
  // stated 60-mile service area so the "everything you see is inside
  // the ring" invariant holds. All 20 seed cities are already inside;
  // this is a guardrail for future edits.
  const inArea = cities.filter((c) => milesBetween(CENTER, c) <= MAX_MILES);
  const topThree = [...inArea].sort((a, b) => b.visits - a.visits).slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto" data-testid="card-service-area-map">
      {/* Compact stat rail — one line on every viewport. */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-border bg-card px-2 sm:px-3 py-2.5 sm:py-3 text-center shadow-sm"
            data-testid={`kpi-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <p className="text-lg sm:text-2xl font-bold text-foreground leading-none tabular-nums">
              {s.value}
            </p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 font-medium">
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>

      <SignalMap animate={!reduce} />

      {/* Top-three cities — compact single row on every viewport. */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mt-4 sm:mt-5">
        {topThree.map((city, i) => {
          const pct = Math.round((city.visits / topThree[0].visits) * 100);
          return (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-border bg-card px-2.5 py-2 shadow-sm"
              data-testid={`rank-city-${i}`}
            >
              <div className="flex items-baseline justify-between gap-1.5">
                <span className="text-[11px] sm:text-xs font-semibold text-foreground truncate">
                  {city.name}
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {city.visits}
                </span>
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden mt-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 + 0.15, duration: 0.6 }}
                  className="h-full bg-primary/60 rounded-full"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="text-[10px] sm:text-[11px] text-muted-foreground text-center mt-3">
        + {TOTAL_COMMUNITIES - 3} more communities across Southern Maine
      </p>
    </div>
  );
}
