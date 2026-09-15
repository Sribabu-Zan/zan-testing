"use client";

import { useEffect, useRef } from "react";
import { offices, type Office } from "@/constants/zan";
import { MQ } from "@/lib/gsap";
import { useRegion } from "@/lib/region";
import { cn } from "@/lib/utils";
import { useLocalTime } from "@/components/zan/about/useLocalTime";
import "./OfficeCard.css";

/** Tilt only where a fine pointer can drive it and motion is welcome. */
const TILT_QUERY = `${MQ.fine} and ${MQ.motion}`;

const MAX_TILT_X = 6; // deg, top/bottom
const MAX_TILT_Y = 7; // deg, left/right
const TAU = 0.14; // s — how quickly the card catches the pointer
const TAU_INTRO = 0.6; // s — the slower settle when it first scrolls in
const INTRO_MS = 1200;

const VARS = [
  "--zan-oc-px",
  "--zan-oc-py",
  "--zan-oc-bx",
  "--zan-oc-by",
  "--zan-oc-fl",
  "--zan-oc-ft",
  "--zan-oc-tilt-x",
  "--zan-oc-tilt-y",
] as const;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * ProfileCard's tilt engine: the pointer sets a target, a rAF loop eases the
 * current position toward it (exponential smoothing), and the position is
 * written as CSS variables that OfficeCard.css turns into rotation, glare,
 * sheen, shadow and a small content parallax. The loop stops once settled.
 */
function attachTilt(wrap: HTMLElement, card: HTMLElement): () => void {
  let raf = 0;
  let last = 0;
  let cx = 0;
  let cy = 0;
  let tx = 0;
  let ty = 0;
  let slowUntil = 0;
  let hovering = false;
  let enterTimer = 0;

  const write = (x: number, y: number) => {
    const w = card.clientWidth || 1;
    const h = card.clientHeight || 1;
    const px = clamp((x / w) * 100, 0, 100);
    const py = clamp((y / h) * 100, 0, 100);
    const s = wrap.style;
    s.setProperty("--zan-oc-px", `${px.toFixed(2)}%`);
    s.setProperty("--zan-oc-py", `${py.toFixed(2)}%`);
    s.setProperty("--zan-oc-bx", `${(35 + px * 0.3).toFixed(2)}%`);
    s.setProperty("--zan-oc-by", `${(35 + py * 0.3).toFixed(2)}%`);
    s.setProperty("--zan-oc-fl", (px / 100).toFixed(3));
    s.setProperty("--zan-oc-ft", (py / 100).toFixed(3));
    s.setProperty("--zan-oc-tilt-x", `${(((py - 50) / 50) * MAX_TILT_X).toFixed(2)}deg`);
    s.setProperty("--zan-oc-tilt-y", `${((-(px - 50) / 50) * MAX_TILT_Y).toFixed(2)}deg`);
  };

  const step = (ts: number) => {
    const dt = last ? (ts - last) / 1000 : 1 / 60;
    last = ts;
    const k = 1 - Math.exp(-dt / (ts < slowUntil ? TAU_INTRO : TAU));
    cx += (tx - cx) * k;
    cy += (ty - cy) * k;
    write(cx, cy);
    if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
      raf = requestAnimationFrame(step);
    } else {
      raf = 0;
      last = 0;
      if (!hovering) wrap.classList.remove("is-active");
    }
  };

  const start = () => {
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(step);
  };

  const toCentre = () => {
    tx = card.clientWidth / 2;
    ty = card.clientHeight / 2;
    start();
  };

  const aim = (e: PointerEvent) => {
    const r = card.getBoundingClientRect();
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
  };

  const onEnter = (e: PointerEvent) => {
    hovering = true;
    wrap.classList.add("is-active", "is-entering");
    window.clearTimeout(enterTimer);
    enterTimer = window.setTimeout(() => wrap.classList.remove("is-entering"), 180);
    aim(e);
    start();
  };
  const onMove = (e: PointerEvent) => {
    aim(e);
    start();
  };
  const onLeave = () => {
    hovering = false;
    toCentre();
  };

  card.addEventListener("pointerenter", onEnter);
  card.addEventListener("pointermove", onMove);
  card.addEventListener("pointerleave", onLeave);

  // The reference's entrance: the first time the card scrolls in, the light
  // starts at the top-right corner and drifts to rest.
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      if (hovering) return;
      cx = card.clientWidth - 60;
      cy = 40;
      write(cx, cy);
      wrap.classList.add("is-active");
      slowUntil = performance.now() + INTRO_MS;
      toCentre();
    },
    { threshold: 0.5 },
  );
  io.observe(card);

  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(enterTimer);
    io.disconnect();
    card.removeEventListener("pointerenter", onEnter);
    card.removeEventListener("pointermove", onMove);
    card.removeEventListener("pointerleave", onLeave);
    wrap.classList.remove("is-active", "is-entering");
    for (const v of VARS) wrap.style.removeProperty(v);
  };
}

