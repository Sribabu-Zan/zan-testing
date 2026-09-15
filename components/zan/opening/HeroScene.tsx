"use client";

import Image from "next/image";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, MQ } from "@/lib/gsap";
import { useRegionId } from "@/lib/region";
import { MarkStage } from "./MarkStage";
import { STAR_LAYERS } from "./sky";
import { UaeFlyer } from "./UaeFlyer";
import { GridField } from "./GridField";
import "./opening.css";

gsap.registerPlugin(useGSAP);

/**
 * Scroll parallax: how far each layer moves, as a fraction of the hero's
 * height, by the time the hero has scrolled away. Positive lags behind the
 * page (far away), negative runs ahead of it (close). Stars are slowest, then
 * the mark; the copy lifts a little; the astronaut is the fastest thing on
 * screen.
 */
const DEPTH = {
  far: 0.55,
  mid: 0.4,
  near: 0.26,
  mark: 0.18,
  flyer: -0.16,
  ufo: -0.28,
  copy: -0.12,
  astro: -0.62,
} as const;

/**
 * The hero's stage: the section, its sky and floating layers, and the two
 * parallaxes (scroll, and pointer on desktop). The copy comes in as children
 * from the server component, so the h1 and everything readable is in the
 * server HTML.
 *
 * Layers, back to front: sky (three star depths) · UAE flyer · UFO (phones
 * and tablets) · copy and mark · astronaut.
 *
 * Every GSAP scene is built inside gsap.matchMedia(MQ.motion), so reduced
 * motion reverts to the still composition with nothing hidden.
 */
export function HeroScene({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const region = useRegionId();

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el) as (selector: string) => HTMLElement[];
      const mm = gsap.matchMedia();

      mm.add(MQ.motion, () => {
        const height = () => el.offsetHeight;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
        });
        for (const [key, k] of Object.entries(DEPTH)) {
          const targets = q(`[data-depth="${key}"]`);
          if (targets.length) tl.to(targets, { y: () => height() * k }, 0);
        }
        tl.to(q('[data-depth="copy"]'), { opacity: 0, ease: "power1.in" }, 0);
        // The ground belongs to the composition: once the mark has left, a
        // lone patch of ruling in the corner reads as a stray texture.
        tl.to(q(".zan-hero-grid"), { opacity: 0, ease: "power1.in", duration: 0.4 }, 0);
        tl.to(q('[data-depth="astro"]'), { rotation: -10 }, 0);
      });

      // Pointer parallax: desktop with a real mouse. Each [data-drift] layer
      // eases towards (pointer offset × its drift).
      mm.add(`${MQ.motion} and ${MQ.fine} and ${MQ.desktop}`, () => {
        const layers = q("[data-drift]").map((node) => ({
          k: Number(node.dataset.drift) || 0,
          x: gsap.quickTo(node, "x", { duration: 1.2, ease: "power3.out" }),
          y: gsap.quickTo(node, "y", { duration: 1.2, ease: "power3.out" }),
        }));
        const onMove = (e: PointerEvent) => {
          if (e.pointerType !== "mouse" || window.scrollY > el.offsetHeight) return;
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          for (const layer of layers) {
            layer.x(nx * layer.k);
            layer.y(ny * layer.k);
          }
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => window.removeEventListener("pointermove", onMove);
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="hero"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col overflow-hidden bg-bg"
    >
      {/* Sky: three depths of fine dots, masked to fade out at the bottom. */}
      <div
        aria-hidden="true"
        data-reveal
        data-in="fade"
        className="zan-hero-in zan-hero-sky pointer-events-none absolute inset-0 -z-10"
      >
        {STAR_LAYERS.map((layer) => (
          <div key={layer.depth} data-depth={layer.depth} className="absolute inset-0">
            <div
              data-drift={layer.drift}
              className="zan-hero-stars absolute -inset-8"
              style={
                {
                  backgroundColor: layer.color,
                  maskImage: layer.mask,
                  WebkitMaskImage: layer.mask,
                  maskSize: `${layer.size}px ${layer.size}px`,
                  WebkitMaskSize: `${layer.size}px ${layer.size}px`,
                } as CSSProperties
              }
            />
          </div>
        ))}
      </div>

      {/* Ground: the drawing-board grid, with cells lighting up in the region's
          colour. Masked away from the copy, so it gives the sky a floor
          without ruling a single line through the headline. */}
      <div aria-hidden="true" data-depth="near" className="pointer-events-none absolute inset-0 -z-10">
        <div
          data-reveal
          data-in="fade"
          className="zan-hero-in size-full"
          style={{ "--zan-d": 1 } as CSSProperties}
        >
          <GridField className="zan-hero-grid size-full" />
        </div>
      </div>

      {/* The UAE site's plane and flag, in the band above the headline. */}
      <div
        aria-hidden="true"
        data-depth="flyer"
        className="pointer-events-none absolute inset-x-0 top-[calc(var(--spacing-nav)+0.75rem)] z-10"
      >
        {region === "ae" && <UaeFlyer />}
      </div>

      <div className="container-zan relative z-20 grid flex-1 content-center items-center gap-y-10 pt-nav pb-12 lg:grid-cols-12 lg:gap-x-8 lg:pb-16">
        {/* Below lg the copy clears the astronaut, which sits in the top-right
            corner under the navbar: the padding is the astronaut's height plus
            a gap, so the badge can never start beside it. */}
        <div data-depth="copy" data-hero-copy className="min-w-0 pt-[5.75rem] text-center sm:pt-[7rem] lg:col-span-7 lg:pt-6 lg:text-left">
          {children}
        </div>
        <div data-depth="mark" className="relative hidden lg:col-span-5 lg:block">
          <MarkStage />
        </div>
      </div>

      {/* Scroll cue: bottom centre, leaves with the copy. */}
      <div
        aria-hidden="true"
        data-depth="copy"
        className="container-zan pointer-events-none absolute inset-x-0 bottom-5 z-20 hidden sm:flex lg:justify-start"
      >
        <div
          data-reveal
          className="zan-hero-in flex flex-col items-center gap-2 font-mono text-[0.6875rem] tracking-[0.2em] text-muted uppercase lg:items-start"
          style={{ "--zan-d": 6 } as CSSProperties}
        >
          <span>Scroll</span>
          <span className="zan-hero-cue-line" />
        </div>
      </div>

      {/* Astronaut: top right, mirrored, drifting; the closest layer. On phones
          and tablets it takes the corner under the navbar, small enough that
          the copy's top padding keeps it clear of the badge and headline. */}
      <div
        aria-hidden="true"
        data-depth="astro"
        className="zan-hero-astro pointer-events-none absolute top-[calc(var(--spacing-nav)+0.25rem)] right-4 z-30 w-[4.5rem] sm:right-8 sm:w-24 lg:top-[calc(var(--spacing-nav)+0.5rem)] lg:right-[8vw] lg:w-36 xl:w-40"
      >
        <div data-drift="-26">
          <div data-reveal data-in="astro" className="zan-hero-in" style={{ "--zan-d": 2 } as CSSProperties}>
            <div className="zan-hero-float">
              <Image
                src="/images/hero/astronaut.png"
                alt=""
                width={500}
                height={500}
                sizes="(min-width: 1280px) 10rem, (min-width: 1024px) 9rem, (min-width: 640px) 6rem, 4.5rem"
                className="h-auto w-full -scale-x-100 select-none"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
