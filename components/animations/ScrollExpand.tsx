"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, MQ } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import "@/components/zan/work/work.css";

/* ───────────────────────────────────────────────────────────────────────────
   SCROLL EXPAND — the reference's panel that grows to fill the screen, in the
   light theme.

   The reference pinned a stage and animated the frame's width and height,
   which reflows the content every frame and traps anything taller than the
   viewport in a nested scroller. Here the panel is always laid out full
   width and a clip-path opens it from an inset, rounded card (hairline and
   float shadow riding alongside) to full bleed as it rises through the
   viewport. Nothing reflows, and content of any height — an opened case
   study included — scrolls with the page.

   Reduced motion: no scrub; the panel stays the inset card.
   ─────────────────────────────────────────────────────────────────────────── */

export function ScrollExpand({
  children,
  className,
  panelClassName,
}: {
  children: ReactNode;
  className?: string;
  panelClassName?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add(
        { desktop: `${MQ.motion} and ${MQ.desktop}`, mobile: `${MQ.motion} and ${MQ.mobile}` },
        (ctx) => {
          const { desktop } = ctx.conditions as { desktop: boolean };
          // Mirrors work.css: clamp(1.5rem, 6vw, 7rem) on desktop, 0.75rem below.
          const inset = () => (desktop ? `${Math.min(112, Math.max(24, window.innerWidth * 0.06))}px` : "12px");

          gsap.fromTo(
            el,
            { "--expand-inset": inset, "--expand-radius": desktop ? "32px" : "28px" },
            {
              "--expand-inset": "0px",
              "--expand-radius": "0px",
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                end: "top 14%",
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            },
          );
        },
      );

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={cn("zan-expand relative", className)}>
      <div aria-hidden="true" className="zan-expand-shadow" />
      <div className={cn("zan-expand-panel relative bg-bg", panelClassName)}>{children}</div>
      <div aria-hidden="true" className="zan-expand-outline" />
    </div>
  );
}

export default ScrollExpand;
