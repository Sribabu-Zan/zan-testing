import type { ReactNode } from "react";

/* A cheap SVG per stage for the timeline layout (phones, reduced motion, no
   WebGL): the same four ideas the laptop's screen draws — a roadmap, a
   wireframe, code with passing checks, a live graph. Token classes only. */

function Check({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="7" className="fill-brand" />
      <path
        d={`M${x - 3} ${y} l2.2 2.4 l4-4.6`}
        className="stroke-on-brand"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

const ILLOS: Record<string, ReactNode> = {
  discovery: (
    <>
      <line x1="24" y1="28" x2="216" y2="28" className="stroke-line-strong" strokeWidth="2" />
      <line x1="24" y1="28" x2="88" y2="28" className="stroke-brand" strokeWidth="2" />
      {[24, 88, 152, 216].map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy="28"
          r="7"
          className={i === 0 ? "fill-brand" : i === 1 ? "fill-bg stroke-brand" : "fill-bg stroke-line-strong"}
          strokeWidth="2"
        />
      ))}
      {[62, 84, 106].map((y, i) => (
        <g key={y}>
          {i < 2 ? (
            <Check x={31} y={y} />
          ) : (
            <rect x="24" y={y - 7} width="14" height="14" rx="4" className="fill-bg stroke-line-strong" strokeWidth="1.5" />
          )}
          <rect x="48" y={y - 3} width={[128, 100, 116][i]} height="6" rx="3" className="fill-line-strong" />
        </g>
      ))}
    </>
  ),
  design: (
    <>
      <rect x="20" y="8" width="200" height="104" rx="10" className="fill-bg stroke-line-strong" strokeWidth="1.5" />
      <rect x="30" y="18" width="180" height="10" rx="5" className="fill-line" />
      <rect x="30" y="36" width="112" height="34" rx="6" className="fill-brand-soft" />
      <rect x="38" y="45" width="64" height="6" rx="3" className="fill-brand" />
      <rect x="38" y="56" width="44" height="5" rx="2.5" className="fill-line-strong" />
      <rect x="150" y="36" width="60" height="34" rx="6" className="fill-none stroke-brand-ink" strokeWidth="1.2" strokeDasharray="4 3" />
      {[30, 92, 154].map((x, i) => (
        <rect
          key={x}
          x={x}
          y="78"
          width="56"
          height="26"
          rx="5"
          className={i === 1 ? "fill-bg stroke-brand" : "fill-bg stroke-line-strong"}
          strokeWidth={i === 1 ? 2 : 1.2}
        />
      ))}
    </>
  ),
  build: (
    <>
      <rect x="20" y="8" width="130" height="104" rx="10" className="fill-ink" />
      {[
        [34, 40],
        [44, 62],
        [44, 48],
        [54, 70],
        [44, 36],
        [34, 26],
      ].map(([x, w], i) => (
        <rect key={i} x={x} y={22 + i * 14} width={w} height="5" rx="2.5" className={i % 3 === 1 ? "fill-brand-glow" : "fill-line-strong"} opacity={i % 3 === 1 ? 1 : 0.55} />
      ))}
      <rect x="160" y="8" width="60" height="104" rx="10" className="fill-bg stroke-line-strong" strokeWidth="1.5" />
      {[30, 56, 82].map((y) => (
        <g key={y}>
          <Check x={176} y={y} />
          <rect x="188" y={y - 2.5} width="22" height="5" rx="2.5" className="fill-line-strong" />
        </g>
      ))}
    </>
  ),
  launch: (
    <>
      <rect x="20" y="8" width="200" height="104" rx="10" className="fill-bg stroke-line-strong" strokeWidth="1.5" />
      {[40, 64, 88].map((y) => (
        <line key={y} x1="32" y1={y} x2="208" y2={y} className="stroke-line" strokeWidth="1" />
      ))}
      <path d="M32 94 L60 86 L88 88 L116 70 L144 66 L172 48 L208 36 L208 100 L32 100 Z" className="fill-brand-soft" />
      <path
        d="M32 94 L60 86 L88 88 L116 70 L144 66 L172 48 L208 36"
        className="stroke-brand"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="208" cy="36" r="4.5" className="fill-brand" />
      <rect x="164" y="15" width="44" height="14" rx="7" className="fill-brand-soft" />
      <circle cx="173" cy="22" r="3" className="fill-brand" />
      <rect x="180" y="19.5" width="20" height="5" rx="2.5" className="fill-brand-ink" />
    </>
  ),
};

export function StepIllustration({ id }: { id: string }) {
  const art = ILLOS[id];
  if (!art) return null;
  return (
    <svg viewBox="0 0 240 120" aria-hidden="true" className="h-auto w-full" fill="none">
      {art}
    </svg>
  );
}
