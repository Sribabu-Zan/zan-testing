"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { processSteps } from "@/constants/zan";
import { gsap, MQ, ScrollTrigger } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { CssLaptop } from "./CssLaptop";
import { StepCard } from "./StepCard";
import { clamp01, spinPitch, spinYaw, stageAt, STEPS, turnsAt } from "./spin";
import type { ProcessProgress } from "./LaptopCanvas";

const LaptopCanvas = dynamic(() => import("./LaptopCanvas"), { ssr: false, loading: () => null });

/** Pinned scroll length: about one screen per turn. */
const PIN_LENGTH = `+=${(STEPS - 1) * 85}%`;

/**
 * Phones and tablets (below 1024px), with motion: the laptop is pinned at the
 * top of the screen under the navbar and the stage cards pass beneath it, one
 * at a time. Each card gets one full turn of the laptop, scrubbed by scroll.
 *
 * The laptop is the three.js model on a hardware GPU (`webgl`), else a CSS 3D
 * laptop with the same screens. The CSS one also stands in while the model
 * loads. In landscape the laptop and the card sit side by side.
 *
 * The cards share one grid cell, so the card row is as tall as the longest
 * card and the laptop takes whatever height is left: no card is ever cropped
 * or hidden under the laptop.
 */
export function MobileStage({ webgl }: { webgl: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<ProcessProgress>({ entry: 0, pin: 0 });
  const kickRef = useRef<() => void>(() => {});
  const [active, setActive] = useState(0);
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  // Mount the canvas within a viewport of the stage; run it only while visible.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const nearIO = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          nearIO.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    const seenIO = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "10% 0px" });
    nearIO.observe(el);
    seenIO.observe(el);
    return () => {
      nearIO.disconnect();
      seenIO.disconnect();
    };
  }, []);

  useGSAP(
    () => {
      const pin = pinRef.current;
      if (!pin) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-proc-card]");
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const apply = () => {
          const { entry, pin: p } = progressRef.current;
          const turns = turnsAt(p);
          cards.forEach((card, i) => {
            const d = turns - i;
            const a = clamp01(1 - Math.abs(d) * 2.2);
            card.style.opacity = a.toFixed(3);
            card.style.transform = `translate3d(0, ${(-Math.max(-0.5, Math.min(0.5, d)) * 36).toFixed(1)}px, 0)`;
            card.style.visibility = a < 0.005 ? "hidden" : "visible";
          });
          pin.style.setProperty("--proc-yaw", `${spinYaw(entry, turns).toFixed(4)}rad`);
          pin.style.setProperty("--proc-pitch", `${spinPitch(entry).toFixed(4)}rad`);
          const i = stageAt(turns);
          setActive((prev) => (prev === i ? prev : i));
          kickRef.current();
        };

        // Rising into view: one turn for the first card.
        ScrollTrigger.create({
          trigger: pin,
          start: "top bottom",
          end: "top top",
          onUpdate: (self) => {
            progressRef.current.entry = self.progress;
            apply();
          },
          onRefresh: (self) => {
            progressRef.current.entry = self.progress;
            apply();
          },
        });

        // Pinned: a turn per further card. A proxy carries the smoothed
        // progress, so the cards and the laptop read the same value.
        const proxy = { p: 0 };
        gsap.to(proxy, {
          p: 1,
          ease: "none",
          onUpdate: () => {
            progressRef.current.pin = proxy.p;
            apply();
          },
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: PIN_LENGTH,
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
          },
        });

        apply();
        return () => {
          cards.forEach((card) => {
            card.style.opacity = "";
            card.style.transform = "";
            card.style.visibility = "";
          });
          pin.style.removeProperty("--proc-yaw");
          pin.style.removeProperty("--proc-pitch");
        };
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  const current = processSteps[active];

  return (
    <div ref={rootRef}>
      <div
        ref={pinRef}
        className="relative flex h-svh w-full flex-col overflow-hidden bg-surface pb-4 pt-nav landscape:grid landscape:grid-cols-2 landscape:items-center landscape:gap-6 landscape:pb-0"
      >
        {/* The laptop: whatever height the card row leaves. */}
        <div aria-hidden="true" className="relative min-h-0 flex-1 landscape:h-full">
          <div className="absolute inset-0">
            <CssLaptop step={active} hidden={webgl && ready} />
          </div>
          {webgl && near && (
            <div className={cn("absolute inset-0 transition-opacity duration-500", ready ? "opacity-100" : "opacity-0")}>
              <LaptopCanvas
                variant="spin"
                progressRef={progressRef}
                kickRef={kickRef}
                running={onScreen}
                onReady={onReady}
              />
            </div>
          )}
        </div>

        <div className="container-zan shrink-0 landscape:pl-0">
          <div aria-hidden="true" className="mb-3 flex items-center justify-center gap-3 sm:mb-4">
            <span className="font-mono text-eyebrow text-brand-ink">{current.index}</span>
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

          <ol aria-label="Our process, in four stages" className="mx-auto grid max-w-xl">
            {processSteps.map((s, i) => (
              <li
                key={s.id}
                data-proc-card
                aria-current={i === active ? "step" : undefined}
                className="col-start-1 row-start-1 min-w-0 will-change-transform"
              >
                <StepCard step={s} active={i === active} compact className="h-full" />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
