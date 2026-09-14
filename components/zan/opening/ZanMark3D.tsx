"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { SVGLoader, type SVGResult } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { gsap } from "@/lib/gsap";

/* ───────────────────────────────────────────────────────────────────────────
   The Zan mark in three.js: a TypeScript port of the old zanservices.com
   hero logo (vite-react-shift Logo3DHero), relit for a light page.

   The brand SVG's traced outlines are smoothed and extruded, then grouped
   into a few pieces ("shards"): four navy clusters and one red/orange piece.
   Every outline keeps its own flat colour (navy, red, orange, periwinkle) as
   a vertex colour, so merging pieces never loses a colour.

   Behaviour kept from the old site: cursor tilt and parallax, a magnetic
   pull, hover lift with the neighbours reacting, click to explode and
   reassemble, drag to turn, a slow turn as the hero scrolls away, idle float,
   and a fly-in assembly on mount. It renders only while on screen and while
   the tab is visible.

   Changed for this page:
     - lit for a white ground: neutral hemisphere, key and fill lights, a soft
       shadow, no blue rim light, no glow halo; Neutral tone mapping so the
       brand colours stay true;
     - pointer input on its own box, not the window, so it never steals
       clicks from the copy; the custom cursor's hover state via data-cursor;
     - cleanup kills only its own tweens (the old one killed every child of
       gsap.globalTimeline, which would take every other section down too);
     - no OrbitControls (it was disabled anyway), no deprecated Clock.
   ─────────────────────────────────────────────────────────────────────────── */

const SVG_URL = "/images/hero/zan-mark.svg";
const FOV = 40;
const MAX_TILT = THREE.MathUtils.degToRad(15);
/** World size of the mark's longest edge. */
const TARGET_SIZE = 2.95;
/** Extrude depth in SVG units (scaled with the geometry). */
const DEPTH_SVG = 90;
/** Navy breaks into this many contiguous pieces on explode. */
const NAVY_PARTS = 4;

// Outline smoothing: sampling density, point dedupe distance, Chaikin passes,
// dust and sliver thresholds (SVG units).
const SAMPLE_DIV = 16;
// Light smoothing only: two Chaikin passes with a 3-unit dedupe rounded the
// mark's hairline strokes away and widened its white counter-space, so the
// four navy plates read as separate tiles instead of one pinwheel.
const SMOOTH_MIN_DIST = 1.5;
const CHAIKIN_ITERS = 1;
const AREA_MIN = 22;
const SLIVER_FRACTION = 0.02;

/**
 * The logo's own flat colours. It is the logo, so these are not region
 * tokens. `match` is the traced fill each bucket collects, `color` what it is
 * drawn in, `glow` the hover emissive.
 */
const PALETTE = [
  { match: 0x284378, color: 0x21386b, glow: 0x2b5cff }, // navy
  { match: 0xcf3a44, color: 0xd23b34, glow: 0xff5a3c }, // red
  { match: 0xf6952f, color: 0xf2922e, glow: 0xffb14a }, // orange
  { match: 0x8ea2d6, color: 0x93a6da, glow: 0xa9bdff }, // periwinkle
] as const;
const NAVY = 0;
const RED = 1;
const ORANGE = 2;

const rgb = (hex: number) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255] as const;

/**
 * Which part of the mark a traced fill belongs to.
 *
 * The SVG is a trace: 1,948 paths and 1,086 distinct fills clustered around
 * the brand colours, so there is nothing to match exactly. Nearest-colour
 * matching failed a specific way — the mark's mid-blue diamonds trace at about
 * #566ca7, which is 77 units from navy and 91 from periwinkle, so they were
 * painted navy and disappeared.
 *
 * Family first, then lightness inside the family, so each part has its own
 * independent rule:
 *   blue                 the navy plates
 *   warm, g/r >= 0.5     the orange lens
 *   warm                 the red wedge
 *   neither (greys)      a seam or a trace artefact, dropped
 *
 * The mark's two mid-blue diamonds are NOT split out. The trace stores each
 * as an outline whose interior shards trace nearer the navy, so colouring the
 * outline alone drew hollow rings over the white channel — worse than the
 * diamonds simply carrying the plate's navy, which is what ships. The real
 * fix is a clean vector of the logo rather than this trace; see the README.
 */
