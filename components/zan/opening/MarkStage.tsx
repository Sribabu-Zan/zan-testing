"use client";

import dynamic from "next/dynamic";
import { useState, type CSSProperties } from "react";
import { usePreloaded } from "@/components/zan/shell/shellStore";
import { cn } from "@/lib/utils";
import { useCan3D, useIdleAfterLoad } from "./hooks";

/** A transparent 1px GIF: what phones get instead of the flat mark. */
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/* three.js lives in this chunk. Nothing downloads it unless useCan3D says
   so — a fine pointer, ≥1024px, motion allowed, enough memory, a real GPU. */
const ZanMark3D = dynamic(() => import("./ZanMark3D"), { ssr: false });

/* Geometry shared by the flat mark and the canvas, so the swap is seamless.
   The flat image is 90% of the box; the drawing fills 85.3% of its square,
   so the mark spans ~77% of the box. The canvas is the box grown 8% on each
   side and 12% top and bottom (room for the explode), so in canvas terms the
   3D mark spans 0.768 / 1.16 of its width. */
const FLAT = 0.9;
const DRAWING = 0.853;
const GROW_X = 0.08;
const SPAN = (FLAT * DRAWING) / (1 + 2 * GROW_X);

/**
 * The desktop right column: the Zan mark.
 *
 * The flat SVG is always there first — server HTML, reduced motion, touch,
 * no WebGL. On a capable desktop the interactive three.js mark mounts once
 * the preloader has lifted and the browser is idle, assembles itself, and
 * the flat mark fades out under it. If WebGL fails, the flat mark returns.
 */
export function MarkStage() {
  const can3D = useCan3D();
  const preloaded = usePreloaded();
  const idle = useIdleAfterLoad(can3D && preloaded);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const mount = can3D && preloaded && idle && !failed;
  const showing3D = mount && ready;

  return (
    <div
      data-reveal
      data-in="fade"
      className="zan-hero-in relative mx-auto aspect-square w-full max-w-[34rem]"
      style={{ "--zan-d": 3 } as CSSProperties}
    >
      {/* A plain <img>, eager and high priority: on desktop it is in the
          first viewport and the largest thing painted. Below 1024px the column
          is hidden, and the <source> hands phones an empty 1px image, so the
          SVG is never downloaded there. */}
      <picture>
        <source media="(max-width: 1023.98px)" srcSet={BLANK} />
        <img
          src="/images/hero/zan-mark.svg"
          alt=""
          width={1024}
          height={1024}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          draggable={false}
          className={cn(
            "zan-hero-mark-flat pointer-events-none absolute top-[5%] left-[5%] size-[90%] select-none",
            "transition-opacity duration-700 ease-out-expo",
            showing3D && "opacity-0",
          )}
        />
      </picture>
      {mount && (
        <ZanMark3D
          span={SPAN}
          onReady={() => setReady(true)}
          onFail={() => setFailed(true)}
          className="absolute -inset-x-[8%] -inset-y-[12%]"
        />
      )}
    </div>
  );
}
