import type { MetadataRoute } from "next";
import { siteRoutes } from "@/constants/pages";
import { regionOrder, type RegionId } from "@/constants/zan";
import { regionUrl } from "@/lib/server-region";

/* ───────────────────────────────────────────────────────────────────────────
   SITEMAP

   Generated from constants/pages.ts `siteRoutes` — the same registry the rest
   of the site builds its navigation and its page templates from — so a URL can
   never be advertised here without a page behind it. That was the previous
   build's core SEO failure: a sitemap full of URLs no crawler could render.

   Every route is emitted three times, once per region, and each entry declares
   all three as hreflang alternates WITH an x-default, so Google reads /ae and
   /us as localisations rather than duplicates. (The main app's sitemap omits
   x-default; without it Google picks the default variant itself.)

   NO lastModified. The main app stamps `new Date()` on all 84 entries at build
   time, which tells crawlers that every page on the site changed at the same
   instant — a signal Google learns to ignore, and then keeps ignoring once
   there is a real one. An absent <lastmod> is honest; a fabricated one is not.
   ─────────────────────────────────────────────────────────────────────────── */

const HREFLANG = { in: "en-IN", ae: "en-AE", us: "en-US" } as const;

/**
 * `regionUrl("/", "in")` ends in a slash; the canonical Next renders into the
 * page does not, because it resolves against metadataBase. Same URL either way
 * as far as Google is concerned, but a sitemap that disagrees with the page it
 * points at is a needless discrepancy to have to explain later.
 */
const absolute = (path: string, region: RegionId) => regionUrl(path, region).replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return siteRoutes.flatMap(({ path, priority, changeFrequency }) =>
    regionOrder.map((region) => ({
      url: absolute(path, region),
      changeFrequency,
      priority,
      alternates: {
        languages: {
          ...Object.fromEntries(regionOrder.map((r) => [HREFLANG[r], absolute(path, r)])),
          "x-default": absolute(path, "in"),
        },
      },
    })),
  );
}
