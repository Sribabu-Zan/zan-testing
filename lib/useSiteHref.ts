"use client";

import { usePathname } from "next/navigation";
import { siteHref } from "@/lib/links";

/**
 * Resolves any href that comes from constants for the page it is on:
 * `const href = useSiteHref(); href(ctas.contact.href)`.
 *
 * Paths ("/pricing") and tel:, mailto: and external URLs come back unchanged.
 * The only thing this adds is the homepage's path in front of an in-page
 * anchor when the link is being rendered somewhere else, so the navbar's
 * "Start a Project" (#contact) still reaches the homepage's enquiry section
 * from /services or /pricing.
 *
 * Its own module, with "use client", so lib/links.ts stays importable from
 * server components.
 */
export function useSiteHref() {
  const pathname = usePathname();
  return (path: string) => siteHref(path, pathname);
}
