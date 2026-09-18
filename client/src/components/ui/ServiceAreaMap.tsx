import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Maximize2, Expand, Shrink, X } from "lucide-react";
import { CLEANS_SINCE_2018, RECURRING_CLIENT_RATE, COMMUNITIES_SERVED, TOTAL_COMMUNITIES } from "@/lib/company-stats";

/**
 * Serving-Southern-Maine — Obsidian-style INTERACTIVE knowledge graph.
 *
 * Real force-directed physics: every node feels every other node,
 * springs pull linked pairs to a rest length, cities are wired to the
 * North Waterboro HQ + any service hub they belong to + geographic
 * neighbors. Drag any node, wheel to zoom, drag empty space to pan.
 * The cursor gently repels nearby nodes so the graph reacts to motion.
 */

type ServiceType = "residential" | "commercial" | "vacation";

const HQ_COLOR = { h: 42, s: 96, l: 62 };
const RES_COLOR = { h: 200, s: 82, l: 66 };
const COM_COLOR = { h: 148, s: 62, l: 55 };
const VAC_COLOR = { h: 282, s: 60, l: 66 };

// Geographic center of the service area (roughly Buxton/Saco corridor).
// This is used purely to lay out the initial graph and anchor the physics
// simulation — it is not a public "HQ" address.
const CENTER = { lat: 43.60, lng: -70.55, name: "The Maine Cleaning Co." };
const MAX_MILES = 95;

type City = { name: string; lat: number; lng: number; visits: number; services: ServiceType[] };

const cities: City[] = [
  { name: "Portland", lat: 43.6591, lng: -70.2568, visits: 848, services: ["residential", "commercial"] },
  { name: "Scarborough", lat: 43.5781, lng: -70.3222, visits: 826, services: ["residential", "commercial"] },
  { name: "Windham", lat: 43.7985, lng: -70.4039, visits: 656, services: ["residential"] },
  { name: "Naples", lat: 43.9781, lng: -70.6075, visits: 641, services: ["residential", "vacation"] },
  { name: "Casco", lat: 43.9580, lng: -70.5175, visits: 335, services: ["residential", "vacation"] },
  { name: "Falmouth", lat: 43.7298, lng: -70.2378, visits: 235, services: ["residential", "commercial"] },
  { name: "Old Orchard Beach", lat: 43.5168, lng: -70.3773, visits: 218, services: ["residential", "vacation"] },
  { name: "South Portland", lat: 43.6415, lng: -70.2580, visits: 122, services: ["residential", "commercial"] },
  { name: "Kennebunk", lat: 43.3884, lng: -70.5449, visits: 86, services: ["residential", "vacation"] },
  { name: "Wells", lat: 43.3222, lng: -70.5800, visits: 80, services: ["residential", "vacation"] },
  { name: "Limerick", lat: 43.6880, lng: -70.7930, visits: 79, services: ["residential"] },
  { name: "Gorham", lat: 43.6795, lng: -70.4434, visits: 72, services: ["residential", "commercial"] },
  { name: "Baldwin", lat: 43.8386, lng: -70.7700, visits: 63, services: ["residential"] },
  { name: "Frye Island", lat: 43.8600, lng: -70.5500, visits: 57, services: ["residential", "vacation"] },
  { name: "Kennebunkport", lat: 43.3612, lng: -70.4767, visits: 49, services: ["residential", "vacation"] },
  { name: "Denmark", lat: 43.9700, lng: -70.7900, visits: 42, services: ["residential"] },
  { name: "Waterboro", lat: 43.5368, lng: -70.7192, visits: 34, services: ["residential"] },
  { name: "Standish", lat: 43.7570, lng: -70.5594, visits: 32, services: ["residential"] },
  { name: "Raymond", lat: 43.8945, lng: -70.4700, visits: 29, services: ["residential"] },
  { name: "Cape Elizabeth", lat: 43.5636, lng: -70.2000, visits: 28, services: ["residential", "commercial"] },
];

const maxVisits = Math.max(...cities.map((c) => c.visits));

