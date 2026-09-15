"use client";

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { gsap, MQ } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import "@/components/zan/work/work.css";
import "@/components/zan/work/wall.css";

/* ───────────────────────────────────────────────────────────────────────────
   THE WALL — the reference's hero parallax, generalised.

   A header, then a tilted plane of card rows that falls into place as the
   section scrolls in (rotateX / rotateZ / translateY / opacity). Framer reads
   those from one spring on the section's scroll progress.

   Each row is also a marquee that never stops: it drifts on its own,
   alternating direction row to row, and scrolling adds a velocity boost that
   eases back to the cruising speed. The loop is seamless because every row
   renders three copies of its cards (clone · original · clone) and the
   offset wraps by exactly one copy's width, which is invisible.

   The clones exist only on the client with motion allowed, and are
   aria-hidden and inert, so the server HTML, screen readers and keyboard
   users meet each card once. Reduced motion: no clones, no marquee, and
   wall.css reflows the rows into a flat grid.

   The marquee pauses while the section is off screen or the tab is hidden,
   eases to a stop while a desktop pointer rests on a row, and stops while a
   card holds keyboard focus, sliding that card to the middle of the screen.
   ─────────────────────────────────────────────────────────────────────────── */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (v: number, from: number, to: number) => Math.min(1, Math.max(0, (v - from) / (to - from)));
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Desktop values first, mobile second. */
const TUNING = {
  fallFrom: [-22, -10] as const, // vh
  fallTo: [9, 4] as const, // vh
  tiltX: [15, 10] as const, // deg
  tiltZ: [20, 8] as const, // deg
  speed: [34, 24] as const, // px/s cruising speed
};

/** Scroll boost: share of the scroll velocity added to the row, and its cap. */
const BOOST = { gain: 0.45, max: 720, rise: 9, fall: 2.2 };

const COPIES = 3; // clone · original · clone
const ORIGINAL = 1;

function subscribeMotion(onChange: () => void) {
  const m = window.matchMedia(MQ.motion);
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
}

