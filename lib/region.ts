import { useSyncExternalStore } from "react";
import { regions, type RegionConfig, type RegionId } from "@/constants/zan";

/* ───────────────────────────────────────────────────────────────────────────
   REGION

   The region is an attribute on <html> (data-region="in" | "ae" | "us"), and
   globals.css keys the whole palette off it. That makes the DOM the source of
   truth, so the hooks below read it through useSyncExternalStore rather than
   holding a copy in React state — no provider, no effect, no stale copy.

   The server always renders "in". A visitor who picked another region gets it
   back before first paint from the inline script in app/layout.tsx, and these
   hooks catch up right after hydration.
   ─────────────────────────────────────────────────────────────────────────── */

const EVENT = "zan:region";
const STORAGE_KEY = "zan.region";

const isRegion = (v: unknown): v is RegionId => v === "in" || v === "ae" || v === "us";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function getRegionId(): RegionId {
  const v = document.documentElement.dataset.region;
  return isRegion(v) ? v : "in";
}

const getServerRegionId = (): RegionId => "in";

/** Switch region: repaints the palette, remembers the choice, notifies hooks. */
export function setRegion(id: RegionId) {
  document.documentElement.dataset.region = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* private mode — the switch still works for this visit */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useRegionId(): RegionId {
  return useSyncExternalStore(subscribe, getRegionId, getServerRegionId);
}

/** Trading name, lockup and office for the current region. */
export function useRegion(): RegionConfig {
  return regions[useRegionId()];
}

/* ── Colours for code that cannot use var() ─────────────────────────────────
   WebGL shaders, canvas 2D, three.js materials. Resolved from the live CSS so
   globals.css stays the only place a colour is defined. Cached per region so
   the snapshot is referentially stable (useSyncExternalStore requires it). */

export interface BrandPalette {
  brand: string;
  brandInk: string;
  from: string;
  to: string;
  glow: string;
  soft: string;
  onBrand: string;
  ink: string;
  line: string;
  bg: string;
}

const TOKENS: Record<keyof BrandPalette, string> = {
  brand: "--color-brand",
  brandInk: "--color-brand-ink",
  from: "--color-brand-from",
  to: "--color-brand-to",
  glow: "--color-brand-glow",
  soft: "--color-brand-soft",
  onBrand: "--color-on-brand",
  ink: "--color-ink",
  line: "--color-line",
  bg: "--color-bg",
};

/** India's values — what the server renders, and the fallback. */
const SERVER_PALETTE: BrandPalette = {
  brand: "#7c3aed",
  brandInk: "#6d28d9",
  from: "#9333ea",
  to: "#6d28d9",
  glow: "#a78bfa",
  soft: "#f0e9fe",
  onBrand: "#ffffff",
  ink: "#121016",
  line: "#e7e5ee",
  bg: "#ffffff",
};

const cache = new Map<RegionId, BrandPalette>();

/** Reads one resolved colour token, e.g. readToken("--color-brand"). */
export function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getPalette(): BrandPalette {
  const id = getRegionId();
  let p = cache.get(id);
  if (!p) {
    const next = { ...SERVER_PALETTE };
    for (const key of Object.keys(TOKENS) as (keyof BrandPalette)[]) {
      next[key] = readToken(TOKENS[key]) || SERVER_PALETTE[key];
    }
    p = next;
    cache.set(id, p);
  }
  return p;
}

/**
 * The current region's colours as plain strings, re-rendering on a region
 * switch. For shaders: `new Color(palette.brand)`.
 */
export function useBrandPalette(): BrandPalette {
  return useSyncExternalStore(subscribe, getPalette, () => SERVER_PALETTE);
}