// The cities above are the busiest we serve, not all of them — the bars and
// the graph plot a subset, and the roster in lib/service-areas.ts is the full
// list. Summing visits here would therefore understate the lifetime total, so
// the strip uses the shared figure rather than deriving one from this array.
const stats = [
  { value: CLEANS_SINCE_2018, label: "Cleans since 2018" },
  { value: RECURRING_CLIENT_RATE, label: "Repeat clients" },
  { value: COMMUNITIES_SERVED, label: "Communities" },
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

type NodeKind = "hq" | "hub" | "city";

type SimNode = {
  id: string;
  kind: NodeKind;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number;
  fy: number;
  radius: number;
  pinned: boolean;
  visits?: number;
  services?: ServiceType[];
  serviceType?: ServiceType;
  color: { h: number; s: number; l: number };
};

type SimLink = {
  a: number;
  b: number;
  kind: "hq" | "hub" | "city";
  rest: number;
  strength: number;
};

type BuiltGraph = {
  nodes: SimNode[];
  links: SimLink[];
  adjacency: number[][];
  hqIndex: number;
};

function cityColor(services: ServiceType[]) {
  if (services.includes("vacation")) return VAC_COLOR;
  if (services.includes("commercial")) return COM_COLOR;
  return RES_COLOR;
}

const HUBS: { type: ServiceType; name: string; color: typeof HQ_COLOR }[] = [
  { type: "residential", name: "Residential", color: RES_COLOR },
  { type: "commercial", name: "Commercial", color: COM_COLOR },
  { type: "vacation", name: "Vacation Rental", color: VAC_COLOR },
];

function buildGraph(w: number, h: number): BuiltGraph {
  const nodes: SimNode[] = [];
  const cx = w / 2;
  const cy = h * 0.52;

  // Geographic projection so initial positions look like Maine
  const project = (lat: number, lng: number) => {
    const ppm = (Math.min(w, h) * 0.34) / MAX_MILES;
    const dyMi = (lat - CENTER.lat) * 69;
    const dxMi = (lng - CENTER.lng) * 69 * Math.cos((CENTER.lat * Math.PI) / 180);
    return { x: cx + dxMi * ppm, y: cy - dyMi * ppm };
  };

  // HQ at geographic center
  nodes.push({
    id: "hq",
    kind: "hq",
    name: CENTER.name,
    x: cx,
    y: cy,
    vx: 0,
    vy: 0,
    fx: 0,
    fy: 0,
    radius: 11,
    pinned: false,
    color: HQ_COLOR,
  });
  const hqIndex = 0;

  // Service hubs orbit HQ
  const hubOrbit = Math.min(w, h) * 0.15;
  HUBS.forEach((h, i) => {
    const a = (i / HUBS.length) * Math.PI * 2 - Math.PI / 2;
    nodes.push({
      id: `hub-${h.type}`,
      kind: "hub",
      name: h.name,
      x: cx + Math.cos(a) * hubOrbit,
      y: cy + Math.sin(a) * hubOrbit,
      vx: 0,
      vy: 0,
      fx: 0,
      fy: 0,
      radius: 7.5,
      pinned: false,
      serviceType: h.type,
      color: h.color,
    });
  });
  const hubStart = 1;

  // City nodes at real geographic positions
  cities.forEach((city) => {
    const p = project(city.lat, city.lng);
    const r = 3.5 + (city.visits / maxVisits) * 9;
    nodes.push({
      id: `city-${city.name}`,
      kind: "city",
      name: city.name,
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      fx: 0,
      fy: 0,
      radius: r,
      pinned: false,
      visits: city.visits,
      services: city.services,
      color: cityColor(city.services),
    });
  });
  const cityStart = 1 + HUBS.length;

  // Links
  const links: SimLink[] = [];
  const hubTypeIndex: Record<ServiceType, number> = {
    residential: hubStart,
    commercial: hubStart + 1,
    vacation: hubStart + 2,
  };

  for (let i = 0; i < cities.length; i++) {
    const idx = cityStart + i;
    links.push({ a: idx, b: hqIndex, kind: "hq", rest: 180, strength: 0.006 });
    cities[i].services.forEach((s) => {
      links.push({
        a: idx,
        b: hubTypeIndex[s],
        kind: "hub",
        rest: 85,
        strength: 0.02,
      });
    });
  }

  // Geographic neighbor links so the map shape holds
  for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      if (milesBetween(cities[i], cities[j]) <= 12) {
        links.push({ a: cityStart + i, b: cityStart + j, kind: "city", rest: 70, strength: 0.02 });
      }
    }
  }

  const adjacency: number[][] = nodes.map(() => []);
  links.forEach((l) => {
    adjacency[l.a].push(l.b);
    adjacency[l.b].push(l.a);
  });

  return { nodes, links, adjacency, hqIndex };
}

