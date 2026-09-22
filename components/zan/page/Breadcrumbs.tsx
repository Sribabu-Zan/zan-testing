import { ChevronRight } from "lucide-react";
import { SiteLink } from "@/components/zan/services/SiteLinks";
import { labels } from "@/constants/pages";
import { jsonLd } from "@/lib/schema";
import { regionUrl, requestRegion } from "@/lib/server-region";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href: string;
}

/**
 * The trail back up a page, with the matching BreadcrumbList data so search
 * results show the same path. The last crumb is the current page and is not a
 * link.
 *
 * The item URLs are REGIONAL. They used to be built as `${site.url}${href}`,
 * which put India's URLs into the breadcrumbs of a page whose own canonical
 * said /ae or /us — a trail that contradicts the page it is on, and an
 * invitation for Google to treat the regional URL as a duplicate of the Indian
 * one. `regionUrl` is the same helper the canonical and the hreflang
 * alternates are built from, so the three can no longer disagree.
 *
 * Async, so it can read the request's region. It renders inside PageHero,
 * which is a server component; nothing client-side imports it.
 */
export async function Breadcrumbs({ trail, className }: { trail: readonly Crumb[]; className?: string }) {
  const { region } = await requestRegion();
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: regionUrl(c.href, region),
    })),
  };
  const last = trail.length - 1;
  return (
    <nav aria-label={labels.breadcrumb} className={cn("min-w-0", className)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbList) }}
      />
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-eyebrow text-muted uppercase">
        {trail.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight aria-hidden="true" className="size-3 shrink-0 text-line-strong" />}
            {i === last ? (
              <span aria-current="page" className="text-ink-2">
                {crumb.label}
              </span>
            ) : (
              <SiteLink
                href={crumb.href}
                // The padding only grows the tap area on phones; the negative
                // margin keeps the trail's line height as it was.
                className="-my-4 inline-block rounded py-4 transition-colors duration-300 hover:text-brand-ink md:my-0 md:py-0"
              >
                {crumb.label}
              </SiteLink>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
