"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { MQ } from "@/lib/gsap";

/* ── Media queries ────────────────────────────────────────────────────────── */

const mediaSubscribers = new Map<string, (onChange: () => void) => () => void>();

function subscribeMedia(query: string) {
  let subscribe = mediaSubscribers.get(query);
  if (!subscribe) {
    subscribe = (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    };
    mediaSubscribers.set(query, subscribe);
  }
  return subscribe;
}

/** A media query's live state. False on the server and during hydration. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/* ── Can this device run the 3D mark? ─────────────────────────────────────── */

let capable: boolean | null = null;

/**
 * Measured once per page load. A software rasteriser (SwiftShader, llvmpipe)
 * "supports" WebGL but draws the extruded mark at a few frames a second, so
 * the renderer string is what decides. Save-Data opts out.
 *
 * navigator.deviceMemory is deliberately NOT consulted: Brave randomises it
 * per site for fingerprinting protection, and a "≤ 4 GB" check sent capable
 * desktops to the flat mark — the client saw exactly that.
 *
 * QA override, shared with the rest of the page: ?quality=high|medium forces
 * the 3D on (headless Chrome renders with SwiftShader), low|none forces it off.
 */
function probeDevice(): boolean {
  if (capable !== null) return capable;

  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced === "high" || forced === "medium") return (capable = true);
  if (forced === "low" || forced === "none") return (capable = false);

  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return (capable = false);

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
  return (capable = ok);
}

const noSubscription = () => () => {};

/** A real mouse, a desktop-wide window and motion allowed — the 3D mark's audience. */
const QUERY_3D = `${MQ.fine} and ${MQ.desktop} and ${MQ.motion}`;

/** Whether the interactive three.js mark may load. False on the server. */
export function useCan3D(): boolean {
  const media = useMedia(QUERY_3D);
  const device = useSyncExternalStore(noSubscription, () => (media ? probeDevice() : false), () => false);
  return media && device;
}

/* ── Timing ───────────────────────────────────────────────────────────────── */

/**
 * True once the page has loaded and the browser has had an idle moment:
 * the earliest a heavy chunk (three.js) may start, so it never competes
 * with the headline's first paint.
 */
export function useIdleAfterLoad(enabled: boolean): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!enabled || idle) return;
    let cancelled = false;
    let handle = 0;
    let timer = 0;
    const requestIdle =
      window.requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 200) as unknown as number);
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;

    const onLoad = () => {
      timer = window.setTimeout(() => {
        handle = requestIdle(
          () => {
            if (!cancelled) setIdle(true);
          },
          { timeout: 1500 },
        );
      }, 0);
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
      window.clearTimeout(timer);
      cancelIdle(handle);
    };
  }, [enabled, idle]);

  return idle;
}

/** Whether an element is on screen. Starts true: the hero opens the page. */
export function useOnScreen(ref: RefObject<Element | null>, rootMargin = "0px"): boolean {
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return onScreen;
}