export function OfficeCard({ office, index }: { office: Office; index: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const { time, offset, iso } = useLocalTime(office.timeZone);

  useEffect(() => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    const mq = window.matchMedia(TILT_QUERY);
    let detach: (() => void) | undefined;
    const sync = () => {
      detach?.();
      detach = mq.matches ? attachTilt(wrap, card) : undefined;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      detach?.();
    };
  }, []);

  const locality = [office.city, [office.region, office.postalCode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const titleId = `office-card-${office.id}`;

  return (
    <div ref={wrapRef} className="zan-office">
      <article
        ref={cardRef}
        aria-labelledby={titleId}
        className="zan-office-card overflow-hidden rounded-3xl border border-line"
      >
        <div className="zan-office-sheen" aria-hidden="true" />
        <div className="zan-office-glare" aria-hidden="true" />
        <div className="zan-office-content p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2.5 font-mono text-eyebrow text-muted uppercase">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span aria-hidden="true" className="h-px w-5 bg-line-strong" />
                <span className="truncate">{office.country}</span>
              </p>
              <h3 id={titleId} className="mt-3 font-display text-h2 text-ink">
                {office.city}
              </h3>
            </div>
            {office.isHq && (
              <span className="shrink-0 rounded-full bg-brand px-3 py-1.5 font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-on-brand uppercase">
                HQ
              </span>
            )}
          </div>

          <address className="mt-4 text-small text-ink-2 not-italic">
            {office.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <span className="block">{locality}</span>
          </address>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-t border-line pt-4">
            <ul className="flex flex-col md:gap-1">
              <li>
                <a
                  href={`tel:${office.phoneTel}`}
                  className="inline-flex min-h-11 items-center text-body font-medium text-ink underline md:min-h-0 decoration-transparent underline-offset-4 transition-colors hover:text-brand-ink hover:decoration-current"
                >
                  {office.phoneDisplay}
                </a>
              </li>
              {office.altPhoneTel && office.altPhoneDisplay && (
                <li>
                  <a
                    href={`tel:${office.altPhoneTel}`}
                    className="inline-flex min-h-11 items-center text-small text-ink-2 underline md:min-h-0 decoration-transparent underline-offset-4 transition-colors hover:text-brand-ink hover:decoration-current"
                  >
                    {office.altPhoneDisplay}
                  </a>
                </li>
              )}
            </ul>
            <p className="ml-auto text-right">
              <span className="block font-mono text-[0.6875rem] tracking-[0.14em] text-muted uppercase">Local time</span>
              <span className="mt-1 flex items-baseline justify-end gap-2">
                <time dateTime={iso} className="font-mono text-h3 text-ink tabular-nums">
                  {time}
                </time>
                {offset && <span className="font-mono text-[0.6875rem] tracking-[0.06em] text-muted">{offset}</span>}
              </span>
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}

/** The three offices, the current region's first. */
export function OfficeCards({ className }: { className?: string }) {
  const { office } = useRegion();
  const ordered = [office, ...offices.filter((o) => o.id !== office.id)];
  return (
    <ul className={cn("grid gap-5", className)}>
      {ordered.map((o, i) => (
        <li key={o.id}>
          <OfficeCard office={o} index={i} />
        </li>
      ))}
    </ul>
  );
}
