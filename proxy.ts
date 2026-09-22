import { NextResponse, type NextRequest } from "next/server";
import type { RegionId } from "@/constants/zan";
import { PATH_HEADER, REGION_COOKIE, REGION_HEADER, regionPrefix, splitRegion, withRegion } from "@/lib/links";

/* ═══════════════════════════════════════════════════════════════════════════
   REGION ROUTING

   The region is a path prefix, not a preference: India keeps the bare paths,
   the UAE sits under /ae and the US under /us. One page, three URLs, each one
   canonical for its market.

     /pricing     /ae/pricing     /us/pricing

   There is still only ONE copy of every route under app/. This file rewrites a
   prefixed request back onto the bare route and passes the region along in two
   request headers, which app/layout.tsx reads to put data-region on <html> and
   to build the canonical and hreflang tags. So the palette, the trading name
   and the phone number are correct in the server HTML, with no flash and
   nothing for the client to fix up.

   It also does the country default. A visitor from the UAE who asks for a bare
   path is sent to /ae once, a visitor from the US to /us, and everyone else
   stays on India. Three rules keep that from doing harm:

     · It only ever fires on a BARE path. Asking for /ae/pricing from anywhere
       in the world serves /ae/pricing.
     · A crawler is never redirected, so the bare India URLs stay reachable and
       each regional URL indexes as itself.
     · An explicit choice wins. The region switcher writes the zan.region
       cookie (as well as localStorage), and once it is set the country header
       is not consulted again.

   It is a 307, not a silent rewrite: the URL a visitor ends up on is the URL
   that region's page is canonical at.
   ═══════════════════════════════════════════════════════════════════════════ */

const isRegion = (v: string | undefined | null): v is RegionId => v === "in" || v === "ae" || v === "us";

/* ── Where the visitor is ────────────────────────────────────────────────────
   Netlify sets x-country / x-geo-country when its geo feature is on, and
   x-nf-geo, a base64 JSON payload, on the request to the function that renders
   the page. x-vercel-ip-country and cf-ipcountry are here so this works
   unchanged behind Vercel or Cloudflare. Locally none of them are present, and
   nothing is redirected. */
const COUNTRY_HEADERS = [
  "x-country",
  "x-geo-country",
  "x-nf-geo-country",
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-appengine-country",
] as const;

/** Only these two countries have their own site. Everyone else gets India. */
const COUNTRY_REGION: Record<string, RegionId> = { AE: "ae", US: "us" };

/** Netlify's own geo payload: base64 JSON, with the code at country.code. */
function netlifyGeoCountry(req: NextRequest): string | null {
  const raw = req.headers.get("x-nf-geo");
  if (!raw) return null;
  try {
    const geo = JSON.parse(atob(raw)) as { country?: { code?: string } };
    return geo.country?.code ?? null;
  } catch {
    return null;
  }
}

function countryRegion(req: NextRequest): RegionId | null {
  const values = COUNTRY_HEADERS.map((key) => req.headers.get(key));
  values.push(netlifyGeoCountry(req));
  for (const raw of values) {
    const value = raw?.trim().toUpperCase();
    // Cloudflare sends XX for "unknown" and T1 for Tor.
    if (!value || value.length !== 2 || value === "XX" || value === "T1") continue;
    return COUNTRY_REGION[value] ?? "in";
  }
  return null;
}

/* ── Crawlers ────────────────────────────────────────────────────────────────
   Googlebot, Bingbot and friends must reach the bare India URLs, and must see
   each regional URL as itself. Geo-redirecting them would cloak the site: the
   crawler indexes whatever country its fetcher happens to sit in, and the
   other two regions never get crawled at all. "bot" alone catches Googlebot,
   bingbot, AdsBot, DuckDuckBot, PetalBot, SemrushBot and the rest. */
const CRAWLER_RE =
  /bot|crawler|crawling|spider|slurp|mediapartners|bingpreview|facebookexternalhit|embedly|quora link preview|outbrain|pinterest|vkshare|w3c_validator|whatsapp|telegram|skypeuripreview|linkedinbot|archive\.org_bot|ia_archiver|feedfetcher|chatgpt|gptbot|claude|perplexity|duckduckgo|yandex|baidu|sogou|applebot/i;

const isCrawler = (req: NextRequest) => CRAWLER_RE.test(req.headers.get("user-agent") ?? "");

function pass(req: NextRequest, region: RegionId, path: string, rewriteTo?: string) {
  const headers = new Headers(req.headers);
  headers.set(REGION_HEADER, region);
  headers.set(PATH_HEADER, path);
  const init = { request: { headers } };
  return rewriteTo
    ? NextResponse.rewrite(new URL(`${rewriteTo}${req.nextUrl.search}`, req.url), init)
    : NextResponse.next(init);
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const { region: fromPath, path } = splitRegion(pathname);

  /* /in/pricing is nobody's canonical URL — India lives at /pricing. */
  if (/^\/in(?=\/|$)/i.test(pathname)) {
    return NextResponse.redirect(new URL(`${path}${search}`, req.url), 308);
  }

  /* An explicit region in the URL is the whole answer. No cookie, no header
     and no country can move a visitor off /ae/pricing. */
  if (fromPath !== "in") {
    return pass(req, fromPath, path, path);
  }

  /* A bare path. India is the answer unless this visitor has said, or their
     country says, otherwise. */
  const chosen = req.cookies.get(REGION_COOKIE)?.value;
  /* A crawler is never moved, whatever it carries. Everyone else gets their
     own choice first and their country only if they have not made one. */
  const preferred = isCrawler(req) ? null : isRegion(chosen) ? chosen : countryRegion(req);

  if (preferred && preferred !== "in" && regionPrefix[preferred]) {
    return NextResponse.redirect(new URL(`${withRegion(path, preferred)}${search}`, req.url), 307);
  }

  return pass(req, "in", path);
}

export const config = {
  /* Everything except the API proxy, Next's own assets and any file with an
     extension (/images/*, /favicon.ico, /robots.txt, /icon.png). */
  matcher: ["/((?!api|_next|.*\\.[^/]*$).*)"],
};
