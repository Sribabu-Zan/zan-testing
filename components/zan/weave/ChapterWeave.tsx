"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { invalidate } from "@react-three/fiber";
import { gsap, MQ, ScrollTrigger } from "@/lib/gsap";
import { useBrandPalette } from "@/lib/region";
import { cn } from "@/lib/utils";
import WeaveCanvas, { type RenderTier, type WeaveColors, type WeaveInput } from "./WeaveScene";

gsap.registerPlugin(useGSAP);

/**
 * The weave, owned by Chapter 01's intro panel. Loaded only on capable
 * desktops (see Weave.tsx).
 *
 * As the panel scrolls into view the three loose strands — three practices,
 * three agencies a client would otherwise hire — are pulled into one knot.
 * The camera leans with the mouse. The render loop stops whenever the canvas
 * is off-screen or the chapter curtain has covered it.
 */
export default function ChapterWeave({
  tier,
  paused,
  onReady,
}: {
  tier: RenderTier;
  paused: boolean;
  onReady: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const input = useRef<WeaveInput>({ progress: 0, pointerX: 0, pointerY: 0 });
  const [onScreen, setOnScreen] = useState(false);
  const [ready, setReady] = useState(false);
  const p = useBrandPalette();
  const colors: WeaveColors = { strands: [p.from, p.brand, p.to], rim: p.glow };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      input.current.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      input.current.pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useGSAP(
    () => {
      const el = host.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const sync = (self: ScrollTrigger) => {
          input.current.progress = self.progress;
          if (tier === "low") invalidate();
        };
        ScrollTrigger.create({
          trigger: el,
          start: "top 92%",
          end: "center 52%",
          onUpdate: sync,
          onRefresh: sync,
        });
      });
      return () => mm.revert();
    },
    { dependencies: [tier], scope: host },
  );

  return (
    <div
      ref={host}
      className={cn(
        "absolute inset-0 transition-[opacity,scale] duration-1000 ease-out-expo",
        ready ? "scale-100 opacity-100" : "scale-[0.96] opacity-0",
      )}
    >
      <WeaveCanvas
        input={input}
        tier={tier}
        colors={colors}
        active={onScreen && !paused}
        onReady={() => {
          setReady(true);
          onReady();
        }}
      />
    </div>
  );
}