function bucketFor(hex: number): number {
  const [r, g, b] = rgb(hex);
  if (b > r + 10) return NAVY;
  if (r > b + 20) return g / Math.max(1, r) >= 0.5 ? ORANGE : RED;
  return -1;
}

/** Dedupe a traced contour, then round its corners with Chaikin cuts. */
function smoothLoop(pts: THREE.Vector2[]): THREE.Vector2[] {
  const simp: THREE.Vector2[] = [];
  for (const p of pts) {
    if (!simp.length || simp[simp.length - 1].distanceTo(p) > SMOOTH_MIN_DIST) simp.push(p.clone());
  }
  if (simp.length > 3 && simp[0].distanceTo(simp[simp.length - 1]) < SMOOTH_MIN_DIST) simp.pop();
  if (simp.length < 4) return pts;

  let loop = simp;
  for (let it = 0; it < CHAIKIN_ITERS; it++) {
    const out: THREE.Vector2[] = [];
    const n = loop.length;
    for (let i = 0; i < n; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % n];
      out.push(new THREE.Vector2(0.75 * a.x + 0.25 * b.x, 0.75 * a.y + 0.25 * b.y));
      out.push(new THREE.Vector2(0.25 * a.x + 0.75 * b.x, 0.25 * a.y + 0.75 * b.y));
    }
    loop = out;
  }
  return loop;
}

/**
 * Lit-to-flat calibration. A lit surface always sits lighter than the flat
 * swatch: measured against the SVG in the same frame, the mark's navy came out
 * at rgb(60,77,126) where the flat reads rgb(30,57,106). Scaling the baked
 * colour closes that gap without dimming the whole scene, which would kill the
 * shading.
 */
const LIT_SCALE = 0.85;

/** Bakes one flat colour into a geometry as a vertex colour attribute. */
function paint(geo: THREE.BufferGeometry, color: THREE.Color, scale = LIT_SCALE) {
  const count = geo.getAttribute("position").count;
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    data[i * 3] = color.r * scale;
    data[i * 3 + 1] = color.g * scale;
    data[i * 3 + 2] = color.b * scale;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(data, 3));
}

/**
 * One piece of the mark: a merged, extruded geometry with independent
 * animation channels (hover lift, parallax, magnetic pull, explode offset),
 * composited each frame in update().
 */
class Shard {
  readonly material: THREE.MeshPhysicalMaterial;
  readonly mesh: THREE.Mesh;
  readonly home: THREE.Vector3;
  readonly outward: THREE.Vector3;
  readonly angle: number;
  neighbours: Shard[] = [];

  hoverLift = 0;
  glow = 0;
  readonly parallax = new THREE.Vector3();
  readonly magnetic = new THREE.Vector3();
  readonly offset = new THREE.Vector3();
  readonly offsetRot = new THREE.Vector3();

