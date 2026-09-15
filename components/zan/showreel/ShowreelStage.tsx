"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, MQ, ScrollTrigger } from "@/lib/gsap";
import { getLenis } from "@/hooks/useLenis";
import { Eyebrow } from "@/components/zan/ui/Eyebrow";
import "@/components/zan/showreel/showreel.css";

/* ───────────────────────────────────────────────────────────────────────────
   THE STAGE — footage under a sheet of page ground with the wordmark cut out
   of it, and the cut opening as you scroll.

   The mask, not background-clip: on a light page the reliable shape is an
   overlay that covers the viewport in --color-bg and has the word knocked out
   (mask: an opaque rect, the word painted black over it). Everything but the
   letters stays page ground, so the section reads as the page until the word
   opens.

   Sizing comes from the nested <svg>'s viewBox, not from a font size: the
   word is set once at a nominal 100 units, measured with getBBox(), and the
   viewBox is fitted around it with a margin. preserveAspectRatio keeps it
   centred and optically the same from 360px to 1920px, through a font swap,
   and in any aspect ratio.

   The opening zooms about the stem of the I, not the centre of the word. The
   centre of ZANSERVICES falls in the gap between R and V, and growing from
   there would fill the screen with page ground rather than footage. The I is
   the one glyph whose centre is guaranteed to be ink. Where it is, and how
   wide its ink actually runs, are measured at runtime — getExtentOfChar() for
   the position, canvas measureText() for the ink inside it — so the scene
   survives a font swap and any other face. While the word grows, the stem
   drifts to the middle of the screen, which keeps the word centred early and
   means the ink only has to cover half the viewport, not all of it.

   Past roughly fifty times its size Chrome stops rasterising the glyph and the
   hole simply disappears, so a plain rect, laid exactly over the I's ink and
   sized in the same way, is always drawn under the word and carries the last
   part of the zoom. By the time the word is hidden the neighbouring letters
   are long past the edges of the screen, so all that is left on screen is the
   stem the rect stands in for.
   ─────────────────────────────────────────────────────────────────────────── */

const WIDE_WORD = "ZANSERVICES";
const STACK_TOP = "ZAN";
const STACK_BOTTOM = "SERVICES";

/** The I: the glyph the opening grows out of, in each layout. */
const WIDE_STEM = WIDE_WORD.indexOf("I");
const STACK_STEM = STACK_BOTTOM.indexOf("I");

/** Baseline-to-baseline for the stacked layout, in nominal units. */
const STACK_LEAD = 94;
/** The nominal type size the word is set at, in user units. */
const NOMINAL = 100;
/** viewBox margin around the word, as a share of its width. */
const FIT_PAD = 0.055;
/** Fallbacks, as shares of the glyph's advance box, for a browser that gives
 *  no ink extents. Deliberately narrow: under-reading the stem only over-scales
 *  at the end, where nothing but the rect is on screen. */
const INK_RATIO = 0.4;
const CAP_RATIO = 0.55;
/** Chrome drops the glyph somewhere above ten thousand pixels of type, which
 *  would take the hole with it. The word hands over to the rect well before. */
const SAFE_GLYPH_PX = 7600;

const MASK_ID = "zan-showreel-knockout";

type Props = {
  /** Mono eyebrow over the wordmark. */
  eyebrow: string;
  /** One line under it, if there is one worth saying. */
  line?: string;
};

