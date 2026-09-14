"use client";

import { motion } from "framer-motion";

/**
 * Three-dot typing indicator, used for both the AI and a live agent.
 *
 * Opacity only, so it survives <MotionConfig reducedMotion="user"> as a legible
 * pulse rather than a bounce, and never rests at 0.
 */
export function TypingDots() {
  return (
    <span className="flex gap-1 rounded-2xl rounded-bl-md border border-line bg-bg px-4 py-3.5 shadow-sm">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16 }}
          className="size-1.5 rounded-full bg-muted"
        />
      ))}
    </span>
  );
}