  constructor(
    geometry: THREE.BufferGeometry,
    glow: number,
    readonly index: number,
    readonly depthFactor: number,
  ) {
    // Pivot on its own centroid so explode spins look natural.
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox!;
    const cx = (bb.min.x + bb.max.x) / 2;
    const cy = (bb.min.y + bb.max.y) / 2;
    const cz = (bb.min.z + bb.max.z) / 2;
    geometry.translate(-cx, -cy, -cz);
    geometry.computeVertexNormals();

    // Satin toy plastic: a light clear coat and little reflection, so the
    // navy reads as the brand's navy on a white page instead of washing out
    // to pale blue wherever it catches the room's light panels.
    this.material = new THREE.MeshPhysicalMaterial({
      color: "white",
      vertexColors: true,
      metalness: 0,
      roughness: 0.62,
      // A thin clear coat: the full coat mirrors the bright room environment
      // across every face and bleaches the navy.
      clearcoat: 0.12,
      clearcoatRoughness: 0.5,
      envMapIntensity: 0.08,
      emissive: new THREE.Color(glow),
      emissiveIntensity: 0,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(cx, cy, cz);
    this.mesh.userData.shard = this;

    this.home = new THREE.Vector3(cx, cy, cz);
    const radial = new THREE.Vector2(cx, cy);
    if (radial.lengthSq() < 1e-4) {
      const a = index * 1.7;
      radial.set(Math.cos(a), Math.sin(a));
    }
    radial.normalize();
    this.outward = new THREE.Vector3(radial.x, radial.y, 0.6).normalize();
    this.angle = Math.atan2(this.outward.y, this.outward.x);
  }

  update() {
    const p = this.mesh.position;
    p.x = this.home.x + this.outward.x * this.hoverLift + this.parallax.x + this.magnetic.x + this.offset.x;
    p.y = this.home.y + this.outward.y * this.hoverLift + this.parallax.y + this.magnetic.y + this.offset.y;
    p.z = this.home.z + this.outward.z * this.hoverLift + this.parallax.z + this.magnetic.z + this.offset.z;
    this.mesh.rotation.set(this.offsetRot.x, this.offsetRot.y, this.offsetRot.z);
    this.material.emissiveIntensity = this.glow * 0.45;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

export interface ZanMark3DProps {
  /** Fraction of the canvas width the mark's longest edge should span. */
  span: number;
  className?: string;
  /** The mark is built and drawn: fade the flat fallback out. */
  onReady?: () => void;
  /** WebGL could not start or was lost: show the flat fallback again. */
  onFail?: () => void;
}

export default function ZanMark3D({ span, className, onReady, onFail }: ZanMark3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const announceReady = useEffectEvent(() => onReady?.());
  const announceFail = useEffectEvent(() => onFail?.());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;

    /* ── Renderer ─────────────────────────────────────────────────────── */
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => announceFail());
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // Neutral, under-exposed. Measured on the rendered mark: at exposure 1 the
    // brand navy (#21386b) averaged a periwinkle luminance of ~121; ACES is
    // worse here (three.js pre-scales it by 1/0.6). Less light, not a
    // different curve, is what keeps the navy navy on a white page.
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.58;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      display: "block",
      width: "100%",
      height: "100%",
      opacity: "0",
      transition: "opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)",
    });
    container.appendChild(canvas);

    /* ── Scene, camera, light ─────────────────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.set(0, 0, 6);
    const lookAt = new THREE.Vector3();

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envRT = pmrem.fromScene(room, 0.04);
    scene.environment = envRT.texture;

    // Daylight on a white page: a neutral sky/ground wash, a soft key from
    // upper right, a gentle fill from the left. No coloured rim.
    // Kept low: the page is already white, so a strong wash flattens the
    // navy into pale blue. The key light does the shaping.
    scene.add(new THREE.HemisphereLight("white", new THREE.Color().setRGB(0.86, 0.86, 0.88), 0.18));

    const key = new THREE.DirectionalLight("white", 1.5);
    key.position.set(0.9, 3.2, 8.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 10;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    const sc = key.shadow.camera;
    sc.near = 1;
    sc.far = 30;
    sc.left = sc.bottom = -4;
    sc.right = sc.top = 4;
    scene.add(key);

    const fill = new THREE.DirectionalLight("white", 0.35);
    fill.position.set(-5, 0.5, 4);
    scene.add(fill);

    // An invisible wall behind the mark that only catches its shadow.
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.ShadowMaterial({ opacity: 0.06 }));
    wall.position.z = -1.45;
    wall.receiveShadow = true;
    scene.add(wall);

    /* ── The mark ─────────────────────────────────────────────────────── */
    const group = new THREE.Group();
    scene.add(group);
    const shards: Shard[] = [];
    const meshes: THREE.Mesh[] = [];
    let formTl: gsap.core.Timeline | null = null;
    let explodeTl: gsap.core.Timeline | null = null;
    let hovered: Shard | null = null;

    const build = (data: SVGResult) => {
      if (disposed) return;
      const colors = PALETTE.map((p) => new THREE.Color(p.color));
      const extrude: THREE.ExtrudeGeometryOptions = {
        depth: DEPTH_SVG,
        bevelEnabled: true,
        bevelThickness: 4,
        bevelSize: 2,
        bevelOffset: 0,
        bevelSegments: 3,
        // The lens is a curve: at 1 segment its triangulation showed as hard
        // banding across the orange.
        curveSegments: 8,
        steps: 1,
      };

      type Entry = {
        geo: THREE.BufferGeometry;
        bucket: number;
        cx: number;
        cy: number;
        area: number;
        bb: THREE.Box3;
      };
      const entries: Entry[] = [];
      let warm = 0;

      // 1) Extrude every kept shape, painted in its bucket's colour.
      for (const path of data.paths) {
        const fillStr = (path.userData?.style?.fill as string | undefined) ?? "";
        if (!fillStr || fillStr === "none") continue;
        const bucket = bucketFor(new THREE.Color(fillStr).getHex());
        if (bucket < 0) continue;

        for (const shape of SVGLoader.createShapes(path)) {
          const outline = smoothLoop(shape.getPoints(SAMPLE_DIV));
          const area = Math.abs(THREE.ShapeUtils.area(outline));
          if (area < AREA_MIN) continue;
          const smoothed = new THREE.Shape(outline);
          for (const hole of shape.holes) {
            const hp = smoothLoop(hole.getPoints(SAMPLE_DIV));
            if (Math.abs(THREE.ShapeUtils.area(hp)) >= AREA_MIN) smoothed.holes.push(new THREE.Path(hp));
          }
          const geo = new THREE.ExtrudeGeometry(smoothed, extrude);
          // Lift the accent and periwinkle shapes clear of the navy faces they
          // sit on: identical depths z-fight and show as cross-hatch moiré.
          // Clear of the navy plates, and each warm shape on its own plane:
          // the lens is many traced shards, and extruding them coincident
          // stippled it with z-fighting.
          if (bucket === RED || bucket === ORANGE) geo.translate(0, 0, 7 + (warm++ % 32) * 0.07);
          paint(geo, colors[bucket]);
          geo.computeBoundingBox();
          const bb = geo.boundingBox!;
          entries.push({ geo, bucket, cx: (bb.min.x + bb.max.x) / 2, cy: (bb.min.y + bb.max.y) / 2, area, bb: bb.clone() });
        }
      }
      if (!entries.length) {
        announceFail();
        return;
      }


      // 1b) Drop slivers — navy only. The mark's small shapes (the two
      // periwinkle diamonds at its centre, the red and orange lens) are far
      // below 2% of the largest navy triangle, and culling them dropped parts
      // of the logo itself.
      const maxArea = entries.reduce((m, e) => Math.max(m, e.area), 0);
      const kept = entries.filter((e) => {
        if (e.bucket !== NAVY) return true;
        if (e.area >= maxArea * SLIVER_FRACTION) return true;
        e.geo.dispose();
        return false;
      });

      // 2) Centre, scale and flip Y (SVG is y-down).
      const union = new THREE.Box3();
      for (const e of kept) union.union(e.geo.boundingBox!);
      const size = union.getSize(new THREE.Vector3());
      const center = union.getCenter(new THREE.Vector3());
      const s = TARGET_SIZE / Math.max(size.x, size.y);
      const toWorld = new THREE.Matrix4()
        .makeScale(s, -s, s)
        .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -DEPTH_SVG / 2));

