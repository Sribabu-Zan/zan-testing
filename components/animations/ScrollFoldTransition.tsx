"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, MQ } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────────────────────
   SCROLL FOLD — a pinned page fold between two chapters.

   A seam ignites across the middle, hairlines sweep, the top half of the page
   hinges back into the void, the label rises through it, then the bottom
   half swings up and the seam closes.

   Paper version: every colour is a token (the grounds are Tailwind classes,
   the glows color-mix of the brand), so it follows the region. Built in
   gsap.matchMedia(): with reduced motion nothing is pinned or hidden and the
   stage is a static label band.
   ─────────────────────────────────────────────────────────────────────────── */

/** Seeded, so server and client agree on every position. */
const DUST = Array.from({ length: 30 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  size: 2 + ((i * 7) % 4),
}));

const LINES = 8;

const seam =
  "linear-gradient(90deg, transparent 0%, var(--color-brand) 50%, transparent 100%)";
/** A tight light on the fold line itself: no haze around it. */
const seamGlow = "0 0 10px color-mix(in oklab, var(--color-brand) 40%, transparent)";
const hairline =
  "linear-gradient(90deg, transparent, color-mix(in oklab, var(--color-brand-ink) 30%, transparent), transparent)";

export function ScrollFoldTransition({
  label,
  className,
  desktopDistance = "+=130%",
  mobileDistance = "+=70%",
}: {
  label: ReactNode;
  className?: string;
  /** Scroll distance the pinned fold occupies at ≥1024px. */
  desktopDistance?: string;
  /** Shorter on touch-sized screens. */
  mobileDistance?: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seamRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const dustRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MQ.motion, desktop: MQ.desktop }, (ctx) => {
        const { motion, desktop } = ctx.conditions as { motion: boolean; desktop: boolean };
        if (!motion) return;

        const lineEls = linesRef.current ? Array.from(linesRef.current.children) : [];
        const dustEls = dustRef.current ? Array.from(dustRef.current.children) : [];

        gsap.set(stageRef.current, { perspective: 2000 });
        gsap.set(topRef.current, { transformOrigin: "50% 100%", rotateX: 0, z: 0 });
        gsap.set(bottomRef.current, { transformOrigin: "50% 0%", rotateX: 90, autoAlpha: 0 });
        // Opening state: the label and a thin seam are already there. On a
        // light ground two blank paper halves read as an empty screen, so the
        // fold is a chapter card from its first pinned frame.
        gsap.set(seamRef.current, { scaleX: 0.3, autoAlpha: 0.55, transformOrigin: "50% 50%" });
        gsap.set(labelRef.current, { autoAlpha: 0.85, y: 16, scale: 0.97 });
        gsap.set(lineEls, { scaleX: 0, autoAlpha: 0, transformOrigin: "0% 50%" });
        gsap.set(dustEls, { autoAlpha: 0, y: 40 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: desktop ? desktopDistance : mobileDistance,
            scrub: 0.4,
            pin: stageRef.current,
            anticipatePin: 1,
          },
        });

        // 1. The label settles and the seam brightens along the horizon.
        tl.to(labelRef.current, { autoAlpha: 1, y: 0, scale: 1, duration: 0.2 }, 0);
        tl.to(seamRef.current, { scaleX: 1, autoAlpha: 1, duration: 0.3 }, 0);
        // 2. Hairlines sweep across.
        tl.to(lineEls, { scaleX: 1, autoAlpha: 1, stagger: 0.04, duration: 0.4 }, 0.05);
        // 3. The top page hinges back and away.
        tl.to(topRef.current, { rotateX: -110, z: -300, duration: 0.7 }, 0.2);
        // 4. Dust drifts up through the void.
        tl.to(
          dustEls,
          { autoAlpha: 1, y: -60, stagger: { each: 0.02, from: "random" }, duration: 0.6 },
          0.3,
        );
        // 5–6. The label holds through the fold …
        tl.to({}, { duration: 0.1 }, 0.85);
        // 7. … and lifts out as the next page swings up.
        tl.to(labelRef.current, { y: -120, scale: 1.12, autoAlpha: 0, duration: 0.25 }, 0.95);
        tl.to(bottomRef.current, { rotateX: 0, autoAlpha: 1, duration: 0.45 }, 0.95);
        // 8. Lines and seam snap closed.
        tl.to(lineEls, { scaleX: 0, autoAlpha: 0, stagger: 0.02, duration: 0.2 }, 1.05);
        tl.to(seamRef.current, { scaleX: 0, autoAlpha: 0, duration: 0.2 }, 1.1);
      });
      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [desktopDistance, mobileDistance] },
  );

  return (
    <section ref={sectionRef} className={cn("relative w-full", className)}>
      <div
        ref={stageRef}
        className={cn(
          "relative h-svh w-full overflow-hidden bg-surface-2",
          // Reduced motion: no pin, no fold — a static band around the label.
          "motion-reduce:h-auto motion-reduce:min-h-[56vh] motion-reduce:bg-surface",
        )}
      >
        {/* Outgoing top half */}
        <div
          ref={topRef}
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1/2 bg-bg will-change-transform motion-reduce:hidden"
          style={{
            backgroundImage:
              "linear-gradient(180deg, var(--color-bg) 0%, color-mix(in oklab, var(--color-bg) 93%, var(--color-ink)) 100%)",
            boxShadow: "0 20px 60px rgb(17 16 22 / 0.10)",
          }}
        />

        {/* Incoming bottom half */}
        <div
          ref={bottomRef}
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/2 bg-surface will-change-transform motion-reduce:hidden"
          style={{
            backgroundImage:
              "linear-gradient(0deg, var(--color-surface) 0%, color-mix(in oklab, var(--color-surface) 94%, var(--color-ink)) 100%)",
            boxShadow: "0 -20px 60px rgb(17 16 22 / 0.08)",
          }}
        />

        {/* Seam glow */}
        <div
          ref={seamRef}
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 will-change-transform motion-reduce:hidden"
          style={{ backgroundImage: seam, boxShadow: seamGlow }}
        />

        {/* Kinetic hairlines */}
        <div
          ref={linesRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col justify-around py-[10vh] motion-reduce:hidden"
        >
          {Array.from({ length: LINES }, (_, i) => (
            <div key={i} className="h-px w-full will-change-transform" style={{ backgroundImage: hairline }} />
          ))}
        </div>

        {/* Dust */}
        <div ref={dustRef} aria-hidden="true" className="pointer-events-none absolute inset-0 motion-reduce:hidden">
          {DUST.map((d, i) => (
            <div
              key={i}
              className="absolute rounded-full will-change-transform"
              style={{
                left: `${d.left}%`,
                top: `${d.top}%`,
                width: d.size,
                height: d.size,
                background: "color-mix(in oklab, var(--color-brand) 40%, transparent)",
              }}
            />
          ))}
        </div>

        {/* Label */}
        <div
          ref={labelRef}
          className={cn(
            "absolute left-1/2 top-1/2 w-full max-w-[100vw] -translate-x-1/2 -translate-y-1/2 px-5 text-center will-change-transform",
            "motion-reduce:relative motion-reduce:left-auto motion-reduce:top-auto motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:py-section",
          )}
        >
          {label}
        </div>
      </div>
    </section>
  );
}

export default ScrollFoldTransition;
