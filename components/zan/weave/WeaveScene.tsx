"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import {
  type DirectionalLight,
  type Group,
  type Material,
  type Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PMREMGenerator,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { QualityTier } from "./useDeviceQuality";
import { StrandGeometry } from "./StrandGeometry";
import { STRAND_COUNT, weavePoint, type Vec3 } from "./weaveCurves";

/* ═══════════════════════════════════════════════════════════════════════════
   THE WEAVE — the WebGL scene (ported from the production site)

   Three strands, one per practice — Development, Digital Marketing,
   Designing — pulled from three loose loops into one woven knot.

   One canvas, three meshes, no textures and no network requests: reflections
   come from three's procedural RoomEnvironment, not an HDR.

   Colours arrive as props from useBrandPalette(), so a region switch relights
   the strands violet, gold or vermilion without the scene knowing any of
   those values. Materials are tuned for the light page: satin rather than
   neon, with a little emissive so the brand hue survives the white ground.

   Ownership: geometry and materials are created in an effect and reached
   through refs, then rewritten in useFrame. The React Compiler rules treat
   hook results as immutable, and a scene has to mutate its objects every
   frame, so everything mutable here goes through a ref or the store's get().
   ═══════════════════════════════════════════════════════════════════════════ */

export type RenderTier = Exclude<QualityTier, "none">;

/** Written by the owner, read every frame. A ref: scroll and pointer change far more often than React should render. */
export interface WeaveInput {
  /** 0 = three loose strands, 1 = one woven form. */
  progress: number;
  /** Pointer position, -1..1 on both axes. */
  pointerX: number;
  pointerY: number;
}

/** Development, Digital Marketing, Designing — and the rim light behind the knot. */
export interface WeaveColors {
  strands: readonly [string, string, string];
  rim: string;
}

interface TierConfig {
  segments: number;
  radial: number;
  maxDpr: number;
  physical: boolean;
  /** Continuous render with idle drift, or render on demand only. */
  idle: boolean;
  antialias: boolean;
}

const TIER: Record<RenderTier, TierConfig> = {
  high: { segments: 360, radial: 16, maxDpr: 2, physical: true, idle: true, antialias: true },
  medium: { segments: 240, radial: 12, maxDpr: 1.5, physical: false, idle: true, antialias: true },
  low: { segments: 150, radial: 9, maxDpr: 1.25, physical: false, idle: false, antialias: false },
};

const TUBE_RADIUS = 0.058;
const STRANDS = Array.from({ length: STRAND_COUNT }, (_, i) => i);

function Environment() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene } = get();
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    return () => {
      scene.environment = null;
      target.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [get]);
  return null;
}

function makeMaterial(physical: boolean): MeshStandardMaterial {
  return physical
    ? new MeshPhysicalMaterial({
        roughness: 0.3,
        metalness: 0.05,
        clearcoat: 0.9,
        clearcoatRoughness: 0.18,
        iridescence: 0.16,
        iridescenceIOR: 1.3,
        envMapIntensity: 0.95,
        emissiveIntensity: 0.14,
      })
    : new MeshStandardMaterial({
        roughness: 0.36,
        metalness: 0.06,
        envMapIntensity: 0.95,
        emissiveIntensity: 0.14,
      });
}

