"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getLenis } from "@/hooks/useLenis";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * Housekeeping after a client-side navigation.
 *
 * Next resets the document scroll itself, but Lenis keeps its own position and
 * animates towards it, so without this a new page can open halfway down or
 * glide back up on the first wheel event. And every route is a different
 * height, so the pinned scenes that are still alive have to re-measure.
 *
 * A deep link with a hash is left alone: the browser (and Lenis's own anchor
 * handling) is already taking it to the right place.
 */
export function RouteChange() {
  const pathname = usePathname();

  useEffect(() => {
    const lenis = getLenis();
    if (window.location.hash) lenis?.resize();
    else lenis?.scrollTo(0, { immediate: true, force: true });
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}
