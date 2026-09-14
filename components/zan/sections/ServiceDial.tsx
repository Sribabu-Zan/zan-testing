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

   The pinned stage is a dial with three bands, and scrolling turns it:

     head    the scroll cue and the position readout, 02 / 04
     strip   the four names in giant type between two rulers of tick marks,
             the one on the centre tick full size and ink
     rail    four segments, one per area, with a brand bar sliding across them
     body    the four spreads on one horizontal track: the copy on the left,
             a plate of that area's disciplines on the right

   Three of those bands travel at their own rate, which is where the depth
   comes from. The strip moves by word widths, roughly half a screen per step.
   The body track moves a whole screen per step, so it is the near layer. Each
   plate then runs a tenth faster again than the spread it sits in, so the
   right-hand block leads the copy into and out of frame.

   The words are buttons. Clicking one, or using the arrow keys, Home or End
   while one has focus, scrolls the page to that area. Off-centre spreads are
   inert, so a keyboard never lands on a link that is off the side of the
   screen.

   With reduced motion nothing is pinned or transformed: the strip, rail and
   readout are gone, and the four spreads stack down the page in full.
   ─────────────────────────────────────────────────────────────────────────── */

const N = pillars.length;
/** Share of the pin spent resting on the first area, and again on the last. */
const HOLD = 0.14;
/** Scroll per step between areas, in viewport heights (%). */
const STEP_DESKTOP = 100;
const STEP_MOBILE = 70;
/** How much faster than its spread a plate travels: the dial's nearest layer. */
const PLATE_RATE = 0.1;
/** How far an off-centre spread fades back while it crosses the stage. */
const DEPTH_FADE = 0.85;
/** The spread holds full strength this far off the centre tick, then falls away. */
const DEPTH_HOLD = 0.06;
const DEPTH_SPAN = 0.55;

/* The taglines are two to four short sentences. Setting one per line is the
   page's own way with them, and it keeps the browser's line balancer from
   breaking a single sentence into something like "The Future / Is /
   Decentralized." The trailing space keeps the text extractable as one line. */
const sentences = (text: string) => text.split(/(?<=\.)\s+/);

/** Smooth 0 → 1 ramp, so a spread leaves and arrives without a hard edge. */
function smoothstep(x: number) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}
const EASE = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;
const pad = (n: number) => String(n).padStart(2, "0");

/** Each heading line rises out of its mask when the h2 comes into view. */
const LINE_RISE: Variants = {
  hidden: { y: "110%" },
  shown: (i: number) => ({ y: "0%", transition: { duration: 1.1, ease: EASE, delay: 0.06 + i * 0.08 } }),
};

const WORDS = pillars.map((p) => ({ id: p.id, label: p.title }));

/* Each area's plate gets its own ground, so the four read as four even at a
   glance and even mid-slide. All four are palette tokens, so they follow the
   region. Paper is the one warm neutral and is the same everywhere; gold
   brand-ink measures only 4.49:1 on it, so that plate's numeral stays ink. */
interface PlateTone {
  /** Ground and hairline of the plate. */
  plate: string;
  /** Rules between the disciplines. */
  rule: string;
  /** The big index numeral in the plate's corner. */
  numeral: string;
}

