"use client";

import { useSyncExternalStore } from "react";

export interface WebGLProbe {
  supported: boolean;
  /** A CPU rasteriser pretending to be a GPU — SwiftShader, llvmpipe. */
  software: boolean;
  /** Integrated or mobile-class GPU: capable, but not for the heaviest shader. */
  integrated: boolean;
  renderer: string;
}

let probe: WebGLProbe | null = null;

/**
 * What this browser can actually draw with, measured once per page load.
 *
 * "Supports WebGL" is not the question that matters — a software renderer
 * supports it and draws the weave at a few frames a second. The renderer
 * string is what tells the two apart, so it is read here and the context is
 * released straight away rather than held for the life of the page.
 */
export function probeWebGL(): WebGLProbe {
  if (probe) return probe;
  let result: WebGLProbe = { supported: false, software: false, integrated: false, renderer: "" };
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as
      | WebGLRenderingContext
      | null;
    if (gl) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = String(
        info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      );
      result = {
        supported: true,
        software: /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer),
        integrated: /intel|mali|adreno|powervr/i.test(renderer),
        renderer,
      };
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    // No WebGL at all; the default result already says so.
  }
  probe = result;
  return result;
}

const subscribe = () => () => {};

/** The probe, or `null` on the server and during hydration. */
export function useWebGLSupport(): WebGLProbe | null {
  return useSyncExternalStore(subscribe, probeWebGL, () => null);
}
