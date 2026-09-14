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
