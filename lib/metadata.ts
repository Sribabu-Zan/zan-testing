import type { Metadata } from "next";
import { site } from "@/constants/zan";

/**
 * One shape for every page's metadata, so a route only has to say what it is
 * about. The root layout already sets metadataBase, applicationName and
 * `robots: { index: false }` — this page is a second build of the company site
 * and must not compete with zanservices.com — and Next merges those down into
 * every route, so nothing here repeats them.
 */
export function pageMetadata({
  title,
  description,
}: {
  /** Without the company name; it is appended here. */
  title: string;
  description: string;
}): Metadata {
  const full = `${title} — ${site.name}`;
  return {
    title: full,
    description,
    openGraph: { title: full, description, type: "website", siteName: site.name },
  };
}
