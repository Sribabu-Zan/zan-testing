import { headers } from "next/headers";
import type { RegionId } from "@/constants/zan";
import { site } from "@/constants/zan";
import { PATH_HEADER, REGION_HEADER, withRegion } from "@/lib/links";

/* ───────────────────────────────────────────────────────────────────────────
   THE REGION, ON THE SERVER

   proxy.ts resolves the region from the path and passes it here as two request
   headers. Reading them is what lets the root layout render data-region, the
   right palette and the right canonical into the HTML itself, so a visitor on
   /ae never sees India's violet first.

   Reading a header makes a route render per request. That is the price of
   putting the region in the server HTML rather than patching it in afterwards,
   and it is the only reason these pages are not static.
   ─────────────────────────────────────────────────────────────────────────── */

export interface RequestRegion {
  region: RegionId;
  /** The path with no region prefix, e.g. "/services/web-development". */
  path: string;
}

const isRegion = (v: string | null): v is RegionId => v === "in" || v === "ae" || v === "us";

/** The region and region-free path of the request being rendered. */
export async function requestRegion(): Promise<RequestRegion> {
  const h = await headers();
  const region = h.get(REGION_HEADER);
  const path = h.get(PATH_HEADER) || "/";
  return { region: isRegion(region) ? region : "in", path };
}

/** The absolute URL of one path in one region. */
export function regionUrl(path: string, region: RegionId): string {
  return `${site.url}${withRegion(path, region) || "/"}`;
}

/**
 * Canonical and hreflang for the page being rendered: every regional variant
 * points its canonical at itself and declares the other two as alternates,
 * with India as x-default. Mirrors lib/seo.ts in the main app, minus its
 * trailing slashes (this site does not use them).
 */
export function regionAlternates(path: string, region: RegionId) {
  return {
    canonical: regionUrl(path, region),
    languages: {
      "en-IN": regionUrl(path, "in"),
      "en-AE": regionUrl(path, "ae"),
      "en-US": regionUrl(path, "us"),
      "x-default": regionUrl(path, "in"),
    },
  };
}
