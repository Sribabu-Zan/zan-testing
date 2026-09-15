"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A media query as a boolean, read through useSyncExternalStore so it is
 * hydration-safe: the server render and the hydrating client render both see
 * `serverValue`, and the real value arrives in the render right after.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

let webgl: boolean | null = null;

/** Whether this browser can create a WebGL context. Probed once, then cached. */
export function hasWebGL(): boolean {
  if (webgl === null) {
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

const noop = () => () => {};

/** hasWebGL() as a hydration-safe value (false on the server). */
export function useWebGL(): boolean {
  return useSyncExternalStore(noop, hasWebGL, () => false);
}

let gpu: boolean | null = null;

/**
 * Whether a phone or tablet should get the real 3D laptop: WebGL on a hardware
 * GPU. The same probe as the opening mark (components/zan/opening/hooks.ts): a
 * software rasteriser (SwiftShader, llvmpipe) only pretends, and Save-Data opts
 * out. ?quality=high|medium forces it on, low|none forces it off.
 */
export function hasCapableGPU(): boolean {
  if (gpu !== null) return gpu;
  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced === "high" || forced === "medium") return (gpu = true);
  if (forced === "low" || forced === "none") return (gpu = false);
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return (gpu = false);
  let ok = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (gl) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      ok = !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    ok = false;
  }
  return (gpu = ok);
}

/** hasCapableGPU() as a hydration-safe value (false on the server). */
export function useCapableGPU(): boolean {
  return useSyncExternalStore(noop, hasCapableGPU, () => false);
}
