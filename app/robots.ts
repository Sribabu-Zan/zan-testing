import type { MetadataRoute } from "next";
import { site } from "@/constants/zan";

/* ───────────────────────────────────────────────────────────────────────────
   ROBOTS

   Carried over from both previous builds, including the explicit allows for
   the AI answer engines: being crawlable by ChatGPT, Perplexity and Claude is
   part of what the GEO service on /services/digital-marketing/seo-aeo-geo
   sells, so the site has to practise it. Google-Extended and
   Applebot-Extended are the AI-training opt-ins for Gemini and Apple
   Intelligence and are listed for the same reason.

   NOTE — this file does not decide whether the site is indexed. The pre-launch
   `robots: { index: false, follow: false }` in app/layout.tsx does, per page,
   via a meta tag. That is deliberate: a Disallow here would stop crawlers
   FETCHING the pages, so they would never read the noindex, and any URL of
   this build that picked up a link could still surface as a bare listing.
   Allowing the crawl and refusing the index is the combination that actually
   keeps the staging build out of search.
   ─────────────────────────────────────────────────────────────────────────── */

const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-User",
  "Google-Extended",
  "Applebot-Extended",
  "meta-externalagent",
  "Bytespider",
  "CCBot",
];

const SEARCH_CRAWLERS = ["Googlebot", "Bingbot", "Twitterbot", "facebookexternalhit"];

/**
 * The chat endpoints, which are proxied to the main app by next.config.ts.
 * They are POST-only JSON and have nothing to index; crawling them wastes
 * budget and, for /api/chat/session, creates a conversation per request.
 */
const PRIVATE = ["/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...[...SEARCH_CRAWLERS, ...AI_CRAWLERS].map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE,
      })),
      { userAgent: "*", allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
