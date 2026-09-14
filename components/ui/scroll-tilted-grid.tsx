"use client";

import { useRef, type ReactNode } from "react";
import { cubicBezier, motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { MQ } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/components/zan/process/useMediaQuery";

/* ───────────────────────────────────────────────────────────────────────────
   SCROLL TILTED GRID — a two-column grid whose tiles tilt up out of the page,
   come into focus at the centre of the viewport and tilt away again.

   Each tile is scrubbed by its own scroll position (framer-motion useScroll):
   it rises from below tipped back and skewed out to its side, flattens and
   sharpens at the centre, then tips forward as it leaves. On the light
   theme it fades to the ground rather than to black.

   Reduced motion: a flat grid (motion values are not covered by
   MotionConfig, so the tilted tile is not rendered at all). Narrow screens:
   one column, a lighter tilt and no blur.
   ─────────────────────────────────────────────────────────────────────────── */

export interface TiltedGridItem {
  key: string;
  /** The tile's content, laid over the media. Real DOM text. */
  node: ReactNode;
  /** Optional full-bleed background (an image) that stretches with the tilt. */
  media?: ReactNode;
}

const easeIntoFocus = cubicBezier(0.22, 1, 0.36, 1);
const easeOutOfFocus = cubicBezier(0, 0, 0.58, 1);
const focusEase = [easeIntoFocus, easeOutOfFocus];

interface TileConfig {
  perspective: number;
  maxTilt: number;
  maxBlur: number;
  /** Sideways travel, % of the tile's width. */
  shift: number;
  skew: number;
  depth: number;
  turn: number;
  aspect: string;
}

const WIDE: TileConfig = { perspective: 900, maxTilt: 64, maxBlur: 6, shift: 40, skew: 18, depth: 300, turn: 5, aspect: "3 / 4" };
const NARROW: TileConfig = { perspective: 900, maxTilt: 26, maxBlur: 0, shift: 10, skew: 5, depth: 110, turn: 2, aspect: "4 / 5" };

function TiltTile({ item, side, config, rounded }: { item: TiltedGridItem; side: -1 | 1; config: TileConfig; rounded: string }) {
  const ref = useRef<HTMLLIElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opts = { ease: focusEase };
  const { maxBlur, maxTilt, shift, skew, depth, turn } = config;

  const blur = useTransform(p, [0, 0.5, 1], [maxBlur, 0, maxBlur], opts);
  const opacity = useTransform(p, [0, 0.5, 1], [0, 1, 0], opts);
  const y = useTransform(p, [0, 0.5, 1], ["100%", "0%", "-100%"], opts);
  const z = useTransform(p, [0, 0.5, 1], [depth, 0, depth], opts);
  const rotateX = useTransform(p, [0, 0.5, 1], [maxTilt, 0, -maxTilt], opts);
  const x = useTransform(p, [0, 0.5, 1], [`${side * shift}%`, "0%", `${side * shift}%`], opts);
  const rotate = useTransform(p, [0, 0.5, 1], [-side * turn, 0, side * turn], opts);
  const skewX = useTransform(p, [0, 0.5, 1], [side * skew, 0, -side * skew], opts);
  const scaleY = useTransform(p, [0, 0.5, 1], [1.8, 1, 1.8], opts);
  const filter = useMotionTemplate`blur(${blur}px)`;

  return (
    <li ref={ref} className="relative" style={{ perspective: config.perspective }}>
      <motion.div
        className={cn("relative w-full overflow-hidden will-change-transform", rounded)}
        style={{
          aspectRatio: config.aspect,
          opacity,
          x,
          y,
          z,
          rotate,
          rotateX,
          skewX,
          filter: maxBlur ? filter : undefined,
        }}
      >
        {item.media && (
          <motion.div aria-hidden="true" className="absolute inset-0" style={{ scaleY, backfaceVisibility: "hidden" }}>
            {item.media}
          </motion.div>
        )}
        {item.node}
      </motion.div>
    </li>
  );
}

function FlatTile({ item, config, rounded }: { item: TiltedGridItem; config: TileConfig; rounded: string }) {
  return (
    <li className="relative">
      <div className={cn("relative w-full overflow-hidden", rounded)} style={{ aspectRatio: config.aspect }}>
        {item.media && (
          <div aria-hidden="true" className="absolute inset-0">
            {item.media}
          </div>
        )}
        {item.node}
      </div>
    </li>
  );
}

export function ScrollTiltedGrid({
  items,
  ariaLabel,
  className,
  rounded = "rounded-3xl",
}: {
  items: readonly TiltedGridItem[];
  ariaLabel?: string;
  className?: string;
  rounded?: string;
}) {
  const reduce = useMediaQuery(MQ.reduce);
  const narrow = useMediaQuery("(max-width: 639.98px)");
  const config = narrow ? NARROW : WIDE;

  return (
    <ul
      aria-label={ariaLabel}
      className={cn(
        "relative z-[1] mx-auto grid w-full max-w-[44rem] grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10",
        className,
      )}
    >
      {items.map((item, i) =>
        reduce ? (
          <FlatTile key={item.key} item={item} config={config} rounded={rounded} />
        ) : (
          // Keyed by config: framer-motion does not clear a style it stops
          // being given, so a breakpoint change remounts the tile clean.
          <TiltTile
            key={`${item.key}-${narrow ? "n" : "w"}`}
            item={item}
            side={i % 2 === 0 ? -1 : 1}
            config={config}
            rounded={rounded}
          />
        ),
      )}
    </ul>
  );
}

export default ScrollTiltedGrid;
