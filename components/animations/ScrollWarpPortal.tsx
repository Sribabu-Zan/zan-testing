"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, MQ } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import "@/components/zan/work/work.css";

/* ───────────────────────────────────────────────────────────────────────────
   WARP PORTAL — the reference's Chapter 02 transition, in the light theme.

   A pinned tunnel of concentric rounded frames that grow out of the centre
   and rush past the camera, beams sweeping in, the label warping forward and
   dissolving, and a flash to the page ground that hands off to the white
   section below.

   Colours are tokens mixed with transparency (color-mix), so the tunnel
   follows the region. The scene builds inside gsap.matchMedia(MQ.motion):
   for reduced motion nothing is pinned and the CSS default — a static band
   with the tunnel held mid-way and the label at rest — is what shows.
   ─────────────────────────────────────────────────────────────────────────── */

const DEPTH_FRAMES = 7;

const mix = (token: string, pct: number) => `color-mix(in oklab, var(${token}) ${pct}%, transparent)`;

/** Per-frame scale/opacity keyframes, by depth index. */
const frameKeys = (i: number) => ({
  // Already on screen when the pin starts: faint hairlines at a mid depth.
  // On the light ground an empty opening reads as a blank screen, not as
  // atmosphere, so the chapter is a chapter card from its very first frame.
  s0: 0.3 + i * 0.16,
  s1: 0.55 + i * 0.32,
  s2: 0.7 + i * 0.36,
  s3: 2.6 + i * 0.7,
  o0: (0.95 - i * 0.11) * 0.45,
  o1: 0.95 - i * 0.11,
});

type Props = {
  /** The chapter label, centred in the tunnel. */
  label: ReactNode;
  /** Accessible name of the band. */
  ariaLabel: string;
  /** Pin length on desktop and on touch/narrow screens. */
  distance?: string;
  mobileDistance?: string;
  className?: string;
};

