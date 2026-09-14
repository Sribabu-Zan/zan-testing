"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { usePreloaded } from "@/components/zan/shell/shellStore";
import { gsap, MQ } from "@/lib/gsap";
import { lerp, seeded } from "./sky";

gsap.registerPlugin(useGSAP);

/** Fixed seed: every visitor sees the same unhurried wander. */
const SEED = 20230901;

type Band = "top" | "bottom";

/**
 * Phones and tablets, where the 3D mark is absent: the old site's UFO,
 * wandering the hero slowly and changing depth as it goes.
 *
 * It keeps to the band above the headline and the band below the buttons,
 * never hovering behind the copy. To change band it slips off the side of
 * the screen and comes back in lower or higher. The bottom band stops short
 * of the right edge, where the floating contact buttons sit.
 *
 * Deterministic: each leg is drawn from a seeded sequence, inside GSAP
 * callbacks, never during render. Reduced motion or desktop: it stays parked
 * (bottom left), and on desktop it is hidden.
 */
export function RoamingUfo() {
  const root = useRef<HTMLDivElement>(null);
  const preloaded = usePreloaded();

  useGSAP(
    () => {
      const box = root.current;
      const ufo = box?.querySelector<HTMLElement>("[data-ufo]");
      if (!box || !ufo || !preloaded) return;

      const mm = gsap.matchMedia();
      mm.add(`${MQ.motion} and ${MQ.mobile}`, () => {
        const rnd = seeded(SEED);
        let band: Band = "bottom";
        let leg: gsap.core.Animation | null = null;
        let paused = false;
        let live = true;

        /** Where the UFO may be, in its own translate space. */
        const measure = () => {
          const b = box.getBoundingClientRect();
          const copy = box.closest("section")?.querySelector("[data-hero-copy]")?.getBoundingClientRect();
          const w = ufo.offsetWidth;
          const h = ufo.offsetHeight;
          const nav = 72;
          const copyTop = copy ? copy.top - b.top : b.height * 0.3;
          const copyBottom = copy ? copy.bottom - b.top : b.height * 0.75;
          return {
            width: b.width,
            w,
            // Translate values are relative to the element's parked layout box.
            ox: ufo.offsetLeft,
            oy: ufo.offsetTop,
            top: { y0: nav + 10, y1: copyTop - h - 14, x1: b.width * 0.7 },
            bottom: { y0: copyBottom + 18, y1: b.height - h - 20, x1: b.width * 0.52 - w * 0.5 },
          };
        };

        const next = () => {
          if (!live) return;
          const g = measure();
          const open = (["top", "bottom"] as const).filter((k) => g[k].y1 - g[k].y0 > 6);
          if (!open.length) return; // no clear band on this screen: stay put

          const to = open[Math.floor(rnd() * open.length)];
          const zone = g[to];
          const depth = rnd();
          const scale = lerp(0.62, 1.1, depth);
          const target = {
            x: lerp(-g.w * 0.2, zone.x1, rnd()) - g.ox,
            y: lerp(zone.y0, zone.y1, rnd()) - g.oy,
            scale,
            rotation: lerp(-9, 9, rnd()),
            // Further away reads fainter.
            opacity: lerp(0.6, 1, depth),
          };
          const duration = lerp(9, 15, rnd());

          if (to === band) {
            leg = gsap.to(ufo, { ...target, duration, ease: "sine.inOut", onComplete: next });
          } else {
            const left = rnd() < 0.5;
            const offX = (left ? -g.w * 1.4 : g.width + g.w * 0.4) - g.ox;
            leg = gsap
              .timeline({ onComplete: next })
              .to(ufo, { x: offX, y: `-=${lerp(10, 40, rnd())}`, duration: duration * 0.55, ease: "sine.in" })
              .set(ufo, { y: target.y + lerp(-24, 24, rnd()) })
              .to(ufo, { ...target, duration: duration * 0.7, ease: "sine.out" });
          }
          if (paused) leg.pause();
          band = to;
        };

        next();

        const io = new IntersectionObserver(([entry]) => {
          paused = !entry.isIntersecting;
          if (paused) leg?.pause();
          else leg?.resume();
        });
        io.observe(box);

        return () => {
          live = false;
          io.disconnect();
          leg?.kill();
          gsap.set(ufo, { clearProps: "transform,opacity" });
        };
      });
    },
    { dependencies: [preloaded], scope: root },
  );

  return (
    <div ref={root} className="absolute inset-0">
      <div data-ufo className="zan-hero-ufo absolute bottom-[6svh] left-0 w-20 sm:w-28 md:w-32">
        <div data-reveal data-in="fade" className="zan-hero-in" style={{ ["--zan-d" as string]: 5 }}>
          <div className="zan-hero-bob">
            <Image
              src="/images/hero/ufo.png"
              alt=""
              width={612}
              height={408}
              sizes="(min-width: 768px) 8rem, (min-width: 640px) 7rem, 5rem"
              className="h-auto w-full select-none"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