export function HeroParallax({
  id,
  header,
  rows,
  className,
  labelledBy,
}: {
  id?: string;
  header: ReactNode;
  rows: readonly (readonly ReactNode[])[];
  className?: string;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  // True only on the client with motion allowed: that is when the clones
  // mount and the rows become marquees. The server snapshot is false, so the
  // server HTML holds each card once.
  const looping = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MQ.motion).matches,
    () => false,
  );

  // 0 = desktop tuning, 1 = mobile. A motion value rather than state, so a
  // breakpoint change retunes the transforms without a re-render.
  const mode = useMotionValue(0);
  useEffect(() => {
    const m = window.matchMedia(MQ.mobile);
    const apply = () => mode.set(m.matches ? 1 : 0);
    apply();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, [mode]);

  // The section's scroll progress: 0 as its top meets the viewport top, 1 as
  // its bottom does. Measured here rather than with useScroll({ target }),
  // which in development warns that <html> is position: static.
  const progress = useMotionValue(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      progress.set(r.height > 0 ? Math.min(1, Math.max(0, -r.top / r.height)) : 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [progress]);
  const p = useSpring(progress, { stiffness: 300, damping: 30 });

  const pick = (pair: readonly [number, number], m: number) => pair[m ? 1 : 0];

  const y = useTransform([p, mode], ([v, m]: number[]) => {
    return `${lerp(pick(TUNING.fallFrom, m), pick(TUNING.fallTo, m), seg(v, 0, 0.2))}vh`;
  });
  const rotateX = useTransform([p, mode], ([v, m]: number[]) => lerp(pick(TUNING.tiltX, m), 0, seg(v, 0, 0.2)));
  const rotateZ = useTransform([p, mode], ([v, m]: number[]) => lerp(pick(TUNING.tiltZ, m), 0, seg(v, 0, 0.2)));
  // Starts barely there so the header above reads cleanly, then fills in as
  // the plane lands.
  const opacity = useTransform(p, [0.02, 0.2], [0.1, 1]);

  /* ── The marquee ────────────────────────────────────────────────────────── */

  // Layout effect: the first transform lands before the clones' first paint,
  // so a row never flashes left-aligned.
  useLayoutEffect(() => {
    const section = ref.current;
    if (!section || !looping) return;

    const mm = gsap.matchMedia();
    mm.add({ motion: MQ.motion, fine: MQ.fine, mobile: MQ.mobile }, (ctx) => {
      const { fine, mobile } = ctx.conditions as { fine: boolean; mobile: boolean };
      const tracks = Array.from(section.querySelectorAll<HTMLElement>("[data-wall-track]"));

      type Row = {
        el: HTMLElement;
        dir: 1 | -1;
        width: number; // one copy, gap included
        pos: number; // px, wraps modulo width
        mult: number; // 0..1, eased toward 0 while hovered
        hovered: boolean;
        focused: boolean;
        nudge: gsap.core.Tween | null;
      };

      const measure = (el: HTMLElement) => {
        const first = el.querySelector<HTMLElement>(`[data-copy="${ORIGINAL}"]`);
        const next = el.querySelector<HTMLElement>(`[data-copy="${ORIGINAL + 1}"]`);
        return first && next ? next.offsetLeft - first.offsetLeft : 0;
      };

      const state: Row[] = tracks.map((el, r) => ({
        el,
        dir: r % 2 ? 1 : -1,
        width: measure(el),
        // Start with the original copy's middle at the middle of the screen.
        pos: 0,
        mult: 1,
        hovered: false,
        focused: false,
        nudge: null,
      }));

      // The original copy starts at viewport middle − (pos mod width), so it
      // can always be slid to put any of its cards at the middle.
      const render = (row: Row) => {
        if (!row.width) return;
        const vw = section.clientWidth;
        const x = vw / 2 - mod(row.pos, row.width) - ORIGINAL * row.width;
        row.el.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      };

      for (const row of state) {
        row.pos = row.width / 2;
        render(row);
      }

      const speed = TUNING.speed[mobile ? 1 : 0];
      let boost = 0;
      let lastY = window.scrollY;

      const tick = (_time: number, deltaMs: number) => {
        const dt = Math.min(deltaMs, 50) / 1000;
        if (!dt) return;
        const y = window.scrollY;
        const velocity = Math.abs(y - lastY) / dt;
        lastY = y;
        const target = Math.min(velocity * BOOST.gain, BOOST.max);
        const k = target > boost ? BOOST.rise : BOOST.fall;
        boost += (target - boost) * (1 - Math.exp(-dt * k));

        for (const row of state) {
          if (row.focused) continue;
          const want = row.hovered ? 0 : 1;
          row.mult += (want - row.mult) * (1 - Math.exp(-dt * 5));
          row.pos += row.dir * (speed + boost) * row.mult * dt;
          // Keep pos small so float precision never drifts.
          if (row.width) row.pos = mod(row.pos, row.width);
          render(row);
        }
      };

      let running = false;
      let onScreen = false;
      const sync = () => {
        const want = onScreen && document.visibilityState === "visible";
        if (want === running) return;
        running = want;
        if (want) {
          lastY = window.scrollY;
          boost = 0;
          gsap.ticker.add(tick);
        } else {
          gsap.ticker.remove(tick);
        }
      };

      const io = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting;
          sync();
        },
        { rootMargin: "10% 0px" },
      );
      io.observe(section);
      document.addEventListener("visibilitychange", sync);

      const ro = new ResizeObserver(() => {
        for (const row of state) {
          const width = measure(row.el);
          if (width && width !== row.width) {
            row.pos = row.width ? (row.pos / row.width) * width : width / 2;
            row.width = width;
          }
          render(row);
        }
      });
      ro.observe(section);

      const cleanups: (() => void)[] = [];
      for (const row of state) {
        const { el } = row;
        if (fine) {
          const enter = () => (row.hovered = true);
          const leave = () => (row.hovered = false);
          el.addEventListener("pointerenter", enter);
          el.addEventListener("pointerleave", leave);
          cleanups.push(() => {
            el.removeEventListener("pointerenter", enter);
            el.removeEventListener("pointerleave", leave);
          });
        }
        const focusIn = (e: FocusEvent) => {
          row.focused = true;
          const card = (e.target as HTMLElement).closest<HTMLElement>("li");
          const first = el.querySelector<HTMLElement>(`[data-copy="${ORIGINAL}"]`);
          if (!card || !first || !row.width) return;
          // Slide so the focused card's middle sits at the viewport middle.
          const target = mod(card.offsetLeft - first.offsetLeft + card.offsetWidth / 2, row.width);
          row.nudge?.kill();
          row.nudge = gsap.to(row, {
            pos: target,
            duration: 0.6,
            ease: "power3.out",
            onUpdate: () => render(row),
          });
        };
        const focusOut = (e: FocusEvent) => {
          if (el.contains(e.relatedTarget as Node | null)) return;
          row.focused = false;
          row.mult = 0; // ease back up from a standstill
        };
        el.addEventListener("focusin", focusIn);
        el.addEventListener("focusout", focusOut);
        cleanups.push(() => {
          el.removeEventListener("focusin", focusIn);
          el.removeEventListener("focusout", focusOut);
        });
      }

      return () => {
        gsap.ticker.remove(tick);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", sync);
        for (const fn of cleanups) fn();
        for (const row of state) {
          row.nudge?.kill();
          row.el.style.transform = "";
        }
      };
    });

    return () => mm.revert();
  }, [looping, rows]);

  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={labelledBy}
      data-looping={looping ? "" : undefined}
      className={cn(
        "zan-workwall relative flex flex-col overflow-clip bg-bg [perspective:1000px] [transform-style:preserve-3d]",
        className,
      )}
    >
      <div className="relative z-10">{header}</div>

      {/* data-reveal: without JavaScript the layout's noscript rule drops the
          server-rendered tilt, fall and fade, so the wall is never left faint. */}
      <motion.div data-reveal className="zan-workwall-plane relative" style={{ rotateX, rotateZ, y, opacity }}>
        {rows.map((row, r) => (
          <ul
            key={r}
            data-wall-track
            className="zan-workwall-row will-change-transform"
          >
            {Array.from({ length: looping ? COPIES : 1 }, (_, copy) => {
              const set = looping ? copy : ORIGINAL;
              const clone = set !== ORIGINAL;
              return row.map((card, c) => (
                <li
                  key={`${set}-${c}`}
                  data-copy={c === 0 ? set : undefined}
                  aria-hidden={clone || undefined}
                  inert={clone || undefined}
                  className={cn("zan-workwall-card", clone && "zan-workwall-clone")}
                >
                  {card}
                </li>
              ));
            })}
          </ul>
        ))}
      </motion.div>
    </section>
  );
}

export default HeroParallax;
