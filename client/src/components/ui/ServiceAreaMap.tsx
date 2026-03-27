import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Heart, MapPin, Sparkles } from "lucide-react";

type ServiceType = "residential" | "commercial" | "janitorial" | "vacation" | "moveinout";

const serviceTypeLabels: Record<ServiceType, string> = {
  residential: "Residential",
  commercial: "Commercial",
  janitorial: "Janitorial",
  vacation: "Vacation Rental",
  moveinout: "Move-In/Out",
};

const serviceTypeColors: Record<ServiceType, { h: number; s: number; l: number }> = {
  residential: { h: 208, s: 70, l: 60 },
  commercial: { h: 145, s: 60, l: 50 },
  janitorial: { h: 35, s: 80, l: 55 },
  vacation: { h: 280, s: 55, l: 60 },
  moveinout: { h: 350, s: 65, l: 58 },
};

const customerCities: { name: string; lat: number; lng: number; visits: number; services: ServiceType[] }[] = [
  { name: "Portland", lat: 43.6591, lng: -70.2568, visits: 848, services: ["residential", "commercial", "janitorial"] },
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
  { name: "Cape Elizabeth", lat: 43.5636, lng: -70.2000, visits: 28, services: ["residential", "commercial", "moveinout"] },
];

const totalCities = 49;
const maxVisits = Math.max(...customerCities.map(c => c.visits));

const kpiCards = [
  { icon: TrendingUp, label: "Total Visits", value: "4,715+", sub: "Cleans completed since 2018", color: "text-blue-600", barColor: "", barPct: 0 },
  { icon: Heart, label: "93% Recurring", value: "93%", sub: "Most clients stay with us", color: "text-emerald-600", barColor: "bg-emerald-500", barPct: 93 },
  { icon: Sparkles, label: "7% One-Time", value: "7%", sub: "Deep cleans & move-outs", color: "text-amber-600", barColor: "bg-amber-500", barPct: 7 },
  { icon: MapPin, label: "Communities", value: "49", sub: "York & Cumberland County", color: "text-purple-600", barColor: "", barPct: 0 },
];

type CityNode = {
  x: number; y: number;
  baseX: number; baseY: number;
  radius: number; visits: number;
  name: string; services: ServiceType[];
  kind: "city";
  vx: number; vy: number;
};

type HubNode = {
  x: number; y: number;
  baseX: number; baseY: number;
  radius: number;
  name: string;
  serviceType: ServiceType;
  kind: "hub";
  vx: number; vy: number;
};

type GraphNode = CityNode | HubNode;
type Edge = { from: number; to: number; dist: number; kind: "city" | "hub" };

const serviceHubPositions: { type: ServiceType; angle: number }[] = [
  { type: "residential", angle: Math.PI * 0.5 },
  { type: "commercial", angle: Math.PI * 1.1 },
  { type: "janitorial", angle: Math.PI * 1.5 },
  { type: "vacation", angle: Math.PI * 0.1 },
  { type: "moveinout", angle: Math.PI * 1.8 },
];

function buildGraph(width: number, height: number) {
  const latMin = Math.min(...customerCities.map(c => c.lat));
  const latMax = Math.max(...customerCities.map(c => c.lat));
  const lngMin = Math.min(...customerCities.map(c => c.lng));
  const lngMax = Math.max(...customerCities.map(c => c.lng));
  const padX = width * 0.15;
  const padY = height * 0.15;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;
  const cx = width / 2;
  const cy = height / 2;

  const cityNodes: GraphNode[] = customerCities.map(city => {
    const nx = ((city.lng - lngMin) / (lngMax - lngMin)) * usableW + padX;
    const ny = ((latMax - city.lat) / (latMax - latMin)) * usableH + padY;
    const r = 3.5 + (city.visits / maxVisits) * 12;
    return { x: nx, y: ny, baseX: nx, baseY: ny, radius: r, visits: city.visits, name: city.name, services: city.services, kind: "city" as const, vx: 0, vy: 0 };
  });

  const hubRadius = Math.min(usableW, usableH) * 0.38;
  const hubNodes: GraphNode[] = serviceHubPositions.map(hub => {
    const hx = cx + Math.cos(hub.angle) * hubRadius;
    const hy = cy + Math.sin(hub.angle) * hubRadius;
    return { x: hx, y: hy, baseX: hx, baseY: hy, radius: 10, name: serviceTypeLabels[hub.type], serviceType: hub.type, kind: "hub" as const, vx: 0, vy: 0 };
  });

  const nodes: GraphNode[] = [...cityNodes, ...hubNodes];
  const cityCount = cityNodes.length;
  const edges: Edge[] = [];

  for (let i = 0; i < cityCount; i++) {
    for (let j = i + 1; j < cityCount; j++) {
      const dx = cityNodes[i].baseX - cityNodes[j].baseX;
      const dy = cityNodes[i].baseY - cityNodes[j].baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < Math.min(usableW, usableH) * 0.28) {
        edges.push({ from: i, to: j, dist, kind: "city" });
      }
    }
  }

  for (let hi = 0; hi < hubNodes.length; hi++) {
    const hub = hubNodes[hi] as HubNode;
    const hubIdx = cityCount + hi;
    for (let ci = 0; ci < cityCount; ci++) {
      const city = cityNodes[ci] as CityNode;
      if (city.services.includes(hub.serviceType)) {
        const dx = city.baseX - hub.baseX;
        const dy = city.baseY - hub.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        edges.push({ from: ci, to: hubIdx, dist, kind: "hub" });
      }
    }
  }

  return { nodes, edges, cityCount };
}

