"use client";

import { useSyncExternalStore } from "react";

/* One subscribe function per query, so useSyncExternalStore keeps a stable
   subscription instead of resubscribing on every render. */
const subscribers = new Map<string, (onChange: () => void) => () => void>();

function subscriberFor(query: string) {
  let subscribe = subscribers.get(query);
  if (!subscribe) {
    subscribe = (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    };
    subscribers.set(query, subscribe);
  }
  return subscribe;
}

/** A media query's live state. False on the server and during hydration. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    subscriberFor(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}