export function ScrollWarpPortal({
  label,
  ariaLabel,
  distance = "+=150%",
  mobileDistance = "+=100%",
  className,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const beamsRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        { desktop: `${MQ.motion} and ${MQ.desktop}`, mobile: `${MQ.motion} and ${MQ.mobile}` },
        (ctx) => {
          const { desktop } = ctx.conditions as { desktop: boolean };
          const frameEls = Array.from(framesRef.current?.children ?? []);
          const beamEls = Array.from(beamsRef.current?.children ?? []);

          // Opening state: the label is already legible and the tunnel faintly
          // drawn. Frames get their first values from updateFrames() below.
          gsap.set(frameEls, { force3D: true });
          gsap.set(labelRef.current, { scale: 0.94, opacity: 0.85, force3D: true });
          gsap.set(haloRef.current, { scale: 0.85, opacity: 0.35, force3D: true });
          gsap.set(flashRef.current, { opacity: 0 });
          gsap.set(vignetteRef.current, { opacity: 0.75 });
          gsap.set(beamEls, { opacity: 0.35, scaleY: 0.7, transformOrigin: "50% 50%", force3D: true });

          const tl = gsap.timeline({
            // No force3D here: the defaults also reach the progress tween on a
            // plain object, where it is not a property. The DOM sets keep it.
            defaults: { ease: "power2.out" },
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: desktop ? distance : mobileDistance,
              scrub: 0.5,
              pin: stageRef.current,
              pinSpacing: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          // Vignette lifts as the portal wakes.
          tl.to(vignetteRef.current, { opacity: 0.45, duration: 0.18, ease: "sine.inOut" }, 0);

          // Halo blooms outward.
          tl.to(haloRef.current, { scale: 1.4, opacity: 0.85, duration: 0.35, ease: "sine.out" }, 0);

          // Frames: one progress value drives every frame deterministically, so
          // scrubbing backwards retraces exactly.
          const state = { p: 0 };
          const easeOut = gsap.parseEase("power2.out");
          const easeInOut = gsap.parseEase("sine.inOut");
          const easeIn = gsap.parseEase("power2.in");

          const updateFrames = () => {
            const p = state.p;
            frameEls.forEach((el, i) => {
              const { s0, s1, s2, s3, o0, o1 } = frameKeys(i);
              let scale: number;
              let opacity: number;
              if (p < 0.45) {
                const t = easeOut(p / 0.45);
                scale = s0 + (s1 - s0) * t;
                opacity = o0 + (o1 - o0) * t;
              } else if (p < 0.5) {
                scale = s1;
                opacity = o1;
              } else if (p < 0.78) {
                const t = easeInOut((p - 0.5) / 0.28);
                scale = s1 + (s2 - s1) * t;
                opacity = o1;
              } else if (p < 0.95) {
                const t = easeIn((p - 0.78) / 0.17);
                scale = s2 + (s3 - s2) * t;
                opacity = o1 * (1 - t);
              } else {
                scale = s3;
                opacity = 0;
              }
              gsap.set(el, { scale, opacity });
            });
          };

          updateFrames();
          tl.to(state, { p: 1, duration: 1, ease: "none", onUpdate: updateFrames }, 0);

          // Beams sweep in.
          tl.to(beamEls, { opacity: 1, scaleY: 1, duration: 0.3, ease: "power1.out" }, 0.05);

          // Label settles…
          tl.to(labelRef.current, { scale: 1, opacity: 1, duration: 0.15, ease: "power2.out" }, 0);

          // …then drifts forward and dissolves while the frames rush past.
          tl.to(labelRef.current, { scale: 1.18, opacity: 0, duration: 0.17, ease: "power2.in" }, 0.78);
          tl.to(haloRef.current, { scale: 2.8, opacity: 0, duration: 0.17, ease: "power2.in" }, 0.78);
          tl.to(beamEls, { opacity: 0, duration: 0.14, ease: "power2.in" }, 0.78);

          // Fade to the page ground right at the end, so it overlaps the work
          // wall's arrival instead of leaving a blank white beat in the pin.
          tl.to(flashRef.current, { opacity: 1, duration: 0.14, ease: "power2.in" }, 0.86);
        },
      );

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [distance, mobileDistance] },
  );

  return (
    <section
      ref={sectionRef}
      aria-label={ariaLabel}
      data-section="chapter-work"
      className={cn("relative w-full bg-surface", className)}
    >
      <div ref={stageRef} className="zan-warp-stage relative isolate w-full overflow-hidden bg-surface">
        {/* Vertical beams: hairlines, fading out at both ends */}
        <div ref={beamsRef} aria-hidden="true" className="zan-warp-beams pointer-events-none absolute inset-0">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute top-1/2 h-[120vh] w-px -translate-y-1/2"
              style={{
                left: `${20 + i * 20}%`,
                background: `linear-gradient(to bottom, transparent 0%, ${mix("--color-brand-ink", 18)} 50%, transparent 100%)`,
              }}
            />
          ))}
        </div>

        {/* Edge fall-off into the surface */}
        <div
          ref={vignetteRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 35%, var(--color-surface) 88%)" }}
        />

        {/* Halo: two thin rings that open out behind the label */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
          <div ref={haloRef} className="relative size-[56vmin] will-change-transform">
            <span className="absolute inset-0 rounded-full" style={{ border: `1px solid ${mix("--color-brand-ink", 22)}` }} />
            <span
              className="absolute inset-[14%] rounded-full"
              style={{ border: `1px solid ${mix("--color-brand-ink", 12)}` }}
            />
          </div>
        </div>

        {/* The tunnel: concentric depth frames */}
        <div
          ref={framesRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          {Array.from({ length: DEPTH_FRAMES }, (_, i) => {
            const { s1, o1 } = frameKeys(i);
            return (
              <div
                key={i}
                className="absolute h-[40vmin] w-[68vmin] rounded-xl will-change-transform portrait:h-[44vh] portrait:w-[62vw]"
                style={{
                  zIndex: DEPTH_FRAMES - i,
                  transform: `scale(${s1})`,
                  opacity: o1,
                  border: `1px solid ${mix("--color-brand-ink", 30)}`,
                  background: `linear-gradient(135deg, ${mix("--color-brand", 4)} 0%, transparent 60%)`,
                }}
              />
            );
          })}
        </div>

        {/* Label */}
        <div className="relative z-10 flex h-full items-center justify-center px-5">
          <div ref={labelRef} className="will-change-transform">
            {label}
          </div>
        </div>

        {/* Flash to the page ground */}
        <div ref={flashRef} aria-hidden="true" className="zan-warp-flash pointer-events-none absolute inset-0 z-20 bg-bg opacity-0" />
      </div>
    </section>
  );
}

export default ScrollWarpPortal;
