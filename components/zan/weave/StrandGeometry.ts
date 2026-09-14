import { BufferAttribute, BufferGeometry, Sphere, Vector3 } from "three";
import type { Vec3 } from "./weaveCurves";

/** A point on the tube's centreline at parameter s in [0, 1), written into `out`. */
export type Sampler = (s: number, out: Vec3) => Vec3;

const TAU = Math.PI * 2;

/**
 * A closed tube whose centreline can be re-sampled in place.
 *
 * three's TubeGeometry does the same maths but builds a new geometry for every
 * change of curve. While the weave is moving that is a fresh ~5k-vertex mesh
 * per strand per frame, and the garbage-collector pauses that follow are
 * exactly the stutter a scroll-driven scene cannot have. This keeps one set of
 * buffers for the life of the mesh and rewrites them.
 *
 * Frames are parallel-transported rather than Frenet, so the tube does not
 * flip where the curve's curvature changes sign. A closed curve accumulates a
 * residual twist over one circuit; that is spread evenly along the length
 * instead of showing up as a seam where the ends meet.
 */
export class StrandGeometry extends BufferGeometry {
  private readonly segments: number;
  private readonly radial: number;
  private readonly radius: number;
  private readonly centre: Float32Array;
  private readonly tangent: Float32Array;
  private readonly normal: Float32Array;
  private readonly binormal: Float32Array;
  private readonly ringCos: Float32Array;
  private readonly ringSin: Float32Array;
  private readonly point: Vec3 = [0, 0, 0];

