import type { RegionId } from "@/constants/zan";

/* ───────────────────────────────────────────────────────────────────────────
   LINKS

   Every page this site links to lives in this site: the services index and its
   sixteen service pages, portfolio, how we work, about, pricing, contact and
   the five policy pages are all routes under app/. Nothing navigates to the
   main Zan app any more (its chat API is still proxied server-side by the
   rewrites in next.config.ts, which is a fetch, not a link).

   THE REGION IS IN THE PATH. India keeps the bare paths, the UAE sits under
   /ae and the US under /us, so each region has one canonical URL per page:

     /pricing        /ae/pricing        /us/pricing

   proxy.ts rewrites a prefixed request back onto the bare route and tells the
   server which region it is, so there is one copy of every page. What the
   helpers below do is the other half: keep a visitor inside their region when
   they follow a link. A content href ("/pricing") is region-free, and
   `siteHref` stamps the current region onto it.

   The other thing that needs resolving is an in-page anchor. "#contact" is a
   section of the homepage, and the navbar, mega menu and footer that carry it
   are on every page, so away from the homepage it has to become "/#contact"
   (or "/ae#contact"). That needs the current path, so it lives in the
   `useSiteHref` hook next door in lib/useSiteHref.ts. THIS module stays free
   of React so server components and proxy.ts can import it; keep it that way.

   tel:, mailto: and http(s): links pass through untouched.
   ─────────────────────────────────────────────────────────────────────────── */

/** Request headers proxy.ts sets so the server knows which region it renders. */
export const REGION_HEADER = "x-zan-region";
/** The path with its region prefix taken off, for canonical + hreflang. */
export const PATH_HEADER = "x-zan-path";

/**
 * The visitor's own choice, written by setRegion() so the SERVER can read it.
 * localStorage cannot be read from a request, and the country default has to
 * be decided before any JavaScript runs.
 */
export const REGION_COOKIE = "zan.region";
/** One year: a region is a standing choice, not a session. */
export const REGION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** What each region prefixes its paths with. India is the bare path. */
export const regionPrefix: Record<RegionId, string> = { in: "", ae: "/ae", us: "/us" };

/** Matches a leading region segment, and only a whole segment: /ae, /ae/x —
    never /aerospace. "/in" is here so a hand-typed one resolves rather than
    404s; proxy.ts redirects it to the bare path. */
const PREFIX_RE = /^\/(in|ae|us)(?=\/|$)/i;

/** A path on this site, so it can be navigated with next/link. */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

/** Splits "/contact-us#enquiry?x" into its path and everything after it. */
function splitSuffix(href: string): [string, string] {
  const cut = href.search(/[?#]/);
  return cut === -1 ? [href, ""] : [href.slice(0, cut), href.slice(cut)];
}

/**
 * The region a path is in, and the path with its region prefix taken off.
 *
 *   splitRegion("/ae/pricing")  -> { region: "ae", path: "/pricing" }
 *   splitRegion("/pricing")     -> { region: "in", path: "/pricing" }
 *   splitRegion("/ae")          -> { region: "ae", path: "/" }
 */
export function splitRegion(pathname: string): { region: RegionId; path: string } {
  const [path, suffix] = splitSuffix(pathname || "/");
  const match = PREFIX_RE.exec(path);
  if (!match) return { region: "in", path: `${path || "/"}${suffix}` };
  const rest = path.slice(match[0].length);
  return { region: match[1].toLowerCase() as RegionId, path: `${rest || "/"}${suffix}` };
}

/**
 * The same page in a given region. Idempotent, so a path that already carries
 * a prefix is moved rather than double-prefixed.
 *
 *   withRegion("/pricing", "ae")  -> "/ae/pricing"
 *   withRegion("/", "us")         -> "/us"
 *   withRegion("/#contact", "ae") -> "/ae#contact"
 */
export function withRegion(href: string, region: RegionId): string {
  if (!isInternalHref(href)) return href;
  const { path } = splitRegion(href);
  const [pathname, suffix] = splitSuffix(path);
  const prefix = regionPrefix[region];
  if (!prefix) return `${pathname}${suffix}`;
  return `${prefix}${pathname === "/" ? "" : pathname}${suffix}`;
}

/**
 * Resolves an href that came from constants against the page it is rendered
 * on. Pure, so anything that knows its own path and region can call it.
 *
 * `pathname` is the CURRENT path with its region prefix already removed, and
 * `region` is where the visitor is. Keeping those two apart is deliberate:
 * under the proxy's rewrite the server sees the bare path and the browser sees
 * the prefixed one, so deriving the region from the path would render one
 * thing on the server and another on the client.
 */
export function siteHref(path: string, pathname: string = "/", region: RegionId = "in"): string {
  if (path.startsWith("#")) {
    return pathname === "/" ? path : withRegion(`/${path}`, region);
  }
  if (!isInternalHref(path)) return path;
  return withRegion(path, region);
}

/** WhatsApp chat with the regional brand name in the greeting, as on the old site. */
export function waLink(number: string, brandName: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(`Hi ${brandName}! I'm interested in your services.`)}`;
}
