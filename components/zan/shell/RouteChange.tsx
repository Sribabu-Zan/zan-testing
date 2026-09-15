"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getLenis } from "@/hooks/useLenis";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * Housekeeping after a client-side navigation: every new route opens at the top.
 *
 * Setting the scroll once is not enough. For a few frames after the pathname
 * changes the old page is still unmounting and the new one is laying out —
 * pins are torn down, spacers inserted, images decoding — and the browser's
 * scroll anchoring moves the viewport to keep some surviving element (often
 * the footer) where it was. Lenis then adopts that position. Measured: a
 * footer link clicked 41,633px down opened /about-us at its bottom, 3,839px.
 *
 * So the top is re-asserted, on both the window and Lenis, across those frames
 * and after the ScrollTrigger refresh the new page triggers, and any scroll
 * input from the visitor cancels it at once.
 *
 * Left alone: a link with a hash (the anchor handling takes it to its section),
 * and Back/Forward, where the browser restoring the previous position is the
 * behaviour people expect.
 */
export function RouteChange() {
  const pathname = usePathname();
  const firstRender = useRef(true);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      fromHistory.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const lenis = getLenis();

    // A full page load: the browser owns the scroll position there.
    if (firstRender.current) {
      firstRender.current = false;
      lenis?.resize();
      ScrollTrigger.refresh();
      return;
    }

    if (window.location.hash || fromHistory.current) {
      fromHistory.current = false;
      lenis?.resize();
      ScrollTrigger.refresh();
      return;
    }

    const toTop = () => {
      window.scrollTo(0, 0);
      getLenis()?.scrollTo(0, { immediate: true, force: true });
    };

    let frameA = 0;
    let frameB = 0;
    const timers: number[] = [];
    const onRefresh = () => toTop();

    const stop = () => {
      cancelAnimationFrame(frameA);
      cancelAnimationFrame(frameB);
      timers.forEach((t) => window.clearTimeout(t));
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };

    toTop();
    frameA = requestAnimationFrame(() => {
      toTop();
      frameB = requestAnimationFrame(toTop);
    });
    for (const ms of [80, 250, 600]) timers.push(window.setTimeout(toTop, ms));
    // Past this point the page has settled; stop listening for refreshes.
    timers.push(window.setTimeout(stop, 1500));

    ScrollTrigger.addEventListener("refresh", onRefresh);
    ScrollTrigger.refresh();

    // The visitor taking over the scroll ends the re-assertion immediately.
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);

    return stop;
  }, [pathname]);

  return null;
}
