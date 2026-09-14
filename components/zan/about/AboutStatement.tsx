"use client";

import { Fragment, useRef } from "react";
import { motion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { about } from "@/constants/zan";
import { gsap, MQ } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import "./about.css";

const EASE = [0.16, 1, 0.3, 1] as const;

type Word = { text: string; accent: boolean };
const words = (text: string, accent = false): Word[] =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({ text: w, accent }));

/** The one phrase that resolves to brand ink instead of ink. If the copy ever
 *  stops containing it, nothing is highlighted and nothing breaks. */
const ACCENT = "weekly progress and a live staging environment";

function withAccent(text: string, phrase: string): Word[] {
  const at = phrase ? text.indexOf(phrase) : -1;
  if (at === -1) return words(text);
  return [
    ...words(text.slice(0, at)),
    ...words(phrase, true),
    ...words(text.slice(at + phrase.length)),
  ];
}

// The statement: body[1] then body[0].
const lead: Word[] = withAccent(about.body[1], ACCENT);
const follow: Word[] = words(about.body[0]);

function Words({ list }: { list: Word[] }) {
  return list.map((w, i) => (
    <Fragment key={i}>
      <span className="zan-about-word" data-accent={w.accent || undefined}>
        {w.text}
      </span>{" "}
    </Fragment>
  ));
}

/**
 * The big statement, scrubbed from faint to ink word by word as it scrolls
 * through (Apple's Performance section), then the four facts as a hairline row.
 * Assistive tech reads the sr-only copy once; the word spans are hidden.
 */
export function AboutStatement() {
  const root = useRef<HTMLDivElement>(null);
  const statement = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const el = statement.current;
        if (!el) return;
        gsap.fromTo(
          el.querySelectorAll(".zan-about-word"),
          { "--zan-ink": 0 },
          {
            "--zan-ink": 1,
            ease: "none",
            duration: 0.6,
            stagger: 0.06,
            scrollTrigger: {
              trigger: el,
              start: "top 82%",
              end: "bottom 52%",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="container-zan pt-[clamp(4rem,9vw,9rem)] pb-section">
      <div ref={statement}>
        <p className="sr-only">{about.body[1]}</p>
        <p className="sr-only">{about.body[0]}</p>
        <div aria-hidden="true">
          <p className="max-w-[30ch] font-sans text-[clamp(1.75rem,0.95rem+3.1vw,4rem)] leading-[1.08] font-semibold tracking-[-0.035em] text-balance">
            <Words list={lead} />
          </p>
          <p className="mt-[clamp(2rem,4vw,3.5rem)] max-w-[44ch] font-sans text-[clamp(1.25rem,0.95rem+1.2vw,2.125rem)] leading-[1.28] font-medium tracking-[-0.02em] lg:ml-[33.333%]">
            <Words list={follow} />
          </p>
        </div>
      </div>

      <motion.dl
        className="mt-[clamp(4rem,8vw,7rem)] grid grid-cols-2 border-y border-line lg:grid-cols-4"
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.08 } } }}
      >
        {about.principles.map((p, i) => (
          <motion.div
            key={p.label}
            data-reveal
            variants={{
              hidden: { opacity: 0, y: 24 },
              shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
            }}
            className={cn(
              "border-line py-7 pr-4 lg:py-9 lg:pr-6",
              i % 2 === 1 && "border-l pl-5",
              i >= 2 && "border-t lg:border-t-0",
              i > 0 && "lg:border-l lg:pl-6",
            )}
          >
            <dt className="font-mono text-eyebrow text-muted uppercase">{p.label}</dt>
            <dd className="mt-3 text-h3 text-ink">{p.value}</dd>
          </motion.div>
        ))}
      </motion.dl>
    </div>
  );
}
