/* ═══════════════════════════════════════════════════════════════════════════
   THE WEAVE — the geometry of the signature object

   Three strands, one per discipline the company sells — Development, Digital
   Marketing, Designing — in two states:

     loose   Each strand is its own loop, drifting in its own plane. Three
             separate things: the three agencies a client would otherwise hire.
     woven   The three strands ply around a single trefoil, like rope. One
             continuous form in which you can still tell the three apart: one
             team doing all of it.

   It is the site's own promise made physical — "everything it takes to design,
   build, secure and grow a digital product, without handing you off between
   three agencies" — and a knot is the one shape that literally means separate
   things, bound.

   `weavePoint` blends the two states. The strands arrive one at a time rather
   than together, and each swings towards the camera on the way in, so the
   join reads as three things being pulled into one another rather than as a
   cross-fade.

   Pure maths with no three.js import, so the WebGL scene and any 2D rendering
   of the object sample the same functions and it is the same object wherever
   it appears. Allocation-free: every function writes into a caller-owned
   tuple, because these run tens of thousands of times per frame while the
   weave is moving.
   ═══════════════════════════════════════════════════════════════════════════ */

export type Vec3 = [number, number, number];

/** Development, Digital Marketing, Designing — in that order. */
export const STRAND_COUNT = 3;

const TAU = Math.PI * 2;

/* ── Woven ─────────────────────────────────────────────────────────────── */

/** The trefoil's raw form spans roughly ±3 units; this brings it to ±1.3. */
const KNOT_SCALE = 0.42;
/** How far each strand sits from the trefoil's centreline. */
const PLY_RADIUS = 0.13;
/**
 * Full turns the three strands make around one another over one circuit of
 * the knot. Must be a whole number, or the rope would not close on itself.
 */
const PLY_TWISTS = 5;

const centre: Vec3 = [0, 0, 0];
const heading: Vec3 = [0, 0, 0];

function trefoil(s: number, out: Vec3): Vec3 {
  const t = s * TAU;
  out[0] = Math.sin(t) + 2 * Math.sin(2 * t);
  out[1] = Math.cos(t) - 2 * Math.cos(2 * t);
  out[2] = -Math.sin(3 * t);
  return out;
}

function trefoilTangent(s: number, out: Vec3): Vec3 {
  const t = s * TAU;
  out[0] = Math.cos(t) + 4 * Math.cos(2 * t);
  out[1] = -Math.sin(t) + 4 * Math.sin(2 * t);
  out[2] = -3 * Math.cos(3 * t);
  return out;
}

/**
 * Strand `k` of the woven rope, at `s` along it.
 *
 * The ply frame (N, B) takes N perpendicular to both the tangent and the Z
 * axis. That is only defined if the tangent never points straight along Z —
 * true of this trefoil, whose tangent's XY part vanishes nowhere — and in
 * exchange the frame is closed and continuous by construction, with none of
 * the seam a transported frame has to correct for on a closed curve.
 */
export function wovenPoint(k: number, s: number, out: Vec3, plyRadius: number = PLY_RADIUS): Vec3 {
  trefoil(s, centre);
  trefoilTangent(s, heading);
  const len = Math.hypot(heading[0], heading[1], heading[2]);
  const tx = heading[0] / len;
  const ty = heading[1] / len;
  const tz = heading[2] / len;
  const nl = Math.hypot(tx, ty);
  const nx = ty / nl;
  const ny = -tx / nl;
  // B = T × N, with N.z = 0.
  const bx = -tz * ny;
  const by = tz * nx;
  const bz = tx * ny - ty * nx;
  const phi = (k / STRAND_COUNT) * TAU + PLY_TWISTS * s * TAU;
  const u = Math.cos(phi) * plyRadius;
  const v = Math.sin(phi) * plyRadius;
  out[0] = centre[0] * KNOT_SCALE + nx * u + bx * v;
  out[1] = centre[1] * KNOT_SCALE + ny * u + by * v;
  out[2] = centre[2] * KNOT_SCALE + bz * v;
  return out;
}

