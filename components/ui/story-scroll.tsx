"use client";

import { Children, type ReactNode, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, MQ } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────────────────────
   STORY SCROLL — full-screen editorial panels dealt over each other.

   Each panel pins by its bottom edge (pinSpacing: false) while the next one
   scrolls up over it, and the incoming panel's slab swings up from a 30°
   rotation about its bottom-left corner.

   Changes from the reference:
   · The root is a <div> (the reference rendered a nested <main>).
   · The scene is built inside gsap.matchMedia(MQ.motion). A visitor who
     prefers reduced motion gets a plain stack of panels, and switching the
     preference at runtime reverts or rebuilds the scene.
   · The pivot is the bottom-left of the panel's FIRST SCREEN (0, 100svh).
     svh, not vh: on a phone vh is the viewport with the browser bars hidden,
     so a panel sized in vh is taller than the screen it is pinned against for
     as long as the bars are showing — and the top of it sits off-screen.
     The reference's panels were exactly one screen tall, so this is its
     bottom-left corner. A taller panel (a content-heavy one, or any panel on
     a phone) would otherwise pivot two screens down, and its visible top
     would stay swung off to the right for most of the entry.
   · The anchor id sits on a wrapper that is never pinned. While a section is
     pinned it is position: fixed, so its own rect no longer says where it
     lives in the page, and an in-page link to it would land in the wrong
     place.
   · refreshPriority -1: these triggers measure after every other trigger,
     so pin spacing added above the deck (a pinned chapter card) is already
     in place whatever order the components mounted in. Nothing downstream
     depends on these pins, since they add no spacing.
   ─────────────────────────────────────────────────────────────────────────── */

export interface FlowSectionProps {
  /** Anchor id. Placed on a wrapper that never pins. */
  id?: string;
  /** Classes for the slab: ground colour, text colour. */
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export function FlowSection({ id, className, children, ...aria }: FlowSectionProps) {
  return (
    <div id={id} data-flow-anchor>
      <section data-flow-section {...aria} className="relative w-full overflow-clip">
        <div
          data-flow-inner
          className={cn("relative flex min-h-svh w-full origin-[0_100svh] flex-col", className)}
        >
          {children}
        </div>
      </section>
    </div>
  );
}

export interface FlowArtProps {
  id?: string;
  className?: string;
  children: ReactNode;
}

export default function FlowArt({ id, className, children }: FlowArtProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const count = Children.count(children);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const sections = gsap.utils.toArray<HTMLElement>("[data-flow-section]", root);

        sections.forEach((section, i) => {
          gsap.set(section, { zIndex: i + 1 });

          const inner = section.querySelector<HTMLElement>("[data-flow-inner]");
          if (i > 0 && inner) {
            gsap.fromTo(
              inner,
              { rotation: 30 },
              {
                rotation: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top bottom",
                  end: "top 25%",
                  scrub: true,
                  refreshPriority: -1,
                },
              },
            );
          }

          if (i < sections.length - 1) {
            ScrollTrigger.create({
              trigger: section,
              start: "bottom bottom",
              end: "bottom top",
              pin: true,
              pinSpacing: false,
              anticipatePin: 1,
              refreshPriority: -1,
            });
          }
        });

        ScrollTrigger.refresh();
      });

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [count] },
  );

  return (
    <div ref={rootRef} id={id} className={cn("relative w-full", className)}>
      {children}
    </div>
  );
}
