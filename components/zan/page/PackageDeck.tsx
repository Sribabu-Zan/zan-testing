import { Check } from "lucide-react";
import { servicePackages } from "@/constants/pricing";
import { cn } from "@/lib/utils";
import { PackagePrice } from "./Price";
import { Reveal } from "./Reveal";

/**
 * The packages a service page sells, as the company sells them: the deck from
 * the main app's price list, each card with its own regional price. Order is
 * the price list's own, which runs cheapest first.
 */
export function PackageDeck({ slug, className }: { slug: string; className?: string }) {
  const packages = servicePackages[slug];
  if (!packages?.length) return null;
  return (
    <ul className={cn("grid gap-5 md:grid-cols-2 xl:grid-cols-3", className)}>
      {packages.map((pkg, i) => (
        <li key={pkg.title} className="min-w-0">
          <Reveal delay={Math.min(i, 3) * 0.06} className="h-full">
            <article
              className={cn(
                "flex h-full flex-col rounded-3xl border bg-bg p-6 transition-[border-color,box-shadow] duration-500 sm:p-7",
                pkg.popular ? "border-brand/45 shadow-lift" : "border-line",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-h3 font-semibold text-ink">{pkg.title}</h3>
                {pkg.popular && (
                  <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 font-mono text-[0.625rem] leading-none tracking-[0.14em] text-brand-ink uppercase">
                    Most chosen
                  </span>
                )}
              </div>

              <p className="mt-3 text-h3 font-semibold text-brand-ink">
                <PackagePrice slug={slug} title={pkg.title} />
              </p>

              <p className="mt-4 text-body text-ink-2">{pkg.description}</p>

              <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-small text-ink-2">
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-ink" strokeWidth={2.2} />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
