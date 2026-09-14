/* The tilted grid's starfield: small brand-tinted points that twinkle, so
   the white ground has depth. Plain dots only. Positions come from a seeded
   hash, so server and client render the same field. */

function seeded(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const STARS = Array.from({ length: 34 }, (_, i) => {
  const r1 = seeded(i + 1);
  const r2 = seeded(i + 101);
  const r3 = seeded(i + 211);
  const r4 = seeded(i + 313);
  const r5 = seeded(i + 419);
  return {
    top: `${(r1 * 100).toFixed(2)}%`,
    left: `${(r2 * 100).toFixed(2)}%`,
    size: Number((2 + r3 * 2.2).toFixed(2)),
    delay: `${(r4 * 5).toFixed(2)}s`,
    duration: `${(2.4 + r3 * 3.6).toFixed(2)}s`,
    brand: r5 > 0.5,
  };
});

export function Starfield() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ contain: "layout style" }}>
      {STARS.map((s, i) => (
        <span
          key={i}
          className="zan-ind-star absolute rounded-full"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            background: s.brand
              ? "color-mix(in oklab, var(--color-brand) 55%, transparent)"
              : "color-mix(in oklab, var(--color-brand-ink) 35%, transparent)",
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}
