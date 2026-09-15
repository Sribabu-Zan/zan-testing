"use client";

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, invalidate, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, useGLTF } from "@react-three/drei";
import {
  Box3,
  CanvasTexture,
  SRGBColorSpace,
  Vector3,
  type Group,
  type Material,
  type Mesh,
  type MeshBasicMaterial,
  type PerspectiveCamera,
} from "three";
import { processSteps } from "@/constants/zan";
import { useBrandPalette, useRegionId, type BrandPalette } from "@/lib/region";
import { drawScreen, FALLBACK_FONTS, resolveFonts, SCREEN_H, SCREEN_W } from "./screens";
import { REST_PITCH, REST_YAW, spinPitch, spinYaw, STEPS, TAU, turnsAt } from "./spin";

/* ───────────────────────────────────────────────────────────────────────────
   The Process laptop — Apple_Website's Features technique on paper.

   "macbook pro M3 16 inch 2024" by jackbaeten, CC BY 4.0 (credited in the
   footer). Draco-compressed; the decoder is served from /draco/, so nothing
   is fetched from a CDN. The body keeps the model's own silver materials;
   only the screen is replaced, by a canvas texture per stage.

   Two variants:
   - "stage" (desktop): full-screen canvas, a three-quarter turn per stage.
   - "spin" (phones, tablets): the laptop fitted to a smaller canvas at the
     top of the pinned stage, one full turn per stage (see ./spin.ts). Its
     screen changes while its back is to the camera. DPR is capped lower.

   frameloop="demand": nothing renders unless the scroll scene kicks it (it
   only does while the section is in its scroll range), and `running={false}`
   stops the loop entirely off-screen. Loaded with next/dynamic, ssr: false,
   near the viewport.
   ─────────────────────────────────────────────────────────────────────────── */

const MODEL = "/models/macbook.glb";
const DRACO = "/draco/";

export interface ProcessProgress {
  /** 0→1 as the stage scrolls up into view. */
  entry: number;
  /** 0→1 through the pinned stages. */
  pin: number;
}

export type LaptopVariant = "stage" | "spin";

/** Every mesh but the screen, with its own material (gltfjsx -T layout). */
const PARTS: readonly [string, string][] = [
  ["Object_10", "PaletteMaterial001"],
  ["Object_16", "zhGRTuGrQoJflBD"],
  ["Object_20", "PaletteMaterial002"],
  ["Object_22", "lmWQsEjxpsebDlK"],
  ["Object_30", "LtEafgAVRolQqRw"],
  ["Object_32", "iyDJFXmHelnMTbD"],
  ["Object_34", "eJObPwhgFzvfaoZ"],
  ["Object_38", "nDsMUuDKliqGFdU"],
  ["Object_42", "CRQixVLpahJzhJc"],
  ["Object_48", "YYwBgwvcyZVOOAA"],
  ["Object_54", "SLGkCohDDelqXBu"],
  ["Object_58", "WnHKXHhScfUbJQi"],
  ["Object_66", "fNHiBfcxHUJCahl"],
  ["Object_74", "LpqXZqhaGCeSzdu"],
  ["Object_82", "gMtYExgrEUqPfln"],
  ["Object_96", "PaletteMaterial003"],
  ["Object_107", "JvMFZolVCdpPqjj"],
  ["Object_127", "ZCDwChwkbBfITSW"],
];
const SCREEN = "Object_123";
const NODE_ROTATION: [number, number, number] = [Math.PI / 2, 0, 0];
const STAGE_POSITION: [number, number, number] = [0, -0.86, 0.4];

/* ── Motion: the turn is a pure function of scroll ─────────────────────── */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

/** Yaw through the pinned stages — a three-quarter view per stage, then face on. */
const KEYS: readonly [number, number][] = [
  [0, -0.5],
  [0.12, -0.5],
  [0.37, 0.3],
  [0.62, -0.28],
  [0.86, 0],
  [1, 0],
];

