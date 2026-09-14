"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { preloaderWords } from "@/constants/zan";
import { ZanLogo } from "@/components/zan/ui/ZanLogo";
import { getLenis } from "@/hooks/useLenis";
import { MQ } from "@/lib/gsap";
import { announcePreloaded, PRELOADER_SEEN_KEY } from "./shellStore";
import "./preloader.css";

/** Fallbacks, ms from mount, for a browser without getAnimations(). */
const REVEAL_MS = 1840;
const DONE_MS = 2300;

function cssAnimation(el: Element, name: string): Animation | undefined {
  return el.getAnimations?.().find((a) => (a as CSSAnimation).animationName === name);
}

/**
 * Calls `fn` when the named CSS animation on `el` ends — at once if it
 * already has. If the animation is not there yet (the stylesheet can land
 * after hydration in dev), it looks again for a couple of seconds before
 * falling back to a timer; it never treats "not found" as "finished", which
 * would drop the preloader before it had played.
 */
function whenAnimationEnds(el: Element, name: string, fallbackMs: number, fn: () => void): () => void {
  let live = true;
  let timer = 0;
  let tries = 0;
  const done = () => {
    if (live) fn();
  };
  const attach = () => {
    if (!live) return;
    const anim = typeof el.getAnimations === "function" ? cssAnimation(el, name) : undefined;
    if (anim) {
      if (anim.playState === "finished") done();
      else anim.finished.then(done, done);
      return;
    }
    if (typeof el.getAnimations !== "function" || ++tries > 40) {
      timer = window.setTimeout(done, fallbackMs);
      return;
    }
    timer = window.setTimeout(attach, 50);
  };
  attach();
  return () => {
    live = false;
    window.clearTimeout(timer);
  };
}

/**
 * Logo, the three practices rising out of their masks one after another, a
 * brand hairline filling underneath — then a brand-gradient panel wipes up
 * over it all and carries on up and away, uncovering the page: the
 * reference's black page reveal, in the region's colour.
 *
 * The sequence is CSS (preloader.css). Until it starts, the stage holds the
 * first paint statically. This component starts it once a frame has been
 * painted, holds the page still while it is covered, and announces
 * `zan:preloaded` the moment the stage drops out.
 */
export function PreloaderStage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    let seen = false;
    try {
      seen = sessionStorage.getItem(PRELOADER_SEEN_KEY) === "1";
    } catch {
      /* storage blocked: play it */
    }
    if (seen || window.matchMedia(MQ.reduce).matches) {
      root.style.display = "none";
      announcePreloaded();
      return;
    }

    // Hold the page still while it is covered. Lenis is created in a sibling
    // effect that runs after this one, so reach for it a frame later.
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    let locked = true;
    const stopLenis = requestAnimationFrame(() => {
      if (locked) getLenis()?.stop();
    });
    const unlock = () => {
      if (!locked) return;
      locked = false;
      html.style.overflow = prevOverflow;
      getLenis()?.start();
    };

    // Play once a frame has really been painted: the second rAF runs after the
    // first frame is on screen. Starting the clock any earlier spends the
    // sequence while nothing is visible — on a busy load, first paint can
    // trail hydration by well over a second.
    let offReveal = () => {};
    let offDone = () => {};
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        root.dataset.play = "1";
        offReveal = whenAnimationEnds(stage, "zan-pl-stage-out", REVEAL_MS, () => {
          unlock();
          announcePreloaded();
        });
        offDone = whenAnimationEnds(root, "zan-pl-gone", DONE_MS, () => {
          root.style.display = "none";
          try {
            sessionStorage.setItem(PRELOADER_SEEN_KEY, "1");
          } catch {
            /* storage blocked */
          }
        });
      });
    });

    return () => {
      cancelAnimationFrame(stopLenis);
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      offReveal();
      offDone();
      delete root.dataset.play;
      unlock();
    };
  }, []);

  return (
    <div
      id="zan-preloader"
      ref={rootRef}
      aria-hidden="true"
      className="zan-pl-root pointer-events-none fixed inset-0 z-[200] overflow-hidden"
    >
      <div
        ref={stageRef}
        className="zan-pl-stage pointer-events-auto absolute inset-0 flex flex-col items-center justify-center bg-bg px-6"
      >
        <ZanLogo eager className="h-10 sm:h-12" />

        <p className="mt-8 flex flex-col items-center gap-y-1.5 text-center font-display text-[clamp(1.375rem,0.9rem+1.6vw,2.25rem)] leading-[1.15] font-medium text-ink lg:flex-row lg:gap-x-6">
          {preloaderWords.map((word, i) => {
            const index = { "--zan-pl-i": i } as CSSProperties;
            return (
              <Fragment key={word}>
                {i > 0 && (
                  <span className="zan-pl-dot hidden size-1.5 shrink-0 rounded-full bg-brand lg:block" style={index} />
                )}
                <span className="block overflow-hidden pb-[0.14em]">
                  <span className="zan-pl-word whitespace-nowrap" style={index}>
                    {word}
                  </span>
                </span>
              </Fragment>
            );
          })}
        </p>

        <div className="absolute bottom-[max(12vh,4rem)] left-1/2 h-px w-[min(16rem,56vw)] -translate-x-1/2 overflow-hidden bg-line">
          <span className="zan-pl-bar block h-full bg-brand-gradient" />
        </div>
      </div>

      <div className="zan-pl-panel absolute inset-0 bg-brand-gradient" />
    </div>
  );
}
