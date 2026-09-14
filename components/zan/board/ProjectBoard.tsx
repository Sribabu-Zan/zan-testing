"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useInView, useMotionValue, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { LayoutGrid, Search } from "lucide-react";
import { about, metrics, offices, practices, processIntro, processSteps } from "@/constants/zan";
import { useContainerScroll } from "@/components/ui/container-scroll-animation";
import { ZanIcon } from "@/components/zan/ui/icons";
import { ZanLogo } from "@/components/zan/ui/ZanLogo";
import { useRegion } from "@/lib/region";
import { cn } from "@/lib/utils";
import { formatClock, useMinute } from "./clock";
import { CountUp } from "./CountUp";
import { CARDS, LANES, layoutAt, type Placement } from "./kanban";

/* ═══════════════════════════════════════════════════════════════════════════
   THE PROJECT BOARD: what the Board section's frame shows.

   An illustrative app screen built from Zan's own data: the three practices,
   the four process stages with their deliverables as kanban cards, the three
   offices' local times, and the published figures. It repeats content that
   is on the page as real text, so the whole mock is aria-hidden and inert.

   Sizes:
     desktop, motion   fills the frame at 1:1 (100vw × viewport − navbar);
                       the frame's GSAP scene scales it, not this component
     otherwise         laid out at a fixed design size and scaled to fit the
                       card — 800×600 compact (no sidebar) below 1024px,
                       1280×800 on a reduced-motion desktop

   Motion (paused off-screen and for reduced motion): a card walks across the
   lanes on a timer, and the figures count up when the frame reaches full
   screen (or, without the pinned scene, when the board scrolls into view).
   ═══════════════════════════════════════════════════════════════════════════ */

const TICK_MS = 2600;
/** Frame progress at which the frame has flattened to full screen. */
const FULL = 0.84;

const eyebrow = "font-mono text-[10.5px] uppercase tracking-[0.14em]";

