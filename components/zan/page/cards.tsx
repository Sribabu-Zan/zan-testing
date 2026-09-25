import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { CARD_ART_SIZES, getProcessArt, getServiceArt, type CardArt } from "@/constants/serviceArt";
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

/** A square glyph plate: the fallback for a subject with no photograph yet. */
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

/** The photograph itself, cropped to whatever frame it is put in. */
export function CardPhoto({ art, sizes, className }: { art: CardArt; sizes?: string; className?: string }) {
  return (
    <Image
      src={art.src}
      alt={art.alt}
      width={art.width}
      height={art.height}
      sizes={sizes ?? CARD_ART_SIZES}
      className={cn("block size-full object-cover", className)}
    />
  );
}

/**
 * The picture a standing-page card leads with: a band across the top, bled out
 * to the card's edges. A 44px glyph square was the size of a favicon; at a
 * card's full width a stethoscope reads as a stethoscope and a warehouse as a
 * warehouse, which is the whole point of putting photographs here.
 *
 * The index number rides the corner of the picture rather than sitting in a
 * row of its own, so the heading follows the band directly.
 */
function CardBanner({ art, index }: { art: CardArt; index?: string }) {
  return (
    <span className="relative -mx-6 -mt-6 mb-6 block overflow-hidden rounded-t-[1.4375rem] border-b border-line bg-surface sm:-mx-7 sm:-mt-7">
      <CardPhoto
        art={art}
        className="aspect-[16/9] transition-transform duration-700 ease-out-expo group-hover/card:scale-[1.03] motion-reduce:transform-none"
      />
      {index && (
        <span className="absolute top-3 right-3 rounded-full bg-bg/90 px-2.5 py-1 font-mono text-eyebrow text-ink">
          {index}
        </span>
      )}
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
  price,
  delay = 0,
}: {
  href: string;
  title: string;
  tagline?: string;
  description?: string;
  icon?: IconKey;
  index?: string;
  capabilities?: readonly string[];
  /** The page's starting price, resolved server-side. Sits in the footer. */
  price?: ReactNode;
  delay?: number;
}) {
  // The service's id is the last segment of its href, which every call site
  // already passes — so the catalogue, the discipline cards and the "other
  // services" list all get the page's own photograph from here rather than
  // from a prop each page has to thread through.
  const art = getServiceArt(href.slice(href.lastIndexOf("/") + 1));
  return (
    <Reveal delay={delay} className="h-full">
      <SiteLink href={href} className={cn(cardBase, cardHover)}>
        {art ? (
          <CardBanner art={art} index={index} />
        ) : (
          <div className="flex items-start justify-between gap-4">
            {icon ? <IconPlate name={icon} /> : null}
            {index && <span className="font-mono text-eyebrow text-muted">{index}</span>}
          </div>
        )}

        <h3 className={cn("font-display text-h3 font-semibold text-ink", !art && (icon || index) ? "mt-5" : "")}>{title}</h3>
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

        <span
          className={cn(
            "mt-6 flex items-center gap-4 text-small font-medium text-ink",
            price ? "justify-between border-t border-line pt-5" : "",
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            Read more
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 text-brand-ink transition-transform duration-300 ease-out-expo group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5"
            />
          </span>
          {price && <span className="shrink-0 text-brand-ink tabular-nums">{price}</span>}
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
  art,
  delay = 0,
  children,
}: {
  index?: string;
  title: string;
  tagline?: string;
  description?: string;
  icon?: IconKey;
  /** The subject's photograph. Falls back to `icon` where there is none. */
  art?: CardArt;
  delay?: number;
  children?: ReactNode;
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <article className={cardBase}>
        {art ? (
          <CardBanner art={art} index={index} />
        ) : (
          <div className="flex items-start justify-between gap-4">
            {icon ? <IconPlate name={icon} /> : null}
            {index && <span className="font-mono text-eyebrow text-muted">{index}</span>}
          </div>
        )}
        <h3 className={cn("font-display text-h3 font-semibold text-ink", !art && (icon || index) ? "mt-5" : "")}>{title}</h3>
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
  // The four steps are always drawn in order, and the index is the only thing
  // every call site passes — so the card resolves its own photograph.
  const art = getProcessArt(index);
  return (
    <Reveal delay={delay} className="h-full">
      <article className="group/card flex h-full flex-col rounded-3xl border border-line bg-bg p-6 sm:p-7">
        {art ? (
          <CardBanner art={art} index={index} />
        ) : (
          <span className="mb-4 font-mono text-eyebrow text-brand-ink">{index}</span>
        )}
        <h3 className="font-display text-h3 font-semibold text-ink">{title}</h3>
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
