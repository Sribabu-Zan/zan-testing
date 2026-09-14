"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Two bars that cross into an ×. Only `top` and `rotate` move, so the bars
 * stay one continuous shape through the whole morph.
 *
 * `morphIn` starts the bars as a hamburger and animates them to × on mount —
 * the copy inside the mobile menu uses it, so opening the menu reads as the
 * header's own toggle turning into the close button.
 */
export const MenuToggle = forwardRef<
  HTMLButtonElement,
  {
    open: boolean;
    onClick: () => void;
    morphIn?: boolean;
    className?: string;
    controls?: string;
  }
>(function MenuToggle({ open, onClick, morphIn = false, className, controls }, ref) {
  const transition = { duration: 0.45, ease: EASE };
  const closed = [{ top: 0, rotate: 0 }, { top: 10, rotate: 0 }] as const;
  const crossed = [{ top: 5, rotate: 45 }, { top: 5, rotate: -45 }] as const;
  const bars = open ? crossed : closed;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      aria-controls={controls}
      className={cn(
        "relative grid size-11 shrink-0 place-items-center rounded-full border border-line bg-bg text-ink",
        "transition-colors duration-300 hover:border-line-strong hover:bg-surface",
        className,
      )}
    >
      <span className="relative block h-[11px] w-[18px]" aria-hidden="true">
        {bars.map((bar, i) => (
          <motion.span
            key={i}
            className="absolute left-0 block h-[1.5px] w-full rounded-full bg-current"
            initial={morphIn ? closed[i] : false}
            animate={bar}
            transition={transition}
          />
        ))}
      </span>
    </button>
  );
});
