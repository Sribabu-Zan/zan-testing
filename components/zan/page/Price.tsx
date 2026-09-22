import { pagePriceFor, priceFor, startingPriceFor } from "@/constants/pricing";
import { requestRegion } from "@/lib/server-region";
import { cn, stripFrom } from "@/lib/utils";

/* The price tables carry a figure per region, and the region is in the URL:
   proxy.ts resolves it per request and lib/server-region hands it to the
   server render. So these are server components and await it, rather than
   reading <html data-region> on the client — the figure a crawler, a no-JS
   visitor and a shared screenshot see is then the right currency for the page
   they asked for, not India's, and it never swaps under the reader on
   hydration. A region switch is a navigation, so the next render is correct. */

/** The headline "from" figure for a service page, or nothing if it has none. */
export async function StartingPrice({ slug, className }: { slug: string; className?: string }) {
  const { region } = await requestRegion();
  const price = startingPriceFor(slug, region);
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
export async function PackagePrice({ slug, title, className }: { slug: string; title: string; className?: string }) {
  const { region } = await requestRegion();
  const price = pagePriceFor(slug, region) ?? priceFor(slug, title, region);
  return <span className={cn("tabular-nums", className)}>{price}</span>;
}

/** Just the figure, for a table cell or a card footer. */
export async function StartingPriceValue({ slug, className }: { slug: string; className?: string }) {
  const { region } = await requestRegion();
  return <span className={cn("tabular-nums", className)}>{stripFrom(startingPriceFor(slug, region))}</span>;
}
