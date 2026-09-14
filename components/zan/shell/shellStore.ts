"use client";

import { useSyncExternalStore } from "react";
import { getLenis } from "@/hooks/useLenis";

/* ───────────────────────────────────────────────────────────────────────────
   Small shared pieces for the shell: the preloader handshake, media queries
   read without an effect, and the one way an in-page link scrolls.
   ─────────────────────────────────────────────────────────────────────────── */

/** Fired on window when the preloader has finished (or was skipped). */
export const PRELOADED_EVENT = "zan:preloaded";
/** sessionStorage key: the preloader has played in this tab. */
export const PRELOADER_SEEN_KEY = "zan.preloader.seen";

function subscribePreloaded(onChange: () => void) {
  window.addEventListener(PRELOADED_EVENT, onChange);
  return () => window.removeEventListener(PRELOADED_EVENT, onChange);
}

/**
 * True once the preloader is out of the way. `html[data-preloaded]` is the
 * source of truth — the inline script sets it before hydration for a visitor
 * who will not see the preloader, and the preloader sets it as it leaves.
 */
export function usePreloaded(): boolean {
  return useSyncExternalStore(
    subscribePreloaded,
    () => document.documentElement.dataset.preloaded === "1",
    () => false,
  );
}

/** Marks the preloader done and tells anyone waiting on it. */
export function announcePreloaded() {
  if (document.documentElement.dataset.preloaded === "1") return;
  document.documentElement.dataset.preloaded = "1";
  window.dispatchEvent(new Event(PRELOADED_EVENT));
}

/** A media query as a value, re-rendering when it flips. Server: false. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Scrolls to an in-page anchor ("#work"). Lenis glides there (and honours
 * scroll-margin-top); without Lenis — reduced motion — it is a plain jump.
 */
export function scrollToHash(href: string) {
  if (!href.startsWith("#")) return;
  if (href === "#" || href === "#top") {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { force: true });
    else window.scrollTo({ top: 0 });
    return;
  }
  const el = document.querySelector<HTMLElement>(href);
  if (!el) return;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, { force: true });
  } else {
    const margin = Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - margin });
  }
}

/** Every element Tab can land on inside `root`, in order. */
export function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("inert") && el.getClientRects().length > 0);
}
