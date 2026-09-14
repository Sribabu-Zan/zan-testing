"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { techDomains, techIntro, techLogos } from "@/constants/zan";
import { SectionHeading } from "@/components/zan/ui/SectionHeading";
import { useMediaQuery } from "@/components/zan/process/useMediaQuery";
import { MQ } from "@/lib/gsap";
import "./tech.css";

/* ───────────────────────────────────────────────────────────────────────────
   TECH MORPH — the reference's scroll-morph ring, carrying Zan's stack.

   When the section comes into view the logo plates scatter, snap into a line
   and close into a ring around the heading (a timed intro). Scrolling then
   morphs the ring into a wide arc along the bottom of the stage and turns it;
   the pointer adds parallax, hovering pauses the drift and flips a plate to
   its tool name and domain.

   The stage is decoration — aria-hidden — and the heading sits in it as real
   text. The same stack is listed accessibly in the domain grid below.

   One rAF loop writes every plate's transform directly (no React render per
   frame), and it only runs while the section is on screen. Reduced motion
   gets a static wall of plates instead.
   ─────────────────────────────────────────────────────────────────────────── */

/** Tools that sit outside the eight engineering domains. */
const EXTRA_DOMAIN: Record<string, string> = { Flask: "Backend", Figma: "Design", "Adobe XD": "Design" };

const TOOLS = Object.entries(techLogos).map(([name, src]) => ({
  name,
  src,
  domain: techDomains.find((d) => d.stack.includes(name))?.label ?? EXTRA_DOMAIN[name] ?? "",
}));
const N = TOOLS.length;

/** Slot of each plate in the ring: every plate on desktop, every other one on phones. */
const SLOT_DESKTOP = TOOLS.map((_, i) => i);
const SLOT_MOBILE = TOOLS.map((_, i) => (i % 2 === 0 ? i / 2 : -1));
const N_MOBILE = Math.ceil(N / 2);

