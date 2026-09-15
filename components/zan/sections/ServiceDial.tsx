"use client";

import { useId, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap, MQ, type ScrollTrigger } from "@/lib/gsap";
import { getLenis } from "@/hooks/useLenis";
import { useSiteHref } from "@/lib/useSiteHref";
import { measureRuler, positionRuler, RulerStrip } from "@/components/ui/ruler-carousel";
import { ButtonLink } from "@/components/zan/ui/Button";
import { Eyebrow } from "@/components/zan/ui/Eyebrow";
import { ZanIcon } from "@/components/zan/ui/icons";
import { pillars, pillarsIntro, type Pillar } from "@/constants/zan";
import "@/components/zan/services/dial.css";

/* ───────────────────────────────────────────────────────────────────────────
   SERVICE DIAL: the four areas of work, read sideways off one instrument.

     head    the scroll cue and the position readout, 02 / 04
     scale   the four names between two rulers of tick marks, the one on the
             centre tick full size and ink. It slides with scroll progress and
             is the section's main event, at every width.
     rail    four segments, one per area, with a brand bar sliding across them
     body    the four spreads on one horizontal track: the copy, and a plate
             of that area's disciplines beside it (below it on a phone)

   pin     motion allowed and a screen at least 540px tall, phones included.
           The stage is pinned one small-viewport tall and vertical scrolling
           turns the dial; scrolling back up turns it back. On a wheel or
           trackpad a sideways gesture does exactly what vertical scrolling
           does: right (deltaX > 0) is down, left is up. Off-centre spreads
           are inert.
   stack   reduced motion, or a screen too short to pin (a phone held
           sideways). The scale, rail and readout are gone and the four
           spreads stack down the page in full. See dial.css.
   ─────────────────────────────────────────────────────────────────────────── */

/** Mirrors the pin media query in dial.css. */
const PIN_MQ = `${MQ.motion} and (min-height: 540px)`;
const N = pillars.length;
/** Share of the pin spent resting on the first area, and again on the last. */
const HOLD = 0.14;
/** Scroll per step between areas, in viewport heights (%). */
const STEP_DESKTOP = 100;
const STEP_MOBILE = 85;
/** How much faster than its spread a plate travels on desktop: the nearest layer. */
const PLATE_RATE = 0.08;
/** How far an off-centre spread fades back while it crosses the stage. */
const DEPTH_FADE = 0.85;
/** The spread holds full strength this far off the centre tick, then falls away. */
const DEPTH_HOLD = 0.06;
const DEPTH_SPAN = 0.55;

/* The taglines are two to four short sentences, set one per line from a
   small tablet up. The trailing space keeps the text extractable as one line. */
const sentences = (text: string) => text.split(/(?<=\.)\s+/);

/** Smooth 0 → 1 ramp, so a spread leaves and arrives without a hard edge. */
function smoothstep(x: number) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}
const EASE = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;
const pad = (n: number) => String(n).padStart(2, "0");
const clampIndex = (i: number) => Math.min(N - 1, Math.max(0, i));

/** Each heading line rises out of its mask when the h2 comes into view. */
const LINE_RISE: Variants = {
  hidden: { y: "110%" },
  shown: (i: number) => ({ y: "0%", transition: { duration: 1.1, ease: EASE, delay: 0.06 + i * 0.08 } }),
};

const WORDS = pillars.map((p) => ({ id: p.id, label: p.title }));

/* Each area's plate gets its own ground, so the four read as four even at a
   glance and even mid-slide. All four are palette tokens, so they follow the
   region. Gold brand-ink measures only 4.49:1 on paper, so that plate's
   numeral stays ink. */
interface PlateTone {
  plate: string;
  rule: string;
  numeral: string;
}

const TONES: Record<Pillar["id"], PlateTone> = {
  development: { plate: "border-brand/25 bg-brand-soft", rule: "border-ink/12", numeral: "text-brand-ink" },
  marketing: { plate: "border-ink/12 bg-paper", rule: "border-ink/12", numeral: "text-ink" },
  blockchain: { plate: "border-line-strong bg-surface-2", rule: "border-ink/12", numeral: "text-brand-ink" },
  designing: { plate: "border-line-strong bg-bg shadow-lift", rule: "border-line-strong", numeral: "text-brand-ink" },
};

