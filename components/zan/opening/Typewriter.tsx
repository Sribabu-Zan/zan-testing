"use client";

import { useEffect, useReducer, useRef } from "react";
import { usePreloaded } from "@/components/zan/shell/shellStore";
import { MQ } from "@/lib/gsap";
import { useMedia, useOnScreen } from "./hooks";

/* ───────────────────────────────────────────────────────────────────────────
   The h1's second line: type, pause, delete, next — the old site's rhythm.

   The server renders the first word in full, so the headline is complete
   and stable in the HTML (it is the page's LCP element). Typing starts only
   once the preloader has uncovered the page, holds the first word a beat
   first, and stops while the hero is off screen.

   The whole line is aria-hidden: the h1 carries the full sentence in an
   sr-only span, so a screen reader hears it once rather than letter by
   letter. Reduced motion: no typing and no caret, just the first word.
   ─────────────────────────────────────────────────────────────────────────── */

type Phase = "hold" | "delete" | "type";

interface State {
  i: number;
  n: number;
  phase: Phase;
  cycles: number;
}

const TYPE_MS = 76;
const DELETE_MS = 36;
const HOLD_MS = 1900;
const FIRST_HOLD_MS = 2400;
const EMPTY_MS = 120;

function advance(s: State, words: readonly string[]): State {
  if (s.phase === "hold") return { ...s, phase: "delete" };
  if (s.phase === "delete") {
    // Stop at three characters: deleting to nothing leaves an 84px hole in
    // the h1 with a lone caret, which reads as broken.
    if (s.n > 3) return { ...s, n: s.n - 1 };
    return { i: (s.i + 1) % words.length, n: 0, phase: "type", cycles: s.cycles + 1 };
  }
  const n = s.n + 1;
  return n >= words[s.i].length ? { ...s, n, phase: "hold" } : { ...s, n };
}

/** A typist's timing: a beat after a space, and a small, repeatable unevenness. */
function delayFor(s: State, words: readonly string[]): number {
  if (s.phase === "hold") return s.cycles === 0 ? FIRST_HOLD_MS : HOLD_MS;
  if (s.phase === "delete") return DELETE_MS;
  if (s.n === 0) return EMPTY_MS;
  if (words[s.i][s.n - 1] === " ") return TYPE_MS + 70;
  return TYPE_MS + ((s.i * 7 + s.n * 13) % 5) * 9;
}

export function Typewriter({ words }: { words: readonly string[] }) {
  const host = useRef<HTMLSpanElement>(null);
  const preloaded = usePreloaded();
  const reduce = useMedia(MQ.reduce);
  const onScreen = useOnScreen(host);
  const [state, step] = useReducer(advance, { i: 0, n: words[0].length, phase: "hold", cycles: 0 });
  const running = preloaded && !reduce && onScreen;

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => step(words), delayFor(state, words));
    return () => window.clearTimeout(timer);
  }, [running, state, words]);

  const text = reduce ? words[0] : words[state.i].slice(0, state.n);

  return (
    <span
      ref={host}
      aria-hidden="true"
      data-phase={running ? state.phase : "rest"}
      className="zan-hero-typed block whitespace-nowrap"
    >
      <span className="text-brand-gradient">{text}</span>
      <span className="zan-hero-caret" />
    </span>
  );
}
