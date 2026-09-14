"use client";

import { useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, MQ, ScrollTrigger } from "@/lib/gsap";
import { MarqueeToggle } from "@/components/zan/work/MarqueeToggle";
import { cn } from "@/lib/utils";
import "./logo-loop.css";

/* ───────────────────────────────────────────────────────────────────────────
   LOGO LOOP — a seamless horizontal marquee.

   The first group is the real list; the copies after it are aria-hidden
   echoes (pass them pre-rendered, with empty alts). Every group moves by its
   own width (xPercent -100), so the loop is seamless at any viewport width
   without measuring anything but the duration.

   · Desktop: scroll velocity boosts the speed (ScrollTrigger.getVelocity →
     timeScale, clamped 1–3) and it eases back to cruising.
   · A mouse hovering it, or the pause toggle under it, brings it smoothly to
     a stop (the toggle is the keyboard route, WCAG 2.2.2).
   · Off-screen it is paused.
   · Reduced motion: nothing moves; the first group sits as a centred,
     wrapping row, the echoes and the toggle are hidden (logo-loop.css).
   ─────────────────────────────────────────────────────────────────────────── */

export function LogoLoop({
  items,
  echo,
  copies = 5,
  speed = 42,
  velocityBoost = true,
  pauseOnHover = true,
  ariaLabel,
  pauseLabel,
  className,
  viewportClassName,
  itemClassName,
}: {
  /** The real items (the first group). */
  items: readonly ReactNode[];
  /** The same items for the aria-hidden copies — images with alt="". */
  echo: readonly ReactNode[];
  /** Total groups, the first included. Enough to fill a wide screen twice. */
  copies?: number;
  /** Cruising speed in px/s. */
  speed?: number;
  velocityBoost?: boolean;
  pauseOnHover?: boolean;
  ariaLabel: string;
  /** The toggle's fixed name; pressed means paused. */
  pauseLabel?: string;
  className?: string;
  /** Classes for the masked strip itself (padding for hover lift, etc.). */
  viewportClassName?: string;
  itemClassName?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  // Read by the ticker, which lives outside React; written only in the handler.
  const pausedRef = useRef(false);

  const toggle = () => {
    const next = !paused;
    pausedRef.current = next;
    setPaused(next);
  };

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add(
        { desktop: `${MQ.motion} and ${MQ.desktop}`, mobile: `${MQ.motion} and ${MQ.mobile}` },
        (ctx) => {
          const { desktop } = ctx.conditions as { desktop: boolean };
          const groups = gsap.utils.toArray<HTMLElement>("[data-loop-group]", el);
          const width = groups[0]?.offsetWidth ?? 0;
          if (!width) return;

          const loop = gsap.to(groups, { xPercent: -100, duration: width / speed, ease: "none", repeat: -1 });

          let boost = 1;
          let hover = 1;
          let hoverTarget = 1;

          const tick = () => {
            const k = 1 - Math.pow(0.955, gsap.ticker.deltaRatio());
            boost += (1 - boost) * k;
            const target = pausedRef.current ? 0 : hoverTarget;
            hover += (target - hover) * Math.min(1, k * 3);
            loop.timeScale(boost * hover);
          };

          const st = ScrollTrigger.create({
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              if (!desktop || !velocityBoost) return;
              const v = gsap.utils.clamp(1, 3, 1 + Math.abs(self.getVelocity()) / 900);
              if (v > boost) boost = v;
            },
            onToggle: (self) => {
              if (self.isActive) {
                loop.resume();
                gsap.ticker.add(tick);
              } else {
                loop.pause();
                gsap.ticker.remove(tick);
              }
            },
          });
          if (st.isActive) gsap.ticker.add(tick);
          else loop.pause();

          const onEnter = (e: PointerEvent) => {
            if (pauseOnHover && e.pointerType === "mouse") hoverTarget = 0;
          };
          const onLeave = () => {
            hoverTarget = 1;
          };
          el.addEventListener("pointerenter", onEnter);
          el.addEventListener("pointerleave", onLeave);

          return () => {
            gsap.ticker.remove(tick);
            el.removeEventListener("pointerenter", onEnter);
            el.removeEventListener("pointerleave", onLeave);
          };
        },
      );

      return () => mm.revert();
    },
    { scope: root, dependencies: [speed, velocityBoost, pauseOnHover, copies] },
  );

  return (
    <div className={cn("relative", className)}>
      <div ref={root} className={cn("zan-partners-loop relative overflow-hidden", viewportClassName)}>
        <div className="zan-partners-track flex w-max">
          {Array.from({ length: copies }, (_, g) => (
            <ul
              key={g}
              data-loop-group
              aria-label={g === 0 ? ariaLabel : undefined}
              aria-hidden={g > 0 || undefined}
              className={cn("zan-partners-group flex shrink-0 items-start", g > 0 && "zan-partners-dup")}
            >
              {(g === 0 ? items : echo).map((node, i) => (
                <li key={i} className={cn("shrink-0", itemClassName)}>
                  {node}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="container-zan mt-3 flex justify-end">
        <MarqueeToggle paused={paused} onToggle={toggle} label={pauseLabel ?? `Pause the ${ariaLabel.toLowerCase()}`} />
      </div>
    </div>
  );
}

export default LogoLoop;
