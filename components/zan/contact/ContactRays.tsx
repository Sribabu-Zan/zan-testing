"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MQ } from "@/lib/gsap";
import { useBrandPalette } from "@/lib/region";
import "./contact.css";

/** ogl only loads on the client, and only once the section is near. */
const LightRays = dynamic(() => import("@/components/ui/LightRays"), { ssr: false });

/** Desktop with motion allowed — everywhere else the static veil is enough. */
const QUERY = `${MQ.desktop} and ${MQ.motion}`;

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

/**
 * The light behind the contact heading: a quiet static wash, plus the
 * reference's WebGL light rays on desktop, kept restrained and coloured from
 * the region's palette so a switch to the UAE turns them gold.
 */
export function ContactRays() {
  const allowed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const palette = useBrandPalette();
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (!allowed || near) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "60% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [allowed, near]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[min(118vh,70rem)] overflow-hidden"
    >
      <div className="zan-contact-veil absolute inset-0" />
      {allowed && near && (
        <div className="zan-contact-rays absolute inset-0">
          <LightRays
            color={palette.brand}
            glow={palette.glow}
            origin="top-center"
            speed={0.4}
            spread={0.7}
            length={1.2}
            fadeDistance={0.9}
            intensity={0.6}
            followMouse
            mouseInfluence={0.05}
            noise={0}
            distortion={0.02}
          />
        </div>
      )}
    </div>
  );
}