const TONES: Record<Pillar["id"], PlateTone> = {
  development: { plate: "border-brand/25 bg-brand-soft", rule: "border-ink/12", numeral: "text-brand-ink" },
  marketing: { plate: "border-ink/12 bg-paper", rule: "border-ink/12", numeral: "text-ink" },
  blockchain: { plate: "border-line-strong bg-surface-2", rule: "border-ink/12", numeral: "text-brand-ink" },
  designing: { plate: "border-line-strong bg-bg shadow-lift", rule: "border-line-strong", numeral: "text-brand-ink" },
};

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
      const stage = stageRef.current;
      const strip = stripRef.current;
      const body = bodyRef.current;
      const track = trackRef.current;
      if (!stage || !strip || !body || !track) return;

      const mm = gsap.matchMedia();
      mm.add({ motion: MQ.motion, desktop: MQ.desktop }, (context) => {
        const { motion: allowMotion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
        if (!allowMotion) return;

        const slides = gsap.utils.toArray<HTMLElement>("[data-dial-slide]", stage);
        const plates = gsap.utils.toArray<HTMLElement>("[data-dial-plate]", stage);
        const marker = stage.querySelector<HTMLElement>("[data-dial-marker]");

        let geo = measureRuler(strip);
        let width = body.clientWidth;
        const proxy = { s: 0 };

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
          plates.forEach((plate, k) => {
            plate.style.transform = `translate3d(${(k - s) * width * PLATE_RATE}px, 0, 0)`;
          });
          const next = Math.round(s);
          if (next !== activeRef.current) {
            activeRef.current = next;
            slides.forEach((slide, k) => {
              slide.inert = k !== next;
            });
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
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: remeasure,
          },
        });
        tl.to(proxy, { s: 0, duration: HOLD })
          .to(proxy, { s: N - 1, duration: 1 })
          .to(proxy, { s: N - 1, duration: HOLD });
        triggerRef.current = tl.scrollTrigger ?? null;

        slides.forEach((slide, k) => {
          slide.inert = k !== activeRef.current;
        });

        // A web font swapping in changes the word widths without a refresh,
        // and the stage's width decides how far the body track travels.
        const ro = new ResizeObserver(remeasure);
        geo.words.forEach((w) => ro.observe(w));
        ro.observe(body);
        remeasure();

        return () => {
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
    <section ref={sectionRef} id="expertise" aria-labelledby={`${uid}-title`} className="relative bg-bg">
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
        {/* The h2 is what is observed. Each line starts pushed below its own
            mask, so it is fully clipped, and an observer on the line itself
            would never see it enter. */}
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

      {/* With motion: the pinned dial, exactly one viewport tall, laid out from
          the top so nothing can be pushed up under the navbar. With reduced
          motion: an ordinary stack of four spreads. */}
      <div
        ref={stageRef}
        className="relative flex flex-col pt-12 pb-section motion-safe:h-svh motion-safe:overflow-clip motion-safe:pt-nav motion-safe:pb-[clamp(0.75rem,2.5vh,1.75rem)]"
      >
        <div
          aria-hidden="true"
          className="container-zan flex items-center justify-between gap-6 pb-[clamp(0.5rem,1.6vh,1rem)] motion-reduce:hidden"
        >
          <p className="inline-flex items-center gap-2 font-mono text-eyebrow text-muted uppercase">
            Scroll
            <ArrowRight className="size-3.5" strokeWidth={1.8} />
          </p>
          <p className="font-mono text-eyebrow text-muted tabular-nums">
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
          className="motion-reduce:hidden"
          wordSize="min(max(1.9rem, 6.4vw), 6.5rem, 11.5vh)"
          linesClassName="h-4 sm:h-5"
        />

        {/* The scale: four segments, one per area, with a brand bar that runs
            across them as the dial turns. A readout, not a control — the words
            on the strip above already are the controls. */}
        <div aria-hidden="true" className="container-zan pt-[clamp(0.6rem,1.8vh,1.1rem)] motion-reduce:hidden">
          <div className="relative grid grid-cols-4">
            <span data-dial-marker="" className="absolute -top-px left-0 h-0.5 w-1/4 bg-brand" />
            {pillars.map((pillar, i) => (
              <p
                key={pillar.id}
                data-active={i === active ? "true" : "false"}
                className="truncate border-t border-line pt-2.5 pr-3 font-mono text-eyebrow text-muted uppercase transition-colors duration-300 data-[active=true]:text-ink"
              >
                <span className="tabular-nums">{pillar.index}</span>
                <span className="hidden sm:inline"> · {pillar.title}</span>
              </p>
            ))}
          </div>
        </div>

        <div
          ref={bodyRef}
          className="zan-dial-body pt-[clamp(1.25rem,3.2vh,2.25rem)] motion-safe:min-h-0 motion-safe:flex-1"
        >
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
 * One area's spread: the copy on the left, its disciplines on a plate on the
 * right. With motion the four sit side by side on the body track and only the
 * one on the centre tick is live; with reduced motion they stack down the page.
 */
function DialSpread({ id, pillar, tone, href }: { id: string; pillar: Pillar; tone: PlateTone; href: string }) {
  const titleId = `${id}-title`;
  return (
    <article id={id} data-dial-slide="" aria-labelledby={titleId} className="zan-dial-slide">
      <div className="container-zan grid gap-x-12 gap-y-7 motion-safe:h-full lg:grid-cols-12 lg:gap-y-0">
        <div className="flex flex-col justify-between gap-6 lg:col-span-6 lg:gap-[clamp(1rem,3vh,2rem)]">
          <div className="flex items-center gap-4">
            <ZanIcon name={pillar.icon} className="size-5 shrink-0 text-brand-ink" />
            <span className="font-mono text-eyebrow text-brand-ink tabular-nums">{pillar.index}</span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </div>

          <div>
            {/* With motion the strip already carries the name in giant type, so
                here it is for screen readers only and the tagline is the big
                line. With reduced motion there is no strip, so the name is the
                display line and the tagline steps down under it. */}
            <h3 id={titleId} className="font-display text-h1 text-ink motion-safe:sr-only">
              {pillar.title}
            </h3>
            <p className="font-display text-h2 text-ink motion-safe:lg:text-[min(var(--text-display),8.5vh)] motion-safe:lg:leading-[1] motion-reduce:mt-4">
              {sentences(pillar.tagline).map((line, i, all) => (
                <span key={line} className="block">
                  {line}
                  {i < all.length - 1 ? " " : null}
                </span>
              ))}
            </p>
            <p className="mt-4 max-w-[38ch] text-body text-ink-2 lg:mt-[clamp(0.75rem,2.5vh,1.75rem)] lg:text-lead">
              {pillar.description}
            </p>
          </div>

          <ButtonLink variant="secondary" href={href} arrow className="self-start">
            Explore {pillar.title}
          </ButtonLink>
        </div>

        <div data-dial-plate="" className="zan-dial-plate lg:col-span-5 lg:col-start-8">
          <div
            className={`flex h-full flex-col rounded-3xl border px-5 py-5 sm:px-8 sm:py-7 ${tone.plate}`}
          >
            <div className="hidden items-start justify-between gap-4 pb-4 sm:flex">
              <p className="font-mono text-eyebrow text-ink-2 uppercase">
                {pad(pillar.items.length)} disciplines
              </p>
              <p aria-hidden="true" className={`font-display leading-[0.8] tabular-nums ${tone.numeral}`}
                 style={{ fontSize: "clamp(2.25rem, 6.5vh, 3.75rem)" }}>
                {pillar.index}
              </p>
            </div>
            <ul
              aria-label={`${pillar.title} disciplines`}
              className="flex min-h-0 flex-1 flex-col"
            >
              {pillar.items.map((item, i) => (
                <li
                  key={item}
                  className={`flex flex-1 items-center gap-4 border-t py-2.5 sm:py-3 ${tone.rule}`}
                >
                  <span className="font-mono text-eyebrow text-ink-2 tabular-nums">{pad(i + 1)}</span>
                  <span className="text-body font-medium text-ink sm:text-h3">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}