      // 3) Navy (and periwinkle) cluster into NAVY_PARTS contiguous pieces,
      //    seeded by farthest-point spread over the significant shapes.
      const navy = kept.filter((e) => e.bucket === NAVY).sort((a, b) => b.area - a.area);
      const cand = navy.slice(0, Math.max(NAVY_PARTS, Math.min(navy.length, 16)));
      const seeds: { x: number; y: number }[] = [];
      if (cand.length) {
        seeds.push({ x: cand[0].cx, y: cand[0].cy });
        while (seeds.length < Math.min(NAVY_PARTS, cand.length)) {
          let best = cand[0];
          let bestD = -1;
          for (const c of cand) {
            let md = Infinity;
            for (const sd of seeds) md = Math.min(md, (c.cx - sd.x) ** 2 + (c.cy - sd.y) ** 2);
            if (md > bestD) {
              bestD = md;
              best = c;
            }
          }
          seeds.push({ x: best.cx, y: best.cy });
        }
      }
      const nearestSeed = (cx: number, cy: number) => {
        let bi = 0;
        let bd = Infinity;
        seeds.forEach((sd, i) => {
          const d = (cx - sd.x) ** 2 + (cy - sd.y) ** 2;
          if (d < bd) {
            bd = d;
            bi = i;
          }
        });
        return bi;
      };

