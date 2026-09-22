"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { regions, type RegionConfig, type RegionId } from "@/constants/zan";
import { REGION_COOKIE, REGION_COOKIE_MAX_AGE } from "@/lib/links";

/* ───────────────────────────────────────────────────────────────────────────
   REGION

   The region comes from the URL: India at the bare path, the UAE under /ae,
   the US under /us. proxy.ts resolves it per request and app/layout.tsx puts
   it on <html> as data-region="in" | "ae" | "us", where globals.css keys the
   whole palette off it.

   That makes the DOM the source of truth on the client, so the hooks below
   read it through useSyncExternalStore rather than holding a copy in React
   state — no effect, no stale copy, and a switch repaints everything at once.

   Hydration is the reason for the context. The DOM cannot be read while the
   server renders, so the server snapshot comes from <RegionProvider>, whose
   value the layout takes from the request. Server HTML, the first client
   render and the attribute on <html> therefore all agree, whichever region the
   visitor asked for.
   ─────────────────────────────────────────────────────────────────────────── */

const EVENT = "zan:region";
/** Kept in step with the cookie; it is what a returning visitor's browser has. */
const STORAGE_KEY = REGION_COOKIE;

const isRegion = (v: unknown): v is RegionId => v === "in" || v === "ae" || v === "us";

/** The region of the request the page was rendered for. */
const RegionContext = createContext<RegionId>("in");

/** Set once, in the root layout, from the path the visitor asked for. */
export function RegionProvider({ value, children }: { value: RegionId; children: ReactNode }) {
  return <RegionContext value={value}>{children}</RegionContext>;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function getRegionId(): RegionId {
  const v = document.documentElement.dataset.region;
  return isRegion(v) ? v : "in";
}

/**
 * Switch region: repaints the palette, remembers the choice, notifies hooks.
 *
 * The cookie is the half of the memory the SERVER can read, so the next
 * request already knows and the country default never second-guesses a
 * visitor who has chosen. RegionSwitcher navigates to the same page in the new
 * region straight after, which is what makes the choice a URL.
 */
export function setRegion(id: RegionId) {
  document.documentElement.dataset.region = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* private mode — the switch still works for this visit */
  }
  try {
    document.cookie = `${REGION_COOKIE}=${id};path=/;max-age=${REGION_COOKIE_MAX_AGE};samesite=lax`;
  } catch {
    /* cookies blocked — the URL still carries the region */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useRegionId(): RegionId {
  const fromRequest = useContext(RegionContext);
  return useSyncExternalStore(subscribe, getRegionId, () => fromRequest);
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

/**
 * What the server renders, per region, and the fallback if a token cannot be
 * read. These are globals.css's values written out: the server has no CSSOM,
 * and a canvas rendered on /ae must not start violet.
 */
const SERVER_PALETTES: Record<RegionId, BrandPalette> = {
  in: {
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
  },
  ae: {
    brand: "#ffc400",
    brandInk: "#8b6904",
    from: "#ffd60a",
    to: "#f59e0b",
    glow: "#ffd60a",
    soft: "#fff4cc",
    onBrand: "#17130a",
    ink: "#17130a",
    line: "#ece6d5",
    bg: "#ffffff",
  },
  us: {
    brand: "#ff5a1f",
    brandInk: "#b8420a",
    from: "#ff7a45",
    to: "#f2470f",
    glow: "#ff8f5e",
    soft: "#ffe8dd",
    onBrand: "#1a0b06",
    ink: "#160f0c",
    line: "#f0e4dd",
    bg: "#ffffff",
  },
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
    const next = { ...SERVER_PALETTES[id] };
    for (const key of Object.keys(TOKENS) as (keyof BrandPalette)[]) {
      next[key] = readToken(TOKENS[key]) || SERVER_PALETTES[id][key];
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
  const fromRequest = useContext(RegionContext);
  return useSyncExternalStore(subscribe, getPalette, () => SERVER_PALETTES[fromRequest]);
}
