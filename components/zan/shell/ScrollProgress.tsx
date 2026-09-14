"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { MQ } from "@/lib/gsap";
import { useMediaQuery } from "./shellStore";

/**
 * The page hides its scrollbar, so this 2px brand hairline is the only
 * scroll-position readout. A stiff, well-damped spring keeps it crisp — it
 * tracks the page instead of trailing it — and reduced motion gets the raw
 * value with no spring at all.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 260, damping: 40, mass: 0.35, restDelta: 0.0005 });
  const reduce = useMediaQuery(MQ.reduce);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[55] h-[2px] origin-left bg-brand-gradient will-change-transform"
      style={{ scaleX: reduce ? scrollYProgress : smooth }}
    />
  );
}