      const navyClusters: THREE.BufferGeometry[][] = seeds.map(() => []);
      const accent: THREE.BufferGeometry[] = [];
      for (const e of kept) {
        if (e.bucket === RED || e.bucket === ORANGE) accent.push(e.geo);
        else if (seeds.length) navyClusters[nearestSeed(e.cx, e.cy)].push(e.geo);
        else e.geo.dispose();
      }

      // 4) Merge each piece into one mesh: four navy shards and the accent.
      const parts = [
        ...navyClusters.map((geos) => ({ geos, glow: PALETTE[NAVY].glow })),
        { geos: accent, glow: PALETTE[RED].glow },
      ];
      let idx = 0;
      for (const part of parts) {
        if (!part.geos.length) continue;
        const merged = mergeGeometries(part.geos, false);
        part.geos.forEach((g) => g.dispose());
        if (!merged) continue;
        merged.applyMatrix4(toWorld);
        const shard = new Shard(merged, part.glow, idx, 0.45 + (idx % 3) * 0.2);
        shards.push(shard);
        meshes.push(shard.mesh);
        group.add(shard.mesh);
        idx++;
      }
      if (!shards.length) {
        announceFail();
        return;
      }

      // Neighbours in angular order, for the hover reaction.
      const ordered = [...shards].sort((a, b) => a.angle - b.angle);
      ordered.forEach((sh, i) => {
        sh.neighbours = [ordered[(i - 1 + ordered.length) % ordered.length], ordered[(i + 1) % ordered.length]];
      });

      // Fly in and assemble, while the flat mark fades out underneath.
      formTl = gsap.timeline();
      shards.forEach((sh, i) => {
        const dist = 3 + Math.random() * 2;
        const ang = Math.random() * Math.PI * 2;
        sh.offset.set(Math.cos(ang) * dist, Math.sin(ang) * dist, (Math.random() - 0.5) * 4);
        sh.offsetRot.set(
          (Math.random() - 0.5) * Math.PI * 3,
          (Math.random() - 0.5) * Math.PI * 3,
          (Math.random() - 0.5) * Math.PI * 3,
        );
        sh.glow = 0.5;
        const at = i * 0.1;
        formTl!
          .to(sh.offset, { x: 0, y: 0, z: 0, duration: 1.5, ease: "back.out(1.4)" }, at)
          .to(sh.offsetRot, { x: 0, y: 0, z: 0, duration: 1.5, ease: "power3.out" }, at)
          .to(sh, { glow: 0, duration: 1.2, ease: "power2.out" }, at + 0.3);
      });