function yawAt({ entry, pin }: ProcessProgress) {
  if (pin <= 0) return lerp(-Math.PI - 0.5, -0.5, ease(Math.min(1, Math.max(0, entry))));
  for (let k = 1; k < KEYS.length; k++) {
    const [p1, a1] = KEYS[k];
    if (pin <= p1) {
      const [p0, a0] = KEYS[k - 1];
      return lerp(a0, a1, ease((pin - p0) / (p1 - p0)));
    }
  }
  return 0;
}
const pitchAt = ({ entry }: ProcessProgress) => lerp(0.42, 0.14, ease(Math.min(1, Math.max(0, entry))));

/* ── Screens ────────────────────────────────────────────────────────────── */

function useFontsReady() {
  const [ready, setReady] = useState(() => document.fonts?.status === "loaded");
  useEffect(() => {
    if (ready || !document.fonts) return;
    let live = true;
    document.fonts.ready.then(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, [ready]);
  return ready;
}

function useScreens(palette: BrandPalette) {
  const fontsReady = useFontsReady();
  const textures = useMemo(() => {
    const fonts = fontsReady ? resolveFonts() : FALLBACK_FONTS;
    return processSteps.map((_, i) => {
      const canvas = document.createElement("canvas");
      canvas.width = SCREEN_W;
      canvas.height = SCREEN_H;
      const ctx = canvas.getContext("2d");
      if (ctx) drawScreen(ctx, processSteps, i, palette, fonts);
      const t = new CanvasTexture(canvas);
      t.colorSpace = SRGBColorSpace;
      // The screen mesh's UVs run bottom-up (measured: false renders it upside down).
      t.flipY = true;
      t.anisotropy = 4;
      return t;
    });
  }, [palette, fontsReady]);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  return textures;
}

/* ── Scene ──────────────────────────────────────────────────────────────── */

function Laptop({
  progressRef,
  step,
  palette,
  variant,
  onReady,
}: {
  progressRef: RefObject<ProcessProgress>;
  step: number;
  palette: BrandPalette;
  variant: LaptopVariant;
  onReady?: () => void;
}) {
  const spin = variant === "spin";
  const groupRef = useRef<Group>(null);
  const innerRef = useRef<Group>(null);
  const shadowRef = useRef<Group>(null);
  const screenRef = useRef<MeshBasicMaterial>(null);
  // Seeded from the scroll position on the first frame, not during render.
  const stateRef = useRef({ yaw: Number.NaN, pitch: Number.NaN });
  const { nodes, materials } = useGLTF(MODEL, DRACO, false);
  const screens = useScreens(palette);
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  // Spin: centre the model on its turning axis and frame it in the canvas,
  // leaving room for its widest silhouette (the diagonal, mid-turn).
  useEffect(() => {
    if (!spin) return;
    const outer = groupRef.current;
    const inner = innerRef.current;
    if (!outer || !inner || !width || !height) return;
    const saved = outer.rotation.clone();
    outer.rotation.set(0, 0, 0);
    inner.position.set(0, 0, 0);
    outer.updateMatrixWorld(true);
    const box = new Box3().setFromObject(inner);
    const centre = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    inner.position.set(-centre.x, -centre.y, -centre.z);
    outer.rotation.copy(saved);
    if (shadowRef.current) shadowRef.current.position.y = -size.y / 2 - size.z * 0.12;

    const cam = camera as PerspectiveCamera;
    const tan = Math.tan((cam.fov * Math.PI) / 360);
    const aspect = width / height;
    const halfW = (Math.hypot(size.x, size.z) / 2) * 1.02;
    const halfH = ((size.y * Math.cos(REST_PITCH) + size.z * Math.sin(REST_PITCH)) / 2) * 1.12;
    const dist = Math.max(halfW / (tan * aspect), halfH / tan) + size.z / 2;
    cam.position.set(0, dist * 0.05, dist);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
    invalidate();
    onReady?.();
  }, [spin, camera, width, height, nodes, onReady]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const target = progressRef.current;
    const s = stateRef.current;
    const ty = spin ? spinYaw(target.entry, turnsAt(target.pin)) : yawAt(target);
    const tp = spin ? spinPitch(target.entry) : pitchAt(target);
    if (Number.isNaN(s.yaw)) {
      s.yaw = ty;
      s.pitch = tp;
    }
    // The phone scene is already smoothed by its scrub, so it follows closely.
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * (spin ? 14 : 7));
    s.yaw += (ty - s.yaw) * k;
    s.pitch += (tp - s.pitch) * k;
    g.rotation.set(s.pitch, s.yaw, 0);
    if (spin && screenRef.current) {
      // The screen follows the laptop as drawn, so it only changes face-away.
      const shown = Math.min(STEPS - 1, Math.max(0, Math.round((s.yaw - REST_YAW) / TAU)));
      if (screenRef.current.map !== screens[shown]) {
        screenRef.current.map = screens[shown];
        screenRef.current.needsUpdate = true;
      }
    }
    // Keep drawing only while the laptop is still easing toward the scroll.
    if (Math.abs(ty - s.yaw) > 1e-4 || Math.abs(tp - s.pitch) > 1e-4) invalidate();
  });

  return (
    <>
      <group ref={groupRef}>
        <group ref={innerRef} scale={0.08} position={spin ? undefined : STAGE_POSITION}>
          {PARTS.map(([node, material]) => (
            <mesh
              key={node}
              geometry={(nodes[node] as Mesh).geometry}
              material={materials[material] as Material}
              rotation={NODE_ROTATION}
            />
          ))}
          <mesh geometry={(nodes[SCREEN] as Mesh).geometry} rotation={NODE_ROTATION}>
            {spin ? (
              <meshBasicMaterial ref={screenRef} toneMapped={false} />
            ) : (
              <meshBasicMaterial map={screens[step]} toneMapped={false} />
            )}
          </mesh>
        </group>
      </group>
      {spin && (
        <group ref={shadowRef} position={[0, -1, 0]}>
          <ContactShadows opacity={0.3} scale={5} blur={2.4} far={1.6} resolution={256} color={palette.ink} />
        </group>
      )}
    </>
  );
}