/** Deterministic hash, so the scatter never differs between renders. */
function seeded(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
const SCATTER = TOOLS.map((_, i) => ({
  x: (seeded(i + 1) - 0.5) * 1500,
  y: (seeded(i + 61) - 0.5) * 1000,
  r: (seeded(i + 131) - 0.5) * 180,
}));

/** Plate size in px — must match the size classes on .zan-tech-card. */
const GEO = {
  desktop: { card: 60, arcScale: 1.6, spread: 130 },
  mobile: { card: 40, arcScale: 1.35, spread: 110 },
};
const NAV = 72;

/** Intro timing (ms): scatter → line → ring, with a small ripple per plate. */
const LINE_AT = 350;
const RING_AT = 1700;
const STAGGER = 14;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function Plate({ src }: { src: string }) {
  return (
    <div className="relative size-full">
      <Image src={src} alt="" fill sizes="(max-width: 767px) 56px, 112px" className="object-contain" draggable={false} />
    </div>
  );
}

function Heading() {
  return (
    <SectionHeading
      align="center"
      size="h2"
      eyebrow={techIntro.eyebrow}
      title={techIntro.title}
      lead={techIntro.lead}
      leadClassName="mt-4 text-body"
    />
  );
}

function MorphStage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    const text = textRef.current;
    const deck = deckRef.current;
    if (!wrap || !stage || !text || !deck) return;

    const cards = Array.from(deck.children) as HTMLElement[];
    const fine = window.matchMedia(MQ.fine).matches;
    const size = { w: stage.clientWidth, h: stage.clientHeight, textH: text.offsetHeight };
    const ro = new ResizeObserver(() => {
      size.w = stage.clientWidth;
      size.h = stage.clientHeight;
      size.textH = text.offsetHeight;
    });
    ro.observe(stage);
    ro.observe(text);

    // Each plate's current state, eased toward its target every frame.
    const st = SCATTER.map((s) => ({ x: s.x, y: s.y, r: s.r, s: 0.6, o: 0, ax: Number.NaN, hidden: false }));
    let morph = 0;
    let turn = 0;
    let par = 0;
    let parTarget = 0;
    let drift = 0;
    let paused = false;
    let raf = 0;
    let last = 0;
    let introStart = -1;

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      parTarget = (((e.clientX - r.left) / r.width) * 2 - 1) * 100;
    };
    const onEnter = () => {
      paused = true;
    };
    const onLeave = () => {
      paused = false;
      parTarget = 0;
    };
    if (fine) {
      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerenter", onEnter);
      stage.addEventListener("pointerleave", onLeave);
    }

    const frame = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      if (introStart < 0) introStart = now;
      const t = now - introStart;

      const { w, h } = size;
      const mobile = w < 768;
      const g = mobile ? GEO.mobile : GEO.desktop;
      const slots = mobile ? SLOT_MOBILE : SLOT_DESKTOP;
      const n = mobile ? N_MOBILE : N;

      // Scroll progress through the sticky range.
      const rect = wrap.getBoundingClientRect();
      const range = rect.height - h;
      const p = range > 0 ? clamp01(-rect.top / range) : 0;

      const k = 1 - Math.exp(-dt / 110);
      morph += (smoothstep(0.02, 0.4, p) - morph) * k;
      turn += (clamp01((p - 0.4) / 0.6) - turn) * k;
      par += (parTarget - par) * (1 - Math.exp(-dt / 260));
      if (morph > 0.95 && !paused) drift += dt * 0.004;

      const cx = w / 2;
      const cy = mobile ? h * 0.62 : h / 2;
      const ringR = mobile ? Math.min(w * 0.4, 170) : Math.min(Math.min(w, h) * 0.38, 360);
      const arcR = Math.min(w, h * 1.5) * (mobile ? 1.35 : 1.1);
      const arcCY = (mobile ? h * 0.86 : h * 0.76) - cy + arcR;
      const spread = g.spread;
      const startA = -90 - spread / 2;
      const stepA = spread / (n - 1);
      const shift = -(turn * spread * 0.8) - drift;
      const spacing = mobile ? g.card * 1.1 : Math.min(g.card * 1.12, (w * 0.94) / n);
      const lineScale = Math.min(1, spacing / (g.card * 1.08));
      const scatterScale = Math.min(1, w / 1440);
      const half = g.card / 2;
      const kc = 1 - Math.exp(-dt / 170);

      for (let i = 0; i < N; i++) {
        const el = cards[i];
        const c = st[i];
        const j = slots[i];
        if (j < 0) {
          if (!c.hidden) {
            el.style.visibility = "hidden";
            c.hidden = true;
          }
          continue;
        }
        if (c.hidden) {
          el.style.visibility = "";
          c.hidden = false;
        }

        const phase = t - j * STAGGER;
        let tx: number;
        let ty: number;
        let tr: number;
        let ts: number;
        let to: number;
        let jump = false;

        if (phase < LINE_AT) {
          const s = SCATTER[i];
          tx = s.x * scatterScale;
          ty = s.y * scatterScale;
          tr = s.r;
          ts = 0.6;
          to = 0;
        } else if (phase < RING_AT) {
          tx = j * spacing - ((n - 1) * spacing) / 2;
          // On desktop the heading sits at the ring's centre: run the line
          // just below it rather than through it.
          ty = mobile ? 0 : size.textH / 2 + g.card;
          tr = 0;
          ts = lineScale;
          to = 1;
        } else {
          const ca = (j / n) * 360;
          const cr = (ca * Math.PI) / 180;
          const wrapped = (((j * stepA + shift) % spread) + spread) % spread;
          const aa = startA + wrapped;
          const ar = (aa * Math.PI) / 180;
          const edge = wrapped < 10 ? wrapped / 10 : wrapped > spread - 10 ? (spread - wrapped) / 10 : 1;
          const ax = Math.cos(ar) * arcR + par;
          // A plate wrapping from one end of the arc to the other snaps
          // across (it is transparent there) instead of flying over the stage.
          if (!Number.isNaN(c.ax) && Math.abs(ax - c.ax) > w * 0.5) jump = true;
          c.ax = ax;
          tx = lerp(Math.cos(cr) * ringR, ax, morph);
          ty = lerp(Math.sin(cr) * ringR, Math.sin(ar) * arcR + arcCY, morph);
          tr = lerp(ca + 90, aa + 90, morph);
          ts = lerp(1, g.arcScale, morph);
          to = lerp(1, edge, morph);
        }

        if (jump && morph > 0.5) {
          c.x = tx;
          c.y = ty;
          c.r = tr;
          c.o = to;
        } else {
          c.x += (tx - c.x) * kc;
          c.y += (ty - c.y) * kc;
          c.r += (tr - c.r) * kc;
          c.o += (to - c.o) * kc;
        }
        c.s += (ts - c.s) * kc;

        el.style.transform = `translate3d(${(cx + c.x - half).toFixed(1)}px, ${(cy + c.y - half).toFixed(1)}px, 0) rotate(${c.r.toFixed(2)}deg) scale(${c.s.toFixed(3)})`;
        el.style.opacity = c.o.toFixed(3);
      }

      // Desktop: the heading rises out of the ring as it opens into the arc.
      if (!mobile) {
        const rise = Math.max(0, cy - (NAV + 28 + size.textH / 2));
        text.style.transform = `translate3d(0, ${(-rise * morph).toFixed(1)}px, 0)`;
      } else if (text.style.transform) {
        text.style.transform = "";
      }

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    // The intro starts when the section is actually on screen, not on load.
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), {
      rootMargin: "0px 0px -15% 0px",
    });
    io.observe(wrap);

    return () => {
      io.disconnect();
      ro.disconnect();
      stop();
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerenter", onEnter);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative h-[150vh] md:h-[240vh]">
      <div
        ref={stageRef}
        className="sticky top-0 h-svh w-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_86%,transparent)]"
      >
        <div ref={deckRef} aria-hidden="true" className="absolute inset-0">
          {TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="zan-tech-card absolute left-0 top-0 size-10 opacity-0 will-change-transform md:size-[60px]"
            >
              <div className="zan-tech-card-inner relative size-full">
                <div className="zan-tech-face absolute inset-0 rounded-xl bg-bg p-1.5 shadow-lift ring-1 ring-line md:rounded-2xl md:p-2.5">
                  <Plate src={tool.src} />
                </div>
                <div className="zan-tech-face zan-tech-back absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-brand-gradient px-1 text-center text-on-brand md:rounded-2xl">
                  <span className="text-[7px] font-semibold leading-tight md:text-[9px]">{tool.name}</span>
                  {tool.domain && (
                    <span className="mt-0.5 font-mono text-[5.5px] uppercase leading-none tracking-[0.12em] md:text-[7px]">
                      {tool.domain}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          ref={textRef}
          className="pointer-events-none absolute left-1/2 top-[5.5rem] w-[min(34rem,calc(100%-2.5rem))] -translate-x-1/2 will-change-transform md:top-1/2 md:-translate-y-1/2"
        >
          <Heading />
        </div>
      </div>
    </div>
  );
}

/** Reduced motion: the heading, then every plate at rest. */
function StaticTech() {
  return (
    <div className="container-zan pt-section">
      <Heading />
      <ul aria-hidden="true" className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-3">
        {TOOLS.map((tool) => (
          <li key={tool.name} className="relative size-14 rounded-2xl bg-bg p-2.5 shadow-lift ring-1 ring-line">
            <Plate src={tool.src} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TechMorph() {
  const reduce = useMediaQuery(MQ.reduce);
  return reduce ? <StaticTech /> : <MorphStage />;
}
