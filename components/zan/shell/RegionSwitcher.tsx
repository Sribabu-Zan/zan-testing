"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { regionOrder, regions, type RegionId } from "@/constants/zan";
import { setRegion, useRegionId } from "@/lib/region";
import { cn } from "@/lib/utils";

/**
 * IN / AE / US as one segmented control — a radiogroup, so it takes a single
 * Tab stop and the arrow keys move (and apply) the selection.
 *
 * The thumb is a brand pill that slides between the segments, so switching a
 * region visibly repaints the control itself in the new colour. It only gets
 * its transition a frame after mount: a returning UAE visitor hydrates as "in"
 * and catches up immediately, and that catch-up should not read as a slide.
 */
export function RegionSwitcher({
  className,
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  const current = useRegionId();
  const index = regionOrder.indexOf(current);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = groupRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.dataset.ready = "1";
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const choose = (id: RegionId, focus = false) => {
    if (id !== current) setRegion(id);
    if (focus) groupRef.current?.querySelector<HTMLButtonElement>(`[data-region-option="${id}"]`)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      choose(regionOrder[e.key === "Home" ? 0 : regionOrder.length - 1], true);
      return;
    }
    if (!step) return;
    e.preventDefault();
    const next = regionOrder[(index + step + regionOrder.length) % regionOrder.length];
    choose(next, true);
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Region"
      onKeyDown={onKeyDown}
      className={cn(
        "group/region relative isolate grid shrink-0 grid-cols-3 rounded-full border border-line bg-surface/80 p-1",
        size === "md" ? "h-10 w-[7.75rem]" : "h-12 w-[10.5rem]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-1 left-1 -z-10 w-[calc((100%-0.5rem)/3)] rounded-full bg-brand-gradient shadow-[0_6px_16px_-8px_color-mix(in_oklab,var(--color-brand)_80%,transparent)]",
          "group-data-ready/region:transition-transform group-data-ready/region:duration-500 group-data-ready/region:ease-out-expo",
        )}
        style={{ transform: `translateX(${Math.max(0, index) * 100}%)` }}
      />
      {regionOrder.map((id) => {
        const r = regions[id];
        const selected = id === current;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${r.label} (${r.short})`}
            title={`${r.label} · ${r.brandName}`}
            tabIndex={selected ? 0 : -1}
            data-region-option={id}
            onClick={() => choose(id)}
            className={cn(
              "relative grid place-items-center rounded-full font-mono font-medium tracking-[0.08em] transition-colors duration-300",
              size === "md" ? "text-[0.6875rem]" : "text-xs",
              selected ? "text-on-brand" : "text-ink-2 hover:text-ink",
            )}
          >
            {r.short}
          </button>
        );
      })}
    </div>
  );
}
