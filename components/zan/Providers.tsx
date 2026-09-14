"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * reducedMotion="user": for a visitor who prefers reduced motion, every
 * framer-motion transform and layout animation is skipped (opacity still
 * fades). GSAP scenes gate themselves with gsap.matchMedia(MQ.motion).
 */
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
