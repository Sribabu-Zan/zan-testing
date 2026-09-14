"use client";

import { useEffect, useState } from "react";

/**
 * When something heavy is allowed to start.
 *
 *   "idle"         After the load event, in the browser's next idle period.
 *   "interaction"  On the reader's first scroll, touch or key press — or, if
 *                  they do none of those, a few seconds after load.
 *   null           Not at all (yet).
 *
 * This exists because of a measurement. Fetching the weave straight after
 * hydration took mobile LCP from 5.9 s to 15.3 s under a 4x CPU throttle: the
 * headline is typed in by JavaScript, and parsing the ~890 KB three.js chunk on
 * a slow core starved it. Nothing heavy may start until the first paint's work
 * is done — on a phone, until the reader has shown they are staying, since any
 * input also closes the LCP window.
 */
export function useDeferredStart(mode: "idle" | "interaction" | null): boolean {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!mode || started) return;

    let cancelled = false;
    let idle = 0;
    let timer = 0;
    const requestIdle =
      window.requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 200) as unknown as number);
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;

    const start = () => {
      if (cancelled) return;
      cancelled = true;
      setStarted(true);
    };
    const startWhenIdle = () => {
      idle = requestIdle(start, { timeout: 2000 });
    };

    const inputs = ["scroll", "touchstart", "pointerdown", "keydown"] as const;
    const onLoad = () => {
      if (mode === "idle") startWhenIdle();
      else timer = window.setTimeout(startWhenIdle, 4000);
    };

    if (mode === "interaction") {
      for (const type of inputs) window.addEventListener(type, start, { once: true, passive: true });
    }
    if (document.readyState === "complete") {
      // Already loaded: still defer to a later task rather than starting here.
      timer = window.setTimeout(onLoad, 0);
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
      for (const type of inputs) window.removeEventListener(type, start);
      window.clearTimeout(timer);
      cancelIdle(idle);
    };
  }, [mode, started]);

  return started;
}
