import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { SiteLink } from "@/components/zan/services/SiteLinks";
import { ZanIcon, type IconKey } from "@/components/zan/ui/icons";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

/* The small set of repeated blocks the standing pages are built from. All of
   them are plain server markup: the content is in the HTML, and the only
   motion is the Reveal wrapper each list item opts into. */

const cardBase =
  "group/card relative flex h-full flex-col rounded-3xl border border-line bg-bg p-6 transition-[border-color,box-shadow,transform] duration-500 ease-out-expo sm:p-7";
const cardHover = "hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift";

/** A square glyph plate, the same on every card that carries an icon. */
export function IconPlate({ name, className }: { name: IconKey; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-ink transition-colors duration-500",
        className,
      )}
    >
      <ZanIcon name={name} className="size-5" />
    </span>
  );
}

/**
 * One service, as a link. Used for the catalogue on /services, the disciplines
 * under a practice page, and the "other services" list at the foot of a
 * service page.
 */
export function ServiceCard({
  href,
  title,
  tagline,
  description,
  icon,
  index,
  capabilities,
  delay = 0,
}: {
  href: string;
  title: string;
  tagline?: string;
  description?: string;
  icon?: IconKey;
  index?: string;
  capabilities?: readonly string[];
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <SiteLink href={href} className={cn(cardBase, cardHover)}>
        <div className="flex items-start justify-between gap-4">
          {icon ? <IconPlate name={icon} /> : null}
          {index && <span className="font-mono text-eyebrow text-muted">{index}</span>}
        </div>

        <h3 className={cn("font-display text-h3 font-semibold text-ink", icon || index ? "mt-5" : "")}>{title}</h3>
        {tagline && <p className="mt-1.5 font-mono text-eyebrow text-brand-ink uppercase">{tagline}</p>}
        {description && <p className="mt-4 text-body text-ink-2">{description}</p>}

        {capabilities && capabilities.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {capabilities.map((c) => (
              <li
                key={c}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-[0.8125rem] leading-none text-ink-2"
              >
                {c}
              </li>
            ))}
          </ul>
        )}

        <span className="mt-6 inline-flex items-center gap-1.5 text-small font-medium text-ink">
          Read more
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 text-brand-ink transition-transform duration-300 ease-out-expo group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5"
          />
        </span>
      </SiteLink>
    </Reveal>
  );
}

/** A plain card with no link, for a list of facts or capabilities. */
export function FactCard({
  index,
  title,
  tagline,
  description,
  icon,
  delay = 0,
  children,
}: {
  index?: string;
  title: string;
  tagline?: string;
  description?: string;
  icon?: IconKey;
  delay?: number;
  children?: ReactNode;
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <article className={cardBase}>
        <div className="flex items-start justify-between gap-4">
          {icon ? <IconPlate name={icon} /> : null}
          {index && <span className="font-mono text-eyebrow text-muted">{index}</span>}
        </div>
        <h3 className={cn("font-display text-h3 font-semibold text-ink", icon || index ? "mt-5" : "")}>{title}</h3>
        {tagline && <p className="mt-1.5 font-mono text-eyebrow text-brand-ink uppercase">{tagline}</p>}
        {description && <p className="mt-4 text-body text-ink-2">{description}</p>}
        {children}
      </article>
    </Reveal>
  );
}

/** Label and value rows: engagement facts, at-a-glance figures. */
export function FactList({
  items,
  className,
}: {
  items: readonly { label: string; value: string }[];
  className?: string;
}) {
  return (
    <dl className={cn("grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div key={item.label} className="bg-bg px-6 py-6">
          <dt className="font-mono text-eyebrow text-muted uppercase">{item.label}</dt>
          <dd className="mt-2 text-lead font-medium text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The credibility figures, as a row of plates. */
export function MetricRow({
  items,
  className,
}: {
  items: readonly { id: string; value: string; label: string; detail: string }[];
  className?: string;
}) {
  return (
    <ul className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((m, i) => (
        <li key={m.id}>
          <Reveal delay={Math.min(i, 4) * 0.05} className="h-full">
            <div className="h-full rounded-3xl border border-line bg-bg px-6 py-7">
              <p className="font-sans text-[clamp(2rem,1.4rem+2.2vw,3rem)] leading-none font-bold tracking-[-0.03em] text-ink tabular-nums">
                {m.value}
              </p>
              <p className="mt-4 text-body font-medium text-ink">{m.label}</p>
              <p className="mt-1 text-small text-muted">{m.detail}</p>
            </div>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

/** A numbered step with its deliverables — the four-stage process. */
export function StepCard({
  index,
  title,
  description,
  deliverables,
  delay = 0,
}: {
  index: string;
  title: string;
  description: string;
  deliverables: readonly string[];
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <article className="flex h-full flex-col rounded-3xl border border-line bg-bg p-6 sm:p-7">
        <span className="font-mono text-eyebrow text-brand-ink">{index}</span>
        <h3 className="mt-4 font-display text-h3 font-semibold text-ink">{title}</h3>
        <p className="mt-3 text-body text-ink-2">{description}</p>
        {deliverables.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-line pt-5">
            {deliverables.map((d) => (
              <li key={d} className="flex items-start gap-2.5 text-small text-ink-2">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                {d}
              </li>
            ))}
          </ul>
        )}
      </article>
    </Reveal>
  );
}
