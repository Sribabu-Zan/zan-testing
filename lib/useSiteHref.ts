"use client";

import { usePathname } from "next/navigation";
import { siteHref, splitRegion } from "@/lib/links";
import { useRegionId } from "@/lib/region";

/**
 * Resolves any href that comes from constants for the page it is on:
 * `const href = useSiteHref(); href(ctas.contact.href)`.
 *
 * Two things happen to it. A path gains the visitor's region, so following a
 * link from /ae/services lands on /ae/pricing rather than dropping back to
 * India. And an in-page anchor gains the path of that region's homepage when
 * it is rendered anywhere else, so the navbar's "Start a Project" (#contact)
 * still reaches the enquiry section from /ae/pricing.
 *
 * tel:, mailto: and external URLs come back unchanged.
 *
 * The region comes from useRegionId(), NOT from the path. proxy.ts rewrites
 * /ae/pricing onto /pricing, so the server renders a path with no prefix on it
 * while the browser's URL has one; taking the region from the path would make
 * the server and the client disagree on every link. The path is still used,
 * with its prefix stripped, for the one question it can answer either way:
 * whether this is the homepage.
 *
 * Its own module, with "use client", so lib/links.ts stays importable from
 * server components and from proxy.ts.
 */
export function useSiteHref() {
  const pathname = usePathname();
  const region = useRegionId();
  const here = splitRegion(pathname || "/").path;
  return (path: string) => siteHref(path, here, region);
}