export function ProjectBoard() {
  const fitRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const visible = useInView(boardRef, { amount: 0.15 });
  const seen = useInView(boardRef, { amount: 0.5 });
  const [tick, setTick] = useState(0);
  const minute = useMinute();

  // The frame scene's progress: -1 while no pinned scene runs.
  const scene = useContainerScroll();
  const idle = useMotionValue(-1);
  const progress = scene ?? idle;
  const [pinned, setPinned] = useState(false);
  const [full, setFull] = useState(false);
  useMotionValueEvent(progress, "change", (v) => {
    setPinned(v >= 0);
    setFull(v >= FULL);
  });

  // Fit the fixed-size layouts to the card. Desktop-with-motion fills the
  // frame instead, where this works out to 1 and the class ignores it.
  useEffect(() => {
    const wrap = fitRef.current;
    const board = boardRef.current;
    if (!wrap || !board) return;
    const fit = () => wrap.style.setProperty("--fit", String(wrap.clientWidth / board.offsetWidth || 1));
    const observer = new ResizeObserver(fit);
    observer.observe(wrap);
    observer.observe(board);
    fit();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || reduced !== false) return;
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [visible, reduced]);

  const placement = layoutAt(tick);
  const counts = Array.from({ length: LANES }, (_, lane) =>
    CARDS.reduce((n, c) => n + (placement.get(c.id)?.lane === lane ? 1 : 0), 0),
  );

  return (
    <div
      ref={fitRef}
      aria-hidden="true"
      inert
      className="relative aspect-[4/3] w-full lg:motion-reduce:aspect-[1280/800] lg:motion-safe:aspect-auto lg:motion-safe:h-full"
    >
      <div
        ref={boardRef}
        className={cn(
          "@container absolute top-0 left-0 flex h-[600px] w-[800px] origin-top-left flex-col overflow-hidden bg-surface text-ink select-none",
          "[scale:var(--fit,0.44)] lg:motion-reduce:h-[800px] lg:motion-reduce:w-[1280px] lg:motion-reduce:[scale:var(--fit,0.86)]",
          "lg:motion-safe:static lg:motion-safe:h-full lg:motion-safe:w-full lg:motion-safe:[scale:1]",
        )}
      >
        <Chrome />
        <div className="flex min-h-0 flex-1">
          <Sidebar counts={counts} />
          {/* On the full-bleed desktop board, content starts below the navbar's 72px. */}
          <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 @4xl:gap-5 @4xl:px-6 @4xl:pt-7 @4xl:pb-5">
            <TopStrip minute={minute} />
            <Kanban placement={placement} counts={counts} />
            <Metrics run={pinned ? full : seen} armed={reduced === false} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Window chrome ────────────────────────────────────────────────────────── */

function Chrome() {
  const region = useRegion();
  return (
    <div className="grid h-10 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-bg px-4 @4xl:h-13 @4xl:px-5">
      <div className="flex gap-1.5">
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
      </div>
      <div className="flex items-center gap-2 rounded-md bg-surface px-3 py-1 text-[12px] font-medium text-ink-2">
        <LayoutGrid className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
        {region.brandName}
      </div>
      <div className="flex justify-end">
        <Search className="size-4 text-muted" strokeWidth={1.8} aria-hidden="true" />
      </div>
    </div>
  );
}

/* ── Sidebar: the practices, the stages, how engagements run ──────────────── */

function Sidebar({ counts }: { counts: number[] }) {
  const terms = about.principles.filter((p) => p.label === "Engagements" || p.label === "Support");
  return (
    <div className="hidden w-56 shrink-0 flex-col border-r border-line bg-bg px-3 py-5 @4xl:flex @6xl:w-60">
      <div className="px-2">
        <ZanLogo className="h-6 w-auto" />
      </div>

      <div className={cn(eyebrow, "mt-8 px-2 text-muted")}>Practices</div>
      <div className="mt-2 space-y-0.5">
        {practices.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-2",
              i === 0 ? "bg-brand-soft text-brand-ink" : "text-ink-2",
            )}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-md",
                i === 0 ? "bg-bg" : "bg-surface",
              )}
            >
              <ZanIcon name={p.items[0].icon} className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{p.title}</span>
            <span className="font-mono text-[11px] text-muted tabular-nums">{p.items.length}</span>
          </div>
        ))}
      </div>

      <div className={cn(eyebrow, "mt-7 px-2 text-muted")}>Stages</div>
      <div className="mt-2 space-y-0.5">
        {processSteps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-ink-2">
            <span className="w-7 shrink-0 text-center font-mono text-[11px] text-brand-ink">{s.index}</span>
            <span className="min-w-0 flex-1 truncate text-[12.5px]">{s.title}</span>
            <span className="font-mono text-[11px] text-muted tabular-nums">{counts[i]}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-3 rounded-xl border border-line bg-surface p-3">
        {terms.map((t) => (
          <div key={t.label}>
            <div className={cn(eyebrow, "text-[9.5px] text-muted")}>{t.label}</div>
            <div className="mt-1 text-[12.5px] font-medium text-ink">{t.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Top strip: status and the three offices' local time ──────────────────── */

function TopStrip({ minute }: { minute: number | null }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="hidden min-w-0 @4xl:block">
        <div className={cn(eyebrow, "text-brand-ink")}>{processIntro.eyebrow}</div>
        <div className="mt-1.5 truncate text-[20px] font-semibold tracking-[-0.015em] text-ink">
          Project board
        </div>
      </div>
      <div className="flex w-full items-center justify-between gap-3 @4xl:w-auto @4xl:justify-end">
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-[12px] font-medium text-brand-ink">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-brand" />
          </span>
          Accepting new projects
        </span>
        <div className="flex items-center divide-x divide-line rounded-full border border-line bg-bg">
          {offices.map((o) => (
            <span key={o.id} className="flex items-baseline gap-1.5 px-3 py-1.5">
              <span className="text-[11px] text-ink-2">{o.city}</span>
              <span className="font-mono text-[12px] text-ink tabular-nums">{formatClock(minute, o.timeZone)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Kanban ────────────────────────────────────────────────────────────────
   Lanes are a grid; cards are absolutely placed over it and moved with the
   `translate` property from their lane/row. A CSS transition does the glide,
   in the board's own coordinates, so it stays exact however the frame
   around it is scaled or tilted. */

const LANE_VARS =
  "[--gap:10px] [--pad:8px] [--head:38px] [--card-h:56px] [--card-gap:6px] " +
  "@4xl:[--gap:14px] @4xl:[--pad:10px] @4xl:[--head:46px] @4xl:[--card-h:70px] @4xl:[--card-gap:8px] " +
  "@6xl:[--head:50px] @6xl:[--card-h:84px] @6xl:[--card-gap:12px]";

function Kanban({ placement, counts }: { placement: Map<string, Placement>; counts: number[] }) {
  return (
    <div className={cn("relative min-h-0 flex-1", LANE_VARS)}>
      <div className="absolute inset-0 grid grid-cols-4 gap-[var(--gap)]">
        {processSteps.map((s, lane) => (
          <div key={s.id} className="rounded-2xl border border-line bg-surface-2/70">
            <div className="flex h-[var(--head)] items-center gap-2 px-[calc(var(--pad)+4px)]">
              <span className="font-mono text-[10.5px] text-brand-ink">{s.index}</span>
              <span className="min-w-0 truncate text-[12px] font-semibold text-ink @4xl:text-[13px]">{s.title}</span>
              <span className="ml-auto rounded-full bg-bg px-1.5 py-px font-mono text-[10.5px] text-muted tabular-nums">
                {counts[lane]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {CARDS.map((card) => {
        const at = placement.get(card.id) ?? { lane: card.home, row: card.order, walking: false };
        const style = { "--c": at.lane, "--r": at.row } as CSSProperties;
        return (
          <div
            key={card.id}
            style={style}
            className={cn(
              "absolute top-0 left-0 h-[var(--card-h)] w-[calc((100%-3*var(--gap))/4-2*var(--pad))]",
              "[translate:calc(var(--c)*(100%+2*var(--pad)+var(--gap))+var(--pad))_calc(var(--head)+var(--r)*(var(--card-h)+var(--card-gap)))]",
              "transition-[translate] duration-[1100ms] ease-out-expo",
              at.walking ? "z-10" : "z-0",
            )}
          >
            <div
              className={cn(
                "flex h-full flex-col justify-between rounded-xl border bg-bg px-3 py-2 @4xl:py-2.5",
                at.walking
                  ? "border-transparent shadow-float ring-1 ring-brand/40"
                  : "border-line shadow-lift",
              )}
            >
              <div className="line-clamp-2 text-[11.5px] leading-snug font-medium text-ink @4xl:text-[12.5px] @6xl:text-[13.5px]">
                {card.title}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("font-mono text-[9.5px] @4xl:text-[10px]", at.walking ? "text-brand-ink" : "text-muted")}>
                  {processSteps[card.home].index}
                </span>
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="block h-full rounded-full bg-brand transition-[width] duration-[1100ms] ease-out-expo"
                    style={{ width: `${((at.lane + 1) / LANES) * 100}%` }}
                  />
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Figures ──────────────────────────────────────────────────────────────── */

function Metrics({ run, armed }: { run: boolean; armed: boolean }) {
  return (
    <div className="grid shrink-0 grid-cols-5 divide-x divide-line rounded-2xl border border-line bg-bg">
      {metrics.map((m) => (
        <div key={m.id} className="min-w-0 px-3 py-2.5 @4xl:px-5 @4xl:py-4">
          <CountUp
            value={m.value}
            run={run}
            armed={armed}
            className="block text-[19px] leading-tight font-semibold tracking-[-0.02em] text-ink tabular-nums @4xl:text-[26px]"
          />
          <span className="mt-0.5 block truncate text-[10.5px] text-ink-2 @4xl:mt-1 @4xl:text-[12.5px]">{m.label}</span>
          <span className="hidden truncate text-[11px] text-muted @4xl:block">{m.detail}</span>
        </div>
      ))}
    </div>
  );
}
