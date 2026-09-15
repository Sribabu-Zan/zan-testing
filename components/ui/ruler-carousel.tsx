"use client";

import type { CSSProperties, KeyboardEvent, Ref } from "react";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────────────────────
   RULER STRIP: a row of huge words between two rulers of tick marks, with a
   fixed centre tick. Adapted from the reference's ruler carousel.

   The strip does not animate itself. A scroll scene drives it:
     const geo = measureRuler(root);   // after layout, and again on resize
     positionRuler(geo, s);            // s: 0 … n-1, fractional in between
   positionRuler slides the words and both rulers together, so the ticks
   travel with the words. Each word shrinks with its distance from the centre
   tick, toward the side that faces it, so neighbours stay close to the
   active word instead of leaving holes.

   Keyboard: the words are buttons, and arrow keys, Home and End move between
   them. The parent decides what picking one does (the service dial scrolls
   the page to it).
   ─────────────────────────────────────────────────────────────────────────── */

export interface RulerItem {
  id: string;
  label: string;
}

/** Scale of a word a full step or more from the centre tick. */
export const RULER_DIM = 0.42;
/** Width per character in em, for the first paint before anything is measured. */
const EST = 0.62;
/** Softens the strip's ends so words leave the band rather than being cut. */
const FADE = "linear-gradient(90deg, transparent, black 7%, black 93%, transparent)";

const tick = (color: string) =>
  `linear-gradient(90deg, transparent calc(50% - 0.5px), ${color} calc(50% - 0.5px), ${color} calc(50% + 0.5px), transparent calc(50% + 0.5px))`;
/* Minor ticks in the strong hairline, major ticks a step darker so the scale
   reads as a scale even on a small screen. */
const TICKS = `${tick("var(--color-line-strong)")}, ${tick("var(--color-muted)")}`;

/** A band of tick marks: a minor tick every 12px, a major one every 60px, centred on the middle. */
export function RulerLines({ side, className }: { side: "top" | "bottom"; className?: string }) {
  const y = side === "top" ? "0" : "100%";
  const style: CSSProperties = {
    backgroundImage: TICKS,
    backgroundSize: "0.75rem 0.625rem, 3.75rem 1.25rem",
    backgroundRepeat: "repeat-x",
    backgroundPosition: `50% ${y}, 50% ${y}`,
  };
  return (
    <div
      aria-hidden="true"
      data-ruler-ticks=""
      className={cn(
        "relative h-6 w-full border-line-strong sm:h-8",
        side === "top" ? "border-t" : "border-b",
        className,
      )}
      style={style}
    >
      <span
        className={cn("absolute left-1/2 h-full w-0.5 -translate-x-1/2 bg-brand", side === "top" ? "top-0" : "bottom-0")}
      />
    </div>
  );
}

export interface RulerStripProps {
  items: readonly RulerItem[];
  /** The word on the centre tick. */
  active: number;
  onPick: (index: number) => void;
  /** Accessible name of the group of words. */
  label: string;
  /** Prefix for the word ids: `${idPrefix}-word-${item.id}`. */
  idPrefix: string;
  /** id of the element that shows item i, for aria-controls. */
  controlsOf?: (index: number) => string;
  rootRef?: Ref<HTMLDivElement>;
  className?: string;
  /** Typography for the words. */
  wordClassName?: string;
  /** Font size of the words at full size (any CSS length). */
  wordSize?: string;
  /** Depth of the two tick bands, e.g. "h-4 sm:h-6" for a shorter strip. */
  linesClassName?: string;
}

