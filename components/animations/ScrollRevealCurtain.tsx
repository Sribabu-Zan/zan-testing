"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, MQ } from "@/lib/gsap";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

/* ═══════════════════════════════════════════════════════════════════════════
   SCROLL REVEAL CURTAIN: the reference's chapter card, light.

   Desktop with motion: the stage pins; what is beneath settles back under a
   white veil while a flat, light panel rises over it carrying the chapter
   label, and ends covering the whole stage. The next section opens on the
   same flat colour, so the hand-off is one continuous surface.

   Touch widths and reduced motion: no pin. The content beneath, then the
   same panel as a static band with the label.

   The panel is one flat token colour (bg-brand-soft by default), so the join
   to a next section painted in that token cannot show, whatever its height.
   ═══════════════════════════════════════════════════════════════════════════ */

export function ScrollRevealCurtain({
  id,
  beneath,
  label,
  distance = 1.2,
  className,
  curtainClassName = "bg-brand-soft text-ink",
  onCoverChange,
}: {
  id?: string;
  /** The content the curtain rises over. */
  beneath: ReactNode;
  /** The chapter label carried by the curtain. */
  label: ReactNode;
  /** Pin length as a share of the viewport height (1.2 = "+=120%"). */
  distance?: number;
  className?: string;
  /** Ground and text colour of the curtain. Keep it flat so the hand-off is seamless. */
  curtainClassName?: string;
  /** Told when the curtain has (and has stopped having) the stage covered. */
  onCoverChange?: (covered: boolean) => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const beneathRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const onCover = useRef(onCoverChange);

  useEffect(() => {
    onCover.current = onCoverChange;
  });

  useGSAP(
    () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      const under = beneathRef.current;
      const veil = veilRef.current;
      const curtain = curtainRef.current;
      const labelEl = labelRef.current;
      if (!section || !stage || !under || !veil || !curtain || !labelEl) return;

      const mm = gsap.matchMedia();

      mm.add(`${MQ.desktop} and ${MQ.motion}`, () => {
        let covered = false;
        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * distance)}`,
            pin: stage,
            pinSpacing: true,
            scrub: 0.4,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const next = self.progress >= 0.8;
              if (next !== covered) {
                covered = next;
                onCover.current?.(next);
              }
            },
          },
        });

        // 0 → 0.05 a beat on the panel; 0.05 → 0.8 it settles back under the
        // veil as the curtain rises; the label arrives; 0.95 → 1 a short hold.
        tl.to({}, { duration: 0.05 }, 0);
        tl.fromTo(under, { scale: 1, transformOrigin: "50% 50%" }, { scale: 0.92, duration: 0.75, ease: "sine.inOut" }, 0.05);
        tl.fromTo(veil, { opacity: 0 }, { opacity: 0.7, duration: 0.75, ease: "sine.inOut" }, 0.05);
        tl.fromTo(curtain, { yPercent: 100, y: 0 }, { yPercent: 0, duration: 0.75 }, 0.05);
        tl.fromTo(
          labelEl,
          { opacity: 0, y: 40, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" },
          0.55,
        );
        tl.to({}, { duration: 0.05 }, 0.95);

        return () => {
          if (covered) onCover.current?.(false);
        };
      });

      // Touch widths: the band is static; its label rises in once.
      mm.add(`${MQ.mobile} and ${MQ.motion}`, () => {
        gsap.from(labelEl, {
          y: 36,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: curtain, start: "top 82%", once: true },
        });
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [distance] },
  );

  return (
    <section ref={sectionRef} id={id} className={cn("relative isolate bg-bg", className)}>
      <div ref={stageRef} className="relative bg-bg lg:motion-safe:h-svh lg:motion-safe:overflow-hidden">
        <div
          ref={beneathRef}
          className="relative lg:motion-safe:absolute lg:motion-safe:inset-0 lg:motion-safe:will-change-transform"
        >
          {beneath}
        </div>

        {/* The white veil the panel settles back under. */}
        <div
          ref={veilRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[2] hidden bg-[color-mix(in_oklab,var(--color-bg)_88%,transparent)] opacity-0 lg:motion-safe:block"
        />

        <div
          ref={curtainRef}
          className={cn(
            "relative z-[4] flex h-[max(64svh,26rem)] items-center justify-center overflow-hidden",
            curtainClassName,
            "lg:motion-safe:absolute lg:motion-safe:inset-0 lg:motion-safe:h-auto lg:motion-safe:will-change-transform",
            // Below the stage until the scene is built.
            "lg:motion-safe:[transform:translateY(100%)]",
          )}
        >
          <div ref={labelRef} className="px-6 text-center will-change-transform">
            {label}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ScrollRevealCurtain;
