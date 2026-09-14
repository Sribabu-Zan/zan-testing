import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { STRAND_COUNT, wovenPoint, type Vec3 } from "./weaveCurves";
import "./weave.css";

/* ───────────────────────────────────────────────────────────────────────────
   The weave without WebGL: phones, reduced motion, no GPU, or before the 3D
   chunk arrives. The same knot, sampled from the same `wovenPoint` the WebGL
   scene uses and seen from the angle the scene settles on, drawn as three
   stroked strands.

   Flat, the rope needs more room than in 3D: without shading, strands that
   touch merge into one band. So the ply is opened up (0.18 against the
   scene's 0.13) and the strands drawn thinner; between crossings the three
   stay apart, and every crossing is a clean over/under.

   Over/under: the strands are cut into short pieces and painted far to near
   in depth bands. Each band first lays a ground-coloured halo, then its
   colour, so wherever a strand passes in front of another a thin gap opens
   around it. Bands keep the SVG small (about 70 paths) and, at this spacing,
   look the same as a full per-piece sort.

   Pure maths at module scope: the server and the client draw the same SVG.
   ─────────────────────────────────────────────────────────────────────────── */

const SEGMENTS = 96;
const BANDS = 26;
const PLY = 0.18;
const VIEW = 1.62;
/** The scene's resting pose: group rotation (XYZ), scale and camera distance. */
const ROT: Vec3 = [0.2, 0.7, -0.12];
const SCALE = 1.04;
const DIST = 6.7;

function project(p: Vec3): Vec3 {
  let [x, y, z] = p;
  // three.js Euler XYZ: v' = Rx · Ry · Rz · v
  const cz = Math.cos(ROT[2]);
  const sz = Math.sin(ROT[2]);
  [x, y] = [x * cz - y * sz, x * sz + y * cz];
  const cy = Math.cos(ROT[1]);
  const sy = Math.sin(ROT[1]);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  const cx = Math.cos(ROT[0]);
  const sx = Math.sin(ROT[0]);
  [y, z] = [y * cx - z * sx, y * sx + z * cx];
  x *= SCALE;
  y *= SCALE;
  z *= SCALE;
  const s = DIST / (DIST - z);
  return [x * s, -y * s, z];
}

const pt = (p: Vec3) => `${Math.round(p[0] * 1000) / 1000} ${Math.round(p[1] * 1000) / 1000}`;

const PATHS: readonly { strand: number; d: string }[] = (() => {
  const pieces: { strand: number; z: number; d: string }[] = [];
  const scratch: Vec3 = [0, 0, 0];
  for (let k = 0; k < STRAND_COUNT; k++) {
    const points = Array.from({ length: SEGMENTS }, (_, i) =>
      project(wovenPoint(k, i / SEGMENTS, scratch, PLY)),
    );
    for (let i = 0; i < SEGMENTS; i++) {
      const a = points[i];
      const b = points[(i + 1) % SEGMENTS];
      pieces.push({ strand: k, z: (a[2] + b[2]) / 2, d: `M${pt(a)}L${pt(b)}` });
    }
  }
  const zs = pieces.map((p) => p.z);
  const lo = Math.min(...zs);
  const span = Math.max(...zs) - lo || 1;
  const band = (z: number) => Math.min(BANDS - 1, Math.floor(((z - lo) / span) * BANDS));
  const out: { strand: number; d: string }[] = [];
  for (let b = 0; b < BANDS; b++) {
    for (let k = 0; k < STRAND_COUNT; k++) {
      const d = pieces
        .filter((p) => p.strand === k && band(p.z) === b)
        .map((p) => p.d)
        .join("");
      if (d) out.push({ strand: k, d });
    }
  }
  return out;
})();

export function WeaveFallback({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
      fill="none"
      strokeLinejoin="round"
      className={cn("overflow-visible", className)}
    >
      {PATHS.map((p, i) => (
        <Fragment key={i}>
          <path d={p.d} className="zan-weave-halo" suppressHydrationWarning />
          <path d={p.d} className={`zan-weave-strand zan-weave-${p.strand}`} suppressHydrationWarning />
        </Fragment>
      ))}
    </svg>
  );
}
