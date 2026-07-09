/**
 * Ambient sparkles floating over the hero — like clean-surface highlights.
 * Positions are deterministic (no Math.random) so hydration is stable and
 * the pattern doesn't shuffle between renders. Purely decorative — pointer
 * events off, respects prefers-reduced-motion via CSS.
 */
const SPARKLES = Array.from({ length: 18 }).map((_, i) => ({
  top: (i * 41 + 11) % 88,
  left: (i * 73 + 5) % 96,
  size: 2.5 + ((i * 13) % 6),
  delay: (i * 0.83) % 6,
  duration: 3.4 + ((i * 0.53) % 3.2),
}));

export function SparkleField() {
  return (
    <div
      className="sparkle-field pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="sparkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
