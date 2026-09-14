"use client";

import { pagePriceFor, priceFor, startingPriceFor } from "@/constants/pricing";
import { useRegionId } from "@/lib/region";
import { cn } from "@/lib/utils";

/* The price tables carry a figure per region, and the region here is an
   attribute on <html> rather than a URL. So these read it through
   useRegionId(): the server renders India's figure, and a visitor who has
   chosen the UAE or the US gets theirs as soon as the page hydrates, the same
   way the navbar's phone number works. */

/** The headline "from" figure for a service page, or nothing if it has none. */
export function StartingPrice({ slug, className }: { slug: string; className?: string }) {
  const price = startingPriceFor(slug, useRegionId());
  if (!price) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-line-strong bg-bg px-4 py-2 text-small font-medium text-ink",
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
      <span className="tabular-nums">{price}</span>
    </span>
  );
}

/** The price of one package on one page. */
export function PackagePrice({ slug, title, className }: { slug: string; title: string; className?: string }) {
  const region = useRegionId();
  const price = pagePriceFor(slug, region) ?? priceFor(slug, title, region);
  return <span className={cn("tabular-nums", className)}>{price}</span>;
}

/** Just the figure, for a table cell. Renders "—" when a page has no price. */
export function StartingPriceValue({ slug }: { slug: string }) {
  const price = startingPriceFor(slug, useRegionId());
  return <span className="tabular-nums">{price ?? "On enquiry"}</span>;
}