export function RulerStrip({
  items,
  active,
  onPick,
  label,
  idPrefix,
  controlsOf,
  rootRef,
  className,
  wordClassName = "font-sans font-bold uppercase",
  wordSize = "min(var(--text-giant), 10vw)",
  linesClassName,
}: RulerStripProps) {
  const n = items.length;
  // Until the scene measures, centre the first word on an estimate of its width.
  const firstCentre = ((items[0]?.label.length ?? 0) * EST) / 2;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = Math.min(active + 1, n - 1);
    else if (e.key === "ArrowLeft") next = Math.max(active - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next === null) return;
    e.preventDefault();
    onPick(next);
    // preventScroll: the strip clips its overflow, and a plain focus() would
    // scroll it sideways to reveal a word that is still off to one side.
    e.currentTarget.querySelector<HTMLElement>(`[data-ruler-index="${next}"]`)?.focus({ preventScroll: true });
  };

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <RulerLines side="top" className={linesClassName} />
      <div
        role="group"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="relative h-[max(1.5em,2.75rem)]"
        // Inline, so the track (several screens wide) is clipped from the
        // first paint in every browser and never widens the page. The track
        // is moved by transform only, so this box is never really scrolled;
        // if focus ever scrolls it, onScroll puts it straight back.
        style={{ fontSize: wordSize, overflow: "hidden", maskImage: FADE, WebkitMaskImage: FADE }}
        onScroll={(e) => {
          e.currentTarget.scrollLeft = 0;
          e.currentTarget.scrollTop = 0;
        }}
      >
        <div
          data-ruler-track=""
          className="absolute inset-y-0 left-1/2 flex w-max items-stretch gap-[0.5em]"
          style={{ transform: `translateX(-${firstCentre}em)` }}
        >
          {items.map((item, i) => (
            // The button keeps its full size, the height of the band (44px or
            // more), so every word is a comfortable tap target. Only the
            // label inside it scales.
            <button
              key={item.id}
              type="button"
              id={`${idPrefix}-word-${item.id}`}
              data-ruler-word=""
              data-ruler-index={i}
              aria-controls={controlsOf?.(i)}
              aria-current={i === active ? "true" : undefined}
              onClick={() => onPick(i)}
              className={`flex min-h-11 shrink-0 cursor-pointer items-center leading-[1] tracking-[-0.035em] whitespace-nowrap transition-colors duration-300 ${wordClassName} ${i === active ? "text-ink" : "text-muted hover:text-ink-2"}`}
            >
              <span
                data-ruler-label=""
                className="block"
                // First paint only. The scene overwrites these once it runs,
                // and React never rewrites them because they never change.
                style={i === 0 ? undefined : { transform: `scale(${RULER_DIM})`, transformOrigin: "0% 50%" }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      <RulerLines side="bottom" className={linesClassName} />
    </div>
  );
}

export interface RulerGeometry {
  track: HTMLElement | null;
  ticks: HTMLElement[];
  words: HTMLElement[];
  /** The scaling label inside each word. */
  labels: HTMLElement[];
  /** Centre of each word from the track's left edge, in px, at full size. */
  centres: number[];
}

/** Reads the strip's layout. Scaling never changes it, so this is needed only after a resize or a font swap. */
export function measureRuler(root: HTMLElement): RulerGeometry {
  const words = Array.from(root.querySelectorAll<HTMLElement>("[data-ruler-word]"));
  return {
    track: root.querySelector<HTMLElement>("[data-ruler-track]"),
    ticks: Array.from(root.querySelectorAll<HTMLElement>("[data-ruler-ticks]")),
    words,
    labels: words.map((w) => w.querySelector<HTMLElement>("[data-ruler-label]") ?? w),
    centres: words.map((w) => w.offsetLeft + w.offsetWidth / 2),
  };
}

/** Puts fractional position s (0 … n-1) on the centre tick. */
export function positionRuler(geo: RulerGeometry, s: number) {
  const { track, ticks, labels, centres } = geo;
  const n = centres.length;
  if (!n || !track) return;
  const t = Math.min(Math.max(s, 0), n - 1);
  const i = Math.floor(t);
  const c = i >= n - 1 ? centres[n - 1] : centres[i] + (centres[i + 1] - centres[i]) * (t - i);

  track.style.transform = `translate3d(${-c}px, 0, 0)`;
  for (const band of ticks) band.style.backgroundPositionX = `calc(50% - ${c}px), calc(50% - ${c}px)`;
  labels.forEach((w, k) => {
    const d = k - t;
    w.style.transformOrigin = d > 0 ? "0% 50%" : "100% 50%";
    w.style.transform = `scale(${1 - (1 - RULER_DIM) * Math.min(1, Math.abs(d))})`;
  });
}
