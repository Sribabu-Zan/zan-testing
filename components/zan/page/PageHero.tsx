import type { ReactNode } from "react";
import { SectionHeading } from "@/components/zan/ui/SectionHeading";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { cn } from "@/lib/utils";

/**
 * A heading line only takes the brand accent if it is short enough to stay on
 * one line in the hero's seven-column well. A phrase that wraps puts two full
 * display lines of saturated colour on the page, which is the large coloured
 * area this site does not use.
 */
const ACCENTABLE = 15;

/**
 * The top of every standing page: the trail back up, the same eyebrow,
 * display heading and lead the homepage's sections use, then whatever the page
 * puts under it (its calls to action, a price) and beside it.
 *
 * Two rules hold across every page type:
 *
 *   1. The heading is ink. A whole headline filled with the brand colour is a
 *      large area of saturated colour, which this site reserves for buttons and
 *      small accents — and in the UAE palette gold on white is about 1.7:1, so
 *      a filled headline is not even legible. Only a heading of more than one
 *      line takes the accent, and only on its last line.
 *   2. The band is a two-column grid at lg and up. The right column carries
 *      something real (what a service includes, the offices, the figures), so
 *      the hero is a filled band rather than copy in the top-left corner of an
 *      empty screen.
 *
 * `pt-nav` clears the fixed navbar. The ground is the warm brand wash, and the
 * section that follows draws the hairline between them.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  trail,
  children,
  aside,
  size = "display",
  className,
}: {
  eyebrow: string;
  title: readonly string[];
  lead?: string;
  trail?: readonly Crumb[];
  /** A heading of several long lines sets at h1 so the band stays readable. */
  size?: "display" | "h1";
  /** Under the lead: calls to action, a price. */
  children?: ReactNode;
  /** The right-hand column. */
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative isolate bg-brand-wash pt-nav", className)}>
      <div className="container-zan pt-10 pb-12 sm:pt-14 sm:pb-14 lg:pt-16 lg:pb-18">
        {trail && <Breadcrumbs trail={trail} className="mb-6" />}
        <div className={cn(aside && "grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14")}>
          <div className={cn(aside && "lg:col-span-7")}>
            <SectionHeading
              eyebrow={eyebrow}
              title={title}
              lead={lead}
              as="h1"
              size={size}
              accentLine={
                title.length > 1 && title[title.length - 1].length <= ACCENTABLE ? title.length - 1 : undefined
              }
              leadClassName="max-w-[56ch]"
            />
            {children}
          </div>
          {aside && <div className="lg:col-span-5">{aside}</div>}
        </div>
      </div>
    </section>
  );
}
