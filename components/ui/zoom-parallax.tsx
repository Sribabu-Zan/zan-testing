"use client";

import Image from "next/image";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, MQ } from "@/lib/gsap";
import "./zoom-parallax.css";

/** A frame's centre offset from the stage centre and its size (vw / svh), and
 *  how far its layer scales by the end of the zoom. */
export interface ZoomBox {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
}

export interface ZoomImage {
  src: string;
  /** Phones and tablets, then ≥1024px. */
  sm: ZoomBox;
  lg: ZoomBox;
  /** Column in the static (reduced-motion) collage: a = left, b = right. */
  side: "a" | "b";
}

interface ZoomParallaxProps {
  /** The centre frame's geometry. Keep w === h so it shares the screen's
   *  aspect, and scale === 100 / w so it ends exactly full screen. */
  portal: { sm: ZoomBox; lg: ZoomBox };
  /** Rendered at full-screen size inside the centre frame. */
  portalContent: ReactNode;
  /** Decorative frames around it (alt=""). */
  images: readonly ZoomImage[];
  className?: string;
}

/** Share of the scroll spent zooming; the rest holds the full-screen portal. */
const ZOOM = 0.84;

const boxVars = (sm: ZoomBox, lg: ZoomBox) =>
  ({
    "--sx": `${sm.x}vw`,
    "--sy": `${sm.y}svh`,
    "--sw": `${sm.w}vw`,
    "--sh": `${sm.h}svh`,
    "--lx": `${lg.x}vw`,
    "--ly": `${lg.y}svh`,
    "--lw": `${lg.w}vw`,
    "--lh": `${lg.h}svh`,
  }) as CSSProperties;

/**
 * The reference's zoom parallax: a sticky stage whose seven-frame collage
 * zooms as the page scrolls until the centre frame fills the screen. Scrubbed
 * by GSAP inside matchMedia(motion) — with reduced motion the collage is a
 * static grid (see zoom-parallax.css).
 */
export function ZoomParallax({ portal, portalContent, images, className }: ZoomParallaxProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MQ.motion, desktop: MQ.desktop }, (ctx) => {
        const { motion, desktop } = ctx.conditions as { motion: boolean; desktop: boolean };
        if (!motion || !root.current) return;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        gsap.utils.toArray<HTMLElement>(".zan-zoom-layer", root.current).forEach((layer) => {
          const to = Number(desktop ? layer.dataset.scaleLg : layer.dataset.scaleSm) || 1;
          tl.fromTo(layer, { scale: 1 }, { scale: to, duration: ZOOM }, 0);
        });

        // The portal's corners and hairline melt away as it becomes the screen.
        tl.fromTo(".zan-zoom-portal", { borderRadius: "1rem" }, { borderRadius: 0, duration: ZOOM }, 0);
        tl.to(".zan-zoom-ring", { opacity: 0, duration: 0.14 }, ZOOM - 0.14);
        tl.to({}, { duration: 1 - ZOOM });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={`zan-zoom ${className ?? ""}`.trim()}>
      <div className="zan-zoom-stage">
        {images.map((img) => (
          <div
            key={img.src}
            aria-hidden="true"
            className="zan-zoom-layer"
            data-scale-sm={img.sm.scale}
            data-scale-lg={img.lg.scale}
          >
            <div className="zan-zoom-frame" data-side={img.side} style={boxVars(img.sm, img.lg)}>
              <Image
                src={img.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 36vw, 56vw"
                className="object-cover"
                draggable={false}
              />
            </div>
          </div>
        ))}

        {/* Last, so it paints over the frames flying past it. */}
        <div className="zan-zoom-layer" data-scale-sm={portal.sm.scale} data-scale-lg={portal.lg.scale}>
          <div
            className="zan-zoom-frame zan-zoom-portal"
            style={
              {
                ...boxVars(portal.sm, portal.lg),
                "--pis": portal.sm.w / 100,
                "--pil": portal.lg.w / 100,
              } as CSSProperties
            }
          >
            <div className="zan-zoom-portal-inner">{portalContent}</div>
            <div className="zan-zoom-ring" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
