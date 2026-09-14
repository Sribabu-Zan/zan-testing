"use client";

import { useSyncExternalStore } from "react";

/* ───────────────────────────────────────────────────────────────────────────
   Office clocks, hydration-safe.

   The server cannot know the reader's clock, so it renders "--:--". The
   client reads the time through useSyncExternalStore: the hydration render
   uses the server snapshot (null, so it matches the HTML), then React
   re-renders once with the real minute. A timer aligned to the next minute
   boundary keeps it current. No state is set in an effect.
   ─────────────────────────────────────────────────────────────────────────── */

const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  let interval = 0;
  const timeout = window.setTimeout(
    () => {
      onChange();
      interval = window.setInterval(onChange, MINUTE);
    },
    MINUTE - (Date.now() % MINUTE) + 25,
  );
  return () => {
    window.clearTimeout(timeout);
    window.clearInterval(interval);
  };
}

const getMinute = () => Math.floor(Date.now() / MINUTE);
const getServerMinute = () => null;

/** Minutes since the epoch; null on the server and while hydrating. */
export function useMinute(): number | null {
  return useSyncExternalStore(subscribe, getMinute, getServerMinute);
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/** "14:05" in the given IANA zone, or "--:--" before the client knows. */
export function formatClock(minute: number | null, timeZone: string): string {
  if (minute === null) return "--:--";
  let format = formatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone,
    });
    formatters.set(timeZone, format);
  }
  return format.format(minute * MINUTE);
}
