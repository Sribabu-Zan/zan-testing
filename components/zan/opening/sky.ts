/* ───────────────────────────────────────────────────────────────────────────
   The hero sky: seeded randomness and the three star tiles.

   Everything here is computed once, at module load, from fixed seeds — the
   server and every browser produce the same dots, so the sky is part of the
   server HTML and never causes a hydration mismatch.
   ─────────────────────────────────────────────────────────────────────────── */

/** mulberry32 — a small seeded PRNG. The same seed gives the same sequence everywhere. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface StarLayer {
  depth: "far" | "mid" | "near";
  /** Tile edge, CSS px. Three unrelated sizes, so the repeats never line up. */
  size: number;
  /** An alpha mask of dots; the layer's colour shows through it. */
  mask: string;
  /** A token mix, so the dots follow the region. */
  color: string;
  /** Pointer drift in px across the whole screen; negative moves away from it. */
  drift: number;
}

/** One tile of dots as an SVG data URI, used as a repeating mask. */
function tile(seed: number, size: number, count: number, rMin: number, rMax: number): string {
  const rnd = seeded(seed);
  let dots = "";
  for (let i = 0; i < count; i++) {
    const x = (rnd() * size).toFixed(1);
    const y = (rnd() * size).toFixed(1);
    const r = lerp(rMin, rMax, rnd()).toFixed(2);
    const a = lerp(0.35, 1, rnd()).toFixed(2);
    dots += `<circle cx='${x}' cy='${y}' r='${r}' fill-opacity='${a}'/>`;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>${dots}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Far: fine ink dust. Mid: brand-tinted points. Near: a few larger ones in
 * the brand's text shade. All at low alpha — a calm sky, not a nebula.
 */
export const STAR_LAYERS: readonly StarLayer[] = [
  {
    depth: "far",
    size: 433,
    mask: tile(11, 433, 34, 0.55, 0.95),
    color: "color-mix(in oklab, var(--color-ink) 30%, transparent)",
    drift: -6,
  },
  {
    depth: "mid",
    size: 587,
    mask: tile(29, 587, 20, 0.8, 1.25),
    color: "color-mix(in oklab, var(--color-brand) 55%, transparent)",
    drift: -12,
  },
  {
    depth: "near",
    size: 761,
    mask: tile(47, 761, 9, 1.1, 1.65),
    color: "color-mix(in oklab, var(--color-brand-ink) 40%, transparent)",
    drift: -20,
  },
];