type HoverInfo = {
  name: string;
  kind: "city" | "hub";
  visits?: number;
  services?: ServiceType[];
  serviceType?: ServiceType;
  connectedCities?: string[];
};

function NetworkGraph({ hoveredName, onHover }: {
  hoveredName: string | null;
  onHover: (info: HoverInfo | null, pctX: number, pctY: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ReturnType<typeof buildGraph> | null>(null);
  const angleRef = useRef(0);
  const animRef = useRef<number>(0);
  const hoveredRef = useRef<string | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const isVisibleRef = useRef(true);

  hoveredRef.current = hoveredName;

  const initGraph = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;
    sizeRef.current = { w, h };
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    }
    graphRef.current = buildGraph(w, h);
  }, []);

  useEffect(() => {
    initGraph();
    const handleResize = () => { initGraph(); };
    window.addEventListener("resize", handleResize);
    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    }, { threshold: 0.1 });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [initGraph]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (!isVisibleRef.current) { animRef.current = requestAnimationFrame(draw); return; }
      const graph = graphRef.current;
      if (!graph) { animRef.current = requestAnimationFrame(draw); return; }
      const { w, h } = sizeRef.current;
      const { nodes, edges, cityCount } = graph;

      angleRef.current += 0.002;
      const angle = angleRef.current;
      const cx = w / 2;
      const cy = h / 2;

      const rotatedNodes = nodes.map((node, i) => {
        const dx = node.baseX - cx;
        const dy = node.baseY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nodeAngle = Math.atan2(dy, dx);
        const isHub = node.kind === "hub";
        const rotSpeed = isHub ? angle * 0.7 : angle;
        const wobbleAmp = isHub ? 1.5 : 3;
        const finalAngle = nodeAngle + rotSpeed;
        const wobble = Math.sin(angle * 2 + dist * 0.01) * wobbleAmp;
        return {
          ...node,
          x: cx + Math.cos(finalAngle) * dist + wobble,
          y: cy + Math.sin(finalAngle) * dist + Math.cos(angle * 1.5 + dist * 0.015) * (isHub ? 1 : 2),
        };
      });

      ctx.clearRect(0, 0, w, h);

      const hoveredNode = hoveredRef.current;
      const hoveredIdx = hoveredNode ? nodes.findIndex(n => n.name === hoveredNode) : -1;
      const highlightSet = new Set<number>();
      if (hoveredIdx >= 0) {
        highlightSet.add(hoveredIdx);
        edges.forEach(e => {
          if (e.from === hoveredIdx) highlightSet.add(e.to);
          if (e.to === hoveredIdx) highlightSet.add(e.from);
        });
      }

      edges.forEach(edge => {
        const a = rotatedNodes[edge.from];
        const b = rotatedNodes[edge.to];
        const isHighlighted = highlightSet.has(edge.from) && highlightSet.has(edge.to);
        const isHub = edge.kind === "hub";

        if (isHub) {
          const hubNode = (edge.from >= cityCount ? rotatedNodes[edge.from] : rotatedNodes[edge.to]) as HubNode & { x: number; y: number };
          const col = serviceTypeColors[hubNode.serviceType];
          const alpha = isHighlighted ? 0.35 : 0.06;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `hsla(${col.h}, ${col.s}%, ${col.l}%, ${alpha})`;
          ctx.lineWidth = isHighlighted ? 1.5 : 0.5;
          ctx.setLineDash(isHighlighted ? [] : [3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          const maxDist = Math.min(w, h) * 0.28;
          const alpha = isHighlighted ? 0.2 : Math.max(0.02, 0.08 * (1 - edge.dist / maxDist));
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `hsla(208, 50%, 55%, ${alpha})`;
          ctx.lineWidth = isHighlighted ? 1.2 : 0.4;
          ctx.stroke();
        }
      });

      rotatedNodes.forEach((node, i) => {
        const isHovered = hoveredRef.current === node.name;
        const isConnected = highlightSet.has(i) && !isHovered;

        if (node.kind === "hub") {
          const hub = node as HubNode & { x: number; y: number };
          const col = serviceTypeColors[hub.serviceType];
          const r = isHovered ? 14 : isConnected ? 12 : 10;

          const glowR = r * (isHovered ? 4 : 2.5);
          const glow = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, glowR);
          glow.addColorStop(0, `hsla(${col.h}, ${col.s}%, ${col.l}%, ${isHovered ? 0.3 : 0.08})`);
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(hub.x, hub.y, glowR, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(hub.x, hub.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${col.h}, ${col.s}%, ${col.l}%, ${isHovered ? 1 : isConnected ? 0.85 : 0.65})`;
          ctx.fill();

          if (isHovered) {
            ctx.strokeStyle = `hsla(${col.h}, ${col.s}%, ${col.l + 15}%, 0.7)`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          ctx.fillStyle = `hsla(${col.h}, ${col.s}%, ${col.l}%, ${isHovered ? 0.95 : 0.55})`;
          ctx.font = `bold ${isHovered ? 11 : 9}px Inter, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(hub.name, hub.x, hub.y - r - 6);
        } else {
          const city = node as CityNode & { x: number; y: number };
          const intensity = 0.35 + (city.visits / maxVisits) * 0.65;
          const r = isHovered ? city.radius * 1.4 : isConnected ? city.radius * 1.15 : city.radius;

          if (city.visits >= 100 || isHovered) {
            const glowR = r * (isHovered ? 4 : 2.5);
            const glow = ctx.createRadialGradient(city.x, city.y, 0, city.x, city.y, glowR);
            glow.addColorStop(0, `hsla(208, 80%, 65%, ${isHovered ? 0.3 : 0.08})`);
            glow.addColorStop(1, "transparent");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(city.x, city.y, glowR, 0, Math.PI * 2);
            ctx.fill();
          }

          if (isHovered && city.services.length > 0) {
            const col = serviceTypeColors[city.services[0]];
            ctx.beginPath();
            ctx.arc(city.x, city.y, r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${col.h}, ${col.s}%, ${col.l + 10}%, ${intensity + 0.15})`;
            ctx.fill();
            ctx.strokeStyle = `hsla(${col.h}, ${col.s}%, ${col.l + 20}%, 0.6)`;
            ctx.lineWidth = 2;
            ctx.stroke();
          } else if (isConnected && hoveredIdx >= cityCount) {
            const hovNode = nodes[hoveredIdx] as HubNode;
            const col = serviceTypeColors[hovNode.serviceType];
            ctx.beginPath();
            ctx.arc(city.x, city.y, r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${col.h}, ${col.s}%, ${col.l}%, ${intensity + 0.1})`;
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(city.x, city.y, r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(208, 70%, 60%, ${intensity})`;
            ctx.fill();
          }

          if (city.visits >= 400 && !isHovered) {
            ctx.fillStyle = `rgba(255,255,255,${0.3 + intensity * 0.15})`;
            ctx.font = "bold 9px Inter, system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(city.name, city.x, city.y - city.radius - 5);
          }
        }
      });

      graph.nodes.forEach((_, i) => {
        nodes[i].x = rotatedNodes[i].x;
        nodes[i].y = rotatedNodes[i].y;
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const graph = graphRef.current;
    if (!canvas || !graph) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { w, h } = sizeRef.current;

    let found: HoverInfo | null = null;
    let pctX = 0, pctY = 0;
    for (let i = 0; i < graph.nodes.length; i++) {
      const node = graph.nodes[i];
      const dx = node.x - mx;
      const dy = node.y - my;
      const hitR = node.kind === "hub" ? node.radius + 12 : node.radius + 8;
      if (Math.sqrt(dx * dx + dy * dy) < hitR) {
        pctX = (node.x / w) * 100;
        pctY = (node.y / h) * 100;
        if (node.kind === "hub") {
          const hub = node as HubNode;
          const connected = graph.edges
            .filter(e => (e.from === i || e.to === i) && e.kind === "hub")
            .map(e => {
              const otherIdx = e.from === i ? e.to : e.from;
              return graph.nodes[otherIdx].name;
            });
          found = { name: hub.name, kind: "hub", serviceType: hub.serviceType, connectedCities: connected };
        } else {
          const city = node as CityNode;
          found = { name: city.name, kind: "city", visits: city.visits, services: city.services };
        }
        break;
      }
    }
    onHover(found, pctX, pctY);
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null, 0, 0);
  }, [onHover]);

  return (
    <div ref={containerRef} className="relative w-full bg-[hsl(208,22%,14%)] rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2)]" style={{ aspectRatio: "16/9" }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 text-white/40">
          <MapPin className="w-3 h-3" />
          <span className="text-[10px] font-medium">{totalCities} communities</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/30 flex-wrap justify-end">
          {(Object.keys(serviceTypeColors) as ServiceType[]).map(st => {
            const col = serviceTypeColors[st];
            return (
              <span key={st} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: `hsl(${col.h}, ${col.s}%, ${col.l}%)` }} />
                {serviceTypeLabels[st]}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ServiceAreaMap() {
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ pctX: 0, pctY: 0 });
  const [tooltipInfo, setTooltipInfo] = useState<HoverInfo | null>(null);

  const handleHover = useCallback((info: HoverInfo | null, pctX: number, pctY: number) => {
    setHoveredName(info?.name || null);
    if (info) {
      setTooltipPos({ pctX, pctY });
      setTooltipInfo(info);
    } else {
      setTooltipInfo(null);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto" data-testid="card-service-area-map">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl border border-border p-3 sm:p-4 text-center shadow-sm"
              data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${kpi.color} mx-auto mb-1.5`} />
              <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{kpi.label}</p>
              <p className="text-lg sm:text-xl font-bold text-foreground leading-tight">{kpi.value}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground/70 font-medium mt-0.5">{kpi.sub}</p>
              {kpi.barPct > 0 && (
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2 mx-2">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${kpi.barPct}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 + 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full ${kpi.barColor} rounded-full`}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="relative mb-5 sm:mb-6">
        <NetworkGraph hoveredName={hoveredName} onHover={handleHover} />
        {tooltipInfo && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${tooltipPos.pctX}%`,
              top: `${tooltipPos.pctY}%`,
              transform: "translate(-50%, -120%)",
            }}
          >
            <div className="bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border min-w-[120px]">
              {tooltipInfo.kind === "city" ? (
                <>
                  <p className="text-xs font-bold text-foreground">{tooltipInfo.name}</p>
                  <p className="text-[10px] text-muted-foreground">{tooltipInfo.visits?.toLocaleString()} visits</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tooltipInfo.services?.map(s => {
                      const col = serviceTypeColors[s];
                      return (
                        <span key={s} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: `hsla(${col.h}, ${col.s}%, ${col.l}%, 0.15)`, color: `hsl(${col.h}, ${col.s}%, ${col.l - 10}%)` }}>
                          {serviceTypeLabels[s]}
                        </span>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: tooltipInfo.serviceType ? `hsl(${serviceTypeColors[tooltipInfo.serviceType].h}, ${serviceTypeColors[tooltipInfo.serviceType].s}%, ${serviceTypeColors[tooltipInfo.serviceType].l}%)` : undefined }} />
                    <p className="text-xs font-bold text-foreground">{tooltipInfo.name}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{tooltipInfo.connectedCities?.length} communities</p>
                  <p className="text-[9px] text-muted-foreground/70 mt-0.5 leading-tight">
                    {tooltipInfo.connectedCities?.slice(0, 5).join(", ")}
                    {(tooltipInfo.connectedCities?.length || 0) > 5 ? ` +${(tooltipInfo.connectedCities?.length || 0) - 5} more` : ""}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {customerCities.slice(0, 10).map((city, i) => {
          const pct = (city.visits / customerCities[0].visits) * 100;
          return (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="bg-card rounded-xl border border-border px-3 py-2.5 shadow-sm"
              data-testid={`rank-city-${i}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-muted-foreground w-4 text-right">#{i + 1}</span>
                <span className="text-[11px] font-semibold text-foreground truncate flex-1">{city.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 bg-secondary rounded-full overflow-hidden flex-1">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.6 }}
                    className="h-full bg-primary/50 rounded-full"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold tabular-nums w-8 text-right">{city.visits}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-3">
        + {totalCities - 10} more communities served across Southern Maine
      </p>
    </div>
  );
}
