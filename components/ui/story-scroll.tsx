"use client";

import { Children, type ReactNode, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, MQ } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────────────────────
   STORY SCROLL — full-screen editorial panels dealt over each other.

   Each panel pins by its bottom edge (pinSpacing: false) while the next one
   scrolls up over it.

   THE HANDOFF, in scroll order:
   1. A panel arrives: its slab slides up until its top meets the top of the
      screen, then scrolls on until its bottom meets the bottom of the screen.
   2. It pins, and STAYS ALONE on the screen for a dwell (a top margin on the
      next panel's anchor, which only ever scrolls behind the pinned panel).
      This is the moment the panel is read: no strip of the previous panel
      above it, nothing of the next one below it.
   3. Only then does the next slab come up over it.

   Without the dwell the next slab started to rise the instant the last line
   of a panel came into view, so there was never a moment where one panel
   filled the screen: the reader always saw a band of the old panel above the
   new one, or the new one climbing over the list they were reading.

   Phones and tablets (below 1024px): a straight slide with a shadow edge on
   the incoming slab. Desktop keeps the reference's swing, from a 30° rotation
   about the bottom-left corner of the slab's first screen.

   Other notes:
   · The root is a <div> (the reference rendered a nested <main>).
   · The scene is built inside gsap.matchMedia(MQ.motion). A visitor who
     prefers reduced motion gets a plain stack of panels, and switching the
     preference at runtime reverts or rebuilds the scene.
   · The pivot is (0, 100svh), not the panel's own corner. svh, not vh: on a
     phone vh is the viewport with the browser bars hidden.
   · The anchor id sits on a wrapper that is never pinned. While a section is
     pinned it is position: fixed, so its own rect no longer says where it
     lives in the page, and an in-page link to it would land in the wrong
     place.
   · refreshPriority -1: these triggers measure after every other trigger,
     so pin spacing added above the deck is already in place whatever order
     the components mounted in. The dwell margins are set before the refresh
     at the end of the scene, so everything below the deck measures with them.
   ─────────────────────────────────────────────────────────────────────────── */

/** How long a pinned panel is held alone before the next slab rises. */
const DWELL = { phone: "40svh", desktop: "30svh" } as const;

/** The incoming slab's edge on a straight slide: a hairline and a soft shadow. */
const SLIDE_EDGE = "0 -1px 0 rgb(17 16 22 / 0.08), 0 -22px 44px -18px rgb(17 16 22 / 0.28)";

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
      mm.add(
        {
          desktop: `${MQ.motion} and ${MQ.desktop}`,
          phone: `${MQ.motion} and ${MQ.mobile}`,
        },
        (ctx) => {
          const desktop = Boolean(ctx.conditions?.desktop);
          const anchors = gsap.utils.toArray<HTMLElement>("[data-flow-anchor]", root);
          const sections = anchors.map((a) => a.querySelector<HTMLElement>("[data-flow-section]"));
          const dwell = desktop ? DWELL.desktop : DWELL.phone;

          // The dwell is scroll the reader spends on a pinned panel. It lives
          // on the next anchor so it scrolls behind the pinned panel, unseen.
          anchors.forEach((anchor, i) => {
            if (i > 0) anchor.style.marginTop = dwell;
          });

          sections.forEach((section, i) => {
            if (!section) return;
            gsap.set(section, { zIndex: i + 1 });

            const inner = section.querySelector<HTMLElement>("[data-flow-inner]");
            if (i > 0 && inner) {
              if (desktop) {
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
              } else {
                // The section's own shadow falls outside its clip, above it,
                // onto the panel it covers.
                gsap.set(section, { boxShadow: SLIDE_EDGE });
              }
            }

            const next = anchors[i + 1];
            if (next) {
              ScrollTrigger.create({
                trigger: section,
                start: "bottom bottom",
                // Held through the dwell and the next slab's whole rise: it is
                // released once that slab's top reaches the top of the screen.
                end: () => `+=${parseFloat(getComputedStyle(next).marginTop) + window.innerHeight}`,
                pin: true,
                pinSpacing: false,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                refreshPriority: -1,
              });
            }
          });

          ScrollTrigger.refresh();

          return () => {
            anchors.forEach((anchor) => {
              anchor.style.marginTop = "";
            });
          };
        },
      );

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
