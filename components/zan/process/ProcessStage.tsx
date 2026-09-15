"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { processSteps } from "@/constants/zan";
import { gsap, MQ, ScrollTrigger } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { StepCard } from "./StepCard";
import { MobileStage } from "./MobileStage";
import { useCapableGPU, useMediaQuery, useWebGL } from "./useMediaQuery";
import type { ProcessProgress } from "./LaptopCanvas";

const LaptopCanvas = dynamic(() => import("./LaptopCanvas"), { ssr: false, loading: () => null });

const STEPS = processSteps.length;
const EASE = [0.16, 1, 0.3, 1] as const;

/** Where each stage's box floats around the laptop. */
const POS = [
  "left-[3.5vw] top-[15%]",
  "right-[3.5vw] top-[20%]",
  "left-[3.5vw] bottom-[9%]",
  "right-[3.5vw] bottom-[13%]",
];

/* ── Desktop: the pinned laptop ─────────────────────────────────────────── */

function PinnedStage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<ProcessProgress>({ entry: 0, pin: 0 });
  const kickRef = useRef<() => void>(() => {});
  const [active, setActive] = useState(0);
  const [near, setNear] = useState(false);

  // Mount the canvas (and fetch the model) only within a viewport of the stage.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      const boxes = gsap.utils.toArray<HTMLElement>("[data-proc-box]");
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        gsap.set(boxes, { autoAlpha: 0, y: 48 });

        // The stage rising into view: the laptop turns round to face the
        // first stage, and the first box arrives with it.
        ScrollTrigger.create({
          trigger: pinRef.current,
          start: "top bottom",
          end: "top top",
          onUpdate: (self) => {
            progressRef.current.entry = self.progress;
            kickRef.current();
          },
        });
        gsap.to(boxes[0], {
          autoAlpha: 1,
          y: 0,
          ease: "power3.out",
          scrollTrigger: { trigger: pinRef.current, start: "top 55%", end: "top 5%", scrub: 1 },
        });

        // Pinned: each further stage turns the laptop, swaps its screen and
        // raises its box.
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: {
            trigger: pinRef.current,
            start: "top top",
            end: "+=260%",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            onUpdate: (self) => {
              progressRef.current.pin = self.progress;
              kickRef.current();
              const i = Math.min(STEPS - 1, Math.floor(self.progress * STEPS));
              setActive((prev) => (prev === i ? prev : i));
            },
          },
        });
        boxes.slice(1).forEach((b, k) => tl.to(b, { autoAlpha: 1, y: 0, duration: 0.5 }, k + 1));
        tl.to({}, { duration: 0.5 }, STEPS - 0.5);
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef}>
      <div ref={pinRef} className="relative h-svh w-full overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0">
          {near && <LaptopCanvas progressRef={progressRef} kickRef={kickRef} step={active} />}
        </div>

        <ol aria-label="Our process, in four stages" className="pointer-events-none absolute inset-0">
          {processSteps.map((s, i) => (
            <li key={s.id} data-proc-box className={cn("pointer-events-auto absolute w-[min(24rem,29vw)]", POS[i])}>
              <StepCard step={s} active={i === active} dim={i < active} />
            </li>
          ))}
        </ol>

        <div
          aria-hidden="true"
          className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-bg px-4 py-2.5 shadow-lift"
        >
          <span className="font-mono text-eyebrow text-brand-ink">{processSteps[active].index}</span>
          {processSteps.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1.5 rounded-full transition-[width,background-color] duration-500 ease-out-expo",
                i === active ? "w-6 bg-brand" : i < active ? "w-1.5 bg-brand/50" : "w-1.5 bg-line-strong",
              )}
            />
          ))}
          <span className="font-mono text-eyebrow text-muted">{String(STEPS).padStart(2, "0")}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Everywhere else: a timeline ────────────────────────────────────────── */

function Timeline() {
  return (
    <ol aria-label="Our process, in four stages" className="container-zan grid gap-5 lg:grid-cols-2 lg:gap-6">
      {processSteps.map((s, i) => (
        <motion.li
          key={s.id}
          data-reveal
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -8% 0px" }}
          transition={{ duration: 0.7, ease: EASE, delay: (i % 2) * 0.06 }}
          className="relative pl-12 lg:pl-0"
        >
          <span
            aria-hidden="true"
            className={cn("absolute left-4 top-0 w-px bg-line-strong lg:hidden", i < STEPS - 1 ? "-bottom-5" : "h-10")}
          />
          <span
            aria-hidden="true"
            className="absolute left-0 top-6 grid size-8 place-items-center rounded-full border border-line-strong bg-bg font-mono text-[0.6875rem] text-brand-ink lg:hidden"
          >
            {s.index}
          </span>
          <StepCard step={s} illustration />
        </motion.li>
      ))}
    </ol>
  );
}

/**
 * - Reduced motion: the four stages as a static timeline, no pin, no spin.
 * - Desktop with WebGL: the pinned laptop with the boxes around it (desktop
 *   without WebGL keeps the timeline).
 * - Below 1024px: the laptop pinned at the top, turning once per card
 *   (3D on a hardware GPU, CSS 3D otherwise).
 * The server renders the timeline, so the stages are always in the HTML.
 */
export function ProcessStage() {
  const desktop = useMediaQuery(MQ.desktop);
  const motionOK = useMediaQuery(MQ.motion);
  const webgl = useWebGL();
  const gpu = useCapableGPU();
  if (!motionOK) return <Timeline />;
  if (desktop) return webgl ? <PinnedStage /> : <Timeline />;
  return <MobileStage webgl={gpu} />;
}
