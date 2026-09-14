"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import "./LightRays.css";

/* ───────────────────────────────────────────────────────────────────────────
   LIGHT RAYS (ogl) — the reference's volumetric shafts, re-lit for a light
   ground.

   The reference multiplied a dark colour into a premultiplied canvas, which
   reads as a grey smear on white. Here the shader writes the ray colour
   straight, with the ray density as its alpha: dense light is the saturated
   brand colour, the fringe fades through the glow colour to nothing, and the
   page ground shows through untouched between the shafts.

   One WebGL context for the component's life. It renders at ≤30 fps, only
   while on screen and the tab is visible; colours update in place (a region
   switch never rebuilds the context). If WebGL is unavailable it renders
   nothing — the caller's static veil stays.
   ─────────────────────────────────────────────────────────────────────────── */

export type RaysOrigin =
  | "top-center"
  | "top-left"
  | "top-right"
  | "left"
  | "right"
  | "bottom-center"
  | "bottom-left"
  | "bottom-right";

export interface LightRaysProps {
  /** Hex colour of the dense light, e.g. useBrandPalette().brand. */
  color: string;
  /** Hex colour of the faint fringe. Defaults to `color`. */
  glow?: string;
  origin?: RaysOrigin;
  speed?: number;
  spread?: number;
  length?: number;
  fadeDistance?: number;
  /** Multiplies the ray density (and so the alpha). */
  intensity?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noise?: number;
  distortion?: number;
  className?: string;
}

/** Anchor in 0–1 of the canvas (y down; outside the box is allowed) + direction. */
const ORIGINS: Record<RaysOrigin, { anchor: [number, number]; dir: [number, number] }> = {
  "top-center": { anchor: [0.5, -0.2], dir: [0, 1] },
  "top-left": { anchor: [0, -0.2], dir: [0, 1] },
  "top-right": { anchor: [1, -0.2], dir: [0, 1] },
  left: { anchor: [-0.2, 0.5], dir: [1, 0] },
  right: { anchor: [1.2, 0.5], dir: [-1, 0] },
  "bottom-center": { anchor: [0.5, 1.2], dir: [0, -1] },
  "bottom-left": { anchor: [0, 1.2], dir: [0, -1] },
  "bottom-right": { anchor: [1, 1.2], dir: [0, -1] },
};

const FRAME_MS = 1000 / 30;

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const m = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(h);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
}

const vertex = /* glsl */ `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragment = /* glsl */ `
precision highp float;

uniform float iTime;
uniform vec2  iResolution;
uniform vec2  anchor;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform vec3  glowColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float fadeDistance;
uniform float intensity;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

float noise(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

float rayStrength(vec2 src, vec2 refDir, vec2 coord, float seedA, float seedB, float speed) {
  vec2 d = coord - src;
  float cosAngle = dot(normalize(d), refDir);
  float ang = cosAngle + distortion * sin(iTime * 2.0 + length(d) * 0.01) * 0.2;
  float spreadFactor = pow(max(ang, 0.0), 1.0 / max(lightSpread, 0.001));
  float dist = length(d);
  float maxDist = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDist - dist) / maxDist, 0.0, 1.0);
  float fadeFalloff = clamp((iResolution.x * fadeDistance - dist) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float base = clamp(
    (0.45 + 0.15 * sin(ang * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-ang * seedB + iTime * speed)),
    0.0, 1.0
  );
  return base * lengthFalloff * fadeFalloff * spreadFactor;
}

