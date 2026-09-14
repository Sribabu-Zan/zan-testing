"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;

/**
 * The standing pages' one reveal: a short rise as the block enters. Framer
 * Motion is under <MotionConfig reducedMotion="user">, so a visitor who asks
 * for reduced motion gets the fade without the movement, and the noscript
 * rule in app/layout.tsx shows every [data-reveal] element at rest.
 *
 * Deliberately not a GSAP scene. These pages are read, not scrubbed.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