export function ShowreelStage({ eyebrow, line }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const innerRef = useRef<SVGSVGElement>(null);
  const wordRef = useRef<SVGGElement>(null);
  const wideRef = useRef<SVGTextElement>(null);
  const stackRef = useRef<SVGGElement>(null);
  const stackBottomRef = useRef<SVGTextElement>(null);
  const stemRef = useRef<SVGRectElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<SVGRectElement>(null);

  /* Playback. The file is decorative, so it runs only while the section is
     near the viewport and the tab is visible, and never for reduced motion. */
  useEffect(() => {
    const video = videoRef.current;
    const root = rootRef.current;
    if (!video || !root) return;

    // Autoplay is only allowed on a muted element, and the attribute React
    // renders is not always enough for the policy check.
    video.muted = true;

    const reduce = window.matchMedia(MQ.reduce);
    let near = false;

    const update = () => {
      if (near && !reduce.matches && !document.hidden) {
        if (!video.paused) return;
        void video.play().catch(() => {
          /* Autoplay refused, or no source this browser can decode: either
             way the poster stays inside the letters. */
        });
      } else if (!video.paused) {
        video.pause();
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        // The last record is the current state. An observer can queue several
        // for one target between callbacks, and the first may be stale.
        near = entries[entries.length - 1].isIntersecting;
        update();
      },
      // Playing, not just buffered, well before it is on screen.
      { rootMargin: "1200px 0px" },
    );
    io.observe(root);
    document.addEventListener("visibilitychange", update);
    reduce.addEventListener("change", update);

    // Fetch the film ahead of time, not when the section arrives. Once the page
    // has finished loading and the main thread is idle, upgrade from
    // preload="none" and start buffering, so the footage is ready by the time
    // anyone scrolls down to it. Waiting for load keeps it off the hero's
    // first paint. load() restarts the element, so playback is re-applied.
    let idleId = 0;
    let fallbackTimer = 0;
    const warm = () => {
      if (video.preload === "auto") return;
      video.preload = "auto";
      video.load();
      update();
    };
    // Safari only gained requestIdleCallback recently; read it as optional
    // rather than branching on `in window`, which TypeScript narrows to never.
    const requestIdle = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    const schedule = () => {
      if (requestIdle) idleId = requestIdle(warm, { timeout: 2500 });
      else fallbackTimer = window.setTimeout(warm, 1200);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      reduce.removeEventListener("change", update);
      window.removeEventListener("load", schedule);
      const cancelIdle = window.cancelIdleCallback as typeof window.cancelIdleCallback | undefined;
      if (idleId && cancelIdle) cancelIdle(idleId);
      window.clearTimeout(fallbackTimer);
      video.pause();
    };
  }, []);

  useGSAP(
    () => {
      // Measured in layout(), read by applyWord() and by the scene.
      const m = {
        cx: 0,
        cy: 0,
        fx: 0,
        fy: 0,
        stemW: 1,
        stemH: 1,
        vb: { x: 0, y: 0, w: 1, h: 1 },
        /* The part of user space the viewport actually shows. The viewBox is
           fitted to the word and is far wider than it is tall, so with
           "…meet" the screen reaches well past it on the short axis: clamping
           the rect to the viewBox would stop it short of the top and bottom
           edges and leave two bands of page ground behind. */
        vis: { x: 0, y: 0, w: 1, h: 1 },
        max: 24,
        swap: 24,
        /** The scale at which the letters either side of the I have left the screen. */
        clearAt: 24,
      };
      const view = { scale: 1 };

      const applyWord = () => {
        const word = wordRef.current;
        const stem = stemRef.current;
        if (!word || !stem) return;

        const span = m.max - 1;
        const u = span > 0 ? Math.min(1, Math.max(0, (view.scale - 1) / span)) : 0;
        // The stem walks to the middle of the screen as it grows.
        const drift = Math.pow(u, 0.65);
        const dx = (m.cx - m.fx) * drift;
        const dy = (m.cy - m.fy) * drift;

        word.setAttribute(
          "transform",
          `translate(${dx} ${dy}) translate(${m.fx} ${m.fy}) scale(${view.scale}) translate(${-m.fx} ${-m.fy})`,
        );
        // Into the hand-over the word thins out rather than cutting, so any
        // hair of difference between the glyph's ink and the rect is a fade.
        const over = (view.scale - m.swap * 0.8) / (m.swap * 0.2);
        const wordAlpha = Math.min(1, Math.max(0, 1 - over));
        word.style.opacity = wordAlpha === 1 ? "" : String(wordAlpha);
        word.style.display = wordAlpha > 0 ? "" : "none";

        // On a very wide window the glyph has to go before the letters either
        // side of the I are off screen. The sheet thins with it there, so the
        // screen crossfades to the footage instead of those letters flashing
        // back to page ground. Driven by scale alone, so scrubbing back retraces.
        sheetRef.current?.setAttribute("fill-opacity", String(m.clearAt > m.swap ? wordAlpha : 1));

        // The rect the zoom ends on: the I's ink, in the same place, clipped to
        // a little outside what the screen shows so its numbers stay small
        // however far the word has grown.
        const halfW = (m.stemW / 2) * view.scale;
        const halfH = (m.stemH / 2) * view.scale;
        const cx = m.fx + dx;
        const cy = m.fy + dy;
        const bleedX = m.vis.w * 0.25;
        const bleedY = m.vis.h * 0.25;
        const x0 = Math.max(cx - halfW, m.vis.x - bleedX);
        const x1 = Math.min(cx + halfW, m.vis.x + m.vis.w + bleedX);
        const y0 = Math.max(cy - halfH, m.vis.y - bleedY);
        const y1 = Math.min(cy + halfH, m.vis.y + m.vis.h + bleedY);
        stem.setAttribute("x", String(x0));
        stem.setAttribute("y", String(y0));
        stem.setAttribute("width", String(Math.max(0, x1 - x0)));
        stem.setAttribute("height", String(Math.max(0, y1 - y0)));
      };

      const ink = document.createElement("canvas").getContext("2d");

      const layout = () => {
        const inner = innerRef.current;
        const overlay = overlayRef.current;
        const wide = wideRef.current;
        const stack = stackRef.current;
        if (!inner || !overlay || !wide || !stack) return;

        // Measuring needs the word rendered; applyWord() hides it once the
        // rect has taken over, and puts that back at the end of this pass.
        if (wordRef.current) wordRef.current.style.display = "";

        const useWide = getComputedStyle(wide).display !== "none";
        const active: SVGGraphicsElement = useWide ? wide : stack;
        const focusText = useWide ? wide : stackBottomRef.current;

        const box = active.getBBox();
        if (!box.width || !box.height) return;

        const pad = box.width * FIT_PAD;
        const vbW = box.width + pad * 2;
        const vbH = box.height + pad * 2;
        m.vb = { x: box.x - pad, y: box.y - pad, w: vbW, h: vbH };
        inner.setAttribute("viewBox", `${m.vb.x} ${m.vb.y} ${vbW} ${vbH}`);

        // Symmetric padding, so the centre of the word is the centre of the
        // screen and the drift target is simply that centre.
        m.cx = box.x + box.width / 2;
        m.cy = box.y + box.height / 2;
        m.fx = m.cx;
        m.fy = m.cy;
        m.stemW = box.width * 0.03;
        m.stemH = box.height * CAP_RATIO;

        // The advance box the I sits in, and the ink inside that box.
        let clear = m.stemW;
        if (focusText) {
          try {
            const ext = focusText.getExtentOfChar(useWide ? WIDE_STEM : STACK_STEM);
            const style = getComputedStyle(focusText);
            const baseline = useWide ? 0 : STACK_LEAD;
            m.fx = ext.x + ext.width / 2;
            m.fy = ext.y + ext.height / 2;
            m.stemW = ext.width * INK_RATIO;
            m.stemH = ext.height * CAP_RATIO;
            if (ink) {
              ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
              const t = ink.measureText("I");
              const w = t.actualBoundingBoxRight + t.actualBoundingBoxLeft;
              const h = t.actualBoundingBoxAscent + t.actualBoundingBoxDescent;
              if (w > 0 && h > 0) {
                m.fx = ext.x + (t.actualBoundingBoxRight - t.actualBoundingBoxLeft) / 2;
                m.fy = baseline - (t.actualBoundingBoxAscent - t.actualBoundingBoxDescent) / 2;
                m.stemW = w;
                m.stemH = h;
              }
            }
            // The nearer edge of the glyph's own box: past the point where that
            // has left the screen, no other letter is on it either.
            clear = Math.min(m.fx - ext.x, ext.x + ext.width - m.fx);
          } catch {
            /* No text layout yet. The centre of the word is close enough. */
          }
        }

        // How far the stem has to grow before its ink covers the viewport,
        // once it has drifted to the middle. preserveAspectRatio="…meet"
        // fits the viewBox, so one user unit is k pixels.
        const rect = overlay.getBoundingClientRect();
        const k = Math.min(rect.width / vbW, rect.height / vbH) || 1;

        // What the screen shows, in user units: the fitted viewBox grown about
        // its centre until it is the shape of the overlay.
        const visW = rect.width / k;
        const visH = rect.height / k;
        m.vis = { x: m.cx - visW / 2, y: m.cy - visH / 2, w: visW, h: visH };

        const need = Math.max(rect.width / (m.stemW * k), rect.height / (m.stemH * k));
        m.max = Math.min(400, Math.max(8, need * 1.18));
        m.clearAt = rect.width / 2 / (clear * k);
        m.swap = Math.min(SAFE_GLYPH_PX / (NOMINAL * k), m.clearAt, m.max);

        applyWord();
      };

      layout();

      // The word is measured with whatever face is loaded; re-fit when the
      // display face swaps in, and whenever the stage is re-measured.
      let live = true;
      void document.fonts?.ready.then(() => {
        if (live) layout();
      });
      ScrollTrigger.addEventListener("refreshInit", layout);
      // refreshInit runs before ScrollTrigger releases the pin, so while the
      // section is pinned it measures the previous size. Measure again once
      // the refresh has re-pinned at the new one.
      ScrollTrigger.addEventListener("refresh", layout);

      const mm = gsap.matchMedia();

      mm.add(
        { desktop: `${MQ.motion} and ${MQ.desktop}`, mobile: `${MQ.motion} and ${MQ.mobile}` },
        (ctx) => {
          const { desktop } = ctx.conditions as { desktop: boolean };

          gsap.set(videoWrapRef.current, { force3D: true });

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top top",
              end: desktop ? "+=230%" : "+=150%",
              scrub: 0.45,
              pin: stageRef.current,
              pinSpacing: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          // The copy clears out before the letters reach it.
          tl.to(
            [eyebrowRef.current, lineRef.current].filter(Boolean),
            { autoAlpha: 0, y: -14, duration: 0.16, stagger: 0.04, ease: "power2.in" },
            0.04,
          );

          // The letters open. One proxy value drives the transform, so
          // scrubbing back retraces exactly.
          tl.fromTo(
            view,
            { scale: 1 },
            {
              scale: () => m.max,
              duration: 0.64,
              ease: "power2.in",
              onUpdate: applyWord,
            },
            0.06,
          );

          // The footage pushes in a little the whole way.
          tl.fromTo(videoWrapRef.current, { scale: 1.02 }, { scale: 1.14, duration: 0.92 }, 0);

          // The last slivers of ground go, leaving the footage full bleed.
          // autoAlpha: hidden, so nothing re-rasterises the mask on the hold.
          tl.to(overlayRef.current, { autoAlpha: 0, duration: 0.1, ease: "power2.in" }, 0.6);

          // Hold, then fade to the page ground, so the white section below
          // arrives on continuous white instead of a cut.
          // Only in the last few per cent of the pin, so the page never sits on
          // a blank white screen: the ground fades up as the section is already
          // handing over to the metrics below.
          tl.to(coverRef.current, { opacity: 1, duration: 0.05, ease: "power1.in" }, 0.95);

          // Stop scrolling part-way through the opening and it finishes by
          // itself, in the direction you were going: on down to the full-bleed
          // hold, or back up to the wordmark. Scrolling still drives it frame
          // by frame; this only takes over once the page has come to rest, and
          // any new scroll input interrupts it.
          const HOLD = 0.74;
          const st = tl.scrollTrigger;
          let settling = false;
          const settle = () => {
            if (!st || settling || !st.isActive) return;
            const p = st.progress;
            if (p <= 0.015 || p >= HOLD - 0.01) return;
            const target = st.direction >= 0 ? st.start + (st.end - st.start) * HOLD : st.start;
            settling = true;
            // Released on a timer, not onComplete: if the visitor scrolls
            // during the glide, Lenis abandons it without calling back, and a
            // flag left set would switch this off for the rest of the visit.
            window.setTimeout(() => {
              settling = false;
            }, 1400);
            const lenis = getLenis();
            if (lenis) {
              lenis.scrollTo(target, { duration: 1.15, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
            } else {
              window.scrollTo({ top: target, behavior: "smooth" });
            }
          };
          ScrollTrigger.addEventListener("scrollEnd", settle);
          return () => ScrollTrigger.removeEventListener("scrollEnd", settle);
        },
      );

      return () => {
        live = false;
        ScrollTrigger.removeEventListener("refreshInit", layout);
        ScrollTrigger.removeEventListener("refresh", layout);
        mm.revert();
      };
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="relative w-full">
      <div ref={stageRef} className="zan-showreel-stage relative isolate w-full overflow-hidden bg-bg">
        {/* Decorative footage: silent, no controls, paused off screen. The
            markup says preload="none" so nothing is fetched while the hero
            paints; the playback effect upgrades it to "auto" once the page has
            loaded, so the film is buffered before the section is reached. */}
        <div ref={videoWrapRef} className="zan-showreel-video absolute inset-0">
          <video
            ref={videoRef}
            className="size-full object-cover"
            poster="/videos/showreel-v2-poster.jpg"
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
            aria-hidden="true"
            tabIndex={-1}
          >
            {/* VP9 first (smaller); H.264 for Safari before iOS 17.4 and any
                browser without VP9, which would otherwise get only the poster. */}
            <source src="/videos/showreel-v2.webm" type="video/webm" />
            <source src="/videos/showreel-v2.mp4" type="video/mp4" />
          </video>        </div>

        {/* The sheet of page ground, with the wordmark knocked out of it. The
            two values inside the mask are luminance, not colour: opaque keeps
            the sheet, black cuts the hole. */}
        <svg ref={overlayRef} aria-hidden="true" focusable="false" className="absolute inset-0 size-full">
          <defs>
            <mask id={MASK_ID} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
              <rect width="100%" height="100%" fill="rgb(255 255 255)" />
              <svg
                ref={innerRef}
                width="100%"
                height="100%"
                viewBox="-388 -136 777 195"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* The I's ink, laid under the word and grown with it. */}
                <rect ref={stemRef} x="0" y="0" width="0" height="0" fill="rgb(0 0 0)" />
                <g ref={wordRef}>
                  <text
                    ref={wideRef}
                    className="zan-showreel-word zan-showreel-word-wide"
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fill="rgb(0 0 0)"
                  >
                    {WIDE_WORD}
                  </text>
                  <g ref={stackRef} className="zan-showreel-word-stack">
                    <text className="zan-showreel-word" x="0" y="0" textAnchor="middle" fill="rgb(0 0 0)">
                      {STACK_TOP}
                    </text>
                    <text
                      ref={stackBottomRef}
                      className="zan-showreel-word"
                      x="0"
                      y={STACK_LEAD}
                      textAnchor="middle"
                      fill="rgb(0 0 0)"
                    >
                      {STACK_BOTTOM}
                    </text>
                  </g>
                </g>
              </svg>
            </mask>
          </defs>
          <rect ref={sheetRef} width="100%" height="100%" fill="var(--color-bg)" mask={`url(#${MASK_ID})`} />
        </svg>

        {/* Copy, on the ground above and below the wordmark. The layer lets
            the pointer through; the text takes it back so it can be selected. */}
        <div className="zan-showreel-copy pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-between px-6 py-[clamp(5.5rem,12vh,8rem)] text-center">
          <div ref={eyebrowRef} className="pointer-events-auto">
            <Eyebrow>{eyebrow}</Eyebrow>
          </div>
          {line && (
            <p ref={lineRef} className="pointer-events-auto max-w-[38ch] text-balance text-lead text-ink-2">
              {line}
            </p>
          )}
        </div>

        {/* The fade to the page ground that hands off to the section below. */}
        <div ref={coverRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 bg-bg opacity-0" />
      </div>
    </div>
  );
}

export default ShowreelStage;
