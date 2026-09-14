"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { usePreloaded } from "@/components/zan/shell/shellStore";
import { gsap, MQ } from "@/lib/gsap";

gsap.registerPlugin(useGSAP);

/** Crossing speed in px/s, so the pass feels the same on a phone and a monitor. */
const SPEED = 120;

/**
 * The UAE site only: an airliner towing the UAE flag banner across the top
 * of the hero, as on the old site (UAESoonFloating), ported to GSAP.
 *
 * It flies in the band between the navbar and the headline, behind the text
 * and the astronaut, starting only once the preloader has lifted, and pauses
 * while the hero is off screen. Each pass starts fully off the left edge and
 * ends fully off the right one. With reduced motion it is parked, smaller,
 * at the top left (opening.css).
 */
export function UaeFlyer() {
  const root = useRef<HTMLDivElement>(null);
  const preloaded = usePreloaded();

  useGSAP(
    () => {
      const host = root.current;
      if (!host || !preloaded) return;
      const row = host.querySelector<HTMLElement>("[data-flyer-row]");
      const flag = host.querySelector<HTMLElement>("[data-flyer-flag]");
      if (!row || !flag) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const distance = host.offsetWidth + row.offsetWidth + 48;
        const flight = gsap.fromTo(
          row,
          { x: () => -row.offsetWidth - 24, y: 14 },
          {
            x: () => host.offsetWidth + 24,
            y: -8,
            duration: Math.min(18, Math.max(9, distance / SPEED)),
            ease: "none",
            repeat: -1,
            repeatDelay: 2.5,
          },
        );
        // The banner's trailing edge flutters; it pivots where the rope ties on.
        const flutter = gsap.to(flag, {
          rotation: 2.5,
          skewY: 1.2,
          transformOrigin: "100% 50%",
          duration: 0.42,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });

        const io = new IntersectionObserver(([entry]) => {
          for (const tween of [flight, flutter]) {
            if (entry.isIntersecting) tween.resume();
            else tween.pause();
          }
        });
        io.observe(host);
        return () => io.disconnect();
      });
    },
    { dependencies: [preloaded], scope: root },
  );

  return (
    <div ref={root} className="relative h-12 w-full sm:h-20 lg:h-24">
      <div data-flyer-row className="zan-hero-flyer-row absolute top-0 left-0 flex items-center">
        <div data-flyer-flag className="relative z-10 w-28 shrink-0 sm:w-44 lg:w-60">
          <Image
            src="/images/uae/uae_flag_flyer.png"
            alt=""
            width={685}
            height={175}
            sizes="(min-width: 1024px) 15rem, (min-width: 640px) 11rem, 7rem"
            className="h-auto w-full select-none"
            draggable={false}
          />
        </div>
        <svg
          viewBox="0 0 200 40"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="relative -mr-2 -ml-3 h-4 w-14 shrink-0 sm:h-6 sm:w-24 lg:h-7 lg:w-32"
        >
          <path
            d="M0 20 C50 0 110 40 200 40"
            fill="none"
            strokeLinecap="round"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
            className="stroke-ink-2/70"
          />
          <path
            d="M0 19 C50 -1 110 39 200 39"
            fill="none"
            strokeLinecap="round"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            stroke="rgb(255 255 255 / 0.7)"
          />
        </svg>
        <div className="relative z-10 w-36 shrink-0 sm:w-56 lg:w-72">
          <Image
            src="/images/uae/airliner_emirates.png"
            alt=""
            width={3500}
            height={1104}
            sizes="(min-width: 1024px) 18rem, (min-width: 640px) 14rem, 9rem"
            className="h-auto w-full select-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