      canvas.style.opacity = "1";
      announceReady();
    };

    new SVGLoader().load(SVG_URL, build, undefined, () => {
      if (!disposed) announceFail();
    });

    /* ── Input: on its own box ────────────────────────────────────────── */
    const rawNdc = new THREE.Vector2();
    const ndc = new THREE.Vector2();
    let inside = false;
    let down: { x: number; y: number; time: number } | null = null;
    let dragging = false;
    let dragLastX = 0;
    let dragLastY = 0;
    const dragRot = new THREE.Vector2();

    const toNdc = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      rawNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    };
    const onMove = (e: PointerEvent) => {
      inside = true;
      toNdc(e);
      if (dragging) {
        dragRot.y += (e.clientX - dragLastX) * 0.01;
        dragRot.x = THREE.MathUtils.clamp(dragRot.x + (e.clientY - dragLastY) * 0.01, -1.1, 1.1);
        dragLastX = e.clientX;
        dragLastY = e.clientY;
      }
    };
    const onLeave = () => {
      if (dragging) return;
      inside = false;
      rawNdc.set(0, 0);
    };
    const onDown = (e: PointerEvent) => {
      toNdc(e);
      down = { x: e.clientX, y: e.clientY, time: performance.now() };
      if (hovered && e.pointerType === "mouse") {
        dragging = true;
        dragLastX = e.clientX;
        dragLastY = e.clientY;
        container.setPointerCapture(e.pointerId);
      }
    };
    const onUp = (e: PointerEvent) => {
      if (dragging) {
        dragging = false;
        if (container.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId);
      }
      if (!down) return;
      const dist = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const dt = performance.now() - down.time;
      down = null;
      // A tap (not a drag) that lands on the mark itself.
      if (dist < 8 && dt < 350 && hovered) explode();
    };
    const onCancel = () => {
      dragging = false;
      down = null;
      onLeave();
    };

    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointerup", onUp);
    container.addEventListener("pointercancel", onCancel);

    /* ── Hover and explode ────────────────────────────────────────────── */
    const hoverEnter = (s: Shard) => {
      gsap.to(s, { hoverLift: 0.4, glow: 1, duration: 0.5, ease: "power3.out", overwrite: "auto" });
      s.neighbours.forEach((n) =>
        gsap.to(n, { hoverLift: 0.16, glow: 0.3, duration: 0.55, ease: "power3.out", overwrite: "auto" }),
      );
    };
    const hoverLeave = (s: Shard) => {
      [s, ...s.neighbours].forEach((x) =>
        gsap.to(x, { hoverLift: 0, glow: 0, duration: 0.65, ease: "power2.out", overwrite: "auto" }),
      );
    };

    const explode = () => {
      if (!shards.length || explodeTl?.isActive()) return;
      formTl?.kill();
      const OUT = 0.55;
      const HOLD = 0.35;
      const BACK = 1.3;
      const tl = gsap.timeline({ onComplete: () => void (explodeTl = null) });
      for (const s of shards) {
        gsap.killTweensOf(s.offset);
        gsap.killTweensOf(s.offsetRot);
        // Modest spread, so pieces stay inside the canvas.
        const spread = 0.8 + Math.random() * 0.5;
        tl.to(
          s.offset,
          {
            x: s.outward.x * spread + (Math.random() - 0.5) * 0.5,
            y: s.outward.y * spread + (Math.random() - 0.5) * 0.5,
            z: (Math.random() - 0.5) * 1.4 + s.outward.z * 0.6,
            duration: OUT,
            ease: "power3.out",
          },
          0,
        )
          .to(
            s.offsetRot,
            {
              x: (Math.random() - 0.5) * Math.PI * 2.5,
              y: (Math.random() - 0.5) * Math.PI * 2.5,
              z: (Math.random() - 0.5) * Math.PI * 2.5,
              duration: OUT,
              ease: "power2.out",
            },
            0,
          )
          .to(s, { glow: 0.6, duration: OUT, ease: "power1.out" }, 0)
          .to(s.offset, { x: 0, y: 0, z: 0, duration: BACK, ease: "elastic.out(1, 0.55)" }, OUT + HOLD)
          .to(s.offsetRot, { x: 0, y: 0, z: 0, duration: BACK, ease: "elastic.out(1, 0.6)" }, OUT + HOLD)
          .to(s, { glow: 0, duration: BACK * 0.6, ease: "power2.out" }, OUT + HOLD);
      }
      explodeTl = tl;
    };

    /* ── Loop ─────────────────────────────────────────────────────────── */
    const tilt = new THREE.Vector2();
    const camParallax = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const cursorWorld = new THREE.Vector3();
    let scrollRot = 0;
    let frame = 0;
    let elapsed = 0;
    let last = performance.now();

    const checkHover = () => {
      raycaster.setFromCamera(rawNdc, camera);
      const hits = inside && meshes.length ? raycaster.intersectObjects(meshes, false) : [];
      const shard = hits.length ? (hits[0].object.userData.shard as Shard) : null;
      if (shard !== hovered) {
        if (hovered) hoverLeave(hovered);
        if (shard) hoverEnter(shard);
        hovered = shard;
      }
      // The custom cursor draws its own hover state (data-cursor on the box).
      if (!document.documentElement.classList.contains("zan-cursor")) {
        container.style.cursor = dragging ? "grabbing" : shard ? "pointer" : "";
      }
    };

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      const t = elapsed;

      const sk = 1 - Math.pow(0.0015, dt);
      ndc.x += (rawNdc.x - ndc.x) * sk;
      ndc.y += (rawNdc.y - ndc.y) * sk;

      frame++;
      if (frame % 2 === 0) checkHover();

      const damp = 1 - Math.pow(0.001, dt);
      tilt.x += (-ndc.y * MAX_TILT - tilt.x) * damp;
      tilt.y += (ndc.x * MAX_TILT - tilt.y) * damp;

      // A slow turn as the hero scrolls away. The hero opens the page, so
      // its progress is simply scrollY over one viewport.
      const scrollTarget = Math.min(window.scrollY / window.innerHeight, 1.2) * 0.8;
      scrollRot += (scrollTarget - scrollRot) * damp * 0.6;

      // A drag turns it; let go and it drifts home.
      if (!dragging) dragRot.multiplyScalar(1 - damp * 0.06);

      group.rotation.x = tilt.x + Math.sin(t * 0.4) * 0.04 + dragRot.x;
      group.rotation.y = tilt.y + scrollRot + Math.cos(t * 0.33) * 0.05 + dragRot.y;
      group.rotation.z = Math.sin(t * 0.22) * 0.02;
      group.position.y = Math.sin(t * 0.6) * 0.06;
      group.scale.setScalar(1 + Math.sin(t * 0.8) * 0.015);

      raycaster.setFromCamera(ndc, camera);
      const onPlane = raycaster.ray.intersectPlane(plane, cursorWorld);
      const magField = onPlane && inside ? THREE.MathUtils.clamp(1 - cursorWorld.length() / 2.6, 0, 1) : 0;

      for (const s of shards) {
        s.parallax.x += (ndc.x * 0.16 * s.depthFactor - s.parallax.x) * damp;
        s.parallax.y += (ndc.y * 0.16 * s.depthFactor - s.parallax.y) * damp;
        const mx = magField > 0 ? (cursorWorld.x - s.home.x) * 0.12 * magField * s.depthFactor : 0;
        const my = magField > 0 ? (cursorWorld.y - s.home.y) * 0.12 * magField * s.depthFactor : 0;
        s.magnetic.x += (mx - s.magnetic.x) * damp;
        s.magnetic.y += (my - s.magnetic.y) * damp;
        s.update();
      }

      // Camera parallax for this frame only, then restored.
      const ck = 1 - Math.pow(0.0025, dt);
      camParallax.x += (ndc.x * 0.4 - camParallax.x) * ck;
      camParallax.y += (ndc.y * 0.28 - camParallax.y) * ck;
      camera.position.x += camParallax.x;
      camera.position.y += camParallax.y;
      camera.lookAt(lookAt);
      renderer.render(scene, camera);
      camera.position.x -= camParallax.x;
      camera.position.y -= camParallax.y;
    };

    // Render only while on screen and the tab is visible.
    let running = false;
    let onScreen = true;
    const sync = () => {
      const want = onScreen && document.visibilityState !== "hidden";
      if (want && !running) {
        last = performance.now();
        renderer.setAnimationLoop(tick);
      } else if (!want && running) {
        renderer.setAnimationLoop(null);
      }
      running = want;
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    io.observe(container);
    document.addEventListener("visibilitychange", sync);
    sync();

    const onLost = (e: Event) => {
      e.preventDefault();
      renderer.setAnimationLoop(null);
      running = false;
      announceFail();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    /* ── Size: the mark spans `span` of the canvas width ──────────────── */
    const fit = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const halfTan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      camera.position.z = TARGET_SIZE / span / (2 * halfTan * camera.aspect);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    fit();

    /* ── Cleanup: only what this component made ──────────────────────── */
    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", onLost);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointerup", onUp);
      container.removeEventListener("pointercancel", onCancel);
      container.style.cursor = "";
      formTl?.kill();
      explodeTl?.kill();
      for (const s of shards) {
        gsap.killTweensOf([s, s.offset, s.offsetRot]);
        s.dispose();
      }
      wall.geometry.dispose();
      (wall.material as THREE.Material).dispose();
      envRT.dispose();
      pmrem.dispose();
      room.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [span]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-cursor
      className={className}
      style={{ touchAction: "pan-y", userSelect: "none" }}
    />
  );
}
