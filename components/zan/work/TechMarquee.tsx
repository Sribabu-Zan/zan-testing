"use client";

import { useState } from "react";
import { marqueeTech, metricsIntro } from "@/constants/zan";
import { cn } from "@/lib/utils";
import { MarqueeToggle } from "./MarqueeToggle";
import "./work.css";

/**
 * The stack caption over a CSS text marquee of every tool the page names.
 * Two identical lists travel -50% for a seamless loop; the second is
 * aria-hidden. Hover or the toggle beside the caption pauses it (WCAG
 * 2.2.2); reduced motion stops it and wraps the first list into centred rows
 * (work.css).
 */
export function TechMarquee({ className }: { className?: string }) {
  const [paused, setPaused] = useState(false);

  const list = (dup: boolean) => (
    <ul
      aria-label={dup ? undefined : metricsIntro.stackCaption}
      aria-hidden={dup || undefined}
      className={cn("zan-metrics-marquee-list flex shrink-0 items-center", dup && "zan-metrics-marquee-dup")}
    >
      {marqueeTech.map((tool) => (
        <li
          key={tool}
          className="flex items-center whitespace-nowrap px-4 font-sans text-[clamp(1.25rem,0.95rem+1.25vw,2.25rem)] font-semibold tracking-[-0.03em] text-ink/85 lg:px-6"
        >
          <span aria-hidden="true" className="mr-8 size-1.5 shrink-0 rounded-full bg-brand lg:mr-12" />
          {tool}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={className}>
      <div className="container-zan flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <p className="text-center font-mono text-eyebrow uppercase text-muted">{metricsIntro.stackCaption}</p>
        <MarqueeToggle paused={paused} onToggle={() => setPaused((p) => !p)} label="Pause the technology list" />
      </div>
      <div data-paused={paused || undefined} className="zan-metrics-marquee mt-7 overflow-hidden py-2">
        <div className="zan-metrics-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </div>
  );
}
