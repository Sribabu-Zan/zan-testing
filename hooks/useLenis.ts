"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

let lenisInstance: Lenis | null = null;

export function getLenis() {
  return lenisInstance;
}

/**
 * One Lenis for the page, driven by GSAP's ticker so ScrollTrigger and the
 * smooth scroll share a frame.
 *
 * Not created for reduced motion — smoothing is itself motion, and native
 * scrolling is what that visitor asked for. Touch keeps native scrolling
 * either way (syncTouch is off by default).
 */
export function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      // In-page links (#services, #contact …) glide instead of jumping.
      anchors: true,
      // Anything that scrolls on its own — the mobile menu, a form, a
      // dropdown — opts out with data-lenis-prevent.
      allowNestedScroll: true,
      prevent: (node) => node instanceof Element && node.closest("[data-lenis-prevent]") !== null,
    });

    lenisInstance = lenis;
    // Exposed for the QA screenshot script, which drives scroll through it.
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);
}
