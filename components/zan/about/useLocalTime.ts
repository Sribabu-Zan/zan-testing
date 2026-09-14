"use client";

import { useSyncExternalStore } from "react";

/* ───────────────────────────────────────────────────────────────────────────
   A shared minute clock for the office local-time readouts.

   One timer for the whole page, aligned to the top of each minute, running
   only while something is subscribed. The server (and the hydrating client)
   render "--:--"; the real time arrives right after hydration through
   useSyncExternalStore — no state set in an effect, no hydration mismatch.
   ─────────────────────────────────────────────────────────────────────────── */

const MINUTE = 60_000;
const PLACEHOLDER = "--:--";

let now = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  now = Date.now();
  listeners.forEach((l) => l());
}

function schedule() {
  timer = setTimeout(() => {
    emit();
    schedule();
  }, MINUTE - (Date.now() % MINUTE) + 30);
}

function onVisible() {
  if (!document.hidden) emit();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (listeners.size === 1) {
    now = Date.now();
    schedule();
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      clearTimeout(timer);
      timer = undefined;
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

function getSnapshot(): number {
  if (now === 0) now = Date.now();
  return Math.floor(now / MINUTE);
}

const getServerSnapshot = (): number | null => null;

const timeFormats = new Map<string, Intl.DateTimeFormat>();
const zoneFormats = new Map<string, Intl.DateTimeFormat>();

function timeFormat(timeZone: string) {
  let f = timeFormats.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone });
    timeFormats.set(timeZone, f);
  }
  return f;
}

function zoneFormat(timeZone: string) {
  let f = zoneFormats.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" });
    zoneFormats.set(timeZone, f);
  }
  return f;
}

export interface LocalTime {
  /** "14:05", or "--:--" before the client clock is known. */
  time: string;
  /** "GMT+5:30", or "" before the client clock is known. */
  offset: string;
  /** ISO string for <time dateTime>, or undefined on the server. */
  iso?: string;
}

/** The current wall-clock time in an IANA zone, updated each minute. */
export function useLocalTime(timeZone: string): LocalTime {
  const minute = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (minute === null) return { time: PLACEHOLDER, offset: "" };
  const date = new Date(minute * MINUTE);
  const offset = zoneFormat(timeZone).formatToParts(date).find((p) => p.type === "timeZoneName")?.value ?? "";
  return { time: timeFormat(timeZone).format(date), offset, iso: date.toISOString() };
}