void main() {
  vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
  vec2 src = anchor * iResolution;

  vec2 dir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 m = mousePos * iResolution;
    dir = normalize(mix(rayDir, normalize(m - src), mouseInfluence));
  }

  float r = rayStrength(src, dir, coord, 36.2214, 21.11349, 1.5 * raysSpeed) * 0.5
          + rayStrength(src, dir, coord, 22.3991, 18.0234, 1.1 * raysSpeed) * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    r *= 1.0 - noiseAmount + noiseAmount * n;
  }

  // Strongest at the source, thinning towards the far edge.
  float falloff = 1.0 - coord.y / iResolution.y;
  r *= 0.2 + 0.8 * falloff;

  float a = clamp(r * intensity, 0.0, 1.0);
  vec3 col = mix(glowColor, raysColor, smoothstep(0.08, 0.6, a));
  gl_FragColor = vec4(col, a);
}`;

interface Uniforms {
  iTime: { value: number };
  iResolution: { value: [number, number] };
  anchor: { value: [number, number] };
  rayDir: { value: [number, number] };
  raysColor: { value: [number, number, number] };
  glowColor: { value: [number, number, number] };
  raysSpeed: { value: number };
  lightSpread: { value: number };
  rayLength: { value: number };
  fadeDistance: { value: number };
  intensity: { value: number };
  mousePos: { value: [number, number] };
  mouseInfluence: { value: number };
  noiseAmount: { value: number };
  distortion: { value: number };
}

export default function LightRays({
  color,
  glow,
  origin = "top-center",
  speed = 1,
  spread = 1,
  length = 2,
  fadeDistance = 1,
  intensity = 1,
  followMouse = true,
  mouseInfluence = 0.1,
  noise = 0,
  distortion = 0,
  className = "",
}: LightRaysProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniformsRef = useRef<Uniforms | null>(null);

  // Build the context once. Props are applied by the effect below, which runs
  // right after this one on mount and again whenever they change.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio, 1.5),
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
      });
    } catch {
      return;
    }
    const gl = renderer.gl;
    if (!gl) return;

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.display = "block";
    canvas.style.opacity = "0";
    canvas.style.transition = "opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1)";
    container.appendChild(canvas);
    gl.clearColor(0, 0, 0, 0);

    const uniforms: Uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },
      anchor: { value: [0.5, -0.2] },
      rayDir: { value: [0, 1] },
      raysColor: { value: [1, 1, 1] },
      glowColor: { value: [1, 1, 1] },
      raysSpeed: { value: 1 },
      lightSpread: { value: 1 },
      rayLength: { value: 2 },
      fadeDistance: { value: 1 },
      intensity: { value: 1 },
      mousePos: { value: [0.5, 0.5] },
      mouseInfluence: { value: 0 },
      noiseAmount: { value: 0 },
      distortion: { value: 0 },
    };
    uniformsRef.current = uniforms;

    let mesh: Mesh;
    try {
      const program = new Program(gl, { vertex, fragment, uniforms });
      mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    } catch {
      canvas.remove();
      uniformsRef.current = null;
      return;
    }

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.dpr = Math.min(window.devicePixelRatio, 1.5);
      renderer.setSize(w, h);
      uniforms.iResolution.value = [w * renderer.dpr, h * renderer.dpr];
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const mouse = { x: 0.5, y: 0.5 };
    const smooth = { x: 0.5, y: 0.5 };
    const onPointer = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / (r.width || 1);
      mouse.y = (e.clientY - r.top) / (r.height || 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let raf = 0;
    let last = 0;
    let shown = false;
    let visible = false;

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < FRAME_MS) return;
      last = t;
      uniforms.iTime.value = t * 0.001;
      smooth.x += (mouse.x - smooth.x) * 0.08;
      smooth.y += (mouse.y - smooth.y) * 0.08;
      uniforms.mousePos.value = [smooth.x, smooth.y];
      renderer.render({ scene: mesh });
      if (!shown) {
        shown = true;
        canvas.style.opacity = "1";
      }
    };

    const sync = () => {
      const run = visible && !document.hidden;
      if (run && !raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      sync();
    });
    io.observe(container);
    document.addEventListener("visibilitychange", sync);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", sync);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
      uniformsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const u = uniformsRef.current;
    if (!u) return;
    const o = ORIGINS[origin];
    u.anchor.value = o.anchor;
    u.rayDir.value = o.dir;
    u.raysColor.value = hexToRgb(color);
    u.glowColor.value = hexToRgb(glow ?? color);
    u.raysSpeed.value = speed;
    u.lightSpread.value = spread;
    u.rayLength.value = length;
    u.fadeDistance.value = fadeDistance;
    u.intensity.value = intensity;
    u.mouseInfluence.value = followMouse ? mouseInfluence : 0;
    u.noiseAmount.value = noise;
    u.distortion.value = distortion;
  }, [color, glow, origin, speed, spread, length, fadeDistance, intensity, followMouse, mouseInfluence, noise, distortion]);

  return <div ref={containerRef} aria-hidden="true" className={`light-rays-container ${className}`.trim()} />;
}