  constructor(segments: number, radial: number, radius: number) {
    super();
    this.segments = segments;
    this.radial = radial;
    this.radius = radius;

    const ring = radial + 1;
    const count = (segments + 1) * ring;
    this.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
    this.setAttribute("normal", new BufferAttribute(new Float32Array(count * 3), 3));

    // Wound so the outside of the tube faces out: along the ring first, then
    // along the curve, which with B = T × N gives an outward-pointing normal.
    const quads = segments * radial;
    const index = count > 65535 ? new Uint32Array(quads * 6) : new Uint16Array(quads * 6);
    let n = 0;
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < radial; j++) {
        const a = i * ring + j;
        const b = (i + 1) * ring + j;
        index[n++] = a;
        index[n++] = a + 1;
        index[n++] = b;
        index[n++] = b;
        index[n++] = a + 1;
        index[n++] = b + 1;
      }
    }
    this.setIndex(new BufferAttribute(index, 1));

    this.centre = new Float32Array(segments * 3);
    this.tangent = new Float32Array(segments * 3);
    this.normal = new Float32Array(segments * 3);
    this.binormal = new Float32Array(segments * 3);

    this.ringCos = new Float32Array(ring);
    this.ringSin = new Float32Array(ring);
    for (let j = 0; j < ring; j++) {
      const a = (j / radial) * TAU;
      this.ringCos[j] = Math.cos(a);
      this.ringSin[j] = Math.sin(a);
    }

    // The object never leaves a sphere this size, so frustum culling needs no
    // per-update recomputation.
    this.boundingSphere = new Sphere(new Vector3(), 3.2);
  }

  update(sample: Sampler): void {
    const S = this.segments;
    const R = this.radial;
    const C = this.centre;
    const T = this.tangent;
    const N = this.normal;
    const B = this.binormal;
    const p = this.point;

    for (let i = 0; i < S; i++) {
      sample(i / S, p);
      C[i * 3] = p[0];
      C[i * 3 + 1] = p[1];
      C[i * 3 + 2] = p[2];
    }

    // Tangents by central difference, wrapping at the ends.
    for (let i = 0; i < S; i++) {
      const a = ((i - 1 + S) % S) * 3;
      const b = ((i + 1) % S) * 3;
      const x = C[b] - C[a];
      const y = C[b + 1] - C[a + 1];
      const z = C[b + 2] - C[a + 2];
      const l = Math.hypot(x, y, z) || 1;
      T[i * 3] = x / l;
      T[i * 3 + 1] = y / l;
      T[i * 3 + 2] = z / l;
    }

    // First normal: perpendicular to T0, from whichever axis T0 is least along.
    const t0x = T[0], t0y = T[1], t0z = T[2];
    const useX = Math.abs(t0z) > 0.9;
    const rx = useX ? 1 : 0;
    const rz = useX ? 0 : 1;
    let dot = rx * t0x + rz * t0z;
    let nx = rx - dot * t0x;
    let ny = -dot * t0y;
    let nz = rz - dot * t0z;
    let nl = Math.hypot(nx, ny, nz) || 1;
    N[0] = nx / nl;
    N[1] = ny / nl;
    N[2] = nz / nl;

    // Transport: carry each normal onto the next tangent's plane.
    for (let i = 1; i < S; i++) {
      const tx = T[i * 3], ty = T[i * 3 + 1], tz = T[i * 3 + 2];
      const px = N[(i - 1) * 3], py = N[(i - 1) * 3 + 1], pz = N[(i - 1) * 3 + 2];
      dot = px * tx + py * ty + pz * tz;
      nx = px - dot * tx;
      ny = py - dot * ty;
      nz = pz - dot * tz;
      nl = Math.hypot(nx, ny, nz) || 1;
      N[i * 3] = nx / nl;
      N[i * 3 + 1] = ny / nl;
      N[i * 3 + 2] = nz / nl;
    }

    // Closure: transport the last normal once more onto T0, measure how far
    // it has turned from N0, and spread that correction along the curve.
    {
      const px = N[(S - 1) * 3], py = N[(S - 1) * 3 + 1], pz = N[(S - 1) * 3 + 2];
      dot = px * t0x + py * t0y + pz * t0z;
      let wx = px - dot * t0x, wy = py - dot * t0y, wz = pz - dot * t0z;
      const wl = Math.hypot(wx, wy, wz) || 1;
      wx /= wl;
      wy /= wl;
      wz /= wl;
      const cx = wy * N[2] - wz * N[1];
      const cy = wz * N[0] - wx * N[2];
      const cz = wx * N[1] - wy * N[0];
      const angle = Math.atan2(cx * t0x + cy * t0y + cz * t0z, wx * N[0] + wy * N[1] + wz * N[2]);
      for (let i = 1; i < S; i++) {
        const a = (angle * i) / S;
        const ca = Math.cos(a), sa = Math.sin(a);
        const tx = T[i * 3], ty = T[i * 3 + 1], tz = T[i * 3 + 2];
        const vx = N[i * 3], vy = N[i * 3 + 1], vz = N[i * 3 + 2];
        // Rodrigues with v ⟂ t: v·cos(a) + (t × v)·sin(a)
        N[i * 3] = vx * ca + (ty * vz - tz * vy) * sa;
        N[i * 3 + 1] = vy * ca + (tz * vx - tx * vz) * sa;
        N[i * 3 + 2] = vz * ca + (tx * vy - ty * vx) * sa;
      }
    }

    for (let i = 0; i < S; i++) {
      const tx = T[i * 3], ty = T[i * 3 + 1], tz = T[i * 3 + 2];
      const vx = N[i * 3], vy = N[i * 3 + 1], vz = N[i * 3 + 2];
      B[i * 3] = ty * vz - tz * vy;
      B[i * 3 + 1] = tz * vx - tx * vz;
      B[i * 3 + 2] = tx * vy - ty * vx;
    }

    const position = this.attributes.position as BufferAttribute;
    const normal = this.attributes.normal as BufferAttribute;
    const pos = position.array as Float32Array;
    const nor = normal.array as Float32Array;
    const radius = this.radius;
    let v = 0;
    for (let i = 0; i <= S; i++) {
      const k = (i % S) * 3;
      const cx = C[k], cy = C[k + 1], cz = C[k + 2];
      const ax = N[k], ay = N[k + 1], az = N[k + 2];
      const bx = B[k], by = B[k + 1], bz = B[k + 2];
      for (let j = 0; j <= R; j++) {
        const c = this.ringCos[j], s = this.ringSin[j];
        const ox = ax * c + bx * s;
        const oy = ay * c + by * s;
        const oz = az * c + bz * s;
        nor[v] = ox;
        nor[v + 1] = oy;
        nor[v + 2] = oz;
        pos[v] = cx + ox * radius;
        pos[v + 1] = cy + oy * radius;
        pos[v + 2] = cz + oz * radius;
        v += 3;
      }
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
  }
}
