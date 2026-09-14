"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

const EASE = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;

const HEADINGS = { h1: motion.h1, h2: motion.h2, h3: motion.h3 } as const;

const line: Variants = {
  hidden: { y: "110%" },
  visible: (i: number) => ({
    y: "0%",
    transition: { duration: 1.1, ease: EASE, delay: 0.06 + i * 0.08 },
  }),
};

/**
 * Eyebrow + display heading + lead, with each heading line rising out of its
 * own mask as it enters. The heading's accessible name is the full sentence
 * (aria-label), so screen readers do not hear it line by line.
 *
 * The in-view trigger sits on the HEADING, not on each line. A line starts
 * translated fully below its overflow-hidden mask, and IntersectionObserver
 * clips a target by its ancestors' overflow — so a line watching itself never
 * intersects and never rises. The heading's own box is never clipped; it
 * fires once and its variant propagates to the lines.
 *
 * Reduced motion: <MotionConfig reducedMotion="user"> in the root turns the
 * rise into a plain appearance. No-JS: the noscript rule in layout.tsx shows
 * every [data-reveal] element at rest.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  as = "h2",
  size = "h1",
  id,
  accentLine,
  className,
  leadClassName,
}: {
  eyebrow?: string;
  title: readonly string[];
  lead?: string;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  size?: "display" | "h1" | "h2";
  /** On the heading element, for a section's aria-labelledby. */
  id?: string;
  /** Index of the one title line set in the brand text gradient. One per view, at most. */
  accentLine?: number;
  className?: string;
  leadClassName?: string;
}) {
  const centred = align === "center";
  const Heading = HEADINGS[as];
  return (
    <div className={cn(centred && "mx-auto flex flex-col items-center text-center", className)}>
      {eyebrow && (
        <motion.div
          data-reveal
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <Eyebrow>{eyebrow}</Eyebrow>
        </motion.div>
      )}

      <Heading
        id={id}
        aria-label={title.join(" ")}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        className={cn(
          "font-display text-balance",
          size === "display" ? "text-display" : size === "h1" ? "text-h1" : "text-h2",
          eyebrow && "mt-5",
        )}
      >
        {title.map((text, i) => (
          <span key={i} aria-hidden="true" className="-mb-[0.1em] block overflow-hidden pb-[0.1em]">
            <motion.span
              data-reveal
              className={cn("block", i === accentLine && "text-brand-gradient")}
              variants={line}
              custom={i}
            >
              {text}
            </motion.span>
          </span>
        ))}
      </Heading>

      {lead && (
        <motion.p
          data-reveal
          className={cn("mt-6 max-w-[54ch] text-lead text-ink-2", leadClassName)}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
        >
          {lead}
        </motion.p>
      )}
    </div>
  );
}
