"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MQ } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import "@/components/zan/work/work.css";

/* ───────────────────────────────────────────────────────────────────────────
   THE WALL — the reference's hero parallax, generalised.

   A header, then a tilted plane of card rows that falls into place as the
   section scrolls in (rotateX / rotateZ / translateY / opacity), while the
   rows drift in opposite directions. Everything reads one spring on the
   section's scroll progress.

   Rows are centred and always wider than the viewport (each card is a share
   of vw), and the drift never exceeds that overhang — so no row ever shows
   an empty edge, at any width.

   Mobile gets smaller cards, a gentler tilt and a shorter fall. Reduced
   motion: work.css strips the inline transforms and reflows the rows into a
   flat grid.
   ─────────────────────────────────────────────────────────────────────────── */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (v: number, from: number, to: number) => Math.min(1, Math.max(0, (v - from) / (to - from)));

/** Desktop values first, mobile second. */
const TUNING = {
  drift: [15, 26] as const, // vw each way
  fallFrom: [-22, -10] as const, // vh
  fallTo: [9, 4] as const, // vh
  tiltX: [15, 10] as const, // deg
  tiltZ: [20, 8] as const, // deg
};

export function HeroParallax({
  id,
  header,
  rows,
  className,
  labelledBy,
}: {
  id?: string;
  header: ReactNode;
  rows: readonly (readonly ReactNode[])[];
  className?: string;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  // 0 = desktop tuning, 1 = mobile. A motion value rather than state, so a
  // breakpoint change retunes the transforms without a re-render.
  const mode = useMotionValue(0);
  useEffect(() => {
    const m = window.matchMedia(MQ.mobile);
    const apply = () => mode.set(m.matches ? 1 : 0);
    apply();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, [mode]);

  // The section's scroll progress: 0 as its top meets the viewport top, 1 as
  // its bottom does (framer's "start start" → "end start"). Measured here
  // rather than with useScroll({ target }), which in development warns that
  // the page's scroll container, <html>, is position: static.
  const progress = useMotionValue(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      progress.set(r.height > 0 ? Math.min(1, Math.max(0, -r.top / r.height)) : 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [progress]);
  const p = useSpring(progress, { stiffness: 300, damping: 30 });

  const pick = (pair: readonly [number, number], m: number) => pair[m ? 1 : 0];

  const x = useTransform([p, mode], ([v, m]: number[]) => `${lerp(-1, 1, v) * pick(TUNING.drift, m)}vw`);
  const xReverse = useTransform([p, mode], ([v, m]: number[]) => `${lerp(1, -1, v) * pick(TUNING.drift, m)}vw`);
  const y = useTransform([p, mode], ([v, m]: number[]) => {
    return `${lerp(pick(TUNING.fallFrom, m), pick(TUNING.fallTo, m), seg(v, 0, 0.2))}vh`;
  });
  const rotateX = useTransform([p, mode], ([v, m]: number[]) => lerp(pick(TUNING.tiltX, m), 0, seg(v, 0, 0.2)));
  const rotateZ = useTransform([p, mode], ([v, m]: number[]) => lerp(pick(TUNING.tiltZ, m), 0, seg(v, 0, 0.2)));
  // Starts barely there so the header above reads cleanly, then fills in as
  // the plane lands.
  const opacity = useTransform(p, [0.02, 0.2], [0.1, 1]);

  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "zan-wall relative flex flex-col overflow-clip bg-bg [perspective:1000px] [transform-style:preserve-3d]",
        className,
      )}
    >
      <div className="relative z-10">{header}</div>

      {/* data-reveal: without JavaScript the layout's noscript rule drops the
          server-rendered tilt, fall and fade, so the wall is never left faint. */}
      <motion.div data-reveal className="zan-wall-plane relative" style={{ rotateX, rotateZ, y, opacity }}>
        {rows.map((row, r) => (
          <motion.ul
            key={r}
            data-reveal
            className="zan-wall-row mb-5 flex justify-center gap-4 lg:mb-12 lg:gap-10"
            style={{ x: r % 2 ? xReverse : x }}
          >
            {row.map((card, c) => (
              <li
                key={c}
                className="zan-wall-card aspect-[104/100] w-[15.5rem] shrink-0 lg:aspect-[118/100] lg:w-[max(19rem,26vw)]"
              >
                {card}
              </li>
            ))}
          </motion.ul>
        ))}
      </motion.div>
    </section>
  );
}

export default HeroParallax;