type LenisWheel = WheelEvent & { lenisStopPropagation?: boolean };

export function ServiceDial() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const activeRef = useRef(0);
  const resolve = useSiteHref();
  const uid = useId();
  const cardId = (i: number) => `${uid}-card-${pillars[i].id}`;

  useGSAP(
    () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      const strip = stripRef.current;
      const body = bodyRef.current;
      const track = trackRef.current;
      if (!section || !stage || !strip || !body || !track) return;

      const mm = gsap.matchMedia();
      mm.add({ pin: PIN_MQ, desktop: MQ.desktop }, (context) => {
        const { pin, desktop } = context.conditions as { pin: boolean; desktop: boolean };
        if (!pin) return;

        const slides = gsap.utils.toArray<HTMLElement>("[data-dial-slide]", stage);
        const plates = gsap.utils.toArray<HTMLElement>("[data-dial-plate]", stage);
        const marker = stage.querySelector<HTMLElement>("[data-dial-marker]");
        const plateRate = desktop ? PLATE_RATE : 0;

        let geo = measureRuler(strip);
        let width = body.clientWidth;
        const proxy = { s: 0 };

        const setInert = (next: number) =>
          slides.forEach((slide, k) => {
            slide.inert = k !== next;
          });

        /** One frame of the dial: every band placed from the same position. */
        const apply = () => {
          const s = proxy.s;
          positionRuler(geo, s);
          track.style.transform = `translate3d(${-s * width}px, 0, 0)`;
          if (marker) marker.style.transform = `translate3d(${s * 100}%, 0, 0)`;
          slides.forEach((slide, k) => {
            const away = smoothstep((Math.abs(k - s) - DEPTH_HOLD) / DEPTH_SPAN);
            slide.style.opacity = String(1 - DEPTH_FADE * away);
          });
          if (plateRate) {
            plates.forEach((plate, k) => {
              plate.style.transform = `translate3d(${(k - s) * width * plateRate}px, 0, 0)`;
            });
          }
          const next = clampIndex(Math.round(s));
          if (next !== activeRef.current) {
            activeRef.current = next;
            setInert(next);
            setActive(next);
          }
        };

        const remeasure = () => {
          geo = measureRuler(strip);
          width = body.clientWidth;
          stage.style.setProperty("--zan-dial-w", `${width}px`);
          apply();
        };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: apply,
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: `+=${(N - 1) * (desktop ? STEP_DESKTOP : STEP_MOBILE)}%`,
            pin: true,
            scrub: desktop ? 0.6 : 0.4,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: remeasure,
          },
        });
        tl.to(proxy, { s: 0, duration: HOLD })
          .to(proxy, { s: N - 1, duration: 1 })
          .to(proxy, { s: N - 1, duration: HOLD });
        const st = tl.scrollTrigger ?? null;
        triggerRef.current = st;
        setInert(activeRef.current);

        /* Sideways wheel = vertical wheel. Only while the page is inside the
           pin, only for gestures more sideways than vertical, and only those
           are cancelled, so vertical scrolling and the rest of the page are
           untouched. Lenis is told to skip the event and is driven with the
           sideways delta instead. */
        const onWheel = (e: WheelEvent) => {
          if (e.ctrlKey || !st) return;
          const lenis = getLenis();
          const y = lenis ? lenis.targetScroll : window.scrollY;
          if (y < st.start - 1 || y > st.end + 1) return;
          const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
          const dx = e.deltaX * unit;
          if (Math.abs(dx) <= Math.abs(e.deltaY * unit)) return;
          e.preventDefault();
          (e as LenisWheel).lenisStopPropagation = true;
          if (lenis) {
            lenis.scrollTo(lenis.targetScroll + dx, {
              programmatic: false,
              lerp: lenis.options.lerp,
              duration: lenis.options.duration,
              easing: lenis.options.easing,
            });
          } else {
            window.scrollBy(0, dx);
          }
        };
        section.addEventListener("wheel", onWheel, { passive: false });

        // A web font swapping in changes the word widths without a refresh,
        // and the stage's width decides how far the body track travels.
        const ro = new ResizeObserver(remeasure);
        geo.words.forEach((w) => ro.observe(w));
        ro.observe(body);
        remeasure();

        return () => {
          section.removeEventListener("wheel", onWheel);
          ro.disconnect();
          triggerRef.current = null;
          stage.style.removeProperty("--zan-dial-w");
          track.style.transform = "";
          if (marker) marker.style.transform = "";
          slides.forEach((slide) => {
            slide.inert = false;
            slide.style.opacity = "";
          });
          plates.forEach((plate) => {
            plate.style.transform = "";
          });
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  /** Scrolls the page to the point in the pin where area i sits on the centre tick. */
  const pick = (i: number) => {
    const st = triggerRef.current;
    if (!st) {
      activeRef.current = i;
      setActive(i);
      return;
    }
    const progress = (HOLD + i / (N - 1)) / (1 + 2 * HOLD);
    const y = st.start + progress * (st.end - st.start);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section ref={sectionRef} id="expertise" aria-labelledby={`${uid}-title`} className="zan-dial relative bg-bg">
      <div className="container-zan flex flex-col items-center pt-section text-center">
        <motion.div
          data-reveal
          className="text-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <Eyebrow>{pillarsIntro.eyebrow}</Eyebrow>
        </motion.div>
        {/* The h2 is what is observed: each line starts fully clipped below
            its own mask, so an observer on the line would never see it. */}
        <motion.h2
          id={`${uid}-title`}
          aria-label={pillarsIntro.title.join(" ")}
          className="mt-5 font-display text-h2 text-balance"
          initial="hidden"
          whileInView="shown"
          viewport={VIEWPORT}
        >
          {pillarsIntro.title.map((line, i) => (
            <span key={i} aria-hidden="true" className="-mb-[0.1em] block overflow-hidden pb-[0.1em]">
              <motion.span data-reveal className="block" variants={LINE_RISE} custom={i}>
                {line}
              </motion.span>
            </span>
          ))}
        </motion.h2>
        <motion.p
          data-reveal
          className="mt-5 max-w-[54ch] text-body text-ink-2"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
        >
          {pillarsIntro.lead}
        </motion.p>
      </div>

      {/* pin: one small-viewport tall, laid out from below the navbar (dial.css).
          stack: ordinary flow. */}
      <div ref={stageRef} className="zan-dial-stage relative flex w-full flex-col pt-12 pb-section">
        <div
          aria-hidden="true"
          className="zan-dial-chrome container-zan flex items-center justify-between gap-6 pb-2.5 lg:pb-[clamp(0.5rem,1.4vh,0.875rem)]"
        >
          <p className="inline-flex items-center gap-2 font-mono text-eyebrow text-muted uppercase">
            Scroll
            <ArrowRight className="size-3.5 rotate-90" strokeWidth={1.8} />
          </p>
          <p className="font-mono text-eyebrow text-ink-2 tabular-nums">
            {pad(active + 1)} / {pad(N)}
          </p>
        </div>

        <RulerStrip
          rootRef={stripRef}
          items={WORDS}
          active={active}
          onPick={pick}
          label="Areas of expertise"
          idPrefix={uid}
          controlsOf={cardId}
          className="zan-dial-chrome"
          wordSize="var(--zan-dial-word)"
          linesClassName="h-5 sm:h-6 lg:h-4"
        />

        {/* The rail: four segments with a brand bar that runs across them as
            the dial turns. The words above are the accessible controls; these
            are pointer shortcuts to the same thing. */}
        <div aria-hidden="true" className="zan-dial-chrome container-zan pt-2.5 lg:pt-[clamp(0.5rem,1.4vh,0.875rem)]">
          <div className="relative grid grid-cols-4">
            <span data-dial-marker="" className="absolute -top-px left-0 h-0.5 w-1/4 bg-brand" />
            {pillars.map((pillar, i) => (
              <button
                key={pillar.id}
                type="button"
                tabIndex={-1}
                onClick={() => pick(i)}
                data-active={i === active ? "true" : "false"}
                className="min-h-11 cursor-pointer truncate border-t border-line pt-2 pr-3 text-left font-mono text-eyebrow text-muted uppercase transition-colors duration-300 hover:text-ink-2 data-[active=true]:text-ink lg:pt-2.5"
              >
                <span className="tabular-nums">{pillar.index}</span>
                <span className="hidden lg:inline"> · {pillar.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div ref={bodyRef} className="zan-dial-body w-full pt-6 sm:pt-8">
          <div ref={trackRef} className="zan-dial-track">
            {pillars.map((pillar, i) => (
              <DialSpread
                key={pillar.id}
                id={cardId(i)}
                pillar={pillar}
                tone={TONES[pillar.id]}
                href={resolve(pillar.href)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * One area's spread: the copy, and its disciplines on a plate beside it
 * (below it on a phone).
 */
function DialSpread({ id, pillar, tone, href }: { id: string; pillar: Pillar; tone: PlateTone; href: string }) {
  const titleId = `${id}-title`;
  return (
    <article id={id} data-dial-slide="" aria-labelledby={titleId} className="zan-dial-slide">
      <div className="zan-dial-grid container-zan grid gap-y-4 sm:gap-y-6 md:grid-cols-2 md:items-center md:gap-x-10 lg:grid-cols-12 lg:gap-x-12">
        <div className="flex min-w-0 flex-col lg:col-span-6">
          <div className="flex items-center gap-3">
            <ZanIcon name={pillar.icon} className="size-4.5 shrink-0 text-brand-ink lg:size-5" />
            <span className="font-mono text-eyebrow text-brand-ink tabular-nums">{pillar.index}</span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </div>

          {/* When pinned the scale carries the name, so here it is for screen
              readers only and the tagline is the headline (dial.css). */}
          <h3 id={titleId} className="zan-dial-name mt-5 font-display text-h1 text-ink">
            {pillar.title}
          </h3>
          <p className="mt-3 font-display text-[clamp(1.5rem,1.1rem+1.9vw,2.25rem)] leading-[1.1] text-ink lg:mt-[clamp(1rem,2.6vh,1.75rem)] lg:text-[min(clamp(2rem,0.9rem+1.9vw,3rem),6vh)] lg:leading-[1.06]">
            {sentences(pillar.tagline).map((line, i, all) => (
              <span key={line} className="sm:block">
                {line}
                {i < all.length - 1 ? " " : null}
              </span>
            ))}
          </p>
          <p className="zan-dial-lead mt-2 max-w-[40ch] text-small text-ink-2 sm:mt-3 sm:text-body lg:mt-[clamp(0.75rem,2vh,1.25rem)] lg:text-lead">
            {pillar.description}
          </p>

          <ButtonLink
            variant="secondary"
            href={href}
            arrow
            className="mt-4 self-start sm:mt-5 lg:mt-[clamp(1.25rem,3.2vh,2.25rem)]"
          >
            Explore {pillar.title}
          </ButtonLink>
        </div>

        <div data-dial-plate="" className="zan-dial-plate min-w-0 lg:col-span-5 lg:col-start-8">
          <div
            className={`flex flex-col rounded-2xl border px-4 py-3 sm:px-7 sm:py-6 lg:rounded-3xl lg:px-8 lg:py-[clamp(1.25rem,3vh,2rem)] ${tone.plate}`}
          >
            <div className="flex items-end justify-between gap-4 pb-2 sm:pb-3 lg:pb-4">
              <p className="font-mono text-eyebrow text-ink-2 uppercase">{pad(pillar.items.length)} disciplines</p>
              <p
                aria-hidden="true"
                className={`font-display text-[clamp(1.5rem,1rem+1.8vw,2.75rem)] leading-[0.8] tabular-nums ${tone.numeral}`}
              >
                {pillar.index}
              </p>
            </div>
            <ul aria-label={`${pillar.title} disciplines`} className="flex flex-col">
              {pillar.items.map((item, i) => (
                <li
                  key={item}
                  className={`flex items-center gap-3 border-t py-2 sm:gap-4 sm:py-3 lg:py-[clamp(0.625rem,1.6vh,0.95rem)] ${tone.rule}`}
                >
                  <span className="w-5 shrink-0 font-mono text-eyebrow text-ink-2 tabular-nums">{pad(i + 1)}</span>
                  <span className="text-[0.9375rem] font-medium text-ink sm:text-body lg:text-[1.0625rem] xl:text-lg">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}
