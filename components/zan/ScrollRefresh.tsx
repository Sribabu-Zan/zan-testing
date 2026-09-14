"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * Keeps every pinned scene aligned when the page changes height after load.
 *
 * ScrollTrigger measures start/end positions once, at creation and on window
 * resize. Anything that grows the document afterwards — an image decoding, a
 * font swapping, an accordion opening, a lazily mounted canvas, a section
 * above creating its own pin spacer — moves everything below it, and each pin
 * further down then starts and ends in the wrong place.
 *
 * One observer on <body>, debounced, refreshing only when the height really
 * changed. After a refresh the height is re-read, so a refresh that itself
 * resizes spacers cannot trigger an endless loop.
 */
export function ScrollRefresh() {
  useEffect(() => {
    let last = document.body.scrollHeight;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const now = document.body.scrollHeight;
        if (Math.abs(now - last) < 2) return;
        ScrollTrigger.refresh();
        last = document.body.scrollHeight;
      }, 250);
    });
    observer.observe(document.body);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
