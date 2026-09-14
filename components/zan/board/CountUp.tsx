"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

function parse(value: string) {
  const match = value.match(/^([\d.,]+)(.*)$/);
  if (!match) return null;
  const raw = match[1].replace(/,/g, "");
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
  const format = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: match[1].includes(","),
  });
  return { target: Number(raw), suffix: match[2], format };
}

/**
 * A published figure that counts up from zero when `run` turns true.
 *
 * The server HTML (and reduced motion) carries the real value. When motion is
 * allowed (`armed`) the figure rests on a dash until `run`, then counts up from
 * zero; the text is written straight to the DOM, so a 60fps count never
 * re-renders React.
 */
export function CountUp({
  value,
  run,
  armed,
  className,
}: {
  value: string;
  run: boolean;
  armed: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const spec = parse(value);
    if (!el || !spec) return;
    const show = (n: number) => {
      el.textContent = spec.format.format(n) + spec.suffix;
    };
    if (!armed) {
      el.textContent = value;
      return;
    }
    if (!run) {
      // A dash, not "0": a resting zero would read as the figure itself.
      el.textContent = "–";
      return;
    }
    const state = { n: 0 };
    const tween = gsap.to(state, {
      n: spec.target,
      duration: 1.6,
      ease: "power3.out",
      onUpdate: () => show(state.n),
      onComplete: () => {
        el.textContent = value;
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, run, armed]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
