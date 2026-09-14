"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useMotionValue } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { gsap, MQ, ScrollTrigger } from "@/lib/gsap";
import { ContainerScrollContext } from "@/components/ui/container-scroll-animation";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

/* ═══════════════════════════════════════════════════════════════════════════
   FRAME TO FULLSCREEN: the reference's opening shot, in the light theme.

   Desktop (≥1024px) with motion allowed: as the section arrives, the title's
   float word rises in letter by letter (ScrollFloat). Then the stage pins; a
   tilted device frame straightens and grows, the title block lifts away, and
   the frame flattens to fill the screen (full bleed: the navbar hides on the
   way down, and the board keeps its own content below the navbar's 72px).
   It holds there for a beat, then the page moves on.

   Everything else (touch widths, reduced motion, no JS): no pin. The title
   block, then the frame as a card below it. With motion on a narrow screen,
   the float word still rises in and the card tilts flat as it scrolls in.

   Both layouts are plain CSS (lg:motion-safe:… classes), so the server HTML
   is already the right one; gsap.matchMedia builds each scene only for the
   same conditions and reverts it cleanly when they stop holding. The section
   is exactly as tall as its content plus the pin (pin spacing), and
   collapses to auto height when nothing is pinned.

   The frame's start pose is measured from the live layout (the tilted frame
   starts just under the title block) and recomputed on every refresh:
   resize, fonts. The scene rebuilds itself to the viewport.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Pin length as a share of the viewport height ("+=210%"). */
const PIN = 2.1;
const TILT = 26;
const PERSPECTIVE = 1600;
/** How far below the viewport the frame's bottom edge starts, px. */
const SINK = 28;
/** Space between the title block and the tilted frame's top edge, px. */
const GAP = 40;
/** The frame has flattened by here; the rest of the pin is a hold. */
const FLAT_AT = 0.84;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/* The frame's edge and shadow fade out as it becomes the screen (--edge 1→0).
   Neutral, ink-tinted layers; never black, never a coloured glow. */
const FRAME_STYLE = {
  "--edge": 1,
  borderColor: "color-mix(in oklab, var(--color-line-strong) calc(var(--edge) * 100%), transparent)",
  boxShadow: [
    "0 1px 2px color-mix(in oklab, var(--color-ink) calc(var(--edge) * 5%), transparent)",
    "0 22px 44px -18px color-mix(in oklab, var(--color-ink) calc(var(--edge) * 16%), transparent)",
    "0 60px 110px -44px color-mix(in oklab, var(--color-ink) calc(var(--edge) * 20%), transparent)",
  ].join(", "),
} as CSSProperties;

/** ScrollFloat's look: each letter starts below its mask, stretched tall and pinched. */
function floatIn(glyphs: HTMLElement[], trigger: HTMLElement, start: string, end: string) {
  if (!glyphs.length) return;
  gsap.fromTo(
    glyphs,
    { yPercent: 120, scaleY: 2.3, scaleX: 0.7, opacity: 0, transformOrigin: "50% 0%" },
    {
      yPercent: 0,
      scaleY: 1,
      scaleX: 1,
      opacity: 1,
      ease: "power3.out",
      stagger: 0.06,
      scrollTrigger: { trigger, start, end, scrub: 0.8 },
    },
  );
}

