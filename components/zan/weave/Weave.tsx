"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { MQ } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { useDeferredStart } from "./useDeferredStart";
import { useDeviceQuality } from "./useDeviceQuality";
import { useMedia } from "./useMedia";
import { WeaveFallback } from "./WeaveFallback";

/* three.js, R3F and drei live in this chunk; nothing downloads it unless the
   conditions below all hold. */
const ChapterWeave = dynamic(() => import("./ChapterWeave"), { ssr: false });

/**
 * The three practices as three strands woven into one knot.
 *
 * Always renders the static SVG knot (server HTML, phones, reduced motion, no
 * WebGL). The WebGL weave replaces it only on a desktop with a real GPU and
 * motion allowed, once the page has gone idle and the panel is near the
 * viewport — then the SVG fades out under it.
 *
 * `paused` stops the render loop, e.g. while the chapter curtain covers it.
 */
export function Weave({ paused = false, className }: { paused?: boolean; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const quality = useDeviceQuality();
  const tier = quality === null || quality === "none" ? null : quality;
  const desktop = useMedia(MQ.desktop);
  const motion = useMedia(MQ.motion);
  const capable = tier !== null && desktop && motion;
  const started = useDeferredStart(capable ? "idle" : null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el || !capable) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [capable]);

  const mount = capable && started && near;

  return (
    <div ref={host} aria-hidden="true" className={cn("relative", className)}>
      <WeaveFallback
        className={cn(
          "absolute inset-0 size-full transition-opacity duration-700 ease-out-expo",
          mount && ready && "opacity-0",
        )}
      />
      {mount && tier !== null && (
        <ChapterWeave tier={tier} paused={paused} onReady={() => setReady(true)} />
      )}
    </div>
  );
}