function Weave({
  input,
  tier,
  colors,
  onFirstFrame,
}: {
  input: RefObject<WeaveInput>;
  tier: RenderTier;
  colors: WeaveColors;
  onFirstFrame: () => void;
}) {
  const config = TIER[tier];
  const get = useThree((s) => s.get);
  const group = useRef<Group>(null);
  const rim = useRef<DirectionalLight>(null);
  const meshes = useRef<(Mesh | null)[]>([]);
  const palette = useRef(colors);
  const live = useRef({
    progress: -1,
    rx: 0,
    ry: 0,
    spin: 0,
    time: 0,
    colorKey: "",
    announced: false,
  });

  // The latest colours, for the frame loop. On-demand tiers only render when
  // asked, so a relight has to ask.
  useEffect(() => {
    palette.current = colors;
    get().invalidate();
  }, [colors, get]);

  useEffect(() => {
    const made: { geometry: StrandGeometry; material: Material }[] = [];
    for (const i of STRANDS) {
      const mesh = meshes.current[i];
      if (!mesh) continue;
      const geometry = new StrandGeometry(config.segments, config.radial, TUBE_RADIUS);
      const material = makeMaterial(config.physical);
      mesh.geometry.dispose();
      (mesh.material as Material).dispose();
      mesh.geometry = geometry;
      mesh.material = material;
      made.push({ geometry, material });
    }
    // Force the next frame to rebuild the geometry and re-apply the colours.
    live.current.progress = -1;
    live.current.colorKey = "";
    get().invalidate();
    return () => {
      for (const { geometry, material } of made) {
        geometry.dispose();
        material.dispose();
      }
    };
  }, [config, get]);

  useFrame((state, delta) => {
    const L = live.current;
    const dt = Math.min(delta, 1 / 20);
    L.time += dt;

    const c = palette.current;
    const key = `${c.strands.join("|")}|${c.rim}`;
    if (L.colorKey !== key) {
      meshes.current.forEach((mesh, i) => {
        const material = mesh?.material;
        if (material instanceof MeshStandardMaterial) {
          material.color.set(c.strands[i]);
          material.emissive.set(c.strands[i]);
        }
      });
      rim.current?.color.set(c.rim);
      L.colorKey = key;
    }

    // Scroll progress, glided rather than stepped.
    const target = input.current.progress;
    const next =
      L.progress < 0 ? target : L.progress + (target - L.progress) * (1 - Math.exp(-dt * 7));
    const moved = Math.abs(next - L.progress) > 1e-4;
    const drifting = config.idle && next < 0.999;
    if (moved || drifting) {
      for (const i of STRANDS) {
        const geometry = meshes.current[i]?.geometry;
        if (geometry instanceof StrandGeometry) {
          geometry.update((s: number, out: Vec3) => weavePoint(i, s, next, L.time, out));
        }
      }
    }
    L.progress = next;

    // Pointer: a slow, damped lean — the object trails the cursor.
    const ease = 1 - Math.exp(-dt * 2.4);
    L.rx += (input.current.pointerY * 0.22 - L.rx) * ease;
    L.ry += (input.current.pointerX * 0.38 - L.ry) * ease;
    if (config.idle) L.spin += dt * 0.07;

    const g = group.current;
    if (g) {
      g.rotation.set(0.2 + L.rx, L.ry + L.spin + next * 0.7, next * -0.12);
      const breathe = config.idle ? Math.sin(L.time * 0.9) * 0.012 : 0;
      g.scale.setScalar(0.94 + next * 0.1 + breathe);
      g.position.y = config.idle ? Math.sin(L.time * 0.6) * 0.05 : 0;
    }

    const cam = state.camera;
    cam.position.x += (input.current.pointerX * 0.35 - cam.position.x) * ease;
    cam.position.y += (-input.current.pointerY * 0.22 - cam.position.y) * ease;
    cam.position.z = 7.2 - next * 0.5;
    cam.lookAt(0, 0, 0);

    if (!L.announced) {
      L.announced = true;
      onFirstFrame();
    }
    if (!config.idle && Math.abs(target - next) > 1e-4) state.invalidate();
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[-3, 4, 5]} intensity={1.3} />
      {/* The rim takes the region's glow and sits behind the knot. */}
      <directionalLight ref={rim} position={[3.5, -1.2, -4]} intensity={2.2} />
      <group ref={group}>
        {STRANDS.map((i) => (
          <mesh
            key={i}
            ref={(mesh) => {
              meshes.current[i] = mesh;
            }}
          />
        ))}
      </group>
    </>
  );
}

export default function WeaveCanvas({
  input,
  tier,
  colors,
  active,
  onReady,
}: {
  input: RefObject<WeaveInput>;
  tier: RenderTier;
  colors: WeaveColors;
  /** False when off-screen or covered: the loop stops entirely. */
  active: boolean;
  onReady: () => void;
}) {
  const config = TIER[tier];
  const [dpr, setDpr] = useState(config.maxDpr);

  return (
    <Canvas
      dpr={[1, dpr]}
      frameloop={!active ? "never" : config.idle ? "always" : "demand"}
      camera={{ position: [0, 0, 7.2], fov: 32, near: 0.1, far: 40 }}
      gl={{
        antialias: config.antialias,
        alpha: true,
        powerPreference: tier === "high" ? "high-performance" : "default",
      }}
      onCreated={({ gl }) => {
        // Neutral rather than ACES: ACES pulls saturated yellow towards white,
        // which would turn the UAE's gold weave into something off-brand.
        gl.toneMapping = NeutralToneMapping;
        gl.setClearAlpha(0);
      }}
      style={{ pointerEvents: "none" }}
    >
      {config.idle && (
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(config.maxDpr)}
          flipflops={3}
          onFallback={() => setDpr(1)}
        />
      )}
      <Environment />
      <Weave input={input} tier={tier} colors={colors} onFirstFrame={onReady} />
    </Canvas>
  );
}
