import { useRef, useState, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import * as THREE from "three";

const GLOBE_RADIUS = 2;

const customerCities = [
  { name: "Scarborough", lat: 43.5781, lng: -70.3222, clients: 8 },
  { name: "Naples", lat: 43.9781, lng: -70.6075, clients: 3 },
  { name: "Falmouth", lat: 43.7298, lng: -70.2378, clients: 3 },
  { name: "Windham", lat: 43.7985, lng: -70.4039, clients: 3 },
  { name: "Portland", lat: 43.6591, lng: -70.2568, clients: 2 },
  { name: "Casco", lat: 43.9580, lng: -70.5175, clients: 2 },
  { name: "Gorham", lat: 43.6795, lng: -70.4434, clients: 1 },
  { name: "Kennebunk", lat: 43.3884, lng: -70.5449, clients: 2 },
  { name: "South Portland", lat: 43.6415, lng: -70.2580, clients: 1 },
  { name: "Old Orchard Beach", lat: 43.5168, lng: -70.3773, clients: 1 },
  { name: "West Baldwin", lat: 43.8386, lng: -70.7700, clients: 1 },
  { name: "Standish", lat: 43.7570, lng: -70.5594, clients: 1 },
  { name: "Waterboro", lat: 43.5368, lng: -70.7192, clients: 1 },
];

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function GlobeWireframe() {
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(GLOBE_RADIUS, 48, 48);
    return new THREE.EdgesGeometry(geo);
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#1e3a5f" transparent opacity={0.12} />
    </lineSegments>
  );
}

function GlobeSphere() {
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <meshPhysicalMaterial
        color="#0a1628"
        roughness={0.8}
        metalness={0.1}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

function GlobeGrid() {
  const latLines = useMemo(() => {
    const result: [number, number, number][][] = [];
    for (let lat = -60; lat <= 80; lat += 20) {
      const points: [number, number, number][] = [];
      for (let lng = -180; lng <= 180; lng += 2) {
        const v = latLngToVector3(lat, lng, GLOBE_RADIUS + 0.002);
        points.push([v.x, v.y, v.z]);
      }
      result.push(points);
    }
    return result;
  }, []);

  const lngLines = useMemo(() => {
    const result: [number, number, number][][] = [];
    for (let lng = -180; lng < 180; lng += 30) {
      const points: [number, number, number][] = [];
      for (let lat = -90; lat <= 90; lat += 2) {
        const v = latLngToVector3(lat, lng, GLOBE_RADIUS + 0.002);
        points.push([v.x, v.y, v.z]);
      }
      result.push(points);
    }
    return result;
  }, []);

  return (
    <>
      {latLines.map((points, i) => (
        <Line key={`lat-${i}`} points={points} color="#1a3050" transparent opacity={0.2} lineWidth={0.5} />
      ))}
      {lngLines.map((points, i) => (
        <Line key={`lng-${i}`} points={points} color="#1a3050" transparent opacity={0.2} lineWidth={0.5} />
      ))}
    </>
  );
}

function GlowPin({ city, onHover, onUnhover, isHovered }: {
  city: typeof customerCities[0];
  onHover: () => void;
  onUnhover: () => void;
  isHovered: boolean;
}) {
  const pos = useMemo(() => latLngToVector3(city.lat, city.lng, GLOBE_RADIUS + 0.01), [city.lat, city.lng]);
  const outerPos = useMemo(() => latLngToVector3(city.lat, city.lng, GLOBE_RADIUS + 0.02), [city.lat, city.lng]);
  const pinScale = 0.02 + city.clients * 0.006;
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const target = isHovered ? 1 : 0.6;
      mat.opacity += (target - mat.opacity) * delta * 5;
      const s = isHovered ? pinScale * 2.5 : pinScale * 1.8;
      glowRef.current.scale.lerp(new THREE.Vector3(s, s, s), delta * 5);
    }
    if (meshRef.current) {
      const s = isHovered ? pinScale * 1.3 : pinScale;
      meshRef.current.scale.lerp(new THREE.Vector3(s, s, s), delta * 5);
    }
  });

  return (
    <group>
      <mesh ref={glowRef} position={outerPos}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#4fc3f7" transparent opacity={0.6} />
      </mesh>
      <mesh
        ref={meshRef}
        position={pos}
        onPointerEnter={(e) => { e.stopPropagation(); onHover(); }}
        onPointerLeave={(e) => { e.stopPropagation(); onUnhover(); }}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#80deea" />
      </mesh>
      {isHovered && (
        <Html
          position={[outerPos.x * 1.15, outerPos.y * 1.15, outerPos.z * 1.15]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div
            className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg border"
            style={{
              background: "rgba(10, 22, 40, 0.92)",
              color: "#80deea",
              borderColor: "rgba(79, 195, 247, 0.3)",
              backdropFilter: "blur(8px)",
            }}
          >
            {city.name}
            <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: 6 }}>
              {city.clients} {city.clients === 1 ? "client" : "clients"}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

function PulseRing({ city }: { city: typeof customerCities[0] }) {
  const ref = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => latLngToVector3(city.lat, city.lng, GLOBE_RADIUS + 0.005), [city.lat, city.lng]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = (state.clock.elapsedTime * 0.8 + city.lat * 0.1) % 2;
    const scale = 0.02 + t * 0.04;
    ref.current.scale.set(scale, scale, scale);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, 0.4 * (1 - t / 2));
  });

  return (
    <mesh ref={ref} position={pos}>
      <ringGeometry args={[0.8, 1, 32]} />
      <meshBasicMaterial color="#4fc3f7" transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

function RotatingGlobe() {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const handleHover = useCallback((name: string) => setHoveredCity(name), []);
  const handleUnhover = useCallback(() => setHoveredCity(null), []);

  useFrame((_, delta) => {
    if (groupRef.current && !hoveredCity) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <GlobeSphere />
      <GlobeWireframe />
      <GlobeGrid />
      {customerCities.map((city) => (
        <GlowPin
          key={city.name}
          city={city}
          onHover={() => handleHover(city.name)}
          onUnhover={handleUnhover}
          isHovered={hoveredCity === city.name}
        />
      ))}
      {customerCities.map((city) => (
        <PulseRing key={`pulse-${city.name}`} city={city} />
      ))}
    </group>
  );
}

export function ServiceAreaGlobe() {
  const maineLat = 43.7;
  const maineLng = -70.4;
  const phi = (90 - maineLat) * (Math.PI / 180);
  const theta = (maineLng + 180) * (Math.PI / 180);
  const camDist = 5.5;
  const cx = -(camDist * Math.sin(phi) * Math.cos(theta));
  const cz = camDist * Math.sin(phi) * Math.sin(theta);
  const cy = camDist * Math.cos(phi);

  return (
    <div className="w-full h-[400px] sm:h-[500px] md:h-[550px] relative" data-testid="globe-container">
      <Canvas
        camera={{ position: [cx, cy, cz], fov: 35, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <pointLight position={[-5, -3, -5]} intensity={0.2} color="#4fc3f7" />
        <RotatingGlobe />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.5}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.85}
        />
      </Canvas>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-muted-foreground/60">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#80deea]" />
          Service location
        </span>
        <span className="hidden sm:inline">Drag to rotate</span>
      </div>
    </div>
  );
}