/* ── Loose ─────────────────────────────────────────────────────────────── */

/** Row-major 3×3 rotation, Rz · Ry · Rx. */
function rotation(ax: number, ay: number, az: number): number[] {
  const cx = Math.cos(ax), sx = Math.sin(ax);
  const cy = Math.cos(ay), sy = Math.sin(ay);
  const cz = Math.cos(az), sz = Math.sin(az);
  return [
    cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
    sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
    -sy, cy * sx, cy * cx,
  ];
}

/**
 * Three loops, set apart and each leaning its own way, so that before they
 * join they read as unrelated. Sized to stay inside the camera's frame even at
 * the widest point of their drift.
 */
const LOOPS = [
  { at: [-1.2, 0.38, -0.35], tilt: [0.55, 0.25, 0.2], radius: 0.68, phase: 0 },
  { at: [0.25, 1.0, 0.3], tilt: [-0.4, 0.62, -0.25], radius: 0.6, phase: 2.1 },
  { at: [1.15, -0.72, -0.12], tilt: [0.3, -0.5, 0.45], radius: 0.64, phase: 4.2 },
].map((loop) => ({ ...loop, m: rotation(loop.tilt[0], loop.tilt[1], loop.tilt[2]) }));

/** Strand `k` of the loose state. `time` keeps the loops gently alive. */
export function loosePoint(k: number, s: number, time: number, out: Vec3): Vec3 {
  const loop = LOOPS[k];
  const t = s * TAU;
  const r = loop.radius * (1 + 0.08 * Math.sin(3 * t + loop.phase + time * 0.6));
  const x = Math.cos(t) * r;
  const y = Math.sin(t) * r * 0.64;
  const z = 0.14 * Math.sin(2 * t + loop.phase + time * 0.45);
  const m = loop.m;
  const drift = 0.07;
  out[0] = loop.at[0] + m[0] * x + m[1] * y + m[2] * z + Math.sin(time * 0.32 + loop.phase) * drift;
  out[1] = loop.at[1] + m[3] * x + m[4] * y + m[5] * z + Math.cos(time * 0.27 + loop.phase) * drift;
  out[2] = loop.at[2] + m[6] * x + m[7] * y + m[8] * z;
  return out;
}

/* ── The blend ─────────────────────────────────────────────────────────── */

/** How much later each strand sets off than the one before it. */
const STAGGER = 0.14;

const smoothstep = (x: number) => x * x * (3 - 2 * x);

/** Strand `k`'s own progress, 0..1, given the weave's overall progress. */
export function strandProgress(k: number, progress: number): number {
  const span = 1 - STAGGER * (STRAND_COUNT - 1);
  const x = (progress - k * STAGGER) / span;
  return smoothstep(x < 0 ? 0 : x > 1 ? 1 : x);
}

const fromLoose: Vec3 = [0, 0, 0];
const toWoven: Vec3 = [0, 0, 0];

/**
 * Strand `k` at `s`, `progress` of the way from loose to woven.
 *
 * A straight blend slides each loop into place across the screen plane, which
 * reads as a cross-fade. The arc term pushes the strand towards the camera in
 * the middle of its journey — zero at both ends, strongest halfway — so it
 * swings in through depth instead.
 */
export function weavePoint(
  k: number,
  s: number,
  progress: number,
  time: number,
  out: Vec3,
): Vec3 {
  const e = strandProgress(k, progress);
  if (e >= 1) return wovenPoint(k, s, out);
  loosePoint(k, s, time, fromLoose);
  if (e <= 0) {
    out[0] = fromLoose[0];
    out[1] = fromLoose[1];
    out[2] = fromLoose[2];
    return out;
  }
  wovenPoint(k, s, toWoven);
  const arc = 4 * e * (1 - e) * 0.85;
  out[0] = fromLoose[0] + (toWoven[0] - fromLoose[0]) * e;
  out[1] = fromLoose[1] + (toWoven[1] - fromLoose[1]) * e;
  out[2] = fromLoose[2] + (toWoven[2] - fromLoose[2]) * e + arc;
  return out;
}
