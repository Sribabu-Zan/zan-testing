"use client";

import { useSyncExternalStore } from "react";
import { probeWebGL } from "./useWebGLSupport";

/**
 * How much of the experience this device gets.
 *
 *   high    Desktop with a discrete or Apple GPU: the full physical material,
 *           2x pixel ratio, continuous idle motion.
 *   medium  An ordinary laptop: a standard material, 1.5x, idle motion.
 *   low     Phones, tablets and small or modest machines: a third of the
 *           vertices, 1.25x, and it renders only while the page scrolls.
 *   none    No WebGL, a software renderer, Save-Data, reduced motion, or a very
 *           weak device. No canvas at all — the pre-3D artwork instead.
 */
export type QualityTier = "high" | "medium" | "low" | "none";

const TIERS: readonly QualityTier[] = ["high", "medium", "low", "none"];

let cached: QualityTier | null = null;

export function detectQuality(): QualityTier {
  if (cached) return cached;

  // Reduced motion is the reader's preference, not a capability, and it wins
  // over everything — including the QA override below. (It used to be checked
  // after the override, and ?quality=high under reduced motion rendered the
  // scene and pinned the hero.)
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cached = "none";
    return cached;
  }

  // A manual override for QA: ?quality=high|medium|low|none. Headless and
  // remote browsers usually render with SwiftShader, which is classed "none",
  // so without this the scene could never be looked at in automated checks.
  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced && (TIERS as readonly string[]).includes(forced)) {
    cached = forced as QualityTier;
    return cached;
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };

  let tier: QualityTier;
  if (nav.connection?.saveData) tier = "none";
  else {
    const gl = probeWebGL();
    // deviceMemory is Chromium-only; elsewhere assume a capable machine and
    // let the other signals decide.
    const memory = nav.deviceMemory ?? 8;
    const cores = nav.hardwareConcurrency ?? 4;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 1024;

    if (!gl.supported || gl.software || memory < 3 || cores < 3) tier = "none";
    else if (touch || narrow || memory <= 4 || cores <= 4) tier = "low";
    else if (cores >= 8 && memory >= 8 && !gl.integrated) tier = "high";
    else tier = "medium";
  }

  cached = tier;
  return tier;
}

const subscribe = () => () => {};

/** The device's tier, or `null` on the server and during hydration. */
export function useDeviceQuality(): QualityTier | null {
  return useSyncExternalStore(subscribe, detectQuality, () => null);
}
