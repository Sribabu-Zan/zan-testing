import { ChevronRight } from "lucide-react";
import { SiteLink } from "@/components/zan/services/SiteLinks";
import { labels } from "@/constants/pages";
import { site } from "@/constants/zan";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href: string;
}

/**
 * The trail back up a service page, with the matching BreadcrumbList data so
 * search results show the same path. The last crumb is the current page and
 * is not a link.
 */
export function Breadcrumbs({ trail, className }: { trail: readonly Crumb[]; className?: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: `${site.url}${c.href}`,
    })),
  };
  const last = trail.length - 1;
  return (
    <nav aria-label={labels.breadcrumb} className={cn("min-w-0", className)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
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
                className="rounded transition-colors duration-300 hover:text-brand-ink"
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
