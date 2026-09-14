"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useMediaQuery } from "@/components/zan/shell/shellStore";

/** A real mouse, and a visitor who has not asked for less motion. */
const QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

const INTERACTIVE = "a, button, [role='button'], [data-cursor], label[for], summary, select";
const TEXT_ENTRY = "input, textarea, select, [contenteditable='true']";

type Mode = "hidden" | "idle" | "hover" | "text";

/**
 * Ring + dot cursor. White with mix-blend-difference, so it reads as ink on
 * the light page and inverts over brand fills and imagery.
 *
 * Mounted only for a fine hover pointer with motion allowed. While mounted it
 * puts .zan-cursor on <html> — globals.css hides the OS cursor only under
 * that class — so touch, reduced motion or a failed chunk keep the normal one.
 */
export function MouseFollower() {
  const enabled = useMediaQuery(QUERY);
  return enabled ? <Cursor /> : null;
}

function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 420, damping: 36, mass: 0.45 });
  const ringY = useSpring(y, { stiffness: 420, damping: 36, mass: 0.45 });
  const [mode, setMode] = useState<Mode>("hidden");

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("zan-cursor");

    let current: Mode = "hidden";
    const apply = (next: Mode) => {
      if (next === current) return;
      current = next;
      setMode(next);
    };
    const classify = (target: EventTarget | null): Mode => {
      const el = target instanceof Element ? target : null;
      if (!el) return "idle";
      if (el.closest(TEXT_ENTRY)) return "text";
      if (el.closest(INTERACTIVE)) return "hover";
      return "idle";
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      if (current === "hidden") {
        ringX.jump(e.clientX);
        ringY.jump(e.clientY);
        apply(classify(e.target));
      }
    };
    const onOver = (e: MouseEvent) => {
      if (current !== "hidden") apply(classify(e.target));
    };
    const onLeave = () => apply("hidden");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    html.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      html.classList.remove("zan-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
      html.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [x, y, ringX, ringY]);

  const shown = mode === "idle" || mode === "hover";
  const spring = { type: "spring", stiffness: 320, damping: 26 } as const;

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9999] mix-blend-difference"
        style={{ x: ringX, y: ringY }}
      >
        <motion.div
          className="-mt-[18px] -ml-[18px] size-9 rounded-full border-[1.5px] border-white"
          initial={false}
          animate={{ scale: mode === "hover" ? 1.7 : 1, opacity: shown ? 1 : 0 }}
          transition={spring}
        />
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9999] mix-blend-difference"
        style={{ x, y }}
      >
        <motion.div
          className="-mt-[3px] -ml-[3px] size-1.5 rounded-full bg-white"
          initial={false}
          animate={{ scale: mode === "hover" ? 0 : 1, opacity: mode === "idle" ? 1 : 0 }}
          transition={{ duration: 0.18 }}
        />
      </motion.div>
    </>
  );
}
