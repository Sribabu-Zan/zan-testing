import { ArrowUpRight, Check } from "lucide-react";
import type { ReactNode } from "react";
import { SiteLink } from "@/components/zan/services/SiteLinks";
import { cn } from "@/lib/utils";

/**
 * The hero's right-hand column: a plain card on the page ground, sitting on
 * the brand wash. It carries content the visitor would otherwise have to
 * scroll for — what a service includes, where the offices are, what the
 * figures are — so the band is full rather than half empty.
 *
 * White card, hairline, no fill: the only saturated colour in a hero is the
 * primary button.
 */
export function HeroPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-line bg-bg p-6 shadow-lift sm:p-7", className)}>
      <h2 className="font-mono text-eyebrow text-muted uppercase">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

/** A checked list of plain phrases: capabilities, what is included. */
export function HeroList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-body text-ink">
          <Check aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-brand-ink" strokeWidth={2.2} />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** The same list, where each row goes somewhere. */
export function HeroLinks({
  items,
}: {
  items: readonly { label: string; href: string; note?: string }[];
}) {
  return (
    <ul className="-my-1">
      {items.map((item) => (
        <li key={item.href}>
          <SiteLink
            href={item.href}
            className="group/row flex items-center justify-between gap-4 rounded-xl py-2.5 transition-colors duration-300 hover:text-brand-ink"
          >
            <span className="min-w-0">
              <span className="block text-body font-medium text-ink transition-colors duration-300 group-hover/row:text-brand-ink">
                {item.label}
              </span>
              {item.note && <span className="mt-0.5 block text-small text-muted">{item.note}</span>}
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 shrink-0 text-brand-ink transition-transform duration-300 ease-out-expo group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5"
            />
          </SiteLink>
        </li>
      ))}
    </ul>
  );
}

/** Label and value rows, for a hero panel of facts. */
export function HeroFacts({ items }: { items: readonly { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="font-mono text-eyebrow text-muted uppercase">{item.label}</dt>
          <dd className="mt-1.5 text-body font-medium text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