function Lights({ palette }: { palette: BrandPalette }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 6, 5]} intensity={1.1} />
      {/* A local studio: light walls and softboxes, no remote HDR. */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={[palette.line]} />
        <Lightformer form="rect" intensity={4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 6, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[-7, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 8, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[7, 2, 2]} rotation-y={-Math.PI / 2} scale={[6, 8, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[0, 1, 8]} scale={[10, 4, 1]} />
      </Environment>
    </>
  );
}

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function LaptopCanvas({
  progressRef,
  kickRef,
  step = 0,
  variant = "stage",
  running = true,
  onReady,
}: {
  progressRef: RefObject<ProcessProgress>;
  /** Filled in with this canvas's invalidate, for the scroll scene to call. */
  kickRef: RefObject<() => void>;
  /** The screen on show ("stage" only; "spin" picks it from the turn). */
  step?: number;
  variant?: LaptopVariant;
  /** False stops the render loop (the section is off screen). */
  running?: boolean;
  /** Called once the model is in and framed ("spin"). */
  onReady?: () => void;
}) {
  const palette = useBrandPalette();
  const region = useRegionId();
  const spin = variant === "spin";

  useEffect(() => {
    kickRef.current = running ? () => invalidate() : () => {};
    if (running) invalidate();
    return () => {
      kickRef.current = () => {};
    };
  }, [kickRef, running]);

  return (
    <Boundary>
      <Canvas
        frameloop={running ? "demand" : "never"}
        dpr={spin ? [1, 1.5] : [1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: spin ? "default" : "high-performance" }}
        camera={{ position: [0, 0.5, 9], fov: 30 }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
        style={{ pointerEvents: "none" }}
      >
        <Lights key={region} palette={palette} />
        <Suspense fallback={null}>
          <Laptop progressRef={progressRef} step={step} palette={palette} variant={variant} onReady={onReady} />
          {!spin && (
            <ContactShadows position={[0, -0.95, 0]} opacity={0.32} scale={9} blur={2.6} far={2.4} color={palette.ink} />
          )}
        </Suspense>
      </Canvas>
    </Boundary>
  );
}

useGLTF.preload(MODEL, DRACO, false);
