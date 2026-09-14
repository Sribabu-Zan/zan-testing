import { useCallback, useSyncExternalStore } from "react";

/**
 * A media query as a boolean that re-renders on change. The server (and the
 * hydration pass) sees `serverValue`, so markup never mismatches; the real
 * value arrives right after hydration.
 */
export function useMedia(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