function ObsidianGraph({ animate }: { animate: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<BuiltGraph | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const animRef = useRef<number>(0);
  const isVisibleRef = useRef(true);

  const [hoveredIdx, setHoveredIdx] = useState<number>(-1);
  const hoveredIdxRef = useRef<number>(-1);
  hoveredIdxRef.current = hoveredIdx;

  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const selectedIdxRef = useRef<number>(-1);
  selectedIdxRef.current = selectedIdx;

  const [filterService, setFilterService] = useState<ServiceType | null>(null);
  const filterServiceRef = useRef<ServiceType | null>(null);
  filterServiceRef.current = filterService;

  const draggingIdxRef = useRef<number>(-1);
  const dragMovedRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, viewX: 0, viewY: 0 });
  const pointerDownRef = useRef<{ x: number; y: number; t: number; idx: number } | null>(null);
  const viewRef = useRef({ x: 0, y: 0, scale: 1 });
  const mouseRef = useRef({ x: -9999, y: -9999, inCanvas: false });
  const timeRef = useRef(0);
  const spawnRef = useRef(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltip, setTooltip] = useState<{
    idx: number;
    sx: number;
    sy: number;
  } | null>(null);
  const [, forceRerender] = useState(0);

  const initGraph = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;
    if (!w || !h) return;
    sizeRef.current = { w, h };
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    graphRef.current = buildGraph(w, h);
    viewRef.current = { x: 0, y: 0, scale: 1 };
    spawnRef.current = timeRef.current;
  }, []);

  useEffect(() => {
    initGraph();
    const onResize = () => initGraph();
    window.addEventListener("resize", onResize);
    const obs = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    if (containerRef.current) obs.observe(containerRef.current);
    return () => {
      window.removeEventListener("resize", onResize);
      obs.disconnect();
    };
  }, [initGraph]);

  // Re-initialize when fullscreen mode changes (container resizes)
  useEffect(() => {
    const t = window.setTimeout(() => initGraph(), 60);
    return () => window.clearTimeout(t);
  }, [isFullscreen, initGraph]);

  // Escape exits fullscreen; body scroll locked while fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const v = viewRef.current;
    return { x: (sx - v.x) / v.scale, y: (sy - v.y) / v.scale };
  }, []);

  const worldToScreen = useCallback((wx: number, wy: number) => {
    const v = viewRef.current;
    return { x: wx * v.scale + v.x, y: wy * v.scale + v.y };
  }, []);

  const hitTest = useCallback(
    (sx: number, sy: number): number => {
      const graph = graphRef.current;
      if (!graph) return -1;
      const v = viewRef.current;
      for (let i = graph.nodes.length - 1; i >= 0; i--) {
        const n = graph.nodes[i];
        const nsx = n.x * v.scale + v.x;
        const nsy = n.y * v.scale + v.y;
        const dx = nsx - sx;
        const dy = nsy - sy;
        const rr = n.radius * v.scale + 10;
        if (dx * dx + dy * dy < rr * rr) return i;
      }
      return -1;
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const step = () => {
      timeRef.current += 16;
      const graph = graphRef.current;
      const { w, h } = sizeRef.current;
      if (!graph || !w) {
        animRef.current = requestAnimationFrame(step);
        return;
      }

      const nodes = graph.nodes;
      const links = graph.links;
      const cx = w / 2;
      const cy = h * 0.52;
      const REPULSION = 850;
      const CENTRIPETAL = 0.004;
      const DAMPING = 0.86;
      const CURSOR_STRENGTH = 3400;
      const CURSOR_RADIUS = 80;
      // Skip physics AND render when the graph is scrolled out of view —
      // main-thread work during scroll delays touch/gesture handling on
      // mobile. RAF still fires (cheap when tab is visible) so we resume
      // instantly when the graph scrolls back into view.
      if (!isVisibleRef.current) {
        animRef.current = requestAnimationFrame(step);
        return;
      }
      const doPhysics = animate;

      if (doPhysics) {
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].fx = 0;
          nodes[i].fy = 0;
        }

        // Repulsion between all node pairs
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dSq = dx * dx + dy * dy + 0.01;
            if (dSq > 80000) continue;
            const d = Math.sqrt(dSq);
            const f = REPULSION / dSq;
            const fx = (f * dx) / d;
            const fy = (f * dy) / d;
            a.fx -= fx;
            a.fy -= fy;
            b.fx += fx;
            b.fy += fy;
          }
        }

        // Spring edges
        for (let l = 0; l < links.length; l++) {
          const link = links[l];
          const a = nodes[link.a];
          const b = nodes[link.b];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy) + 0.01;
          const disp = d - link.rest;
          const f = link.strength * disp;
          const fx = (f * dx) / d;
          const fy = (f * dy) / d;
          a.fx += fx;
          a.fy += fy;
          b.fx -= fx;
          b.fy -= fy;
        }

        // Centripetal pull toward center
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.fx += (cx - n.x) * CENTRIPETAL;
          n.fy += (cy - n.y) * CENTRIPETAL;
        }

        // Cursor repulsion
        if (mouseRef.current.inCanvas && draggingIdxRef.current < 0) {
          const worldMouse = screenToWorld(mouseRef.current.x, mouseRef.current.y);
          for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            const dx = n.x - worldMouse.x;
            const dy = n.y - worldMouse.y;
            const dSq = dx * dx + dy * dy + 0.01;
            if (dSq < CURSOR_RADIUS * CURSOR_RADIUS) {
              const d = Math.sqrt(dSq);
              const f = CURSOR_STRENGTH / dSq;
              n.fx += (f * dx) / d;
              n.fy += (f * dy) / d;
            }
          }
        }

        // HQ is anchored gently to center
        const hq = nodes[graph.hqIndex];
        hq.fx += (cx - hq.x) * 0.09;
        hq.fy += (cy - hq.y) * 0.09;

        // Integrate
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (n.pinned) {
            n.vx = 0;
            n.vy = 0;
            continue;
          }
          n.vx = (n.vx + n.fx) * DAMPING;
          n.vy = (n.vy + n.fy) * DAMPING;
          const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
          const maxSpeed = 12;
          if (speed > maxSpeed) {
            n.vx = (n.vx / speed) * maxSpeed;
            n.vy = (n.vy / speed) * maxSpeed;
          }
          n.x += n.vx;
          n.y += n.vy;
          const margin = 14;
          if (n.x < margin) {
            n.x = margin;
            n.vx = Math.abs(n.vx) * 0.4;
          } else if (n.x > w - margin) {
            n.x = w - margin;
            n.vx = -Math.abs(n.vx) * 0.4;
          }
          if (n.y < margin) {
            n.y = margin;
            n.vy = Math.abs(n.vy) * 0.4;
          } else if (n.y > h - margin) {
            n.y = h - margin;
            n.vy = -Math.abs(n.vy) * 0.4;
          }
        }
      }

      const v = viewRef.current;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.scale(v.scale, v.scale);

      const hoveredI = hoveredIdxRef.current;
      const selectedI = selectedIdxRef.current;
      const activeI = hoveredI >= 0 ? hoveredI : selectedI;
      const highlighted = new Set<number>();
      if (activeI >= 0) {
        highlighted.add(activeI);
        graph.adjacency[activeI].forEach((i) => highlighted.add(i));
      }
      const hasHover = activeI >= 0;

      // Spawn burst — fades edges + nodes in from HQ over ~800ms after (re)init
      const spawnElapsed = timeRef.current - spawnRef.current;
      const spawnT = Math.min(1, spawnElapsed / 800);
      const spawnEase = 1 - Math.pow(1 - spawnT, 3);

      // Service filter — cities/hub/HQ matching filter stay at full alpha,
      // everything else fades to ~15%. Eases smoothly on toggle.
      const filter = filterServiceRef.current;
      const nodeInFilter = (i: number) => {
        if (!filter) return true;
        const n = nodes[i];
        if (n.kind === "hq") return true;
        if (n.kind === "hub") return n.serviceType === filter;
        return n.services?.includes(filter) ?? false;
      };
      const filterAmt = filter ? 1 : 0;
      const dimNode = (i: number) => 1 - (1 - (nodeInFilter(i) ? 1 : 0.14)) * filterAmt;
      const dimEdge = (a: number, b: number) => dimNode(a) * dimNode(b);

      // Edges
      for (let li = 0; li < links.length; li++) {
        const link = links[li];
        const a = nodes[link.a];
        const b = nodes[link.b];
        const isHighlighted = hasHover && highlighted.has(link.a) && highlighted.has(link.b);
        const dim = hasHover && !isHighlighted;
        let baseAlpha = link.kind === "hq" ? 0.08 : link.kind === "hub" ? 0.13 : 0.16;
        if (isHighlighted) baseAlpha = link.kind === "hq" ? 0.6 : 0.55;
        if (dim) baseAlpha *= 0.3;
        let colorHSL: { h: number; s: number; l: number };
        if (link.kind === "hub") {
          const hubNode = nodes[link.b].kind === "hub" ? nodes[link.b] : nodes[link.a];
          colorHSL = hubNode.color;
        } else if (link.kind === "hq") {
          colorHSL = HQ_COLOR;
        } else {
          colorHSL = { h: 192, s: 55, l: 68 };
        }
        // Curved edge for HQ links, straight for the rest
        ctx.beginPath();
        if (link.kind === "hq") {
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const nx = -(b.y - a.y);
          const ny = b.x - a.x;
          const len = Math.max(1, Math.sqrt(nx * nx + ny * ny));
          const bow = 0.11;
          const cpX = midX + (nx / len) * len * bow;
          const cpY = midY + (ny / len) * len * bow;
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(cpX, cpY, b.x, b.y);
        } else {
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
        ctx.strokeStyle = `hsla(${colorHSL.h}, ${colorHSL.s}%, ${colorHSL.l}%, ${baseAlpha * spawnEase * dimEdge(link.a, link.b)})`;
        ctx.lineWidth = isHighlighted ? 1.5 : link.kind === "hq" ? 0.55 : 0.7;
        ctx.stroke();
      }

      // Signal packets — glowing dots flow HQ → city along the bezier curve
      if (animate) {
        const packetPeriod = 3400;
        for (let li = 0; li < links.length; li++) {
          const link = links[li];
          if (link.kind !== "hq") continue;
          const a = nodes[link.a];
          const b = nodes[link.b];
          const hq = a.kind === "hq" ? a : b;
          const city = a.kind === "hq" ? b : a;
          if (!city.visits) continue;
          const offset = (link.a * 173 + link.b * 89) % packetPeriod;
          const phase = ((timeRef.current + offset) % packetPeriod) / packetPeriod;
          if (phase > 0.72) continue;
          const p = phase / 0.72;
          const midX = (hq.x + city.x) / 2;
          const midY = (hq.y + city.y) / 2;
          const nx = -(city.y - hq.y);
          const ny = city.x - hq.x;
          const len = Math.max(1, Math.sqrt(nx * nx + ny * ny));
          const bow = 0.11;
          const cpX = midX + (nx / len) * len * bow;
          const cpY = midY + (ny / len) * len * bow;
          const om = 1 - p;
          const px = om * om * hq.x + 2 * om * p * cpX + p * p * city.x;
          const py = om * om * hq.y + 2 * om * p * cpY + p * p * city.y;
          const packetDim = hasHover && !(highlighted.has(link.a) && highlighted.has(link.b));
          const alpha =
            (p < 0.15 ? p / 0.15 : p > 0.85 ? (1 - p) / 0.15 : 1) *
            (packetDim ? 0.22 : 0.85) *
            spawnEase *
            dimEdge(link.a, link.b);
          const h1 = HQ_COLOR.h + (city.color.h - HQ_COLOR.h) * p;
          const s1 = HQ_COLOR.s + (city.color.s - HQ_COLOR.s) * p;
          const l1 = HQ_COLOR.l + (city.color.l - HQ_COLOR.l) * p;
          const glow = ctx.createRadialGradient(px, py, 0, px, py, 10);
          glow.addColorStop(0, `hsla(${h1}, ${s1}%, ${l1}%, ${alpha * 0.55})`);
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(px, py, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px, py, 1.9, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${h1}, ${s1}%, ${Math.min(l1 + 10, 92)}%, ${alpha})`;
          ctx.fill();
        }
      }

      // Nodes (draw HQ last so it's on top)
      const drawOrder = [
        ...nodes.map((_, i) => i).filter((i) => nodes[i].kind !== "hq"),
        graph.hqIndex,
      ];
      for (const i of drawOrder) {
        const n = nodes[i];
        const isHovered = i === hoveredI;
        const isConnected = hasHover && highlighted.has(i) && !isHovered;
        const dim = hasHover && !highlighted.has(i);
        const col = n.color;
        const baseR = isHovered ? n.radius * 1.3 : isConnected ? n.radius * 1.12 : n.radius;

        // Halo
        const glowR = baseR * (isHovered ? 5 : n.kind === "hq" ? 4.5 : n.kind === "hub" ? 3.5 : 2.5);
        const glowAlpha = dim
          ? 0.02
          : isHovered
          ? 0.34
          : isConnected
          ? 0.18
          : n.kind === "hq"
          ? 0.24
          : n.kind === "hub"
          ? 0.1
          : (n.visits ?? 0) >= 100
          ? 0.08
          : 0.05;
        const nodeDim = dimNode(i);
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
        grad.addColorStop(0, `hsla(${col.h}, ${col.s}%, ${col.l}%, ${glowAlpha * spawnEase * nodeDim})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.beginPath();
        ctx.arc(n.x, n.y, baseR * (0.6 + 0.4 * spawnEase), 0, Math.PI * 2);
        const coreAlpha = dim ? 0.28 : isHovered ? 1 : isConnected ? 0.95 : n.kind === "hq" ? 0.98 : 0.85;
        ctx.fillStyle = `hsla(${col.h}, ${col.s}%, ${col.l}%, ${coreAlpha * spawnEase * nodeDim})`;
        ctx.fill();

        // Rim
        if (isHovered || n.kind === "hq") {
          ctx.strokeStyle = `hsla(${col.h}, ${col.s}%, ${Math.min(col.l + 20, 92)}%, ${isHovered ? 0.85 : 0.6})`;
          ctx.lineWidth = isHovered ? 1.8 : 1.2;
          ctx.stroke();
        }

        // Labels — dramatically cut ambient noise on mobile. Only HQ + hub
        // labels always show. City names appear on hover / selection so the
        // graph reads as a clean network instead of a wall of overlapping text.
        const showLabel =
          n.kind === "hq" ||
          n.kind === "hub" ||
          isHovered ||
          isConnected;
        if (showLabel) {
          const labelAlpha = dim ? 0.35 : isHovered ? 1 : n.kind === "hq" ? 0.95 : 0.75;
          ctx.font = `${
            n.kind === "hq" ? "bold 11.5px" : n.kind === "hub" ? "600 10px" : (n.visits ?? 0) >= 400 ? "bold 10px" : "500 9.5px"
          } Inter, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          const labelY = n.y - baseR - 6;
          ctx.fillStyle = `hsla(220, 30%, 4%, ${labelAlpha * 0.7})`;
          ctx.fillText(n.name, n.x + 0.5, labelY + 0.5);
          ctx.fillStyle = `hsla(0, 0%, 100%, ${labelAlpha})`;
          ctx.fillText(n.name, n.x, labelY);
        }
      }

      ctx.restore();

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [screenToWorld, animate]);

  // ── Pointer handlers ─────────────────────────
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const p = getPos(e);
      const idx = hitTest(p.x, p.y);
      pointerDownRef.current = { x: p.x, y: p.y, t: Date.now(), idx };
      dragMovedRef.current = false;
      setHasInteracted(true);
      if (idx >= 0) {
        draggingIdxRef.current = idx;
        graphRef.current!.nodes[idx].pinned = true;
        try {
          canvasRef.current!.setPointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
        if ("vibrate" in navigator) {
          try {
            (navigator as Navigator & { vibrate: (n: number) => void }).vibrate(6);
          } catch {
            /* noop */
          }
        }
        e.preventDefault();
      } else {
        isPanningRef.current = true;
        panStartRef.current = {
          x: p.x,
          y: p.y,
          viewX: viewRef.current.x,
          viewY: viewRef.current.y,
        };
        try {
          canvasRef.current!.setPointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
        e.preventDefault();
      }
    },
    [hitTest]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const p = getPos(e);
      mouseRef.current = { x: p.x, y: p.y, inCanvas: true };
      const down = pointerDownRef.current;
      if (down) {
        const dx = p.x - down.x;
        const dy = p.y - down.y;
        if (dx * dx + dy * dy > 36) dragMovedRef.current = true;
      }
      if (draggingIdxRef.current >= 0) {
        const world = screenToWorld(p.x, p.y);
        const n = graphRef.current!.nodes[draggingIdxRef.current];
        n.x = world.x;
        n.y = world.y;
        n.vx = 0;
        n.vy = 0;
        const s = worldToScreen(n.x, n.y);
        setTooltip({ idx: draggingIdxRef.current, sx: s.x, sy: s.y });
      } else if (isPanningRef.current) {
        const dx = p.x - panStartRef.current.x;
        const dy = p.y - panStartRef.current.y;
        viewRef.current.x = panStartRef.current.viewX + dx;
        viewRef.current.y = panStartRef.current.viewY + dy;
      } else {
        const idx = hitTest(p.x, p.y);
        if (idx !== hoveredIdxRef.current) setHoveredIdx(idx);
        if (idx >= 0) {
          const n = graphRef.current!.nodes[idx];
          const s = worldToScreen(n.x, n.y);
          setTooltip({ idx, sx: s.x, sy: s.y });
        } else {
          setTooltip(null);
        }
      }
    },
    [hitTest, screenToWorld, worldToScreen]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const down = pointerDownRef.current;
    if (draggingIdxRef.current >= 0) {
      graphRef.current!.nodes[draggingIdxRef.current].pinned = false;
      draggingIdxRef.current = -1;
    }
    isPanningRef.current = false;
    if (down) {
      const elapsed = Date.now() - down.t;
      if (!dragMovedRef.current && elapsed < 350) {
        if (down.idx >= 0) {
          setSelectedIdx((cur) => (cur === down.idx ? -1 : down.idx));
        } else {
          setSelectedIdx(-1);
        }
      }
    }
    pointerDownRef.current = null;
    dragMovedRef.current = false;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }, []);

  /**
   * The browser fires pointercancel when it decides a gesture belongs to it
   * rather than to us — which, with `touch-action: pan-y` inline, is exactly
   * what happens every time a thumb drag turns into a page scroll.
   *
   * Without this the few pixels of movement before the browser took over
   * would be left applied, so the map crept sideways a little every time you
   * scrolled past it. Put the view and the node back where they were at
   * pointerdown and the map simply sits still while the page moves.
   */
  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current && panStartRef.current) {
      viewRef.current.x = panStartRef.current.viewX;
      viewRef.current.y = panStartRef.current.viewY;
    }
    if (draggingIdxRef.current >= 0) {
      graphRef.current!.nodes[draggingIdxRef.current].pinned = false;
      draggingIdxRef.current = -1;
    }
    isPanningRef.current = false;
    pointerDownRef.current = null;
    dragMovedRef.current = false;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    mouseRef.current = { x: -9999, y: -9999, inCanvas: false };
    setHoveredIdx(-1);
    setTooltip(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const v = viewRef.current;
    const delta = -e.deltaY * 0.0018;
    const next = Math.max(0.55, Math.min(2.6, v.scale * (1 + delta)));
    const worldX = (px - v.x) / v.scale;
    const worldY = (py - v.y) / v.scale;
    v.x = px - worldX * next;
    v.y = py - worldY * next;
    v.scale = next;
    forceRerender((n) => n + 1);
  }, []);

  const resetView = useCallback(() => {
    initGraph();
    forceRerender((n) => n + 1);
  }, [initGraph]);

  const clearSelection = useCallback(() => setSelectedIdx(-1), []);

  const graph = graphRef.current;
  const tooltipNode = tooltip && graph ? graph.nodes[tooltip.idx] : null;

  const wrapperClasses = isFullscreen
    ? "graph-canvas fixed inset-0 z-[80] w-full h-full overflow-hidden border-0 shadow-none rounded-none"
    : "graph-canvas relative w-full h-80 sm:h-[26rem] md:h-[30rem] rounded-2xl overflow-hidden border border-border/60 shadow-[0_4px_28px_rgba(0,0,0,0.22)]";

  /**
   * `touch-action` decides who owns a thumb drag that starts on the map: us,
   * or the browser's page scrolling. It used to be `none` unconditionally,
   * which means "the map handles every gesture" — so inline, where the map is
   * 320px tall on a 844px phone, it made 38% of the viewport a strip you
   * physically could not scroll past. Your thumb landed on it and the page
   * just did not move.
   *
   * Inline it is now `pan-y`: the browser keeps vertical panning (the page
   * scrolls, always), and the map still gets taps, horizontal drags and
   * pinch. Node dragging is the thing that gives way on a phone, and that is
   * the right trade — reading the page is not optional, dragging a node is.
   * Fullscreen there is no page behind to scroll, so it stays `none` and the
   * map gets everything.
   *
   * When the browser takes over the gesture it fires pointercancel, which is
   * already wired to handlePointerUp, so a drag that turns into a page scroll
   * cleans up after itself rather than leaving a node stuck to the finger.
   */
  const touchAction = isFullscreen ? "none" : "pan-y";

  return (
    <div
      ref={containerRef}
      className={wrapperClasses}
      style={{ touchAction, overscrollBehavior: "contain" }}
      data-testid="obsidian-graph"
    >
      <div className="graph-glow" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 select-none"
        style={{
          cursor: draggingIdxRef.current >= 0 ? "grabbing" : hoveredIdx >= 0 ? "grab" : "default",
          touchAction,
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          overscrollBehavior: "contain",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Top-left HQ pill */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10.5px] font-semibold text-white/90">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: `hsl(${HQ_COLOR.h} ${HQ_COLOR.s}% ${HQ_COLOR.l}%)`,
              boxShadow: `0 0 8px hsl(${HQ_COLOR.h} ${HQ_COLOR.s}% ${HQ_COLOR.l}% / 0.75)`,
            }}
          />
          The Maine Cleaning Co. · Southern Maine
        </div>
      </div>

      {/* Top-right controls — compact cluster in one pill */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        {selectedIdx >= 0 && (
          <button
            type="button"
            onClick={clearSelection}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:border-white/25 transition-colors"
            title="Clear selection"
            data-testid="button-graph-clear-selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="flex items-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full overflow-hidden">
          <button
            type="button"
            onClick={resetView}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Reset graph"
            data-testid="button-graph-reset"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors border-l border-white/10"
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Expand fullscreen"}
            data-testid="button-graph-fullscreen"
          >
            {isFullscreen ? <Shrink className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* First-time hint — fades out once the user interacts */}
      {!hasInteracted && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2"
        >
          <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
            Tap a node to focus · drag to move
          </div>
        </motion.div>
      )}

      {/* Bottom row — reach label + tappable filter chips */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-col-reverse sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 text-white/60 pointer-events-none">
          <MapPin className="w-3 h-3" />
          <span className="text-[10px] font-medium">
            {TOTAL_COMMUNITIES}+ communities · all across Southern Maine
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-start sm:justify-end">
          {[
            { type: "residential" as ServiceType, c: RES_COLOR, label: "Residential" },
            { type: "commercial" as ServiceType, c: COM_COLOR, label: "Commercial" },
            { type: "vacation" as ServiceType, c: VAC_COLOR, label: "Vacation" },
          ].map((it) => {
            const active = filterService === it.type;
            return (
              <button
                key={it.type}
                type="button"
                onClick={() => {
                  setHasInteracted(true);
                  setFilterService((cur) => (cur === it.type ? null : it.type));
                }}
                className={`flex items-center gap-1 h-6 px-2 rounded-full backdrop-blur-md border transition-all text-[10px] font-semibold ${
                  active
                    ? "bg-white/15 border-white/40 text-white"
                    : "bg-black/40 border-white/10 text-white/70 hover:text-white hover:border-white/25"
                }`}
                title={active ? `Show all` : `Isolate ${it.label} network`}
                data-testid={`button-filter-${it.type}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: `hsl(${it.c.h} ${it.c.s}% ${it.c.l}%)`,
                    boxShadow: `0 0 ${active ? 8 : 5}px hsl(${it.c.h} ${it.c.s}% ${it.c.l}% / ${active ? 0.9 : 0.6})`,
                  }}
                />
                {it.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && tooltipNode && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: tooltip.sx,
            top: tooltip.sy,
            transform: "translate(-50%, calc(-100% - 14px))",
          }}
        >
          <div className="bg-card/95 backdrop-blur-md rounded-lg px-3 py-2 shadow-[0_6px_24px_rgba(0,0,0,0.3)] border border-border min-w-[130px]">
            {tooltipNode.kind === "city" && (
              <>
                <p className="text-xs font-bold text-foreground">{tooltipNode.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {tooltipNode.visits?.toLocaleString()} visits
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tooltipNode.services?.map((s) => {
                    const col = s === "vacation" ? VAC_COLOR : s === "commercial" ? COM_COLOR : RES_COLOR;
                    const label = s === "vacation" ? "Vacation" : s === "commercial" ? "Commercial" : "Residential";
                    return (
                      <span
                        key={s}
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `hsla(${col.h}, ${col.s}%, ${col.l}%, 0.18)`,
                          color: `hsl(${col.h} ${col.s}% ${Math.max(col.l - 12, 30)}%)`,
                        }}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
            {tooltipNode.kind === "hub" && (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: `hsl(${tooltipNode.color.h} ${tooltipNode.color.s}% ${tooltipNode.color.l}%)` }}
                  />
                  <p className="text-xs font-bold text-foreground">{tooltipNode.name}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">Service category</p>
              </>
            )}
            {tooltipNode.kind === "hq" && (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: `hsl(${HQ_COLOR.h} ${HQ_COLOR.s}% ${HQ_COLOR.l}%)`,
                      boxShadow: `0 0 8px hsl(${HQ_COLOR.h} ${HQ_COLOR.s}% ${HQ_COLOR.l}% / 0.7)`,
                    }}
                  />
                  <p className="text-xs font-bold text-foreground">{tooltipNode.name}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">Southern Maine headquarters</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ServiceAreaMap() {
  const reduce = useReducedMotion();
  const topThree = useMemo(() => [...cities].sort((a, b) => b.visits - a.visits).slice(0, 3), []);

  return (
    <div className="max-w-4xl mx-auto" data-testid="card-service-area-map">
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

      <ObsidianGraph animate={!reduce} />

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
