/* ───────────────────────────────────────────────────────────────────────────
   LINKS

   Every page this site links to now lives in this site: the services index and
   its sixteen service pages, portfolio, how we work, about, pricing, contact
   and the five policy pages are all routes under app/. Nothing navigates to
   the main Zan app any more (its chat API is still proxied server-side by the
   rewrites in next.config.ts, which is a fetch, not a link).

   So a content href that starts with "/" is a path on THIS site and is used as
   written: there is no host to add, and no region prefix either — the region
   is an attribute on <html>, not a URL segment.

   The one thing that still needs resolving is an in-page anchor. "#contact" is
   a section of the homepage, and the navbar, mega menu and footer that carry
   it are on every page, so away from "/" it has to become "/#contact". That
   needs the current path, so it lives in the `useSiteHref` hook next door in
   lib/useSiteHref.ts. THIS module stays free of React so server components can
   import it; keep it that way.

   tel:, mailto: and http(s): links pass through untouched.
   ─────────────────────────────────────────────────────────────────────────── */

/** A path on this site, so it can be navigated with next/link. */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

/**
 * Resolves a content href against the page it is being rendered on. Pure, so
 * a server component that knows its own path can call it directly.
 */
export function siteHref(path: string, pathname: string = "/"): string {
  if (!path.startsWith("#")) return path;
  return pathname === "/" ? path : `/${path}`;
}

/** WhatsApp chat with the regional brand name in the greeting, as on the old site. */
export function waLink(number: string, brandName: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(`Hi ${brandName}! I'm interested in your services.`)}`;
}