export function FrameToFullscreen({
  id,
  title,
  backdrop,
  children,
  className,
}: {
  id?: string;
  /** The title block: stays in flow on touch, floats over the stage on desktop. */
  title: ReactNode;
  /** Optional layers behind everything (aria-hidden by the caller). */
  backdrop?: ReactNode;
  /** The frame's content. */
  children: ReactNode;
  className?: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(-1);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      const titleEl = titleRef.current;
      const frame = frameRef.current;
      if (!section || !stage || !titleEl || !frame) return;

      // ScrollFloat: outer letters take the scroll exit, inner glyphs the rise.
      const chars = Array.from(titleEl.querySelectorAll<HTMLElement>("[data-float-char]"));
      const glyphs = Array.from(titleEl.querySelectorAll<HTMLElement>("[data-float-glyph]"));

      const mm = gsap.matchMedia();

      mm.add(`${MQ.desktop} and ${MQ.motion}`, () => {
        // Layout sizes (offset*), which transforms do not affect.
        const pose = () => {
          const W = frame.offsetWidth;
          const H = frame.offsetHeight;
          const stageH = stage.offsetHeight;
          const titleBottom = titleEl.offsetTop + titleEl.offsetHeight;
          // Visual height the tilted frame may take: under the title, down
          // past the fold by SINK. Undo the tilt's foreshortening to get the
          // scale that produces it.
          const V = Math.max(140, stageH + SINK - titleBottom - GAP);
          const t = (TILT * Math.PI) / 180;
          const h = (V * PERSPECTIVE) / (PERSPECTIVE * Math.cos(t) - V * Math.sin(t));
          const sy = gsap.utils.clamp(0.24, 0.74, h / H);
          const sx = gsap.utils.clamp(0.42, 0.82, Math.min(Math.min(W * 0.82, 1320) / W, sy / 0.66));
          return { sx, sy };
        };

        // The float word has risen before the stage pins.
        floatIn(glyphs, titleEl, "top 92%", "top 40%");

        progress.set(0);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * PIN)}`,
            pin: stage,
            pinSpacing: true,
            scrub: 1.2,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => progress.set(self.progress),
            onRefresh: (self) => progress.set(self.progress),
          },
        });

        // 0 → 0.42  the frame lifts, straightens part-way and grows
        tl.fromTo(
          frame,
          {
            transformPerspective: PERSPECTIVE,
            transformOrigin: "50% 100%",
            x: 0,
            xPercent: 0,
            yPercent: 0,
            z: 0,
            rotation: 0,
            rotateY: 0,
            skewX: 0,
            skewY: 0,
            rotateX: TILT,
            scaleX: () => pose().sx,
            scaleY: () => pose().sy,
            y: SINK,
            borderRadius: 28,
          },
          {
            rotateX: 11,
            scaleX: () => mix(pose().sx, 1, 0.2),
            scaleY: () => mix(pose().sy, 1, 0.3),
            // Float up into the space the title leaves, rather than sit low.
            y: () => -Math.round(stage.offsetHeight * 0.1),
            duration: 0.42,
            ease: "power1.inOut",
          },
          0,
        );

        // 0 → 0.22  the title lifts away first, so the rising frame never runs
        // under live text; the float word stretches up out of its mask
        if (chars.length) {
          tl.to(
            chars,
            {
              yPercent: -70,
              scaleY: 1.9,
              scaleX: 0.78,
              opacity: 0,
              transformOrigin: "50% 100%",
              stagger: 0.012,
              duration: 0.12,
              ease: "power2.in",
            },
            0,
          );
        }
        tl.to(titleEl, { yPercent: -12, autoAlpha: 0, duration: 0.2, ease: "sine.inOut" }, 0.02);

        // 0.50 → 0.84  the frame flattens into the screen; its edge dissolves
        tl.to(
          frame,
          { rotateX: 0, scaleX: 1, scaleY: 1, y: 0, borderRadius: 0, duration: FLAT_AT - 0.5, ease: "power3.inOut" },
          0.5,
        );
        tl.to(frame, { "--edge": 0, duration: 0.1, ease: "none" }, FLAT_AT - 0.1);

        // 0.84 → 1  hold on the full-screen board
        tl.to({}, { duration: 1 - FLAT_AT }, FLAT_AT);

        // The title's height changes when the display face swaps in.
        let alive = true;
        document.fonts?.ready.then(() => {
          if (alive) ScrollTrigger.refresh();
        });

        return () => {
          alive = false;
          progress.set(-1);
        };
      });

      // Touch widths: the float word rises in; the card tilts flat as it arrives.
      mm.add(`${MQ.mobile} and ${MQ.motion}`, () => {
        floatIn(glyphs, titleEl, "top 90%", "top 45%");
        gsap.fromTo(
          frame,
          { transformPerspective: 1200, transformOrigin: "50% 100%", rotateX: 16, scale: 0.94, y: 20 },
          {
            rotateX: 0,
            scale: 1,
            y: 0,
            ease: "none",
            scrollTrigger: { trigger: frame, start: "top bottom", end: "top 38%", scrub: 0.6 },
          },
        );
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <ContainerScrollContext.Provider value={progress}>
      <section ref={sectionRef} id={id} className={cn("relative isolate bg-bg", className)}>
        <div
          ref={stageRef}
          className={cn(
            "relative pt-24 pb-16 sm:pt-28 sm:pb-20",
            "lg:motion-reduce:pt-section lg:motion-reduce:pb-section",
            "lg:motion-safe:h-svh lg:motion-safe:overflow-hidden lg:motion-safe:p-0",
          )}
        >
          {backdrop}

          <div
            ref={titleRef}
            className="relative z-10 lg:motion-safe:absolute lg:motion-safe:inset-x-0 lg:motion-safe:top-[calc(var(--spacing-nav,4.5rem)+4.5vh)]"
          >
            {title}
          </div>

          <div className="relative z-0 mt-12 px-5 sm:mt-14 sm:px-8 lg:motion-reduce:mt-16 lg:motion-safe:absolute lg:motion-safe:inset-x-0 lg:motion-safe:bottom-0 lg:motion-safe:mt-0 lg:motion-safe:px-0">
            <div
              ref={frameRef}
              data-frame
              style={FRAME_STYLE}
              className={cn(
                "relative mx-auto w-full max-w-[1120px] overflow-hidden rounded-[20px] border bg-bg lg:rounded-[28px]",
                "lg:motion-safe:h-svh lg:motion-safe:max-w-none lg:motion-safe:origin-bottom",
                // The start pose before the scene is built, so the first paint
                // already shows the tilted frame under the title.
                "lg:motion-safe:[transform:perspective(1600px)_translateY(28px)_rotateX(26deg)_scale(0.82,0.61)]",
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </section>
    </ContainerScrollContext.Provider>
  );
}

export default FrameToFullscreen;
