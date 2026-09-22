import type { Metadata } from "next";
import type { RegionId } from "@/constants/zan";
import { regions, site } from "@/constants/zan";
import { regionUrl, requestRegion } from "@/lib/server-region";

/* ───────────────────────────────────────────────────────────────────────────
   PAGE METADATA

   One shape for every page's metadata, so a route only has to say what it is
   about.

   WHY THIS IS ASYNC. Next MERGES metadata objects key by key, but it does not
   deep-merge the values: a page that returns its own `openGraph` REPLACES the
   root layout's outright. So the layout's og:url, og:locale and og:image were
   reaching exactly one route — the homepage, the only page that does not call
   this function. Every other page emitted og:title and og:description and
   nothing else, which is why twitter:card quietly degraded to `summary` on 27
   of 28 URLs. The fix is for this builder to re-emit the whole Open Graph
   block itself, which means it needs the region, which means reading the
   request headers proxy.ts sets — hence `async`, and hence every page's
   `export const metadata` becoming `export async function generateMetadata`.
   ─────────────────────────────────────────────────────────────────────────── */

/** The 1200x630 card every share of this site falls back to. */
export const OG_IMAGE = "/og-default.png";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Matches the hreflang alternates and the <html lang> the layout sets. */
export const OG_LOCALE: Record<RegionId, string> = {
  in: "en_IN",
  ae: "en_AE",
  us: "en_US",
};

/**
 * Copy is authored with the default trading name; the UAE entity trades as
 * Zan Verse Technology, so swap it in before the text reaches a <title>, an
 * og:site_name or a description.
 *
 * The negative lookahead is the whole point. The main app's `localiseBrand`
 * does a blanket `replaceAll(site.name, name)`, which turns "Zan Services LLC"
 * — the US legal entity, named in the policies and in the Sacramento address —
 * into "Zan Verse Technology LLC" on /ae. That company does not exist.
 */
export function localiseBrand(text: string, region: RegionId): string {
  const { brandName } = regions[region];
  if (brandName === site.name) return text;
  return text.replace(/Zan Services(?! LLC)/g, brandName);
}

/**
 * The place a regional title claims. India's titles are written with the city
 * in them ("Web Development Company in Kolkata") because that is what they
 * rank on; repeating it on /ae and /us advertises the wrong country to the
 * wrong market.
 *
 * Opt-in per page, never blanket: "headquartered in Kolkata" and "Offices in
 * Kolkata, Dubai and Sacramento" are facts that hold in all three regions and
 * must survive untouched, so only pages whose title/description are written as
 * a local sales pitch pass `localPlace`.
 */
const PLACE: Record<RegionId, { kolkata: string; india: string }> = {
  in: { kolkata: "in Kolkata", india: "in India" },
  ae: { kolkata: "in Dubai", india: "in the UAE" },
  us: { kolkata: "in the US", india: "in the US" },
};

function localisePlace(text: string, region: RegionId): string {
  if (region === "in") return text;
  const { kolkata, india } = PLACE[region];
  return text.replace(/\bin Kolkata\b/g, kolkata).replace(/\bin India\b/g, india);
}

export interface PageMetadataArgs {
  /** Without the company name; it is appended here. */
  title: string;
  description: string;
  /**
   * True for a page whose copy is a local sales pitch ("… in Kolkata"), so the
   * regional builds name their own market instead. Leave it off wherever the
   * city is a statement of fact about where the company is.
   */
  localPlace?: boolean;
  /**
   * The /ae wording, where the India wording does not fit. "Zan Verse
   * Technology" is eight characters longer than "Zan Services" and is appended
   * to every title, which on its own pushed five titles past 60 characters and
   * four descriptions past 160. Truncating is the search engine's job, not
   * ours, so the UAE gets its own shorter form. Either field may be left out;
   * the India one is used where it is. Written already pointing at the UAE, so
   * `localPlace` finds nothing left to swap.
   */
  ae?: { title?: string; description?: string };
}

/**
 * The root layout already sets metadataBase, applicationName, the canonical +
 * hreflang alternates and the pre-launch `robots` block, and Next merges those
 * down into every route, so nothing here repeats them. Everything Next would
 * REPLACE rather than merge — the whole of `openGraph`, the whole of `twitter`
 * — is rebuilt here in full.
 */
export async function pageMetadata(args: PageMetadataArgs): Promise<Metadata> {
  const { region, path } = await requestRegion();
  return buildMetadata(args, region, path);
}

/** The pure half, so it can be called with a region that is already in hand. */
export function buildMetadata(
  { title, description, localPlace = false, ae }: PageMetadataArgs,
  region: RegionId,
  path: string,
): Metadata {
  const { brandName } = regions[region];
  const localise = (text: string) =>
    localiseBrand(localPlace ? localisePlace(text, region) : text, region);

  const fit = region === "ae" && ae ? ae : {};
  const full = `${localise(fit.title ?? title)} — ${brandName}`;
  const body = localise(fit.description ?? description);
  const canonical = regionUrl(path, region);

  return {
    title: full,
    description: body,
    openGraph: {
      title: full,
      description: body,
      type: "website",
      // The three things a page-level openGraph block silently dropped.
      url: canonical,
      siteName: brandName,
      locale: OG_LOCALE[region],
      images: [
        {
          url: OG_IMAGE,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: brandName,
        },
      ],
    },
    twitter: {
      // Without an image this degrades to a plain `summary` card whatever it
      // says here, which is exactly what was happening.
      card: "summary_large_image",
      site: "@zanservices",
      title: full,
      description: body,
      images: [OG_IMAGE],
    },
  };
}
