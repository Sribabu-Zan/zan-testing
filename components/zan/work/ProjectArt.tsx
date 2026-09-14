import type { CSSProperties, ReactElement } from "react";
import type { Project } from "@/constants/zan";
import { cn } from "@/lib/utils";
import "./work.css";

/* ───────────────────────────────────────────────────────────────────────────
   Generated artwork for a project with no image (the fitness app), drawn from
   its `hue` and `pattern`. Abstract on purpose — it never pretends to be a
   capture of the product. Deterministic: seeded from indices, no randomness.
   Colours come from the region's brand rotated by the project's hue offset
   (see .zan-art in work.css).
   ─────────────────────────────────────────────────────────────────────────── */

/** India's brand violet, as an HSL hue — the zero point for `hue` offsets. */
const BRAND_HUE = 262;

const W = 400;
const H = 300;

const stroke = (alpha: number, width = 1.25): CSSProperties => ({
  stroke: "var(--art-a)",
  strokeOpacity: alpha,
  strokeWidth: width,
  fill: "none",
});

function Arc() {
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={70} cy={H + 10} r={60 + i * 38} style={stroke(0.42 - i * 0.038)} />
      ))}
      <circle cx={292} cy={118} r={64} style={{ ...stroke(1, 14), stroke: "var(--art-soft)", strokeOpacity: 1 }} />
      <circle
        cx={292}
        cy={118}
        r={64}
        pathLength={100}
        strokeDasharray="72 100"
        strokeLinecap="round"
        transform="rotate(-90 292 118)"
        style={{ ...stroke(1, 14) }}
      />
      <circle cx={292} cy={118} r={40} style={{ ...stroke(0.55, 8), stroke: "var(--art-b)" }} />
      <circle cx={292} cy={118} r={12} style={{ fill: "var(--art-a)" }} />
    </>
  );
}

function Grid() {
  const cells: ReactElement[] = [];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 12; y++) {
      if ((x * 7 + y * 3) % 11 === 0 && x > 5) {
        cells.push(
          <rect
            key={`${x}-${y}`}
            x={x * 25 + 3}
            y={y * 25 + 3}
            width={19}
            height={19}
            rx={4}
            style={{ fill: "var(--art-a)", fillOpacity: 0.18 + ((x + y) % 4) * 0.16 }}
          />,
        );
      }
    }
  }
  return (
    <>
      {Array.from({ length: 17 }, (_, i) => (
        <line key={`v${i}`} x1={i * 25} y1={0} x2={i * 25} y2={H} style={stroke(0.16)} />
      ))}
      {Array.from({ length: 13 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 25} x2={W} y2={i * 25} style={stroke(0.16)} />
      ))}
      {cells}
    </>
  );
}

function Mesh() {
  const cols = 9;
  const rows = 7;
  const pt = (c: number, r: number) => [
    (c / (cols - 1)) * W + Math.sin(c * 1.7 + r * 0.9) * 14,
    (r / (rows - 1)) * H + Math.cos(c * 0.8 + r * 1.3) * 12,
  ];
  const lines: ReactElement[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const [x, y] = pt(c, r);
      if (c < cols - 1) {
        const [x2, y2] = pt(c + 1, r);
        lines.push(<line key={`a${c}-${r}`} x1={x} y1={y} x2={x2} y2={y2} style={stroke(0.3)} />);
      }
      if (r < rows - 1) {
        const [x2, y2] = pt(c, r + 1);
        lines.push(<line key={`b${c}-${r}`} x1={x} y1={y} x2={x2} y2={y2} style={stroke(0.3)} />);
      }
      if (c < cols - 1 && r < rows - 1 && (c + r) % 2 === 0) {
        const [x2, y2] = pt(c + 1, r + 1);
        lines.push(<line key={`d${c}-${r}`} x1={x} y1={y} x2={x2} y2={y2} style={stroke(0.18)} />);
      }
      if ((c * 3 + r) % 5 === 0) {
        lines.push(<circle key={`p${c}-${r}`} cx={x} cy={y} r={3.5} style={{ fill: "var(--art-a)" }} />);
      }
    }
  }
  return <>{lines}</>;
}

function Orbit() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <ellipse
          key={i}
          cx={W / 2}
          cy={H / 2}
          rx={70 + i * 46}
          ry={26 + i * 17}
          transform={`rotate(${-18 + i * 4} ${W / 2} ${H / 2})`}
          style={stroke(0.5 - i * 0.09)}
        />
      ))}
      <circle cx={W / 2} cy={H / 2} r={22} style={{ fill: "var(--art-a)" }} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i * 97 + 30) * (Math.PI / 180);
        const rx = 70 + i * 46;
        const ry = 26 + i * 17;
        const rot = (-18 + i * 4) * (Math.PI / 180);
        const x0 = Math.cos(a) * rx;
        const y0 = Math.sin(a) * ry;
        return (
          <circle
            key={`m${i}`}
            cx={W / 2 + x0 * Math.cos(rot) - y0 * Math.sin(rot)}
            cy={H / 2 + x0 * Math.sin(rot) + y0 * Math.cos(rot)}
            r={6 - i}
            style={{ fill: i % 2 ? "var(--art-b)" : "var(--art-a)" }}
          />
        );
      })}
    </>
  );
}

const PATTERNS: Record<Project["pattern"], () => ReactElement> = { arc: Arc, grid: Grid, mesh: Mesh, orbit: Orbit };

export function ProjectArt({
  project,
  className,
}: {
  project: Pick<Project, "hue" | "pattern">;
  className?: string;
}) {
  const Pattern = PATTERNS[project.pattern];
  return (
    <div
      aria-hidden="true"
      className={cn("zan-art relative overflow-hidden", className)}
      style={{ "--art-shift": project.hue - BRAND_HUE } as CSSProperties}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, var(--art-soft) 0%, var(--color-bg) 100%)",
        }}
      />
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <Pattern />
      </svg>
    </div>
  );
}
